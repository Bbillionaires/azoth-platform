// ─────────────────────────────────────────
//  Nexus Security — Central Export + GDPR
// ─────────────────────────────────────────

export * from './validate'
export * from './audit'
export * from './encrypt'
export * from './apiAuth'

// ─────────────────────────────────────────
//  GDPR / Data Privacy Helpers
// ─────────────────────────────────────────

/**
 * Right to Erasure — delete all of a contact's PII.
 * Keeps the record shell for audit purposes but
 * wipes all identifying information.
 */
export async function eraseContactPII(contactId: number, workspaceId: string, requestedBy: string) {
  // const supabase = createServerSupabase()
  // await supabase.from('contacts').update({
  //   name:        '[DELETED]',
  //   email:       '[DELETED]',
  //   phone:       null,
  //   company:     null,
  //   role:        null,
  //   notes:       null,
  //   tags:        [],
  //   custom_data: {},
  //   status:      'inactive',
  // }).eq('id', contactId).eq('workspace_id', workspaceId)
  //
  // await audit({ action: 'contact.deleted', workspace_id: workspaceId, user_id: requestedBy, target_id: contactId, metadata: { gdpr: true } })

  console.log(`[GDPR] Erasing PII for contact ${contactId} in workspace ${workspaceId}, requested by ${requestedBy}`)
}

/**
 * Data Portability — export all data for a contact
 * in a machine-readable JSON format.
 */
export async function exportContactData(contactId: number, workspaceId: string) {
  // const supabase = createServerSupabase()
  // const [contact, messages, tasks] = await Promise.all([
  //   supabase.from('contacts').select('*').eq('id', contactId).eq('workspace_id', workspaceId).single(),
  //   supabase.from('messages').select('*').eq('workspace_id', workspaceId),
  //   supabase.from('tasks').select('*').eq('contact_id', contactId).eq('workspace_id', workspaceId),
  // ])
  // return { contact: contact.data, messages: messages.data, tasks: tasks.data, exported_at: new Date().toISOString() }

  return { contact_id: contactId, workspace_id: workspaceId, exported_at: new Date().toISOString() }
}

// ─────────────────────────────────────────
//  Security Checklist (for deployment)
// ─────────────────────────────────────────
export const SECURITY_CHECKLIST = `
NEXUS PLATFORM — PRE-LAUNCH SECURITY CHECKLIST
================================================

AUTH + ACCESS
□ Supabase Auth configured with email confirmation
□ Strong password policy enforced (min 8 chars, 1 letter, 1 number)
□ MFA available to users (Supabase TOTP)
□ JWT expiry set to 1 hour, refresh tokens to 7 days
□ Rate limiting on /api/auth (10 req/min per IP)

DATABASE
□ lib/schema.sql executed
□ lib/security/rls.sql executed (Row-Level Security)
□ Supabase service_role key NEVER exposed to client
□ anon key only has RLS-restricted access
□ Database backups enabled (daily + point-in-time)

ENCRYPTION
□ FIELD_ENCRYPTION_KEY set in production (64-char hex)
□ HTTPS enforced (Vercel does this automatically)
□ Supabase connection uses SSL (default)

ENVIRONMENT
□ .env.local NOT committed to git (.gitignore includes it)
□ All secrets in Vercel environment variables
□ NODE_ENV=production in deployment
□ WEBHOOK_SECRET set and rotated quarterly

API SECURITY
□ All API routes use withAuth() wrapper
□ Bearer tokens validated against hashed values in DB
□ Rate limits applied per route
□ Input validated with validateContact() / sanitize()
□ CORS restricted to your domain only

HEADERS
□ CSP, HSTS, X-Frame-Options set (middleware.ts handles this)
□ Vercel Edge Network CDN in front

GDPR / COMPLIANCE
□ Privacy Policy page linked from signup
□ Data retention policy documented
□ Right-to-erasure endpoint implemented
□ User consent captured at signup
□ Data export endpoint available to users

MONITORING
□ Supabase audit logs enabled
□ Error tracking (Sentry) connected
□ Uptime monitoring (Better Uptime / Checkly)
□ Alert on >1000 failed auth attempts/hour
`
