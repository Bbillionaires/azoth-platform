import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/integrations?workspace_id=xxx
export async function GET(req: NextRequest) {
  const wsId = req.nextUrl.searchParams.get('workspace_id')
  if (!wsId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  const supabase = admin()
  const { data, error } = await supabase
    .from('workspace_integrations')
    .select('*')
    .eq('workspace_id', wsId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ integrations: data })
}

// POST /api/integrations — upsert integration config
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { workspace_id, type, config } = body

  if (!workspace_id || !type) {
    return NextResponse.json({ error: 'workspace_id and type required' }, { status: 400 })
  }

  const supabase = admin()
  const { data, error } = await supabase
    .from('workspace_integrations')
    .upsert(
      { workspace_id, type, config: config ?? {}, enabled: true },
      { onConflict: 'workspace_id,type' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ integration: data })
}

// PATCH /api/integrations — toggle enabled
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { workspace_id, type, enabled } = body

  if (!workspace_id || !type || enabled === undefined) {
    return NextResponse.json({ error: 'workspace_id, type, enabled required' }, { status: 400 })
  }

  const supabase = admin()
  const { data, error } = await supabase
    .from('workspace_integrations')
    .update({ enabled })
    .eq('workspace_id', workspace_id)
    .eq('type', type)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ integration: data })
}
