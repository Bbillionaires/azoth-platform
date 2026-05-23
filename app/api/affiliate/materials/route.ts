/**
 * Marketing materials CRUD
 * Admin creates materials; affiliates download/view them via portal
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/affiliate/materials?workspace_id=xxx
export async function GET(req: NextRequest) {
  const wsId = req.nextUrl.searchParams.get('workspace_id')
  if (!wsId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  const supabase = admin()
  const { data, error } = await supabase
    .from('affiliate_materials')
    .select('*')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ materials: data })
}

// POST /api/affiliate/materials — add a material
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { workspace_id, title, description, file_url, file_type, thumbnail_url } = body

  if (!workspace_id || !title || !file_url || !file_type) {
    return NextResponse.json({ error: 'workspace_id, title, file_url, file_type required' }, { status: 400 })
  }

  const supabase = admin()
  const { data, error } = await supabase
    .from('affiliate_materials')
    .insert({ workspace_id, title, description, file_url, file_type, thumbnail_url })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data })
}

// PATCH /api/affiliate/materials — update
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = admin()
  const { data, error } = await supabase
    .from('affiliate_materials')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data })
}

// DELETE /api/affiliate/materials?id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = admin()
  const { error } = await supabase.from('affiliate_materials').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
