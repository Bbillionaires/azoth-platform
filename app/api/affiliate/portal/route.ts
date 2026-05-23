/**
 * GET /api/affiliate/portal?code=xxx
 * Returns affiliate stats, leads, and materials for the portal page.
 * No auth required — the code itself is the credential.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })

  const supabase = admin()

  // Get affiliate
  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('code', code)
    .single()

  if (error || !affiliate) {
    return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 404 })
  }

  // Get leads
  const { data: leads } = await supabase
    .from('affiliate_leads')
    .select('*')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

  // Get marketing materials for this workspace
  const { data: materials } = await supabase
    .from('affiliate_materials')
    .select('*')
    .eq('workspace_id', affiliate.workspace_id)
    .order('created_at', { ascending: false })

  // Click trend — last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recentClicks } = await supabase
    .from('affiliate_clicks')
    .select('created_at')
    .eq('affiliate_id', affiliate.id)
    .gte('created_at', since)

  return NextResponse.json({
    affiliate,
    leads: leads ?? [],
    materials: materials ?? [],
    recent_clicks: recentClicks ?? [],
  })
}
