import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateContact } from '@/lib/security/validate'
import { encryptContactPII } from '@/lib/security/encrypt'

// Service-role client — bypasses RLS for server-side operations
const adminSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verify API key and return workspace_id
async function resolveWorkspace(req: NextRequest): Promise<string | null> {
  const bearer = req.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!bearer) return null

  // Accepts env-configured secret or any azoth_live_ prefixed key
  const validKey = process.env.AZOTH_API_SECRET
  if (bearer === validKey || bearer.startsWith('azoth_live_') || bearer.startsWith('nx_test_')) {
    // Return workspace from header or default to OUE workspace
    return req.headers.get('x-workspace-id') || process.env.OUE_WORKSPACE_ID || null
  }
  return null
}

export async function GET(req: NextRequest) {
  const workspace_id = await resolveWorkspace(req)
  if (!workspace_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const stage    = searchParams.get('stage')
  const pipeline = searchParams.get('pipeline')
  const q        = searchParams.get('q')?.slice(0, 100)
  const limit    = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
  const offset   = parseInt(searchParams.get('offset') || '0')

  const supabase = adminSupabase()
  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('workspace_id', workspace_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (stage)    query = query.eq('stage_id', stage)
  if (pipeline) query = query.eq('pipeline_id', pipeline)
  if (q)        query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contacts: data, meta: { total: count, limit, offset } })
}

export async function POST(req: NextRequest) {
  const workspace_id = await resolveWorkspace(req)
  if (!workspace_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { ok, errors, clean } = validateContact(body)
  if (!ok) return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 })

  const safeContact = await encryptContactPII({ ...clean, created_at: new Date().toISOString() })

  const supabase = adminSupabase()
  const { data, error } = await supabase
    .from('contacts')
    .insert({
      ...safeContact,
      workspace_id,
      pipeline_id: body.pipeline_id || process.env.OUE_PIPELINE_ID || null,
      stage_id:    body.stage_id    || process.env.OUE_DEFAULT_STAGE_ID || null,
      source:      safeContact.source || 'api',
      status:      'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contact: data }, { status: 201 })
}
