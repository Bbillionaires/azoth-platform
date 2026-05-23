create table if not exists workspace_integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  type text not null,
  config jsonb not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz default now(),
  unique(workspace_id, type)
);
alter table workspace_integrations disable row level security;
