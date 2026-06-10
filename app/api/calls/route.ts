import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/calls — initiate outbound call via Twilio Voice
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { workspace_id, to } = body

  if (!workspace_id || !to) {
    return NextResponse.json({ error: 'workspace_id and to required' }, { status: 400 })
  }

  const supabase = admin()
  const { data: integration, error: intErr } = await supabase
    .from('workspace_integrations')
    .select('config')
    .eq('workspace_id', workspace_id)
    .eq('type', 'twilio_voice')
    .eq('enabled', true)
    .single()

  if (intErr || !integration) {
    return NextResponse.json({ error: 'Twilio Voice integration not configured' }, { status: 400 })
  }

  const { account_sid, auth_token, phone_number } = integration.config as Record<string, string>

  if (!account_sid || !auth_token || !phone_number) {
    return NextResponse.json({ error: 'Twilio Voice integration missing required fields' }, { status: 400 })
  }

  const twimlUrl = 'https://demo.twilio.com/docs/voice.xml'

  const params = new URLSearchParams({
    From: phone_number,
    To: to,
    Url: twimlUrl,
  })

  const twilioRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${account_sid}/Calls.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${account_sid}:${auth_token}`).toString('base64'),
      },
      body: params.toString(),
    }
  )

  const twilioData = await twilioRes.json()

  if (!twilioRes.ok) {
    return NextResponse.json({ error: twilioData.message ?? 'Twilio error' }, { status: 500 })
  }

  return NextResponse.json({ success: true, call_sid: twilioData.sid })
}
