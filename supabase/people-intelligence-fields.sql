-- Adds relationship intelligence fields to person records.
-- Run this in the Supabase SQL Editor before deploying UI that writes these fields.

alter table public.people
  add column if not exists opposition text,
  add column if not exists nationality text,
  add column if not exists languages text[] not null default '{}',
  add column if not exists public_private_status text,
  add column if not exists influence_type text,
  add column if not exists access_path text,
  add column if not exists relationship_owner text,
  add column if not exists best_approach text,
  add column if not exists current_authority text,
  add column if not exists historical_authority text,
  add column if not exists sensitivity_level text,
  add column if not exists motivations text,
  add column if not exists constraints text,
  add column if not exists relevant_mandates text[] not null default '{}',
  add column if not exists relevant_geographies text[] not null default '{}',
  add column if not exists relevant_sectors text[] not null default '{}',
  add column if not exists relevant_institutions text[] not null default '{}',
  add column if not exists key_relationships text,
  add column if not exists do_not_discuss text,
  add column if not exists best_next_move text,
  add column if not exists source_confidence numeric,
  add column if not exists last_verified_date date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'people_sensitivity_level_check'
      and conrelid = 'public.people'::regclass
  ) then
    alter table public.people
      add constraint people_sensitivity_level_check
      check (sensitivity_level is null or sensitivity_level in ('low','moderate','high','sensitive'));
  end if;
end $$;

comment on column public.people.influence_type is
  'Decision-maker, gatekeeper, advisor, introducer, convener, allocator, regulator, validator, or other influence role.';
comment on column public.people.access_path is
  'How this person should be reached: direct, warm path, institutional channel, event context, chief of staff, or other route.';
comment on column public.people.relationship_owner is
  'Internal owner responsible for the relationship.';
comment on column public.people.best_approach is
  'Preferred approach method and setting.';
comment on column public.people.current_authority is
  'Current authority, decision rights, influence, or ability to approve/block/introduce.';
comment on column public.people.historical_authority is
  'Former authority or role history that remains relevant.';
comment on column public.people.motivations is
  'Known incentives, priorities, reputation interests, or reasons this person may engage.';
comment on column public.people.constraints is
  'Known constraints, compliance limits, procurement restrictions, political limits, or sensitivities.';
comment on column public.people.do_not_discuss is
  'Topics, counterparties, or asks that should be avoided.';
comment on column public.people.best_next_move is
  'Recommended next action for relationship development.';
