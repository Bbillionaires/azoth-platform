-- ─────────────────────────────────────────────────────────────
--  OUE Sector Pipelines — Run this in Supabase SQL Editor
--  Creates one pipeline per OUE sector, each with 6 stages
-- ─────────────────────────────────────────────────────────────

-- OUE Workspace ID
do $$
declare
  ws_id uuid := '921e30a3-e4dd-414b-a5fe-0c6333e45a30';

  p_film        uuid;
  p_consulting  uuid;
  p_nonprofit   uuid;
  p_medical     uuid;
  p_investment  uuid;
  p_founder     uuid;
  p_team        uuid;

begin

  -- 1. Film & Entertainment
  insert into pipelines (workspace_id, name, color, position)
    values (ws_id, 'film', '#C0392B', 1) returning id into p_film;
  insert into stages (pipeline_id, name, color, position) values
    (p_film, 'New Lead',      '#6B7280', 1),
    (p_film, 'Contacted',     '#3B82F6', 2),
    (p_film, 'Qualified',     '#8B5CF6', 3),
    (p_film, 'Proposal Sent', '#F59E0B', 4),
    (p_film, 'Negotiating',   '#EF4444', 5),
    (p_film, 'Closed Won',    '#10B981', 6);

  -- 2. Business Consulting
  insert into pipelines (workspace_id, name, color, position)
    values (ws_id, 'consulting', '#2980B9', 2) returning id into p_consulting;
  insert into stages (pipeline_id, name, color, position) values
    (p_consulting, 'New Lead',      '#6B7280', 1),
    (p_consulting, 'Contacted',     '#3B82F6', 2),
    (p_consulting, 'Qualified',     '#8B5CF6', 3),
    (p_consulting, 'Proposal Sent', '#F59E0B', 4),
    (p_consulting, 'Negotiating',   '#EF4444', 5),
    (p_consulting, 'Closed Won',    '#10B981', 6);

  -- 3. Non-Profit
  insert into pipelines (workspace_id, name, color, position)
    values (ws_id, 'nonprofit', '#27AE60', 3) returning id into p_nonprofit;
  insert into stages (pipeline_id, name, color, position) values
    (p_nonprofit, 'New Lead',      '#6B7280', 1),
    (p_nonprofit, 'Contacted',     '#3B82F6', 2),
    (p_nonprofit, 'Qualified',     '#8B5CF6', 3),
    (p_nonprofit, 'Proposal Sent', '#F59E0B', 4),
    (p_nonprofit, 'Negotiating',   '#EF4444', 5),
    (p_nonprofit, 'Closed Won',    '#10B981', 6);

  -- 4. Health & Medical
  insert into pipelines (workspace_id, name, color, position)
    values (ws_id, 'medical', '#16A085', 4) returning id into p_medical;
  insert into stages (pipeline_id, name, color, position) values
    (p_medical, 'New Lead',      '#6B7280', 1),
    (p_medical, 'Contacted',     '#3B82F6', 2),
    (p_medical, 'Qualified',     '#8B5CF6', 3),
    (p_medical, 'Proposal Sent', '#F59E0B', 4),
    (p_medical, 'Negotiating',   '#EF4444', 5),
    (p_medical, 'Closed Won',    '#10B981', 6);

  -- 5. Investment & Acquisition
  insert into pipelines (workspace_id, name, color, position)
    values (ws_id, 'investment', '#D4A017', 5) returning id into p_investment;
  insert into stages (pipeline_id, name, color, position) values
    (p_investment, 'New Lead',      '#6B7280', 1),
    (p_investment, 'Contacted',     '#3B82F6', 2),
    (p_investment, 'Qualified',     '#8B5CF6', 3),
    (p_investment, 'Proposal Sent', '#F59E0B', 4),
    (p_investment, 'Negotiating',   '#EF4444', 5),
    (p_investment, 'Closed Won',    '#10B981', 6);

  -- 6. My Story (Founder)
  insert into pipelines (workspace_id, name, color, position)
    values (ws_id, 'founder', '#C4845A', 6) returning id into p_founder;
  insert into stages (pipeline_id, name, color, position) values
    (p_founder, 'New Lead',      '#6B7280', 1),
    (p_founder, 'Contacted',     '#3B82F6', 2),
    (p_founder, 'Qualified',     '#8B5CF6', 3),
    (p_founder, 'Proposal Sent', '#F59E0B', 4),
    (p_founder, 'Negotiating',   '#EF4444', 5),
    (p_founder, 'Closed Won',    '#10B981', 6);

  -- 7. Team & Associates
  insert into pipelines (workspace_id, name, color, position)
    values (ws_id, 'team', '#5BA8A0', 7) returning id into p_team;
  insert into stages (pipeline_id, name, color, position) values
    (p_team, 'New Lead',      '#6B7280', 1),
    (p_team, 'Contacted',     '#3B82F6', 2),
    (p_team, 'Qualified',     '#8B5CF6', 3),
    (p_team, 'Proposal Sent', '#F59E0B', 4),
    (p_team, 'Negotiating',   '#EF4444', 5),
    (p_team, 'Closed Won',    '#10B981', 6);

  raise notice 'All 7 pipelines created successfully';
end $$;
