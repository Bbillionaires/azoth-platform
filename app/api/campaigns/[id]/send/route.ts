import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key] ?? data[key.toLowerCase()] ?? ''
    return String(val)
  })
}

// Resolve workspace from bearer token (mirrors contacts route pattern)
async function resolveWorkspace(req: NextRequest, supabase: ReturnType<typeof serviceClient>): Promise<string | null> {
  const bearer = req.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!bearer) return null
  const validKey = process.env.AZOTH_API_SECRET
  if (bearer === validKey || bearer.startsWith('azoth_live_') || bearer.startsWith('nx_test_')) {
    return req.headers.get('x-workspace-id') || process.env.OUE_WORKSPACE_ID || null
  }
  return null
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = serviceClient()

  // Auth — accept internal secret OR workspace bearer
  const internalSecret = req.headers.get('x-internal-secret')
  let workspaceId: string | null = null

  if (internalSecret && internalSecret === (process.env.WEBHOOK_SECRET || '')) {
    // called internally
    const body = await req.json().catch(() => ({}))
    workspaceId = body.workspace_id ?? null
  } else {
    workspaceId = await resolveWorkspace(req, supabase)
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch campaign
  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()

  if (campErr || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (!['draft', 'scheduled'].includes(campaign.status)) {
    return NextResponse.json({ error: `Campaign status is '${campaign.status}', must be draft or scheduled to send` }, { status: 400 })
  }

  // Fetch workspace integrations (supports both 'type'/'enabled' and 'provider'/'active' column shapes)
  const { data: integrationRows } = await supabase
    .from('workspace_integrations')
    .select('*')
    .eq('workspace_id', workspaceId)

  const integrations: Record<string, Record<string, string>> = {}
  for (const row of integrationRows ?? []) {
    const key: string = row.type ?? row.provider ?? ''
    const isActive: boolean = row.enabled ?? row.active ?? false
    if (key && isActive) {
      integrations[key] = row.config ?? {}
    }
  }

  // Fetch contacts
  let contactQuery = supabase
    .from('contacts')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'active')

  // Apply basic audience_filter (tags matching)
  const filter = campaign.audience_filter as Record<string, unknown> | null
  if (filter?.tags && Array.isArray(filter.tags) && filter.tags.length > 0) {
    contactQuery = contactQuery.overlaps('tags', filter.tags)
  }

  const { data: contacts } = await contactQuery
  if (!contacts?.length) {
    await supabase
      .from('campaigns')
      .update({ status: 'active', sent_count: 0 })
      .eq('id', id)
    return NextResponse.json({ sent: 0, failed: 0, message: 'No matching contacts' })
  }

  let sent = 0
  let failed = 0

  if (campaign.type === 'email') {
    // Priority: Gmail > Resend > SendGrid
    const gmailConfig = integrations?.gmail as Record<string, string> | undefined
    const resendApiKey = integrations?.resend?.api_key || process.env.RESEND_API_KEY
    const sendgridApiKey = integrations?.sendgrid?.api_key || process.env.SENDGRID_API_KEY

    const hasGmail = gmailConfig && (gmailConfig.access_token || (gmailConfig.gmail_email && gmailConfig.gmail_app_password))

    if (!hasGmail && !resendApiKey && !sendgridApiKey) {
      return NextResponse.json({ error: 'No email provider configured (Gmail, Resend, or SendGrid)' }, { status: 400 })
    }

    for (const contact of contacts) {
      if (!contact.email) { failed++; continue }
      const subject = interpolate(campaign.subject ?? '(no subject)', contact)
      const html    = interpolate(campaign.body ?? '', contact)

      try {
        if (hasGmail) {
          // Send via Gmail
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gmail/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspace_id: workspaceId,
              to: contact.email,
              subject,
              html,
              from_name: campaign.from_name ?? 'AZOTH',
            }),
          })
          if (res.ok) { sent++ } else { failed++ }
        } else if (resendApiKey) {
          // Send via Resend
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
            body: JSON.stringify({
              from: `${campaign.from_name ?? 'AZOTH'} <${campaign.from_email ?? 'no-reply@azoth.app'}>`,
              to: [contact.email],
              subject,
              html,
            }),
          })
          if (res.ok) { sent++ } else { failed++ }
        } else if (sendgridApiKey) {
          // Send via SendGrid
          const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sendgridApiKey}` },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: contact.email }] }],
              from: { email: campaign.from_email ?? 'no-reply@azoth.app', name: campaign.from_name ?? 'AZOTH' },
              subject,
              content: [{ type: 'text/html', value: html }],
            }),
          })
          if (res.ok) { sent++ } else { failed++ }
        }
      } catch { failed++ }
    }
  } else if (campaign.type === 'sms') {
    const accountSid = integrations?.twilio?.account_sid || process.env.TWILIO_ACCOUNT_SID
    const authToken  = integrations?.twilio?.auth_token  || process.env.TWILIO_AUTH_TOKEN
    const fromNumber = integrations?.twilio?.from_number || process.env.TWILIO_FROM_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: 'No Twilio credentials configured' }, { status: 400 })
    }

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    for (const contact of contacts) {
      if (!contact.phone) { failed++; continue }
      const message = interpolate(campaign.body ?? '', contact)
      const formBody = new URLSearchParams({ To: contact.phone, From: fromNumber, Body: message })
      try {
        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${credentials}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody.toString(),
          }
        )
        if (res.ok) { sent++ } else { failed++ }
      } catch { failed++ }
    }
  } else {
    return NextResponse.json({ error: 'Sequence campaigns are not directly sendable via this endpoint' }, { status: 400 })
  }

  // Update campaign status
  await supabase
    .from('campaigns')
    .update({
      status: 'active',
      sent_count: (campaign.sent_count ?? 0) + sent,
    })
    .eq('id', id)

  return NextResponse.json({ sent, failed })
}
