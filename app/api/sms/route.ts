import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/sms — send SMS via Twilio or SendHub
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { to, message, workspace_id } = body as { to: string; message: string; workspace_id: string }

  if (!to || !message || !workspace_id) {
    return NextResponse.json({ error: 'to, message, and workspace_id required' }, { status: 400 })
  }

  const supabase = admin()

  // Try Twilio first
  const { data: twilioInt } = await supabase
    .from('workspace_integrations')
    .select('config')
    .eq('workspace_id', workspace_id)
    .eq('type', 'twilio')
    .eq('enabled', true)
    .single()

  if (twilioInt) {
    const { account_sid, auth_token, phone_number } = twilioInt.config as Record<string, string>
    if (account_sid && auth_token && phone_number) {
      const params = new URLSearchParams({ From: phone_number, To: to, Body: message })
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: 'Basic ' + Buffer.from(`${account_sid}:${auth_token}`).toString('base64'),
          },
          body: params.toString(),
        }
      )
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: data.message ?? 'Twilio error' }, { status: 500 })
      return NextResponse.json({ success: true, provider: 'twilio', sid: data.sid })
    }
  }

  // Fallback to SendHub
  const { data: sendhubInt } = await supabase
    .from('workspace_integrations')
    .select('config')
    .eq('workspace_id', workspace_id)
    .eq('type', 'sendhub')
    .eq('enabled', true)
    .single()

  if (sendhubInt) {
    const { api_key, phone_number } = sendhubInt.config as Record<string, string>
    if (api_key && phone_number) {
      const res = await fetch('https://api.sendhub.com/v1/messages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `ApiKey ${api_key}`,
        },
        body: JSON.stringify({ numbers: [{ number: to }], text: message }),
      })
      const data = await res.json()
      if (!res.ok) return NextResponse.json({ error: data.detail ?? 'SendHub error' }, { status: 500 })
      return NextResponse.json({ success: true, provider: 'sendhub' })
    }
  }

  return NextResponse.json({ error: 'No SMS integration configured (Twilio or SendHub)' }, { status: 400 })
}
