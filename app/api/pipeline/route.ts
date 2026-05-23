/**
 * GET /api/pipeline?workspace_id=xxx&name=film
 * Returns the pipeline + its first stage ID for a given sector name.
 * Used by external projects (OUE etc.) to route leads to the right pipeline.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const wsId = req.nextUrl.searchParams.get('workspace_id')
  const name = req.nextUrl.searchParams.get('name')

  if (!wsId) return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })

  const supabase = admin()

  // If a sector name is given, look up that specific pipeline
  if (name) {
    const { data, error } = await supabase
      .from('pipelines')
      .select('*, stages(*)')
      .eq('workspace_id', wsId)
      .eq('name', name)
      .single()

    if (error || !data) {
      // Fallback — return the first pipeline for this workspace
      const { data: fallback } = await supabase
        .from('pipelines')
        .select('*, stages(*)')
        .eq('workspace_id', wsId)
        .order('position', { ascending: true })
        .limit(1)
        .single()

      if (!fallback) return NextResponse.json({ error: 'No pipelines found' }, { status: 404 })

      const stages = (fallback.stages ?? []).sort((a: any, b: any) => a.position - b.position)
      return NextResponse.json({ pipeline: fallback, default_stage_id: stages[0]?.id ?? null })
    }

    const stages = (data.stages ?? []).sort((a: any, b: any) => a.position - b.position)
    return NextResponse.json({ pipeline: data, default_stage_id: stages[0]?.id ?? null })
  }

  // No name — return all pipelines for workspace
  const { data, error } = await supabase
    .from('pipelines')
    .select('*, stages(*)')
    .eq('workspace_id', wsId)
    .order('position', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pipelines: data })
}
