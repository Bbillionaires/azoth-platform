/**
 * POST /api/affiliate/lead
 *
 * Called by any external project (OUE, etc.) when a lead converts.
 * Requires the Azoth API secret in the Authorization header.
 *
 * Body:
 * {
 *   affiliate_code: "dearis-x4f2",
 *   workspace_id: "uuid",
 *   contact_name: "John Doe",
 *   contact_email: "john@example.com",
 *   source_project: "one-united-enterprise",
 *   metadata: { sector: "consulting", service: "strategy" }  // optional
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Auth check
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token || !token.startsWith('azoth_live_')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { affiliate_code, workspace_id, contact_name, contact_email, source_project, metadata } = body

  if (!affiliate_code || !workspace_id || !contact_name || !contact_email) {
    return NextResponse.json({ error: 'affiliate_code, workspace_id, contact_name, contact_email required' }, { status: 400 })
  }

  const supabase = admin()

  // Resolve code to affiliate ID
  const { data: affiliate, error: affErr } = await supabase
    .from('affiliates')
    .select('id')
    .eq('code', affiliate_code)
    .eq('workspace_id', workspace_id)
    .single()

  if (affErr || !affiliate) {
    return NextResponse.json({ error: 'Affiliate code not found' }, { status: 404 })
  }

  // Insert lead record
  const { data: lead, error: leadErr } = await supabase
    .from('affiliate_leads')
    .insert({
      affiliate_id: affiliate.id,
      workspace_id,
      contact_name,
      contact_email,
      source_project: source_project ?? 'unknown',
      metadata: metadata ?? {},
    })
    .select()
    .single()

  if (leadErr) return NextResponse.json({ error: leadErr.message }, { status: 500 })

  // Increment cached lead count
  await supabase.rpc('increment_affiliate_leads', { aff_id: affiliate.id })

  return NextResponse.json({ ok: true, lead_id: lead.id })
}
