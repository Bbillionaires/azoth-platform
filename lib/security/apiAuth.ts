// ─────────────────────────────────────────
//  Nexus — API Route Auth + Workspace Guard
//
//  Every API handler calls requireAuth()
//  first. This:
//    1. Validates the Supabase session
//    2. Looks up which workspace the user
//       belongs to
//    3. Returns user + workspace context
//
//  All database queries then use workspace_id
//  from this context — so users can never
//  accidentally (or maliciously) access
//  another tenant's data.
// ─────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'

export interface AuthContext {
  user_id:      string
  email:        string
  workspace_id: string
  role:         'owner' | 'admin' | 'member' | 'viewer'
  ip:           string
}

export type ApiHandler = (
  req: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>

// ── requireAuth wrapper ───────────────────
/**
 * Wrap any API route handler with auth + workspace isolation.
 *
 * Usage:
 *   export const GET = withAuth(async (req, ctx) => {
 *     const { data } = await supabase
 *       .from('contacts')
 *       .select('*')
 *       .eq('workspace_id', ctx.workspace_id)  // ← always scoped
 *     return NextResponse.json({ contacts: data })
 *   })
 */
export function withAuth(handler: ApiHandler, options?: { allowedRoles?: AuthContext['role'][] }) {
  return async (req: NextRequest, params?: Record<string, string>): Promise<NextResponse> => {
    try {
      const ctx = await getAuthContext(req)

      if (!ctx) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHENTICATED' },
          { status: 401 }
        )
      }

      // Role-based access control
      if (options?.allowedRoles && !options.allowedRoles.includes(ctx.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions', code: 'FORBIDDEN', required: options.allowedRoles },
          { status: 403 }
        )
      }

      return await handler(req, ctx, params)
    } catch (err) {
      console.error('[Nexus API Error]', err)
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  }
}

// ── Get auth context ──────────────────────
async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'

  // ── Bearer token auth (for API integrations) ──
  const bearer = req.headers.get('authorization')?.replace('Bearer ', '')
  if (bearer) {
    return validateApiKey(bearer, ip)
  }

  // ── Session cookie auth (for browser) ──
  // Uncomment when Supabase is connected:
  // const { createServerSupabase } = await import('@/lib/supabase')
  // const supabase = createServerSupabase()
  // const { data: { user }, error } = await supabase.auth.getUser()
  // if (error || !user) return null
  //
  // const { data: member } = await supabase
  //   .from('workspace_members')
  //   .select('workspace_id, role')
  //   .eq('user_id', user.id)
  //   .single()
  //
  // if (!member) return null
  //
  // return {
  //   user_id:      user.id,
  //   email:        user.email!,
  //   workspace_id: member.workspace_id,
  //   role:         member.role,
  //   ip,
  // }

  // Demo mode: return mock context
  return {
    user_id:      'user_dearis',
    email:        'dearis@company.com',
    workspace_id: 'ws_demo_001',
    role:         'owner',
    ip,
  }
}

// ── API key validation ────────────────────
async function validateApiKey(key: string, ip: string): Promise<AuthContext | null> {
  // Keys are stored hashed in the database
  // const hash = await hashApiKey(key)
  // const { data } = await supabase
  //   .from('api_keys')
  //   .select('workspace_id, user_id, role, last_used_at')
  //   .eq('key_hash', hash)
  //   .eq('active', true)
  //   .single()
  //
  // if (!data) return null
  //
  // Update last_used_at (non-blocking)
  // supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', hash)
  //
  // return { ...data, email: 'api@client', ip }

  // Demo: accept any key starting with 'nx_live_'
  if (!key.startsWith('nx_live_') && !key.startsWith('nx_test_')) return null

  return {
    user_id:      'api_client',
    email:        'api@client',
    workspace_id: 'ws_demo_001',
    role:         'admin',
    ip,
  }
}

// ── Hash API key ──────────────────────────
// Store only the hash — never the raw key
export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data    = encoder.encode(key)
  const hash    = await crypto.subtle.digest('SHA-256', data)
  return Buffer.from(hash).toString('hex')
}

// ── CSRF token ────────────────────────────
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('hex')
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  // Timing-safe comparison to prevent timing attacks
  if (token.length !== sessionToken.length) return false
  let diff = 0
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ sessionToken.charCodeAt(i)
  }
  return diff === 0
}

// ── Webhook signature verification ────────
/**
 * Verify that an inbound webhook is really from us
 * (or from a trusted source like Stripe).
 * Uses HMAC-SHA256 signature.
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const enc    = new TextEncoder()
    const key    = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signed = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
    const expected = `sha256=${Buffer.from(signed).toString('hex')}`

    // Timing-safe comparison
    if (expected.length !== signature.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) {
      diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
    }
    return diff === 0
  } catch {
    return false
  }
}
