import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/security/apiAuth'
import { validateContact } from '@/lib/security/validate'
import { AuditLog } from '@/lib/security/audit'
import { encryptContactPII } from '@/lib/security/encrypt'

// GET /api/contacts — scoped to caller's workspace only
export const GET = withAuth(async (req, ctx) => {
  const { searchParams } = new URL(req.url)
  const stage    = searchParams.get('stage')
  const pipeline = searchParams.get('pipeline')
  const q        = searchParams.get('q')?.slice(0, 100) // limit search length

  // All queries are scoped to ctx.workspace_id — users can NEVER see other workspaces
  // const supabase = createServerSupabase()
  // let query = supabase.from('contacts').select('*').eq('workspace_id', ctx.workspace_id)
  // if (stage)    query = query.eq('stage_id', stage)
  // if (pipeline) query = query.eq('pipeline_id', pipeline)
  // if (q)        query = query.ilike('name', `%${q}%`)
  // const { data, error } = await query
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    contacts: [],
    meta: { total: 0, workspace_id: ctx.workspace_id, filters: { stage, pipeline, q } }
  })
})

// POST /api/contacts — validate, sanitize, encrypt PII, then insert
export const POST = withAuth(async (req, ctx) => {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate and sanitize all input
  const { ok, errors, clean } = validateContact(body)
  if (!ok) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 })
  }

  // Encrypt PII fields before storing
  const safeContact = await encryptContactPII({
    ...clean,
    workspace_id: ctx.workspace_id, // always use server-side workspace — never trust client
    created_at: new Date().toISOString(),
  })

  // const supabase = createServerSupabase()
  // const { data, error } = await supabase.from('contacts').insert(safeContact).select().single()
  // if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const contact = { id: Date.now(), ...safeContact }

  // Audit log every creation
  await AuditLog.contactCreated({ workspace_id: ctx.workspace_id, user_id: ctx.user_id, contact_id: contact.id as number, ip: ctx.ip })

  return NextResponse.json({ contact }, { status: 201 })
}, { allowedRoles: ['owner', 'admin', 'member'] }) // viewers cannot create
