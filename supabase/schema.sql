create extension if not exists pgcrypto;

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  type text not null check (type in ('company','government','ngo','fund','embassy','university','law_firm','media','cultural','other')),
  sector text,
  country text,
  city text,
  website text,
  description text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_cards (
  id uuid primary key default gen_random_uuid(),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  mandate_id uuid,
  interaction_date date not null,
  type text not null check (type in ('meeting','email','call','introduction','event','proposal','note','follow_up','other')),
  summary text not null,
  outcome text,
  next_step text,
  sentiment text check (sentiment in ('positive','neutral','negative','unclear')),
  confidence numeric not null default 0,
  source_label text not null default 'Manual entry',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists mandates (
  id uuid primary key default gen_random_uuid(),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists outreach_queue (
  id uuid primary key default gen_random_uuid(),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists review_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail text not null,
  status text not null default 'needs_review' check (status in ('needs_review','suggested','stale','sensitive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table organizations enable row level security;
alter table people enable row level security;
alter table roles enable row level security;
alter table business_cards enable row level security;
alter table interactions enable row level security;
alter table mandates enable row level security;
alter table outreach_queue enable row level security;
alter table review_tasks enable row level security;

-- MVP policy: authenticated users can manage private workspace records.
-- Tighten this to workspace membership before multi-user production use.
create policy "authenticated manage organizations" on organizations for all to authenticated using (true) with check (true);
create policy "authenticated manage people" on people for all to authenticated using (true) with check (true);
create policy "authenticated manage roles" on roles for all to authenticated using (true) with check (true);
create policy "authenticated manage business cards" on business_cards for all to authenticated using (true) with check (true);
create policy "authenticated manage interactions" on interactions for all to authenticated using (true) with check (true);
create policy "authenticated manage mandates" on mandates for all to authenticated using (true) with check (true);
create policy "authenticated manage outreach queue" on outreach_queue for all to authenticated using (true) with check (true);
create policy "authenticated manage review tasks" on review_tasks for all to authenticated using (true) with check (true);
