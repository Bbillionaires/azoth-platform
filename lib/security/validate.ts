// ─────────────────────────────────────────
//  Nexus — Input Validation & Sanitization
//
//  Every field that touches the DB goes
//  through these validators. Never trust
//  client input.
// ─────────────────────────────────────────

// ── Sanitize ─────────────────────────────

/**
 * Strip HTML/script tags and dangerous characters.
 * Use on all free-text user input before storing.
 */
export function sanitize(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')   // strip <script> blocks
    .replace(/<[^>]*>/g, '')                                 // strip all HTML tags
    .replace(/javascript:/gi, '')                            // strip JS protocol
    .replace(/on\w+\s*=/gi, '')                              // strip event handlers
    .slice(0, 10_000)                                        // hard length cap
}

/**
 * Sanitize but preserve safe formatting for rich text fields (notes, messages).
 * Only allows newlines, removes everything executable.
 */
export function sanitizeRich(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, 50_000)
}

// ── Validators ───────────────────────────

export const Validators = {
  email(v: unknown): { ok: boolean; error?: string } {
    const s = sanitize(v)
    if (!s) return { ok: false, error: 'Email is required' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { ok: false, error: 'Invalid email address' }
    if (s.length > 254) return { ok: false, error: 'Email too long' }
    return { ok: true }
  },

  name(v: unknown): { ok: boolean; error?: string } {
    const s = sanitize(v)
    if (!s) return { ok: false, error: 'Name is required' }
    if (s.length < 1) return { ok: false, error: 'Name is required' }
    if (s.length > 200) return { ok: false, error: 'Name too long (max 200 chars)' }
    return { ok: true }
  },

  phone(v: unknown): { ok: boolean; error?: string } {
    if (!v) return { ok: true }  // optional
    const s = sanitize(v).replace(/\s/g, '')
    if (!/^\+?[\d\-()]{7,20}$/.test(s)) return { ok: false, error: 'Invalid phone number' }
    return { ok: true }
  },

  url(v: unknown): { ok: boolean; error?: string } {
    if (!v) return { ok: true }  // optional
    const s = sanitize(v)
    try {
      const u = new URL(s)
      if (!['http:', 'https:'].includes(u.protocol)) return { ok: false, error: 'URL must use http or https' }
      return { ok: true }
    } catch {
      return { ok: false, error: 'Invalid URL' }
    }
  },

  currency(v: unknown): { ok: boolean; error?: string } {
    const n = Number(v)
    if (isNaN(n)) return { ok: false, error: 'Must be a number' }
    if (n < 0)    return { ok: false, error: 'Value cannot be negative' }
    if (n > 999_999_999) return { ok: false, error: 'Value too large' }
    return { ok: true }
  },

  uuid(v: unknown): { ok: boolean; error?: string } {
    const s = sanitize(v)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
      return { ok: false, error: 'Invalid ID format' }
    }
    return { ok: true }
  },

  tags(v: unknown): { ok: boolean; error?: string; value?: string[] } {
    if (!Array.isArray(v)) return { ok: true, value: [] }
    if (v.length > 20) return { ok: false, error: 'Max 20 tags allowed' }
    const cleaned = v.map(t => sanitize(t)).filter(Boolean).map(t => t.toLowerCase().replace(/\s+/g,'-').slice(0, 50))
    return { ok: true, value: cleaned }
  },

  password(v: unknown): { ok: boolean; error?: string } {
    const s = typeof v === 'string' ? v : ''
    if (!s) return { ok: false, error: 'Password is required' }
    if (s.length < 8) return { ok: false, error: 'Password must be at least 8 characters' }
    if (s.length > 128) return { ok: false, error: 'Password too long' }
    if (!/[A-Za-z]/.test(s)) return { ok: false, error: 'Password must contain at least one letter' }
    if (!/[0-9]/.test(s)) return { ok: false, error: 'Password must contain at least one number' }
    return { ok: true }
  },

  workspaceName(v: unknown): { ok: boolean; error?: string } {
    const s = sanitize(v)
    if (!s) return { ok: false, error: 'Workspace name is required' }
    if (s.length < 2) return { ok: false, error: 'Workspace name too short' }
    if (s.length > 100) return { ok: false, error: 'Workspace name too long' }
    if (/[<>{}]/.test(s)) return { ok: false, error: 'Workspace name contains invalid characters' }
    return { ok: true }
  },
}

// ── Contact shape validator ───────────────
export interface ContactInput {
  name: string
  email: string
  phone?: string
  company?: string
  role?: string
  value?: number
  source?: string
  tags?: string[]
  notes?: string
  stage_id?: string
  pipeline_id?: string
}

export function validateContact(body: Record<string, unknown>): { ok: boolean; errors: string[]; clean: Partial<ContactInput> } {
  const errors: string[] = []
  const clean: Partial<ContactInput> = {}

  const nameV = Validators.name(body.name)
  if (!nameV.ok) errors.push(nameV.error!)
  else clean.name = sanitize(body.name)

  const emailV = Validators.email(body.email)
  if (!emailV.ok) errors.push(emailV.error!)
  else clean.email = sanitize(body.email).toLowerCase()

  if (body.phone) {
    const phoneV = Validators.phone(body.phone)
    if (!phoneV.ok) errors.push(phoneV.error!)
    else clean.phone = sanitize(body.phone)
  }

  if (body.company)  clean.company  = sanitize(body.company).slice(0, 200)
  if (body.role)     clean.role     = sanitize(body.role).slice(0, 200)
  if (body.source)   clean.source   = sanitize(body.source).slice(0, 100)
  if (body.notes)    clean.notes    = sanitizeRich(body.notes)

  if (body.value !== undefined) {
    const valV = Validators.currency(body.value)
    if (!valV.ok) errors.push(valV.error!)
    else clean.value = Number(body.value)
  }

  const tagsV = Validators.tags(body.tags)
  if (!tagsV.ok) errors.push(tagsV.error!)
  else clean.tags = tagsV.value

  if (body.stage_id)    clean.stage_id    = sanitize(body.stage_id).slice(0, 50)
  if (body.pipeline_id) clean.pipeline_id = sanitize(body.pipeline_id).slice(0, 50)

  return { ok: errors.length === 0, errors, clean }
}

// ── Message validator ─────────────────────
export function validateMessage(body: Record<string, unknown>): { ok: boolean; errors: string[]; clean: { body: string } } {
  const errors: string[] = []
  const b = sanitizeRich(body.body)
  if (!b) errors.push('Message body is required')
  if (b.length > 10_000) errors.push('Message too long (max 10,000 characters)')
  return { ok: errors.length === 0, errors, clean: { body: b } }
}
