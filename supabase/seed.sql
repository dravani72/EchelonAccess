-- Seed EchelonAccess with the same relationship intelligence data used by lib/mock-data.ts.
--
-- Before running:
-- 1. Sign in to the app once so Supabase creates your auth user.
-- 2. In Supabase Dashboard > Authentication > Users, copy your user id.
-- 3. Replace the placeholder below with that user id.

do $$
declare
  owner_user_id uuid := '00000000-0000-0000-0000-000000000000';
  workspace_id uuid := gen_random_uuid();
begin
  if owner_user_id = '00000000-0000-0000-0000-000000000000' then
    raise exception 'Replace owner_user_id in supabase/seed.sql with a real Supabase auth.users.id before running.';
  end if;

  insert into workspaces (id, name, slug, owner_id)
  values (workspace_id, 'Private Relationship Desk', 'private-relationship-desk', owner_user_id)
  on conflict (slug) do update
    set name = excluded.name,
        owner_id = excluded.owner_id,
        updated_at = now()
  returning id into workspace_id;

  insert into workspace_members (workspace_id, user_id, role)
  values (workspace_id, owner_user_id, 'owner')
  on conflict (workspace_id, user_id) do update
    set role = excluded.role;

  insert into organizations (
    id, workspace_id, name, normalized_name, type, sector, country, city, tags
  ) values
  (
    '10000000-0000-4000-8000-000000000001',
    workspace_id,
    'Northbridge Capital',
    'northbridge capital',
    'fund',
    'Infrastructure',
    'United Kingdom',
    'London',
    array['fund','infrastructure','energy']
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    workspace_id,
    'Ministry of Trade, Brazil',
    'ministry of trade brazil',
    'government',
    'Trade',
    'Brazil',
    'Brasilia',
    array['government','latin-america']
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    workspace_id,
    'Harborline Growth',
    'harborline growth',
    'fund',
    'Growth Equity',
    'Singapore',
    'Singapore',
    array['apac','logistics','fund']
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    name = excluded.name,
    normalized_name = excluded.normalized_name,
    type = excluded.type,
    sector = excluded.sector,
    country = excluded.country,
    city = excluded.city,
    tags = excluded.tags,
    deleted_at = null,
    updated_at = now();

  insert into people (
    id, workspace_id, canonical_name, display_name, aliases, relationship_strength, trust_level, warmth_status,
    current_title, current_organization, last_interaction, geography, sector_tags, source_count,
    mandate_matches, review_status, notes
  ) values
  (
    '00000000-0000-4000-8000-000000000001',
    workspace_id,
    'Amelia Hart',
    'Amelia Hart',
    array['A. Hart'],
    5,
    'high',
    'direct',
    'Partner, Strategic Infrastructure',
    'Northbridge Capital',
    '2026-05-18',
    'London / New York',
    array['Infrastructure','Energy','Sovereign'],
    9,
    3,
    'verified',
    'Can be approached directly when the ask is precise and well-framed.'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    workspace_id,
    'Rafael Santos',
    'Rafael Santos',
    array['Rafa Santos'],
    4,
    'moderate',
    'warm',
    'Senior Advisor',
    'Ministry of Trade, Brazil',
    '2026-03-07',
    'Brasilia',
    array['Government','Trade','Latin America'],
    6,
    2,
    'needs_review',
    'Historical card indicates prior private-sector role that may matter for energy mandate.'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    workspace_id,
    'Maya Chen',
    'Maya Chen',
    array[]::text[],
    3,
    'moderate',
    'known',
    'Managing Director',
    'Harborline Growth',
    '2025-11-12',
    'Singapore',
    array['Growth Equity','Logistics','APAC'],
    4,
    1,
    'verified',
    'Best reached through an event-specific pretext or a mutual Asia logistics contact.'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    workspace_id,
    'James Okafor',
    'James Okafor',
    array['J. Okafor'],
    2,
    'unknown',
    'weak',
    'Board Member',
    'Atlantic Development Bank',
    '2024-09-22',
    'Accra / Lagos',
    array['Development Finance','Ports','Africa'],
    3,
    2,
    'possible_duplicate',
    'Two cards may be the same person with title progression.'
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    canonical_name = excluded.canonical_name,
    display_name = excluded.display_name,
    aliases = excluded.aliases,
    relationship_strength = excluded.relationship_strength,
    trust_level = excluded.trust_level,
    warmth_status = excluded.warmth_status,
    current_title = excluded.current_title,
    current_organization = excluded.current_organization,
    last_interaction = excluded.last_interaction,
    geography = excluded.geography,
    sector_tags = excluded.sector_tags,
    source_count = excluded.source_count,
    mandate_matches = excluded.mandate_matches,
    review_status = excluded.review_status,
    notes = excluded.notes,
    deleted_at = null,
    updated_at = now();

  insert into roles (
    id, workspace_id, person_id, organization_id, organization_name, title, start_date, end_date, is_current, confidence, source_label
  ) values
  (
    '20000000-0000-4000-8000-000000000001',
    workspace_id,
    '00000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Northbridge Capital',
    'Partner, Strategic Infrastructure',
    '2023',
    null,
    true,
    0.92,
    'Manual update'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    workspace_id,
    '00000000-0000-4000-8000-000000000001',
    null,
    'UK Department for Business and Trade',
    'Deputy Trade Commissioner',
    '2012',
    '2018',
    false,
    0.86,
    'Business card OCR'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    workspace_id,
    '00000000-0000-4000-8000-000000000001',
    null,
    'Helios Energy Group',
    'Head of Public-Private Partnerships',
    '2018',
    '2023',
    false,
    0.78,
    'Public profile'
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    person_id = excluded.person_id,
    organization_id = excluded.organization_id,
    organization_name = excluded.organization_name,
    title = excluded.title,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    is_current = excluded.is_current,
    confidence = excluded.confidence,
    source_label = excluded.source_label,
    deleted_at = null,
    updated_at = now();

  insert into interactions (
    id, workspace_id, person_id, interaction_date, type, summary, outcome, next_step, confidence, source_label
  ) values
  (
    '30000000-0000-4000-8000-000000000001',
    workspace_id,
    '00000000-0000-4000-8000-000000000001',
    '2026-05-18',
    'call',
    'Discussed sovereign-backed port modernization mandate and likely counterparties.',
    'Open to a specific one-page ask.',
    'Send targeted brief after mandate terms are tightened.',
    0.95,
    'User note'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    workspace_id,
    '00000000-0000-4000-8000-000000000001',
    '2025-10-04',
    'event',
    'Reconnected at infrastructure forum; mentioned move from energy advisory into fund role.',
    null,
    null,
    0.84,
    'Event note'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    workspace_id,
    '00000000-0000-4000-8000-000000000001',
    '2012-01-01',
    'note',
    'Original card captured Deputy Trade Commissioner title and London office number.',
    null,
    null,
    0.76,
    'Business card OCR'
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    person_id = excluded.person_id,
    interaction_date = excluded.interaction_date,
    type = excluded.type,
    summary = excluded.summary,
    outcome = excluded.outcome,
    next_step = excluded.next_step,
    confidence = excluded.confidence,
    source_label = excluded.source_label,
    deleted_at = null,
    updated_at = now();

  insert into mandates (
    id, workspace_id, client_name, title, objective, sector, geography, status, relevant_contacts, next_action
  ) values
  (
    '40000000-0000-4000-8000-000000000001',
    workspace_id,
    'Confidential infrastructure client',
    'Port Modernization Capital Path',
    'Identify warm government and fund counterparties for port modernization financing.',
    'Infrastructure',
    array['West Africa','United Kingdom'],
    'active',
    11,
    'Approve outreach angle for Amelia Hart'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    workspace_id,
    'Energy transition sponsor',
    'Latin America Energy Introductions',
    'Map trade and energy-policy access points for regional expansion.',
    'Energy',
    array['Brazil','Chile'],
    'researching',
    7,
    'Resolve Rafael Santos role history'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    workspace_id,
    'APAC logistics operator',
    'Strategic Growth Equity Access',
    'Find investor and sovereign logistics paths across Singapore and Indonesia.',
    'Logistics',
    array['Singapore','Indonesia'],
    'draft',
    5,
    'Define forbidden contacts before matching'
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    client_name = excluded.client_name,
    title = excluded.title,
    objective = excluded.objective,
    sector = excluded.sector,
    geography = excluded.geography,
    status = excluded.status,
    relevant_contacts = excluded.relevant_contacts,
    next_action = excluded.next_action,
    deleted_at = null,
    updated_at = now();

  insert into outreach_queue (
    id, workspace_id, person_id, mandate_id, person_name, mandate_title, reason, channel, relationship_strength,
    risk_level, due_date, status
  ) values
  (
    '50000000-0000-4000-8000-000000000001',
    workspace_id,
    '00000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    'Amelia Hart',
    'Port Modernization Capital Path',
    'Direct relationship with infrastructure mandate fit and fund authority.',
    'email',
    5,
    'low',
    '2026-06-25',
    'draft_ready'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    workspace_id,
    '00000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000002',
    'Rafael Santos',
    'Latin America Energy Introductions',
    'Government trade role maps to energy market access, but current authority needs review.',
    'intro_request',
    4,
    'medium',
    '2026-06-28',
    'awaiting_approval'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    workspace_id,
    '00000000-0000-4000-8000-000000000004',
    '40000000-0000-4000-8000-000000000001',
    'James Okafor',
    'Port Modernization Capital Path',
    'Possible development-finance path, but duplicate identity must be resolved first.',
    'email',
    2,
    'unknown',
    '2026-07-01',
    'draft_needed'
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    person_id = excluded.person_id,
    mandate_id = excluded.mandate_id,
    person_name = excluded.person_name,
    mandate_title = excluded.mandate_title,
    reason = excluded.reason,
    channel = excluded.channel,
    relationship_strength = excluded.relationship_strength,
    risk_level = excluded.risk_level,
    due_date = excluded.due_date,
    status = excluded.status,
    deleted_at = null,
    updated_at = now();

  insert into review_tasks (id, workspace_id, title, detail, status) values
  (
    '60000000-0000-4000-8000-000000000001',
    workspace_id,
    'Rafael Santos role change',
    'Public profile suggests new ministry title; preserve prior private-sector card role.',
    'needs_review'
  ),
  (
    '60000000-0000-4000-8000-000000000002',
    workspace_id,
    'James Okafor duplicate',
    'Two card scans share phone number but differ by organization and date.',
    'suggested'
  ),
  (
    '60000000-0000-4000-8000-000000000003',
    workspace_id,
    'Maya Chen stale contact',
    'Known contact with active APAC mandate relevance and no interaction in 7 months.',
    'stale'
  )
  on conflict (id) do update set
    workspace_id = excluded.workspace_id,
    title = excluded.title,
    detail = excluded.detail,
    status = excluded.status,
    deleted_at = null,
    updated_at = now();
end $$;
