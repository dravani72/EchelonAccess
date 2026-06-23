-- Expands mandate records into a comprehensive deal / ask morphology.
-- Run this in the Supabase SQL Editor before deploying UI that reads these fields.

alter table public.mandates
  add column if not exists mandate_category text,
  add column if not exists deal_type text,
  add column if not exists ask_type text,
  add column if not exists transaction_type text,
  add column if not exists client_profile text,
  add column if not exists sponsor_profile text,
  add column if not exists jurisdiction text[] not null default '{}',
  add column if not exists target_counterparty_types text[] not null default '{}',
  add column if not exists desired_counterparties text[] not null default '{}',
  add column if not exists forbidden_contacts text[] not null default '{}',
  add column if not exists capital_type text,
  add column if not exists capital_stack text,
  add column if not exists target_amount text,
  add column if not exists minimum_ticket text,
  add column if not exists currency text,
  add column if not exists economics text,
  add column if not exists fee_model text,
  add column if not exists transaction_stage text,
  add column if not exists timeline text,
  add column if not exists urgency text,
  add column if not exists decision_deadline date,
  add column if not exists close_target_date date,
  add column if not exists regulatory_regime text,
  add column if not exists compliance_requirements text,
  add column if not exists sanctions_exposure text,
  add column if not exists political_exposure text,
  add column if not exists procurement_process text,
  add column if not exists government_touchpoints text[] not null default '{}',
  add column if not exists required_approvals text[] not null default '{}',
  add column if not exists decision_makers text[] not null default '{}',
  add column if not exists gatekeepers text[] not null default '{}',
  add column if not exists influencers text[] not null default '{}',
  add column if not exists buyer_universe text[] not null default '{}',
  add column if not exists investor_universe text[] not null default '{}',
  add column if not exists strategic_partners text[] not null default '{}',
  add column if not exists relationship_thesis text,
  add column if not exists access_strategy text,
  add column if not exists outreach_angle text,
  add column if not exists value_proposition text,
  add column if not exists proof_points text[] not null default '{}',
  add column if not exists materials_required text[] not null default '{}',
  add column if not exists diligence_requirements text[] not null default '{}',
  add column if not exists data_room_status text,
  add column if not exists confidentiality_level text,
  add column if not exists conflict_constraints text,
  add column if not exists competitive_landscape text,
  add column if not exists incumbent_relationships text,
  add column if not exists risks text,
  add column if not exists blockers text,
  add column if not exists open_questions text[] not null default '{}',
  add column if not exists success_criteria text[] not null default '{}',
  add column if not exists disqualification_criteria text[] not null default '{}',
  add column if not exists next_milestone text,
  add column if not exists owner text,
  add column if not exists priority text,
  add column if not exists source_confidence numeric,
  add column if not exists last_reviewed_date date,
  add column if not exists tags text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mandates_urgency_check'
      and conrelid = 'public.mandates'::regclass
  ) then
    alter table public.mandates
      add constraint mandates_urgency_check
      check (urgency is null or urgency in ('low','medium','high','critical'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'mandates_priority_check'
      and conrelid = 'public.mandates'::regclass
  ) then
    alter table public.mandates
      add constraint mandates_priority_check
      check (priority is null or priority in ('low','medium','high','critical'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'mandates_confidentiality_level_check'
      and conrelid = 'public.mandates'::regclass
  ) then
    alter table public.mandates
      add constraint mandates_confidentiality_level_check
      check (confidentiality_level is null or confidentiality_level in ('standard','confidential','highly_confidential','restricted'));
  end if;
end $$;

comment on column public.mandates.deal_type is 'Deal morphology: capital raise, M&A, procurement, PPP/concession, market entry, strategic partnership, government access, buyer/investor search, regulatory navigation, or other.';
comment on column public.mandates.ask_type is 'The precise ask: introduction, capital, buyer list, policy readout, mandate validation, diligence support, government access, strategic counterparties, or other.';
comment on column public.mandates.access_strategy is 'Relationship-led strategy for reaching the right counterparties without violating constraints.';
comment on column public.mandates.disqualification_criteria is 'Conditions that make a contact, investor, buyer, or strategic partner unsuitable.';
