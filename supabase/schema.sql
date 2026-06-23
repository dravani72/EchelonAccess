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
  opposition text,
  nationality text,
  languages text[] not null default '{}',
  public_private_status text,
  influence_type text,
  access_path text,
  relationship_owner text,
  best_approach text,
  current_authority text,
  historical_authority text,
  sensitivity_level text check (sensitivity_level in ('low','moderate','high','sensitive')),
  motivations text,
  constraints text,
  relevant_mandates text[] not null default '{}',
  relevant_geographies text[] not null default '{}',
  relevant_sectors text[] not null default '{}',
  relevant_institutions text[] not null default '{}',
  key_relationships text,
  do_not_discuss text,
  best_next_move text,
  source_confidence numeric,
  last_verified_date date,
  relationship_strength int not null default 1 check (relationship_strength between 1 and 5),
  trust_level text check (trust_level in ('unknown','low','moderate','high','sensitive')),
  warmth_status text not null default 'cold' check (warmth_status in ('cold','weak','known','warm','direct')),
  current_title text,
  current_organization text,
  avatar_url text,
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

alter table people add column if not exists avatar_url text;
alter table people add column if not exists opposition text;
alter table people add column if not exists nationality text;
alter table people add column if not exists languages text[] not null default '{}';
alter table people add column if not exists public_private_status text;
alter table people add column if not exists influence_type text;
alter table people add column if not exists access_path text;
alter table people add column if not exists relationship_owner text;
alter table people add column if not exists best_approach text;
alter table people add column if not exists current_authority text;
alter table people add column if not exists historical_authority text;
alter table people add column if not exists sensitivity_level text check (sensitivity_level in ('low','moderate','high','sensitive'));
alter table people add column if not exists motivations text;
alter table people add column if not exists constraints text;
alter table people add column if not exists relevant_mandates text[] not null default '{}';
alter table people add column if not exists relevant_geographies text[] not null default '{}';
alter table people add column if not exists relevant_sectors text[] not null default '{}';
alter table people add column if not exists relevant_institutions text[] not null default '{}';
alter table people add column if not exists key_relationships text;
alter table people add column if not exists do_not_discuss text;
alter table people add column if not exists best_next_move text;
alter table people add column if not exists source_confidence numeric;
alter table people add column if not exists last_verified_date date;

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
  mandate_category text,
  deal_type text,
  ask_type text,
  transaction_type text,
  client_profile text,
  sponsor_profile text,
  sector text,
  geography text[] not null default '{}',
  jurisdiction text[] not null default '{}',
  target_counterparty_types text[] not null default '{}',
  desired_counterparties text[] not null default '{}',
  forbidden_contacts text[] not null default '{}',
  capital_type text,
  capital_stack text,
  target_amount text,
  minimum_ticket text,
  currency text,
  economics text,
  fee_model text,
  transaction_stage text,
  timeline text,
  urgency text check (urgency in ('low','medium','high','critical')),
  decision_deadline date,
  close_target_date date,
  regulatory_regime text,
  compliance_requirements text,
  sanctions_exposure text,
  political_exposure text,
  procurement_process text,
  government_touchpoints text[] not null default '{}',
  required_approvals text[] not null default '{}',
  decision_makers text[] not null default '{}',
  gatekeepers text[] not null default '{}',
  influencers text[] not null default '{}',
  buyer_universe text[] not null default '{}',
  investor_universe text[] not null default '{}',
  strategic_partners text[] not null default '{}',
  relationship_thesis text,
  access_strategy text,
  outreach_angle text,
  value_proposition text,
  proof_points text[] not null default '{}',
  materials_required text[] not null default '{}',
  diligence_requirements text[] not null default '{}',
  data_room_status text,
  confidentiality_level text check (confidentiality_level in ('standard','confidential','highly_confidential','restricted')),
  conflict_constraints text,
  competitive_landscape text,
  incumbent_relationships text,
  risks text,
  blockers text,
  open_questions text[] not null default '{}',
  success_criteria text[] not null default '{}',
  disqualification_criteria text[] not null default '{}',
  next_milestone text,
  owner text,
  priority text check (priority in ('low','medium','high','critical')),
  source_confidence numeric,
  last_reviewed_date date,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','researching','active','paused','completed','dead')),
  relevant_contacts int not null default 0,
  next_action text,
  notes text,
  sync_version int not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table mandates add column if not exists mandate_category text;
alter table mandates add column if not exists deal_type text;
alter table mandates add column if not exists ask_type text;
alter table mandates add column if not exists transaction_type text;
alter table mandates add column if not exists client_profile text;
alter table mandates add column if not exists sponsor_profile text;
alter table mandates add column if not exists jurisdiction text[] not null default '{}';
alter table mandates add column if not exists target_counterparty_types text[] not null default '{}';
alter table mandates add column if not exists desired_counterparties text[] not null default '{}';
alter table mandates add column if not exists forbidden_contacts text[] not null default '{}';
alter table mandates add column if not exists capital_type text;
alter table mandates add column if not exists capital_stack text;
alter table mandates add column if not exists target_amount text;
alter table mandates add column if not exists minimum_ticket text;
alter table mandates add column if not exists currency text;
alter table mandates add column if not exists economics text;
alter table mandates add column if not exists fee_model text;
alter table mandates add column if not exists transaction_stage text;
alter table mandates add column if not exists timeline text;
alter table mandates add column if not exists urgency text check (urgency in ('low','medium','high','critical'));
alter table mandates add column if not exists decision_deadline date;
alter table mandates add column if not exists close_target_date date;
alter table mandates add column if not exists regulatory_regime text;
alter table mandates add column if not exists compliance_requirements text;
alter table mandates add column if not exists sanctions_exposure text;
alter table mandates add column if not exists political_exposure text;
alter table mandates add column if not exists procurement_process text;
alter table mandates add column if not exists government_touchpoints text[] not null default '{}';
alter table mandates add column if not exists required_approvals text[] not null default '{}';
alter table mandates add column if not exists decision_makers text[] not null default '{}';
alter table mandates add column if not exists gatekeepers text[] not null default '{}';
alter table mandates add column if not exists influencers text[] not null default '{}';
alter table mandates add column if not exists buyer_universe text[] not null default '{}';
alter table mandates add column if not exists investor_universe text[] not null default '{}';
alter table mandates add column if not exists strategic_partners text[] not null default '{}';
alter table mandates add column if not exists relationship_thesis text;
alter table mandates add column if not exists access_strategy text;
alter table mandates add column if not exists outreach_angle text;
alter table mandates add column if not exists value_proposition text;
alter table mandates add column if not exists proof_points text[] not null default '{}';
alter table mandates add column if not exists materials_required text[] not null default '{}';
alter table mandates add column if not exists diligence_requirements text[] not null default '{}';
alter table mandates add column if not exists data_room_status text;
alter table mandates add column if not exists confidentiality_level text check (confidentiality_level in ('standard','confidential','highly_confidential','restricted'));
alter table mandates add column if not exists conflict_constraints text;
alter table mandates add column if not exists competitive_landscape text;
alter table mandates add column if not exists incumbent_relationships text;
alter table mandates add column if not exists risks text;
alter table mandates add column if not exists blockers text;
alter table mandates add column if not exists open_questions text[] not null default '{}';
alter table mandates add column if not exists success_criteria text[] not null default '{}';
alter table mandates add column if not exists disqualification_criteria text[] not null default '{}';
alter table mandates add column if not exists next_milestone text;
alter table mandates add column if not exists owner text;
alter table mandates add column if not exists priority text check (priority in ('low','medium','high','critical'));
alter table mandates add column if not exists source_confidence numeric;
alter table mandates add column if not exists last_reviewed_date date;
alter table mandates add column if not exists tags text[] not null default '{}';

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'relationship-artifacts',
  'relationship-artifacts',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'text/vcard',
    'text/x-vcard',
    'text/csv',
    'application/csv'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

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
drop policy if exists "members read relationship artifacts" on storage.objects;
drop policy if exists "writers upload relationship artifacts" on storage.objects;
drop policy if exists "writers update relationship artifacts" on storage.objects;
drop policy if exists "writers delete relationship artifacts" on storage.objects;

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

create policy "members read relationship artifacts" on storage.objects for select to authenticated using (
  bucket_id = 'relationship-artifacts'
  and is_workspace_member(((storage.foldername(name))[1])::uuid)
);

create policy "writers upload relationship artifacts" on storage.objects for insert to authenticated with check (
  bucket_id = 'relationship-artifacts'
  and can_write_workspace(((storage.foldername(name))[1])::uuid)
);

create policy "writers update relationship artifacts" on storage.objects for update to authenticated using (
  bucket_id = 'relationship-artifacts'
  and can_write_workspace(((storage.foldername(name))[1])::uuid)
) with check (
  bucket_id = 'relationship-artifacts'
  and can_write_workspace(((storage.foldername(name))[1])::uuid)
);

create policy "writers delete relationship artifacts" on storage.objects for delete to authenticated using (
  bucket_id = 'relationship-artifacts'
  and can_write_workspace(((storage.foldername(name))[1])::uuid)
);
