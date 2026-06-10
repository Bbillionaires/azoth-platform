import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const stateParam = req.nextUrl.searchParams.get('state')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (!code) {
    return NextResponse.redirect(`${appUrl}/integrations?gmail=error&reason=no_code`)
  }

  // Decode state to get workspace_id
  let workspaceId = ''
  try {
    const decoded = JSON.parse(Buffer.from(stateParam ?? '', 'base64url').toString('utf-8'))
    workspaceId = decoded.workspace_id ?? ''
  } catch {
    return NextResponse.redirect(`${appUrl}/integrations?gmail=error&reason=bad_state`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = `${appUrl}/api/integrations/gmail/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/integrations?gmail=error&reason=token_exchange`)
  }

  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in?: number
  }

  // Get user email
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userRes.ok) {
    return NextResponse.redirect(`${appUrl}/integrations?gmail=error&reason=userinfo`)
  }

  const userInfo = await userRes.json() as { email: string }

  const tokenExpiry = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  // Save to workspace_integrations
  const supabase = serviceClient()
  const { error } = await supabase
    .from('workspace_integrations')
    .upsert(
      {
        workspace_id: workspaceId,
        type: 'gmail',
        config: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token ?? '',
          email: userInfo.email,
          token_expiry: tokenExpiry ?? '',
        },
        enabled: true,
      },
      { onConflict: 'workspace_id,type' }
    )

  if (error) {
    return NextResponse.redirect(`${appUrl}/integrations?gmail=error&reason=db`)
  }

  return NextResponse.redirect(`${appUrl}/integrations?gmail=connected`)
}
