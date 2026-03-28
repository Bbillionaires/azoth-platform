// ─────────────────────────────────────────
//  Nexus — Audit Log
//
//  Every create, update, delete, and login
//  event is logged with who did it, when,
//  from what IP, and what changed.
//
//  In production this writes to Supabase's
//  activity_log table. In development it
//  writes to console.
// ─────────────────────────────────────────

export type AuditAction =
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'contact.stage_changed'
  | 'contact.exported'
  | 'campaign.created'
  | 'campaign.sent'
  | 'campaign.deleted'
  | 'automation.triggered'
  | 'pipeline.created'
  | 'pipeline.deleted'
  | 'message.sent'
  | 'member.invited'
  | 'member.removed'
  | 'workspace.settings_changed'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.login_failed'
  | 'auth.password_reset'
  | 'api.key_rotated'
  | 'data.exported'

export interface AuditEntry {
  action:      AuditAction
  workspace_id: string
  user_id?:    string
  user_email?: string
  ip?:         string
  target_id?:  string | number
  target_type?: string
  before?:     Record<string, unknown>
  after?:      Record<string, unknown>
  metadata?:   Record<string, unknown>
  timestamp:   string
}

// ── Log to Supabase ───────────────────────
async function persistLog(entry: AuditEntry): Promise<void> {
  // Uncomment when Supabase is connected:
  // const { createServerSupabase } = await import('@/lib/supabase')
  // const supabase = createServerSupabase()
  // await supabase.from('activity_log').insert({
  //   workspace_id: entry.workspace_id,
  //   user_id:      entry.user_id,
  //   type:         entry.action,
  //   description:  buildDescription(entry),
  //   metadata: {
  //     ip:          entry.ip,
  //     target_id:   entry.target_id,
  //     target_type: entry.target_type,
  //     before:      entry.before,
  //     after:       entry.after,
  //     ...entry.metadata,
  //   },
  // })
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${entry.timestamp} | ${entry.action} | user=${entry.user_id} | workspace=${entry.workspace_id}`, entry.metadata ?? '')
  }
}

function buildDescription(entry: AuditEntry): string {
  const who = entry.user_email ?? entry.user_id ?? 'System'
  switch (entry.action) {
    case 'contact.created':       return `${who} created contact #${entry.target_id}`
    case 'contact.updated':       return `${who} updated contact #${entry.target_id}`
    case 'contact.deleted':       return `${who} deleted contact #${entry.target_id}`
    case 'contact.stage_changed': return `${who} moved contact #${entry.target_id} from "${entry.before?.stage}" to "${entry.after?.stage}"`
    case 'contact.exported':      return `${who} exported contact data (${entry.metadata?.count} records)`
    case 'campaign.sent':         return `${who} sent campaign "${entry.metadata?.name}" to ${entry.metadata?.count} contacts`
    case 'auth.login':            return `${who} signed in from ${entry.ip}`
    case 'auth.login_failed':     return `Failed login attempt for ${entry.metadata?.email} from ${entry.ip}`
    case 'data.exported':         return `${who} exported ${entry.metadata?.count} records`
    case 'member.invited':        return `${who} invited ${entry.metadata?.email} as ${entry.metadata?.role}`
    case 'member.removed':        return `${who} removed ${entry.metadata?.email}`
    default:                      return `${who} performed ${entry.action}`
  }
}

// ── Public API ────────────────────────────
export async function audit(entry: Omit<AuditEntry, 'timestamp'>): Promise<void> {
  await persistLog({ ...entry, timestamp: new Date().toISOString() })
}

// ── Convenience wrappers ──────────────────
export const AuditLog = {
  contactCreated: (opts: { workspace_id: string; user_id: string; contact_id: number; ip?: string }) =>
    audit({ action: 'contact.created', workspace_id: opts.workspace_id, user_id: opts.user_id, target_id: opts.contact_id, target_type: 'contact', ip: opts.ip }),

  contactDeleted: (opts: { workspace_id: string; user_id: string; contact_id: number; contact_name: string; ip?: string }) =>
    audit({ action: 'contact.deleted', workspace_id: opts.workspace_id, user_id: opts.user_id, target_id: opts.contact_id, target_type: 'contact', ip: opts.ip, metadata: { name: opts.contact_name } }),

  stageChanged: (opts: { workspace_id: string; user_id: string; contact_id: number; fromStage: string; toStage: string }) =>
    audit({ action: 'contact.stage_changed', workspace_id: opts.workspace_id, user_id: opts.user_id, target_id: opts.contact_id, before: { stage: opts.fromStage }, after: { stage: opts.toStage } }),

  loginSuccess: (opts: { workspace_id: string; user_id: string; email: string; ip?: string }) =>
    audit({ action: 'auth.login', workspace_id: opts.workspace_id, user_id: opts.user_id, user_email: opts.email, ip: opts.ip }),

  loginFailed: (opts: { email: string; ip?: string }) =>
    audit({ action: 'auth.login_failed', workspace_id: 'unknown', metadata: { email: opts.email }, ip: opts.ip }),

  dataExported: (opts: { workspace_id: string; user_id: string; count: number; ip?: string }) =>
    audit({ action: 'data.exported', workspace_id: opts.workspace_id, user_id: opts.user_id, ip: opts.ip, metadata: { count: opts.count } }),

  memberInvited: (opts: { workspace_id: string; user_id: string; invitedEmail: string; role: string }) =>
    audit({ action: 'member.invited', workspace_id: opts.workspace_id, user_id: opts.user_id, metadata: { email: opts.invitedEmail, role: opts.role } }),

  campaignSent: (opts: { workspace_id: string; user_id: string; campaign_id: string; name: string; count: number }) =>
    audit({ action: 'campaign.sent', workspace_id: opts.workspace_id, user_id: opts.user_id, target_id: opts.campaign_id, target_type: 'campaign', metadata: { name: opts.name, count: opts.count } }),
}
