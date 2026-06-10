import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/meetings — generate a meeting link
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { provider, workspace_id, contact_name } = body as {
    provider: 'zoom' | 'meet'
    workspace_id: string
    contact_name?: string
  }

  if (!provider || !workspace_id) {
    return NextResponse.json({ error: 'provider and workspace_id required' }, { status: 400 })
  }

  if (provider === 'meet') {
    return NextResponse.json({ url: 'https://meet.google.com/new' })
  }

  // Zoom
  const supabase = admin()
  const { data: integration } = await supabase
    .from('workspace_integrations')
    .select('config')
    .eq('workspace_id', workspace_id)
    .eq('type', 'zoom')
    .eq('enabled', true)
    .single()

  if (!integration) {
    return NextResponse.json({ url: 'https://zoom.us/start/videomeeting' })
  }

  const { api_key, api_secret, account_id } = integration.config as Record<string, string>

  if (!api_key || !api_secret || !account_id) {
    return NextResponse.json({ url: 'https://zoom.us/start/videomeeting' })
  }

  try {
    // Get Zoom OAuth token using Server-to-Server OAuth
    const tokenRes = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${account_id}`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${api_key}:${api_secret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    if (!tokenRes.ok) {
      return NextResponse.json({ url: 'https://zoom.us/start/videomeeting' })
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token as string

    // Create meeting
    const meetingRes = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: contact_name ? `Meeting with ${contact_name}` : 'Meeting',
        type: 1, // instant meeting
        settings: { join_before_host: true },
      }),
    })

    if (!meetingRes.ok) {
      return NextResponse.json({ url: 'https://zoom.us/start/videomeeting' })
    }

    const meetingData = await meetingRes.json()
    return NextResponse.json({ url: meetingData.join_url ?? 'https://zoom.us/start/videomeeting' })
  } catch {
    return NextResponse.json({ url: 'https://zoom.us/start/videomeeting' })
  }
}
