import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ── Helpers ───────────────────────────────

function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key] ?? data[key.toLowerCase()] ?? ''
    return String(val)
  })
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Action Executors ──────────────────────

async function execNotifySlack(
  actionVal: string,
  data: Record<string, unknown>,
  integrations: Record<string, Record<string, string>>
) {
  const webhookUrl =
    integrations?.slack?.webhook_url ||
    actionVal ||
    process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  const message = interpolate(
    integrations?.slack?.message_template || 'AZOTH event: {{name}} ({{email}})',
    data
  )
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, username: 'AZOTH', icon_emoji: ':zap:' }),
    })
  } catch { /* non-blocking */ }
}

async function execSendEmail(
  actionVal: string,
  data: Record<string, unknown>,
  integrations: Record<string, Record<string, string>>
) {
  const apiKey = integrations?.resend?.api_key || process.env.RESEND_API_KEY
  if (!apiKey) return

  let to: string | undefined
  let subject = 'Update from AZOTH'
  let body = actionVal

  try {
    const parsed = JSON.parse(actionVal)
    to = parsed.to
    subject = parsed.subject ?? subject
    body = parsed.body ?? body
  } catch { /* plain string fallback */ }

  const contactEmail = data.email as string | undefined
  const recipient = to || contactEmail
  if (!recipient) return

  subject = interpolate(subject, data)
  body = interpolate(body, data)

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: 'AZOTH <no-reply@azoth.app>',
        to: [recipient],
        subject,
        html: body,
      }),
    })
  } catch { /* non-blocking */ }
}

async function execSendSms(
  actionVal: string,
  data: Record<string, unknown>,
  integrations: Record<string, Record<string, string>>
) {
  const accountSid = integrations?.twilio?.account_sid || process.env.TWILIO_ACCOUNT_SID
  const authToken  = integrations?.twilio?.auth_token  || process.env.TWILIO_AUTH_TOKEN
  const fromNumber = integrations?.twilio?.from_number || process.env.TWILIO_FROM_NUMBER
  if (!accountSid || !authToken || !fromNumber) return

  const toNumber = data.phone as string | undefined
  if (!toNumber) return

  const message = interpolate(actionVal, data)
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const formBody = new URLSearchParams({ To: toNumber, From: fromNumber, Body: message })

  try {
    await fetch(
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
  } catch { /* non-blocking */ }
}

async function execSendWebhook(
  actionVal: string,
  event: string,
  workspaceId: string,
  data: Record<string, unknown>
) {
  if (!actionVal) return
  try {
    await fetch(actionVal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, workspace_id: workspaceId, data }),
    })
  } catch { /* non-blocking */ }
}

async function execAddTag(
  actionVal: string,
  data: Record<string, unknown>,
  supabase: ReturnType<typeof serviceClient>
) {
  const contactId = data.id
  if (!contactId || !actionVal) return
  const existingTags: string[] = Array.isArray(data.tags) ? (data.tags as string[]) : []
  const newTags = Array.from(new Set([...existingTags, actionVal]))
  try {
    await supabase.from('contacts').update({ tags: newTags }).eq('id', contactId)
  } catch { /* non-blocking */ }
}

async function execMoveStage(
  actionVal: string,
  data: Record<string, unknown>,
  supabase: ReturnType<typeof serviceClient>
) {
  const contactId = data.id
  if (!contactId || !actionVal) return
  try {
    await supabase.from('contacts').update({ stage_id: actionVal }).eq('id', contactId)
  } catch { /* non-blocking */ }
}

async function execCreateTask(
  actionVal: string,
  data: Record<string, unknown>,
  workspaceId: string,
  supabase: ReturnType<typeof serviceClient>
) {
  if (!actionVal) return
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  try {
    await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      contact_id: data.id ?? null,
      title: interpolate(actionVal, data),
      done: false,
      due_date: tomorrow.toISOString().split('T')[0],
      created_by: '00000000-0000-0000-0000-000000000000', // system
    })
  } catch { /* non-blocking */ }
}

async function execAssignOwner(
  actionVal: string,
  data: Record<string, unknown>,
  supabase: ReturnType<typeof serviceClient>
) {
  const contactId = data.id
  if (!contactId || !actionVal) return
  try {
    await supabase.from('contacts').update({ owner_id: actionVal }).eq('id', contactId)
  } catch { /* non-blocking */ }
}

// ── Main handler ──────────────────────────

export async function POST(req: NextRequest) {
  // Internal auth check
  const secret = req.headers.get('x-internal-secret')
  if (!secret || secret !== (process.env.WEBHOOK_SECRET || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { event: string; workspace_id: string; data: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event, workspace_id, data } = body
  if (!event || !workspace_id) {
    return NextResponse.json({ error: 'Missing event or workspace_id' }, { status: 400 })
  }

  const supabase = serviceClient()

  // Fetch active automations matching this trigger event
  // Map event names to trigger column values
  const triggerMap: Record<string, string[]> = {
    contact_created: ['contact_created'],
    stage_changed:   ['stage_is', 'stage_changed'],
    tag_added:       ['tag_added'],
  }
  const triggers = triggerMap[event] ?? [event]

  const { data: automations, error: autoErr } = await supabase
    .from('automations')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq('active', true)
    .in('trigger', triggers)

  if (autoErr || !automations?.length) {
    return NextResponse.json({ ok: true, matched: 0 })
  }

  // Fetch workspace integrations
  const { data: integrationRows } = await supabase
    .from('workspace_integrations')
    .select('provider, config')
    .eq('workspace_id', workspace_id)
    .eq('active', true)

  const integrations: Record<string, Record<string, string>> = {}
  for (const row of integrationRows ?? []) {
    integrations[row.provider] = row.config ?? {}
  }

  let executed = 0

  for (const auto of automations) {
    // Trigger condition checks
    if (auto.trigger === 'stage_is' || auto.trigger === 'stage_changed') {
      if (auto.trigger_val && data.stage_id !== auto.trigger_val) continue
    }
    if (auto.trigger === 'tag_added') {
      const tags: string[] = Array.isArray(data.tags) ? (data.tags as string[]) : []
      if (auto.trigger_val && !tags.includes(auto.trigger_val)) continue
    }

    const av: string = auto.action_val ?? ''

    // Execute action (all non-blocking)
    switch (auto.action) {
      case 'notify_slack':
        await execNotifySlack(av, data, integrations)
        break
      case 'send_email':
        await execSendEmail(av, data, integrations)
        break
      case 'send_sms':
        await execSendSms(av, data, integrations)
        break
      case 'send_webhook':
      case 'webhook':
        await execSendWebhook(av, event, workspace_id, data)
        break
      case 'add_tag':
        await execAddTag(av, data, supabase)
        break
      case 'move_stage':
        await execMoveStage(av, data, supabase)
        break
      case 'create_task':
        await execCreateTask(av, data, workspace_id, supabase)
        break
      case 'assign_owner':
        await execAssignOwner(av, data, supabase)
        break
      default:
        break
    }

    // Update run_count and last_run
    try {
      await supabase
        .from('automations')
        .update({ run_count: (auto.run_count ?? 0) + 1, last_run: new Date().toISOString() })
        .eq('id', auto.id)
    } catch { /* non-blocking */ }

    executed++
  }

  return NextResponse.json({ ok: true, matched: automations.length, executed })
}
