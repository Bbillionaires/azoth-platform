-- ─────────────────────────────────────────
--  Nexus — Row-Level Security Policies
--
--  Run AFTER lib/schema.sql.
--  These policies are your last line of
--  defense. Even if the application has a
--  bug that skips the workspace_id filter,
--  Postgres WILL enforce these rules at the
--  database level.
--
--  Rule: a user can only see/modify rows
--  in their own workspace.
-- ─────────────────────────────────────────

-- ── Helper: is_member ─────────────────────
-- Returns true if the current Supabase
-- user belongs to the given workspace.
create or replace function is_member(ws_id uuid)
returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id
    and   user_id      = auth.uid()
  );
$$;

-- ── Helper: my_workspace ──────────────────
-- Returns the workspace_id of the current
-- user (assumes 1 workspace per user for now;
-- extend for multi-workspace users).
create or replace function my_workspace()
returns uuid
language sql security definer stable as $$
  select workspace_id from workspace_members
  where user_id = auth.uid()
  limit 1;
$$;

-- ── Helper: my_role ───────────────────────
create or replace function my_role(ws_id uuid)
returns text
language sql security definer stable as $$
  select role from workspace_members
  where workspace_id = ws_id
  and   user_id      = auth.uid()
  limit 1;
$$;

-- ─────────────────────────────────────────
--  WORKSPACES
-- ─────────────────────────────────────────
-- Members can read their workspace
create policy "read own workspace"
  on workspaces for select
  using (is_member(id));

-- Only owners can update workspace settings
create policy "owner can update workspace"
  on workspaces for update
  using (my_role(id) in ('owner', 'admin'))
  with check (my_role(id) in ('owner', 'admin'));

-- Prevent delete (must go through support)
create policy "no workspace delete"
  on workspaces for delete
  using (false);

-- ─────────────────────────────────────────
--  WORKSPACE MEMBERS
-- ─────────────────────────────────────────
create policy "members can see teammates"
  on workspace_members for select
  using (is_member(workspace_id));

create policy "admins can invite"
  on workspace_members for insert
  with check (my_role(workspace_id) in ('owner', 'admin'));

create policy "admins can remove"
  on workspace_members for delete
  using (my_role(workspace_id) in ('owner', 'admin'));

-- Owners cannot remove themselves
create policy "cannot remove self if owner"
  on workspace_members for delete
  using (not (user_id = auth.uid() and my_role(workspace_id) = 'owner'));

-- ─────────────────────────────────────────
--  CONTACTS
-- ─────────────────────────────────────────
create policy "members read contacts"
  on contacts for select
  using (is_member(workspace_id));

create policy "members create contacts"
  on contacts for insert
  with check (is_member(workspace_id));

-- Viewers cannot write
create policy "non-viewers update contacts"
  on contacts for update
  using (my_role(workspace_id) in ('owner', 'admin', 'member'))
  with check (my_role(workspace_id) in ('owner', 'admin', 'member'));

create policy "non-viewers delete contacts"
  on contacts for delete
  using (my_role(workspace_id) in ('owner', 'admin', 'member'));

-- ─────────────────────────────────────────
--  PIPELINES + STAGES
-- ─────────────────────────────────────────
create policy "members read pipelines"
  on pipelines for select
  using (is_member(workspace_id));

create policy "admins manage pipelines"
  on pipelines for all
  using (my_role(workspace_id) in ('owner', 'admin'))
  with check (my_role(workspace_id) in ('owner', 'admin'));

create policy "members read stages"
  on stages for select
  using (
    exists (
      select 1 from pipelines p
      where p.id = stages.pipeline_id
      and   is_member(p.workspace_id)
    )
  );

create policy "admins manage stages"
  on stages for all
  using (
    exists (
      select 1 from pipelines p
      where p.id = stages.pipeline_id
      and   my_role(p.workspace_id) in ('owner', 'admin')
    )
  );

-- ─────────────────────────────────────────
--  THREADS + MESSAGES (Inbox)
-- ─────────────────────────────────────────
create policy "members read threads"
  on threads for select
  using (is_member(workspace_id));

create policy "members create threads"
  on threads for insert
  with check (is_member(workspace_id));

create policy "creator or admin can delete thread"
  on threads for delete
  using (
    created_by = auth.uid()
    or my_role(workspace_id) in ('owner', 'admin')
  );

create policy "members read messages"
  on messages for select
  using (is_member(workspace_id));

create policy "members send messages"
  on messages for insert
  with check (
    is_member(workspace_id)
    and author_id = auth.uid()
  );

-- Users can only edit their own messages
create policy "author edits own message"
  on messages for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- ─────────────────────────────────────────
--  CAMPAIGNS
-- ─────────────────────────────────────────
create policy "members read campaigns"
  on campaigns for select
  using (is_member(workspace_id));

create policy "members manage campaigns"
  on campaigns for all
  using (my_role(workspace_id) in ('owner', 'admin', 'member'))
  with check (my_role(workspace_id) in ('owner', 'admin', 'member'));

-- ─────────────────────────────────────────
--  AUTOMATIONS
-- ─────────────────────────────────────────
create policy "members read automations"
  on automations for select
  using (is_member(workspace_id));

create policy "admins manage automations"
  on automations for all
  using (my_role(workspace_id) in ('owner', 'admin'))
  with check (my_role(workspace_id) in ('owner', 'admin'));

-- ─────────────────────────────────────────
--  ACTIVITY LOG
-- ─────────────────────────────────────────
-- Read-only for members
create policy "members read audit log"
  on activity_log for select
  using (is_member(workspace_id));

-- Only backend (service role) can insert
create policy "service inserts audit log"
  on activity_log for insert
  with check (false);  -- use service_role key from server only

-- ─────────────────────────────────────────
--  TASKS
-- ─────────────────────────────────────────
create policy "members read tasks"
  on tasks for select
  using (is_member(workspace_id));

create policy "members manage tasks"
  on tasks for all
  using (is_member(workspace_id))
  with check (is_member(workspace_id));

-- ─────────────────────────────────────────
--  EXTRA: Prevent workspace_id tampering
--
--  Users cannot change a row's workspace_id
--  to move data between workspaces.
-- ─────────────────────────────────────────
create or replace function prevent_workspace_id_change()
returns trigger language plpgsql as $$
begin
  if OLD.workspace_id <> NEW.workspace_id then
    raise exception 'workspace_id cannot be changed';
  end if;
  return NEW;
end;
$$;

-- Apply to all workspace-scoped tables
create trigger contacts_no_workspace_change
  before update on contacts
  for each row execute function prevent_workspace_id_change();

create trigger threads_no_workspace_change
  before update on threads
  for each row execute function prevent_workspace_id_change();

create trigger campaigns_no_workspace_change
  before update on campaigns
  for each row execute function prevent_workspace_id_change();
