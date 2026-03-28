-- ─────────────────────────────────────────
--  Nexus Platform — Full Schema
--  Run in Supabase SQL editor
-- ─────────────────────────────────────────

-- ── Enable UUID extension ─────────────────
create extension if not exists "pgcrypto";

-- ── Workspaces ────────────────────────────
create table if not exists workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  industry    text,
  currency    text default 'USD',
  accent      text default '#e8a045',
  plan        text default 'free' check (plan in ('free','starter','pro','agency')),
  owner_id    uuid not null,
  created_at  timestamptz default now()
);

-- ── Workspace Members ─────────────────────
create table if not exists workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id      uuid not null,
  email        text not null,
  name         text not null,
  role         text default 'member' check (role in ('owner','admin','member','viewer')),
  avatar_color text default '#5b8ef5',
  created_at   timestamptz default now(),
  unique(workspace_id, user_id)
);

-- ── Pipelines ─────────────────────────────
create table if not exists pipelines (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name         text not null,
  color        text default '#e8a045',
  position     int default 0,
  created_at   timestamptz default now()
);

-- ── Stages ────────────────────────────────
create table if not exists stages (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid references pipelines(id) on delete cascade,
  name        text not null,
  color       text default '#555e6e',
  position    int default 0
);

-- ── Custom Fields ─────────────────────────
create table if not exists field_definitions (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name         text not null,
  key          text not null,
  type         text not null check (type in ('text','number','email','date','select','textarea','checkbox','phone','url')),
  required     boolean default false,
  builtin      boolean default false,
  options      text[],
  position     int default 0
);

-- ── Contacts ──────────────────────────────
create table if not exists contacts (
  id           bigint generated always as identity primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  pipeline_id  uuid references pipelines(id),
  stage_id     uuid references stages(id),
  owner_id     uuid,
  name         text not null,
  email        text not null,
  phone        text,
  company      text,
  role         text,
  value        numeric(12,2) default 0,
  source       text,
  tags         text[] default '{}',
  notes        text,
  status       text default 'active' check (status in ('active','inactive')),
  color        text default '#5b8ef5',
  custom_data  jsonb default '{}',
  created_at   timestamptz default now(),
  last_contact date default current_date
);
create index on contacts(workspace_id);
create index on contacts(pipeline_id);
create index on contacts(stage_id);
create index on contacts using gin(tags);

-- ── Threads (Basecamp-style deal rooms) ───
create table if not exists threads (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid references workspaces(id) on delete cascade,
  contact_id      bigint references contacts(id) on delete set null,
  title           text not null,
  type            text default 'team' check (type in ('deal_room','team','direct','announcement')),
  created_by      uuid not null,
  pinned          boolean default false,
  last_message_at timestamptz default now(),
  created_at      timestamptz default now()
);
create index on threads(workspace_id);
create index on threads(contact_id);

-- ── Messages ──────────────────────────────
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid references threads(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  author_id    uuid not null,
  author_name  text not null,
  author_color text default '#5b8ef5',
  body         text not null,
  mentions     uuid[] default '{}',
  reactions    jsonb default '{}',
  edited       boolean default false,
  created_at   timestamptz default now()
);
create index on messages(thread_id);
create index on messages(workspace_id);

-- ── Campaigns ─────────────────────────────
create table if not exists campaigns (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid references workspaces(id) on delete cascade,
  name            text not null,
  type            text default 'email' check (type in ('email','sms','sequence')),
  status          text default 'draft' check (status in ('draft','scheduled','active','paused','completed')),
  subject         text,
  body            text,
  from_name       text,
  from_email      text,
  audience_filter jsonb default '{}',
  scheduled_at    timestamptz,
  sent_count      int default 0,
  open_count      int default 0,
  click_count     int default 0,
  reply_count     int default 0,
  created_at      timestamptz default now()
);

-- ── Sequence Steps ────────────────────────
create table if not exists sequence_steps (
  id          uuid primary key default gen_random_uuid(),
  sequence_id uuid references campaigns(id) on delete cascade,
  position    int default 0,
  type        text check (type in ('email','sms','wait','condition')),
  delay_days  int default 0,
  subject     text,
  body        text
);

-- ── Automations ───────────────────────────
create table if not exists automations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name         text not null,
  active       boolean default true,
  trigger      text not null,
  trigger_val  text,
  action       text not null,
  action_val   text,
  run_count    int default 0,
  last_run     timestamptz,
  created_at   timestamptz default now()
);

-- ── Tasks ─────────────────────────────────
create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  contact_id   bigint references contacts(id) on delete set null,
  thread_id    uuid references threads(id) on delete set null,
  title        text not null,
  done         boolean default false,
  due_date     date,
  assignee_id  uuid,
  created_by   uuid not null,
  created_at   timestamptz default now()
);

-- ── Activity Log ──────────────────────────
create table if not exists activity_log (
  id           bigint generated always as identity primary key,
  workspace_id uuid references workspaces(id) on delete cascade,
  contact_id   bigint references contacts(id) on delete set null,
  user_id      uuid,
  type         text,
  description  text,
  metadata     jsonb default '{}',
  created_at   timestamptz default now()
);
create index on activity_log(workspace_id);
create index on activity_log(contact_id);

-- ── Row Level Security ────────────────────
alter table workspaces       enable row level security;
alter table workspace_members enable row level security;
alter table pipelines        enable row level security;
alter table stages           enable row level security;
alter table contacts         enable row level security;
alter table threads          enable row level security;
alter table messages         enable row level security;
alter table campaigns        enable row level security;
alter table automations      enable row level security;
alter table tasks            enable row level security;
alter table activity_log     enable row level security;

-- Workspace member check helper
create or replace function is_workspace_member(ws_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- Workspace RLS
create policy "Members can view their workspace" on workspaces
  for select using (is_workspace_member(id));

-- Generic member policy for all workspace-scoped tables
-- (apply same pattern to each table)
create policy "Members can access workspace data" on contacts
  for all using (is_workspace_member(workspace_id));

create policy "Members can access threads" on threads
  for all using (is_workspace_member(workspace_id));

create policy "Members can access messages" on messages
  for all using (is_workspace_member(workspace_id));

create policy "Members can access campaigns" on campaigns
  for all using (is_workspace_member(workspace_id));

create policy "Members can access automations" on automations
  for all using (is_workspace_member(workspace_id));

-- ── Realtime ──────────────────────────────
-- Enable realtime for live inbox updates
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table threads;
alter publication supabase_realtime add table activity_log;
