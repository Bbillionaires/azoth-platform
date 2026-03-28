import type { Pipeline, CRMField, Contact, Automation, Thread, Message, Campaign } from './types'

export const DEMO_WORKSPACE_ID = 'ws_demo_001'
export const DEMO_USER_ID      = 'user_dearis'

export const DEMO_PIPELINES: Pipeline[] = [
  { id: 'p1', workspace_id: DEMO_WORKSPACE_ID, name: 'Sales Pipeline', color: '#e8a045',
    stages: [
      { id: 's1', pipeline_id: 'p1', name: 'Lead',        color: '#555e6e', position: 0 },
      { id: 's2', pipeline_id: 'p1', name: 'Qualified',   color: '#5b8ef5', position: 1 },
      { id: 's3', pipeline_id: 'p1', name: 'Proposal',    color: '#e8a045', position: 2 },
      { id: 's4', pipeline_id: 'p1', name: 'Negotiation', color: '#9b72f5', position: 3 },
      { id: 's5', pipeline_id: 'p1', name: 'Won',         color: '#3ecf8e', position: 4 },
      { id: 's6', pipeline_id: 'p1', name: 'Lost',        color: '#f06060', position: 5 },
    ],
  },
  { id: 'p2', workspace_id: DEMO_WORKSPACE_ID, name: 'Onboarding', color: '#3ecf8e',
    stages: [
      { id: 'o1', pipeline_id: 'p2', name: 'Signed',   color: '#555e6e', position: 0 },
      { id: 'o2', pipeline_id: 'p2', name: 'Setup',    color: '#5b8ef5', position: 1 },
      { id: 'o3', pipeline_id: 'p2', name: 'Training', color: '#e8a045', position: 2 },
      { id: 'o4', pipeline_id: 'p2', name: 'Go Live',  color: '#9b72f5', position: 3 },
      { id: 'o5', pipeline_id: 'p2', name: 'Complete', color: '#3ecf8e', position: 4 },
    ],
  },
]

export const DEMO_FIELDS: CRMField[] = [
  { id: 'f1', workspace_id: DEMO_WORKSPACE_ID, name: 'Name',       key: 'name',    type: 'text',   required: true, builtin: true },
  { id: 'f2', workspace_id: DEMO_WORKSPACE_ID, name: 'Email',      key: 'email',   type: 'email',  required: true, builtin: true },
  { id: 'f3', workspace_id: DEMO_WORKSPACE_ID, name: 'Phone',      key: 'phone',   type: 'phone',  builtin: true },
  { id: 'f4', workspace_id: DEMO_WORKSPACE_ID, name: 'Company',    key: 'company', type: 'text',   builtin: true },
  { id: 'f5', workspace_id: DEMO_WORKSPACE_ID, name: 'Role',       key: 'role',    type: 'text',   builtin: true },
  { id: 'f6', workspace_id: DEMO_WORKSPACE_ID, name: 'Deal Value', key: 'value',   type: 'number', builtin: true },
  { id: 'f7', workspace_id: DEMO_WORKSPACE_ID, name: 'Source',     key: 'source',  type: 'select', builtin: true, options: ['Website','Referral','Cold Outreach','Event','Social','Other'] },
  { id: 'f8', workspace_id: DEMO_WORKSPACE_ID, name: 'Tags',       key: 'tags',    type: 'text',   builtin: true },
  { id: 'f9', workspace_id: DEMO_WORKSPACE_ID, name: 'Notes',      key: 'notes',   type: 'textarea', builtin: true },
]

export const DEMO_CONTACTS: Contact[] = [
  { id: 1, workspace_id: DEMO_WORKSPACE_ID, pipeline_id: 'p1', stage_id: 's2', name: 'Aaliyah Johnson',  email: 'aaliyah@novacorp.io',      phone: '(904) 555-0121', company: 'NovaCorp',        role: 'VP Engineering',   value: 42000,  source: 'Referral',      tags: ['enterprise','tech'],     notes: 'Strong fit. Interested in automation.', status: 'active', color: '#5b8ef5', created_at: '2025-12-01', last_contact: '2026-03-10' },
  { id: 2, workspace_id: DEMO_WORKSPACE_ID, pipeline_id: 'p1', stage_id: 's3', name: 'Marcus Rivera',    email: 'mrivera@stackhaus.com',    phone: '(904) 555-0344', company: 'Stackhaus',       role: 'CTO',              value: 85000,  source: 'Cold Outreach', tags: ['priority'],              notes: 'Proposal sent. Follow up.', status: 'active', color: '#9b72f5', created_at: '2026-01-15', last_contact: '2026-03-18' },
  { id: 3, workspace_id: DEMO_WORKSPACE_ID, pipeline_id: 'p1', stage_id: 's5', name: 'Priya Nair',       email: 'priya@meridianhealth.com', phone: '(904) 555-0278', company: 'Meridian Health', role: 'Dir. Operations',  value: 120000, source: 'Event',         tags: ['healthcare','won'],       notes: 'Closed! Onboarding Q2.',   status: 'active', color: '#3ecf8e', created_at: '2025-11-20', last_contact: '2026-03-01' },
  { id: 4, workspace_id: DEMO_WORKSPACE_ID, pipeline_id: 'p1', stage_id: 's1', name: 'Devon Osei',       email: 'dosei@liftwave.co',        phone: '(904) 555-0415', company: 'Liftwave',        role: 'CEO',              value: 28000,  source: 'Website',       tags: ['startup'],               notes: 'Intro call scheduled.', status: 'active', color: '#e8a045', created_at: '2026-02-10', last_contact: '2026-03-22' },
  { id: 5, workspace_id: DEMO_WORKSPACE_ID, pipeline_id: 'p1', stage_id: 's4', name: 'Simone Beaumont',  email: 'sbeaumont@archrex.com',    phone: '(904) 555-0567', company: 'Archrex',         role: 'Procurement Lead', value: 67000,  source: 'Referral',      tags: ['priority'],              notes: 'Legal review pending.', status: 'active', color: '#f472b6', created_at: '2026-01-05', last_contact: '2026-03-24' },
  { id: 6, workspace_id: DEMO_WORKSPACE_ID, pipeline_id: 'p1', stage_id: 's2', name: 'Yara Okonkwo',     email: 'yara@bloomretail.com',     phone: '(904) 555-0791', company: 'Bloom Retail',    role: 'COO',              value: 38000,  source: 'Social',        tags: ['retail'],                notes: 'Demo next Tuesday.', status: 'active', color: '#3dd5f3', created_at: '2026-02-28', last_contact: '2026-03-25' },
  { id: 7, workspace_id: DEMO_WORKSPACE_ID, pipeline_id: 'p1', stage_id: 's1', name: 'James Okafor',     email: 'james@finleap.io',         phone: '(904) 555-0832', company: 'FinLeap',         role: 'CFO',              value: 95000,  source: 'Referral',      tags: ['fintech'],               notes: 'Referred by Priya.', status: 'active', color: '#5b8ef5', created_at: '2026-03-01', last_contact: '2026-03-26' },
]

export const DEMO_THREADS: Thread[] = [
  { id: 't1', workspace_id: DEMO_WORKSPACE_ID, contact_id: 2, title: '🏢 Marcus Rivera — Stackhaus Deal',         type: 'deal_room',     created_by: DEMO_USER_ID, pinned: true, last_message_at: '2026-03-27T14:30:00Z', created_at: '2026-03-01T09:00:00Z' },
  { id: 't2', workspace_id: DEMO_WORKSPACE_ID, contact_id: 5, title: '🔥 Simone Beaumont — Final Negotiation',    type: 'deal_room',     created_by: DEMO_USER_ID, pinned: true, last_message_at: '2026-03-27T10:15:00Z', created_at: '2026-02-15T09:00:00Z' },
  { id: 't3', workspace_id: DEMO_WORKSPACE_ID,                title: '📣 Q2 Sales Sprint Kickoff',                 type: 'announcement',  created_by: DEMO_USER_ID, pinned: false, last_message_at: '2026-03-26T16:00:00Z', created_at: '2026-03-25T09:00:00Z' },
  { id: 't4', workspace_id: DEMO_WORKSPACE_ID,                title: '💬 Team: Weekly Sync',                       type: 'team',          created_by: DEMO_USER_ID, pinned: false, last_message_at: '2026-03-25T11:30:00Z', created_at: '2026-01-01T09:00:00Z' },
  { id: 't5', workspace_id: DEMO_WORKSPACE_ID, contact_id: 3, title: '✅ Priya Nair — Onboarding Room',           type: 'deal_room',     created_by: DEMO_USER_ID, pinned: false, last_message_at: '2026-03-24T08:00:00Z', created_at: '2026-03-01T09:00:00Z' },
]

export const DEMO_MESSAGES: Message[] = [
  { id: 'm1', thread_id: 't1', workspace_id: DEMO_WORKSPACE_ID, author_id: DEMO_USER_ID,  author_name: 'DeAris',  author_color: '#e8a045', body: 'Sent the proposal this morning. $85k for the full platform. @Alex can you review the pricing deck before EOD?', mentions: [], reactions: { '👍': ['alex'], '🔥': ['maria'] }, created_at: '2026-03-27T14:30:00Z' },
  { id: 'm2', thread_id: 't1', workspace_id: DEMO_WORKSPACE_ID, author_id: 'user_alex',   author_name: 'Alex',    author_color: '#5b8ef5', body: 'On it. I think we could offer a 3-month pilot at $25k to get them moving faster. Their Q2 budget resets April 1.', mentions: [], reactions: { '💡': [DEMO_USER_ID] }, created_at: '2026-03-27T14:45:00Z' },
  { id: 'm3', thread_id: 't1', workspace_id: DEMO_WORKSPACE_ID, author_id: 'user_maria',  author_name: 'Maria',   author_color: '#9b72f5', body: "Marcus mentioned their CTO wants a live demo. I can take that — I know their stack well. Set it up for next week?", mentions: [], reactions: {}, created_at: '2026-03-27T15:00:00Z' },
  { id: 'm4', thread_id: 't2', workspace_id: DEMO_WORKSPACE_ID, author_id: DEMO_USER_ID,  author_name: 'DeAris',  author_color: '#e8a045', body: 'Legal came back. They want indemnification clause removed. @Maria this is your area — can you respond?', mentions: ['user_maria'], reactions: {}, created_at: '2026-03-27T10:15:00Z' },
  { id: 'm5', thread_id: 't3', workspace_id: DEMO_WORKSPACE_ID, author_id: DEMO_USER_ID,  author_name: 'DeAris',  author_color: '#e8a045', body: '📣 Q2 goal is $380k closed revenue. Pipeline currently at $375k. We need ONE more big close. Stackhaus and Archrex are our shots. Let\'s go.', mentions: [], reactions: { '🎯': ['user_alex', 'user_maria'], '💪': ['user_alex'] }, created_at: '2026-03-26T16:00:00Z' },
  { id: 'm6', thread_id: 't4', workspace_id: DEMO_WORKSPACE_ID, author_id: 'user_alex',   author_name: 'Alex',    author_color: '#5b8ef5', body: 'This week: 4 demos scheduled, 2 proposals out. Need to revisit the Liftwave follow-up — Devon hasn\'t replied in 3 days.', mentions: [], reactions: {}, created_at: '2026-03-25T11:30:00Z' },
]

export const DEMO_CAMPAIGNS: Campaign[] = [
  { id: 'c1', workspace_id: DEMO_WORKSPACE_ID, name: 'Q2 Cold Outreach — SaaS CTOs',   type: 'sequence', status: 'active',    subject: 'Quick question about your tech stack',       body: 'Hi {{first_name}}, saw your recent post about scaling...', from_name: 'DeAris', from_email: 'dearis@yourcompany.com', sent_count: 142, open_count: 68,  click_count: 23, reply_count: 11, created_at: '2026-03-01T00:00:00Z' },
  { id: 'c2', workspace_id: DEMO_WORKSPACE_ID, name: 'Win-Back — Lost Deals Q1',        type: 'email',    status: 'scheduled', subject: "We've made improvements since we last spoke", body: 'Hi {{first_name}}, it has been a few months...',           from_name: 'DeAris', from_email: 'dearis@yourcompany.com', sent_count: 0,   open_count: 0,   click_count: 0,  reply_count: 0,  created_at: '2026-03-20T00:00:00Z' },
  { id: 'c3', workspace_id: DEMO_WORKSPACE_ID, name: 'Onboarding Day 1 Welcome',        type: 'email',    status: 'active',    subject: "Welcome to the platform, {{first_name}}!",    body: 'Hi {{first_name}}, welcome aboard! Here is how to get started...',  from_name: 'DeAris', from_email: 'dearis@yourcompany.com', sent_count: 28,  open_count: 25,  click_count: 18, reply_count: 6,  created_at: '2026-02-15T00:00:00Z' },
  { id: 'c4', workspace_id: DEMO_WORKSPACE_ID, name: 'SMS: Event Reminder — Webinar',   type: 'sms',      status: 'completed', subject: '',                                             body: 'Hi {{first_name}}, reminder: our live demo webinar starts in 1 hour. Join: {{link}}', from_name: 'DeAris', from_email: '', sent_count: 95,  open_count: 91,  click_count: 54, reply_count: 12, created_at: '2026-03-15T00:00:00Z' },
]

export const DEMO_AUTOMATIONS: Automation[] = [
  { id: 'a1', workspace_id: DEMO_WORKSPACE_ID, name: 'Won → Create onboarding room',    active: true,  trigger: 'stage_is',        trigger_val: 's5',    action: 'create_task',       action_val: 'Schedule onboarding kickoff call' },
  { id: 'a2', workspace_id: DEMO_WORKSPACE_ID, name: 'New Lead → Slack notify',         active: true,  trigger: 'contact_created', trigger_val: '',      action: 'notify_slack',      action_val: 'https://hooks.slack.com/...' },
  { id: 'a3', workspace_id: DEMO_WORKSPACE_ID, name: 'Won → Add to onboarding sequence',active: true,  trigger: 'stage_is',        trigger_val: 's5',    action: 'add_to_campaign',   action_val: 'c3' },
  { id: 'a4', workspace_id: DEMO_WORKSPACE_ID, name: 'High value → Webhook alert',      active: false, trigger: 'value_over',      trigger_val: '50000', action: 'webhook',           action_val: 'https://yourapp.com/alerts' },
  { id: 'a5', workspace_id: DEMO_WORKSPACE_ID, name: 'Qualified → Start outreach seq.', active: true,  trigger: 'stage_is',        trigger_val: 's2',    action: 'add_to_campaign',   action_val: 'c1' },
]
