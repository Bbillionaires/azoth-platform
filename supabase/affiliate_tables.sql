-- ─────────────────────────────────────────────────────────────
--  AZOTH Affiliate System — Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Affiliates
create table if not exists affiliates (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid references workspaces(id) on delete cascade,
  name             text not null,
  email            text not null,
  code             text unique not null,
  destination_url  text not null,
  status           text not null default 'active' check (status in ('active','paused','suspended')),
  commission_rate  numeric(5,2) not null default 10.00,
  total_clicks     integer not null default 0,
  total_leads      integer not null default 0,
  created_at       timestamptz not null default now()
);

-- 2. Click tracking
create table if not exists affiliate_clicks (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid references affiliates(id) on delete cascade,
  referrer        text,
  ip              text,
  created_at      timestamptz not null default now()
);

-- 3. Lead tracking
create table if not exists affiliate_leads (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid references affiliates(id) on delete cascade,
  workspace_id    uuid references workspaces(id) on delete cascade,
  contact_name    text not null,
  contact_email   text not null,
  source_project  text not null default 'unknown',
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

-- 4. Marketing materials
create table if not exists affiliate_materials (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid references workspaces(id) on delete cascade,
  title           text not null,
  description     text,
  file_url        text not null,
  file_type       text not null check (file_type in ('image','video','document','link')),
  thumbnail_url   text,
  created_at      timestamptz not null default now()
);

-- 5. Indexes
create index if not exists idx_affiliates_workspace  on affiliates(workspace_id);
create index if not exists idx_affiliates_code       on affiliates(code);
create index if not exists idx_aff_clicks_affiliate  on affiliate_clicks(affiliate_id);
create index if not exists idx_aff_leads_affiliate   on affiliate_leads(affiliate_id);
create index if not exists idx_aff_materials_ws      on affiliate_materials(workspace_id);

-- 6. Helper functions for atomic counter increments
create or replace function increment_affiliate_clicks(aff_id uuid)
returns void language sql security definer as $$
  update affiliates set total_clicks = total_clicks + 1 where id = aff_id;
$$;

create or replace function increment_affiliate_leads(aff_id uuid)
returns void language sql security definer as $$
  update affiliates set total_leads = total_leads + 1 where id = aff_id;
$$;

-- 7. RLS — service role bypasses these, so just disable for now
--    (all affiliate API routes use the service role client)
alter table affiliates          disable row level security;
alter table affiliate_clicks    disable row level security;
alter table affiliate_leads     disable row level security;
alter table affiliate_materials disable row level security;
