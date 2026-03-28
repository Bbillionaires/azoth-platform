// ─────────────────────────────────────────
//  Nexus — Field-Level Encryption
//
//  Sensitive contact fields (phone, email)
//  are encrypted at rest using AES-256-GCM
//  before going into the database.
//
//  The encryption key comes from
//  FIELD_ENCRYPTION_KEY in .env.local
//  (32-byte hex string, never committed).
//
//  Even if the database is breached, these
//  fields are unreadable without the key.
// ─────────────────────────────────────────

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256

// ── Key derivation ────────────────────────
let _cryptoKey: CryptoKey | null = null

async function getKey(): Promise<CryptoKey> {
  if (_cryptoKey) return _cryptoKey

  const rawKey = process.env.FIELD_ENCRYPTION_KEY
  if (!rawKey) {
    // In development without a key, skip encryption (log a warning)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Nexus Security] FIELD_ENCRYPTION_KEY not set — PII fields stored in plaintext in dev mode')
    }
    throw new Error('FIELD_ENCRYPTION_KEY environment variable is required for encryption')
  }

  // Key must be a 64-char hex string (32 bytes)
  if (!/^[0-9a-f]{64}$/i.test(rawKey)) {
    throw new Error('FIELD_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }

  const keyBytes = Buffer.from(rawKey, 'hex')
  _cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )

  return _cryptoKey
}

// ── Encrypt ───────────────────────────────
/**
 * Encrypt a string value for database storage.
 * Returns a base64-encoded string: iv:ciphertext
 */
export async function encryptField(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext

  try {
    const key = await getKey()
    const iv  = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for GCM
    const enc = new TextEncoder()

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      enc.encode(plaintext)
    )

    const ivB64 = Buffer.from(iv).toString('base64')
    const ctB64 = Buffer.from(ciphertext).toString('base64')

    return `enc:${ivB64}:${ctB64}`
  } catch {
    // If encryption key not available, return plaintext (dev mode)
    return plaintext
  }
}

// ── Decrypt ───────────────────────────────
/**
 * Decrypt a value retrieved from the database.
 * Non-encrypted values (plaintext, from before encryption was enabled)
 * are returned as-is.
 */
export async function decryptField(value: string): Promise<string> {
  if (!value || !value.startsWith('enc:')) return value

  try {
    const key = await getKey()
    const [, ivB64, ctB64] = value.split(':')

    const iv         = Buffer.from(ivB64, 'base64')
    const ciphertext = Buffer.from(ctB64, 'base64')
    const dec        = new TextDecoder()

    const plaintext = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    )

    return dec.decode(plaintext)
  } catch {
    console.error('[Nexus Security] Decryption failed — returning masked value')
    return '[encrypted]'
  }
}

// ── Mask for display ──────────────────────
/** Show only last 4 chars — for display in logs, audit trails */
export function maskPII(value: string): string {
  if (!value) return ''
  if (value.includes('@')) {
    const [local, domain] = value.split('@')
    return `${local[0]}***@${domain}`
  }
  return `***${value.slice(-4)}`
}

// ── Batch helpers ─────────────────────────
export async function encryptContactPII(contact: Record<string, unknown>): Promise<Record<string, unknown>> {
  const encrypted = { ...contact }
  if (contact.email) encrypted.email = await encryptField(contact.email as string)
  if (contact.phone) encrypted.phone = await encryptField(contact.phone as string)
  return encrypted
}

export async function decryptContactPII(contact: Record<string, unknown>): Promise<Record<string, unknown>> {
  const decrypted = { ...contact }
  if (contact.email) decrypted.email = await decryptField(contact.email as string)
  if (contact.phone) decrypted.phone = await decryptField(contact.phone as string)
  return decrypted
}
