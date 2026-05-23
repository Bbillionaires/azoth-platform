import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params
  const supabase = admin()

  // Look up the affiliate by code
  const { data: affiliate, error } = await supabase
    .from('affiliates')
    .select('id, destination_url, status')
    .eq('code', code)
    .single()

  if (error || !affiliate || affiliate.status !== 'active') {
    // Redirect to homepage if code is invalid
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Record the click (fire-and-forget, don't block the redirect)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? null
  const referrer = req.headers.get('referer') ?? null

  supabase.from('affiliate_clicks').insert({
    affiliate_id: affiliate.id,
    referrer,
    ip,
  }).then(() => {
    // Update cached click count on affiliate row
    supabase.rpc('increment_affiliate_clicks', { aff_id: affiliate.id }).then(() => {})
  })

  // Build the destination URL — append ref code as query param
  const dest = new URL(affiliate.destination_url)
  dest.searchParams.set('ref', code)

  const response = NextResponse.redirect(dest.toString())

  // Set a 30-day cookie so conversions are tracked even without the ref param
  response.cookies.set('aff_ref', code, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  return response
}
