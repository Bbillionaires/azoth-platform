import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Refresh an OAuth access token using the refresh_token */
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })
  if (!res.ok) return null
  return res.json()
}

/** Build an RFC 2822 email and base64url-encode it */
function buildRawMessage(opts: {
  from: string
  to: string
  subject: string
  html: string
}): string {
  const boundary = `azoth_${Date.now()}`
  const lines = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    opts.html,
    '',
    `--${boundary}--`,
  ]
  const raw = lines.join('\r\n')
  // base64url encode (no padding)
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    workspace_id: string
    to: string
    subject: string
    html: string
    from_name?: string
  }

  const { workspace_id, to, subject, html, from_name } = body
  if (!workspace_id || !to || !subject || !html) {
    return NextResponse.json({ error: 'workspace_id, to, subject, html required' }, { status: 400 })
  }

  const supabase = serviceClient()

  // Fetch gmail integration
  const { data: row, error: fetchErr } = await supabase
    .from('workspace_integrations')
    .select('config')
    .eq('workspace_id', workspace_id)
    .eq('type', 'gmail')
    .single()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Gmail integration not configured' }, { status: 400 })
  }

  const config = row.config as Record<string, string>

  // ── Method: App Password (SMTP via Gmail REST API using Basic Auth is not supported,
  //    but App Password can authenticate via OAuth-less SMTP; here we use the Gmail REST API
  //    with an app password only when an access_token is present from OAuth.
  //    For app password method, we use nodemailer-compatible base64 auth via the Gmail SMTP
  //    through the Gmail REST API isn't available — so we call the send endpoint differently.) ──
  // Determine method: if access_token present → OAuth; else app password path
  if (config.access_token) {
    // OAuth path
    let accessToken = config.access_token

    // Check token expiry and refresh if needed
    if (config.token_expiry) {
      const expiry = new Date(config.token_expiry).getTime()
      if (Date.now() > expiry - 60_000 && config.refresh_token) {
        const refreshed = await refreshAccessToken(config.refresh_token)
        if (refreshed) {
          accessToken = refreshed.access_token
          const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
          // Persist updated token
          await supabase
            .from('workspace_integrations')
            .update({ config: { ...config, access_token: accessToken, token_expiry: newExpiry } })
            .eq('workspace_id', workspace_id)
            .eq('type', 'gmail')
        }
      }
    }

    const fromAddress = config.email ?? 'me'
    const fromHeader = from_name ? `${from_name} <${fromAddress}>` : fromAddress
    const raw = buildRawMessage({ from: fromHeader, to, subject, html })

    const gmailRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      }
    )

    if (!gmailRes.ok) {
      const err = await gmailRes.text()
      return NextResponse.json({ error: `Gmail API error: ${err}` }, { status: 502 })
    }

    const gmailData = await gmailRes.json() as { id: string }
    return NextResponse.json({ success: true, message_id: gmailData.id })
  } else if (config.gmail_email && config.gmail_app_password) {
    // App Password path — use Gmail REST API with basic auth via OAuth2 is not possible,
    // but we can send via Gmail SMTP API using the app password as the password.
    // Since we cannot use nodemailer, we use the Gmail REST API which requires OAuth.
    // For app passwords, use SMTP directly encoded as a raw email via a fetch to
    // a self-hosted SMTP bridge isn't ideal; instead we fall back to the Gmail SMTP
    // submission endpoint using HTTP CONNECT — which isn't feasible with fetch().
    //
    // Best practical approach without npm packages: encode as RFC 2822 and POST to
    // smtp.gmail.com:587 is not possible via fetch(). Instead, use the approach of
    // sending via the Gmail API using the app password as an XOAUTH2 token, which
    // also doesn't work without SASL.
    //
    // Realistic solution: use a minimal SMTP-over-TLS via a Google-provided endpoint.
    // Since fetch() only does HTTP/HTTPS, we POST to https://smtp-relay.gmail.com
    // doesn't accept REST calls.
    //
    // Conclusion: for the app password path, we compose the raw message and POST to
    // the Gmail API using the email/password via HTTP Basic auth which Gmail no longer
    // supports. We therefore return a clear error message directing users to use OAuth.
    return NextResponse.json(
      { error: 'App password sending requires the Gmail REST API (OAuth). Please reconnect with "Connect with Google" for sending emails. App password credentials are saved and work for IMAP/SMTP clients.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ error: 'No valid Gmail credentials found' }, { status: 400 })
}
