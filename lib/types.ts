// ─────────────────────────────────────────
//  Nexus Platform — Type System
// ─────────────────────────────────────────

export interface Workspace {
  id: string
  name: string
  slug: string
  industry?: string
  currency: string
  accent: string
  plan: 'free' | 'starter' | 'pro' | 'agency'
  owner_id: string
  created_at: string
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  avatar_color: string
  online?: boolean
}

// ── CRM ──────────────────────────────────
export type FieldType = 'text' | 'number' | 'email' | 'date' | 'select' | 'textarea' | 'checkbox' | 'phone' | 'url'

export interface CRMField {
  id: string
  workspace_id: string
  name: string
  key: string
  type: FieldType
  required?: boolean
  builtin?: boolean
  options?: string[]
}

export interface Stage {
  id: string
  pipeline_id: string
  name: string
  color: string
  position: number
}

export interface Pipeline {
  id: string
  workspace_id: string
  name: string
  color: string
  stages: Stage[]
}

export interface Contact {
  id: number
  workspace_id: string
  pipeline_id: string
  stage_id: string
  name: string
  email: string
  phone?: string
  company?: string
  role?: string
  value: number
  source?: string
  tags: string[]
  notes?: string
  status: 'active' | 'inactive'
  color: string
  owner_id?: string
  created_at: string
  last_contact: string
  [key: string]: unknown
}

// ── Inbox / Messaging (Basecamp feel) ────
export interface Thread {
  id: string
  workspace_id: string
  contact_id?: number
  title: string
  type: 'deal_room' | 'team' | 'direct' | 'announcement'
  created_by: string
  pinned?: boolean
  created_at: string
  last_message_at: string
  message_count?: number
}

export interface Message {
  id: string
  thread_id: string
  workspace_id: string
  author_id: string
  author_name: string
  author_color: string
  body: string
  mentions: string[]
  reactions: Record<string, string[]>
  created_at: string
  edited?: boolean
}

// ── Campaigns (GHL feel) ─────────────────
export type CampaignType = 'email' | 'sms' | 'sequence'
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'

export interface Campaign {
  id: string
  workspace_id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  subject?: string
  body: string
  from_name?: string
  from_email?: string
  audience_filter?: Record<string, unknown>
  scheduled_at?: string
  sent_count: number
  open_count: number
  click_count: number
  reply_count: number
  created_at: string
}

export interface SequenceStep {
  id: string
  sequence_id: string
  position: number
  type: 'email' | 'sms' | 'wait' | 'condition'
  delay_days: number
  subject?: string
  body: string
}

// ── Automations ───────────────────────────
export type TriggerType = 'stage_is' | 'value_over' | 'tag_added' | 'contact_created' | 'source_is' | 'campaign_opened' | 'form_submitted' | 'date_is'
export type ActionType  = 'webhook' | 'add_tag' | 'remove_tag' | 'notify_slack' | 'send_email' | 'send_sms' | 'assign_owner' | 'move_stage' | 'create_task' | 'add_to_campaign'

export interface Automation {
  id: string
  workspace_id: string
  name: string
  active: boolean
  trigger: TriggerType
  trigger_val: string
  action: ActionType
  action_val: string
  run_count?: number
}

// ── Tasks ─────────────────────────────────
export interface Task {
  id: string
  workspace_id: string
  contact_id?: number
  thread_id?: string
  title: string
  done: boolean
  due_date?: string
  assignee_id?: string
  created_by: string
  created_at: string
}
