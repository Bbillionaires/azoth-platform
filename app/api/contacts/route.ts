import { NextRequest, NextResponse } from 'next/server'
import { validateContact } from '@/lib/security/validate'
import { encryptContactPII } from '@/lib/security/encrypt'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const stage    = searchParams.get('stage')
  const pipeline = searchParams.get('pipeline')
  const q        = searchParams.get('q')?.slice(0, 100)
  return NextResponse.json({ contacts: [], meta: { total: 0, filters: { stage, pipeline, q } } })
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { ok, errors, clean } = validateContact(body)
  if (!ok) return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 })
  const safeContact = await encryptContactPII({ ...clean, created_at: new Date().toISOString() })
  const contact = { id: Date.now(), ...safeContact }
  return NextResponse.json({ contact }, { status: 201 })
}