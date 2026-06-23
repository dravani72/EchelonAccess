create extension if not exists pgcrypto;

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create or replace function is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from workspace_members
    where workspace_members.workspace_id = target_workspace_id
      and workspace_members.user_id = auth.uid()
  );
$$;

create or replace function can_write_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from workspace_members
    where workspace_members.workspace_id = target_workspace_id
      and workspace_members.user_id = auth.uid()
      and workspace_members.role in ('owner','admin','member')
  );
$$;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  type text not null check (type in ('company','government','ngo','fund','embassy','university','law_firm','media','cultural','other')),
  sector text,
  country text,
  city text,
  website text,
  description text,
  tags text[] not null default '{}',
  sync_version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  canonical_name text not null,
  display_name text not null,
  honorific text,
  aliases text[] not null default '{}',
  notes text,
  relationship_strength int not null default 1 check (relationship_strength between 1 and 5),
  trust_level text check (trust_level in ('unknown','low','moderate','high','sensitive')),
  warmth_status text not null default 'cold' check (warmth_status in ('cold','weak','known','warm','direct')),
  current_title text,
  current_organization text,
  last_interaction date,
  geography text,
  sector_tags text[] not null default '{}',
  source_count int not null default 0,
  mandate_matches int not null default 0,
  review_status text not null default 'needs_review' check (review_status in ('verified','needs_review','possible_duplicate')),
  sync_version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  organization_name text not null,
  title text not null,
  start_date text,
  end_date text,
  is_current boolean not null default false,
  confidence numeric not null default 0,
  source_label text not null default 'Manual entry',
  source_ids uuid[] not null default '{}',
  notes text,
  sync_version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_cards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  person_id uuid references people(id) on delete set null,
  organization_id uuid references organizations(id) on delete set null,
  image_url text,
  raw_ocr_text text,
  parsed_fields jsonb not null default '{}',
  scan_date date not null default current_date,
  estimated_card_date text,
  source_event text,
  confidence numeric not null default 0,
  review_status text not null default 'unreviewed' check (review_status in ('unreviewed','reviewed','needs_attention','merged')),
  sync_version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mandates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_name text not null,
  title text not null,
  objective text not null,
  sector text,
  geography text[] not null default '{}',
  desired_counterparties text[] not null default '{}',
  forbidden_contacts text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','researching','active','paused','completed','dead')),
  relevant_contacts int not null default 0,
  next_action text,
  notes text,
  sync_version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  person_id uuid references people(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  mandate_id uuid references mandates(id) on delete set null,
  interaction_date date not null,
  type text not null check (type in ('meeting','email','call','introduction','event','proposal','note','follow_up','other')),
  summary text not null,
  outcome text,
  next_step text,
  sentiment text check (sentiment in ('positive','neutral','negative','unclear')),
  confidence numeric not null default 0,
  source_label text not null default 'Manual entry',
  sync_version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outreach_queue (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  person_name text not null,
  person_id uuid references people(id) on delete set null,
  mandate_title text not null,
  mandate_id uuid references mandates(id) on delete set null,
  reason text not null,
  channel text not null check (channel in ('email','call','intro_request')),
  relationship_strength int not null default 1 check (relationship_strength between 1 and 5),
  risk_level text not null default 'unknown' check (risk_level in ('low','medium','high','unknown')),
  due_date date,
  status text not null default 'draft_needed' check (status in ('draft_needed','draft_ready','awaiting_approval','sent','follow_up_needed','paused','closed')),
  sync_version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists review_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  detail text not null,
  status text not null default 'needs_review' check (status in ('needs_review','suggested','stale','sensitive')),
  sync_version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sync_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_table text not null,
  entity_id uuid not null,
  action text not null check (action in ('create','update','delete')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table organizations enable row level security;
alter table people enable row level security;
alter table roles enable row level security;
alter table business_cards enable row level security;
alter table interactions enable row level security;
alter table mandates enable row level security;
alter table outreach_queue enable row level security;
alter table review_tasks enable row level security;
alter table sync_events enable row level security;

grant usage on schema public to authenticated;
revoke execute on function is_workspace_member(uuid) from public, anon;
revoke execute on function can_write_workspace(uuid) from public, anon;
grant execute on function is_workspace_member(uuid) to authenticated;
grant execute on function can_write_workspace(uuid) to authenticated;

grant select, insert, update, delete on table workspaces to authenticated;
grant select, insert, update, delete on table workspace_members to authenticated;
grant select, insert, update, delete on table organizations to authenticated;
grant select, insert, update, delete on table people to authenticated;
grant select, insert, update, delete on table roles to authenticated;
grant select, insert, update, delete on table business_cards to authenticated;
grant select, insert, update, delete on table mandates to authenticated;
grant select, insert, update, delete on table interactions to authenticated;
grant select, insert, update, delete on table outreach_queue to authenticated;
grant select, insert, update, delete on table review_tasks to authenticated;
grant select, insert, update, delete on table sync_events to authenticated;

drop policy if exists "members can read workspaces" on workspaces;
drop policy if exists "owners can update workspaces" on workspaces;
drop policy if exists "authenticated can create own workspace" on workspaces;
drop policy if exists "members can read workspace memberships" on workspace_members;
drop policy if exists "owners and admins can manage memberships" on workspace_members;
drop policy if exists "user can create own first membership" on workspace_members;
drop policy if exists "members read organizations" on organizations;
drop policy if exists "writers manage organizations" on organizations;
drop policy if exists "members read people" on people;
drop policy if exists "writers manage people" on people;
drop policy if exists "members read roles" on roles;
drop policy if exists "writers manage roles" on roles;
drop policy if exists "members read business cards" on business_cards;
drop policy if exists "writers manage business cards" on business_cards;
drop policy if exists "members read mandates" on mandates;
drop policy if exists "writers manage mandates" on mandates;
drop policy if exists "members read interactions" on interactions;
drop policy if exists "writers manage interactions" on interactions;
drop policy if exists "members read outreach queue" on outreach_queue;
drop policy if exists "writers manage outreach queue" on outreach_queue;
drop policy if exists "members read review tasks" on review_tasks;
drop policy if exists "writers manage review tasks" on review_tasks;
drop policy if exists "members read sync events" on sync_events;
drop policy if exists "writers append sync events" on sync_events;

create policy "members can read workspaces" on workspaces for select to authenticated using (is_workspace_member(id));
create policy "owners can update workspaces" on workspaces for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "authenticated can create own workspace" on workspaces for insert to authenticated with check (owner_id = auth.uid());

create policy "members can read workspace memberships" on workspace_members for select to authenticated using (is_workspace_member(workspace_id));
create policy "owners and admins can manage memberships" on workspace_members for all to authenticated using (can_write_workspace(workspace_id)) with check (can_write_workspace(workspace_id));
create policy "user can create own first membership" on workspace_members for insert to authenticated with check (user_id = auth.uid());

create policy "members read organizations" on organizations for select to authenticated using (is_workspace_member(workspace_id) and deleted_at is null);
create policy "writers manage organizations" on organizations for all to authenticated using (can_write_workspace(workspace_id)) with check (can_write_workspace(workspace_id));

create policy "members read people" on people for select to authenticated using (is_workspace_member(workspace_id) and deleted_at is null);
create policy "writers manage people" on people for all to authenticated using (can_write_workspace(workspace_id)) with check (can_write_workspace(workspace_id));

create policy "members read roles" on roles for select to authenticated using (is_workspace_member(workspace_id) and deleted_at is null);
create policy "writers manage roles" on roles for all to authenticated using (can_write_workspace(workspace_id)) with check (can_write_workspace(workspace_id));

create policy "members read business cards" on business_cards for select to authenticated using (is_workspace_member(workspace_id) and deleted_at is null);
create policy "writers manage business cards" on business_cards for all to authenticated using (can_write_workspace(workspace_id)) with check (can_write_workspace(workspace_id));

create policy "members read mandates" on mandates for select to authenticated using (is_workspace_member(workspace_id) and deleted_at is null);
create policy "writers manage mandates" on mandates for all to authenticated using (can_write_workspace(workspace_id)) with check (can_write_workspace(workspace_id));

create policy "members read interactions" on interactions for select to authenticated using (is_workspace_member(workspace_id) and deleted_at is null);
create policy "writers manage interactions" on interactions for all to authenticated using (can_write_workspace(workspace_id)) with check (can_write_workspace(workspace_id));

create policy "members read outreach queue" on outreach_queue for select to authenticated using (is_workspace_member(workspace_id) and deleted_at is null);
create policy "writers manage outreach queue" on outreach_queue for all to authenticated using (can_write_workspace(workspace_id)) with check (can_write_workspace(workspace_id));

create policy "members read review tasks" on review_tasks for select to authenticated using (is_workspace_member(workspace_id) and deleted_at is null);
create policy "writers manage review tasks" on review_tasks for all to authenticated using (can_write_workspace(workspace_id)) with check (can_write_workspace(workspace_id));

create policy "members read sync events" on sync_events for select to authenticated using (is_workspace_member(workspace_id));
create policy "writers append sync events" on sync_events for insert to authenticated with check (can_write_workspace(workspace_id) and user_id = auth.uid());
