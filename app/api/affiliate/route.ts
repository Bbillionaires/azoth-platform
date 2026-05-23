import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function genCode(name: string): string {
  const base = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 12)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

// GET /api/affiliate?workspace_id=xxx — list affiliates for a workspace
export async function GET(req: NextRequest) {
  const wsId = req.nextUrl.searchParams.get('workspace_id')
  if (!wsId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  const supabase = admin()
  const { data, error } = await supabase
    .from('affiliates')
    .select('*')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ affiliates: data })
}

// POST /api/affiliate — create a new affiliate
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { workspace_id, name, email, destination_url, commission_rate } = body

  if (!workspace_id || !name || !email || !destination_url) {
    return NextResponse.json({ error: 'workspace_id, name, email, destination_url required' }, { status: 400 })
  }

  const supabase = admin()
  const code = genCode(name)

  const { data, error } = await supabase
    .from('affiliates')
    .insert({
      workspace_id,
      name,
      email,
      code,
      destination_url,
      commission_rate: commission_rate ?? 10,
      status: 'active',
      total_clicks: 0,
      total_leads: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ affiliate: data })
}

// PATCH /api/affiliate — update an affiliate
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = admin()
  const { data, error } = await supabase
    .from('affiliates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ affiliate: data })
}

// DELETE /api/affiliate?id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = admin()
  const { error } = await supabase.from('affiliates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
