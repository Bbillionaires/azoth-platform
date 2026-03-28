import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/security/apiAuth'
import { AuditLog } from '@/lib/security/audit'

export async function POST(req: NextRequest) {
  // Read raw body for signature verification (must be before .json())
  const rawBody = await req.text()

  // Verify HMAC-SHA256 signature
  const signature = req.headers.get('x-nexus-signature') ?? ''
  const secret    = process.env.WEBHOOK_SECRET ?? ''

  if (secret && !(await verifyWebhookSignature(rawBody, signature, secret))) {
    console.warn('[Nexus Webhook] Invalid signature from', req.headers.get('x-forwarded-for'))
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  let payload: { event: string; data: Record<string, unknown>; workspace_id?: string }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const { event, data, workspace_id = 'unknown' } = payload
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? ''

  console.log(`[Nexus Webhook] ${event} | workspace=${workspace_id}`)

  switch (event) {
    case 'contact.created':
      break
    case 'contact.stage_changed':
      await AuditLog.stageChanged({
        workspace_id,
        user_id:    'webhook',
        contact_id: Number(data.contact_id),
        fromStage:  String(data.from ?? ''),
        toStage:    String(data.to ?? ''),
      })
      break
    case 'deal.won':
      break
    case 'campaign.opened':
      break
    case 'stripe.payment_succeeded':
      // Update workspace plan in DB
      break
    default:
      console.warn('[Nexus] Unknown webhook event:', event)
  }

  return NextResponse.json({ received: true, event })
}
