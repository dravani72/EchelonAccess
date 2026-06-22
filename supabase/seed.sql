insert into people (
  id, canonical_name, display_name, aliases, relationship_strength, trust_level, warmth_status,
  current_title, current_organization, last_interaction, geography, sector_tags, source_count,
  mandate_matches, review_status, notes
) values
(
  '00000000-0000-4000-8000-000000000001',
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
)
on conflict (id) do nothing;

insert into roles (
  person_id, organization_name, title, start_date, end_date, is_current, confidence, source_label
) values
('00000000-0000-4000-8000-000000000001','Northbridge Capital','Partner, Strategic Infrastructure','2023',null,true,0.92,'Manual update'),
('00000000-0000-4000-8000-000000000001','UK Department for Business and Trade','Deputy Trade Commissioner','2012','2018',false,0.86,'Business card OCR'),
('00000000-0000-4000-8000-000000000001','Helios Energy Group','Head of Public-Private Partnerships','2018','2023',false,0.78,'Public profile');

insert into interactions (
  person_id, interaction_date, type, summary, outcome, next_step, confidence, source_label
) values
('00000000-0000-4000-8000-000000000001','2026-05-18','call','Discussed sovereign-backed port modernization mandate and likely counterparties.','Open to a specific one-page ask.','Send targeted brief after mandate terms are tightened.',0.95,'User note'),
('00000000-0000-4000-8000-000000000001','2025-10-04','event','Reconnected at infrastructure forum; mentioned move from energy advisory into fund role.',null,null,0.84,'Event note');

insert into mandates (
  client_name, title, objective, sector, geography, status, relevant_contacts, next_action
) values
('Confidential infrastructure client','Port Modernization Capital Path','Identify warm government and fund counterparties for port modernization financing.','Infrastructure',array['West Africa','United Kingdom'],'active',11,'Approve outreach angle for Amelia Hart'),
('Energy transition sponsor','Latin America Energy Introductions','Map trade and energy-policy access points for regional expansion.','Energy',array['Brazil','Chile'],'researching',7,'Resolve Rafael Santos role history');

insert into outreach_queue (
  person_name, mandate_title, reason, channel, relationship_strength, risk_level, due_date, status
) values
('Amelia Hart','Port Modernization Capital Path','Direct relationship with infrastructure mandate fit and fund authority.','email',5,'low','2026-06-25','draft_ready'),
('Rafael Santos','Latin America Energy Introductions','Government trade role maps to energy market access, but current authority needs review.','intro_request',4,'medium','2026-06-28','awaiting_approval');

insert into review_tasks (title, detail, status) values
('Rafael Santos role change','Public profile suggests new ministry title; preserve prior private-sector card role.','needs_review'),
('James Okafor duplicate','Two card scans share phone number but differ by organization and date.','suggested'),
('Maya Chen stale contact','Known contact with active APAC mandate relevance and no interaction in 7 months.','stale');
