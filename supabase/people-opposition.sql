-- Adds opposition intelligence to person records.
-- Run this in the Supabase SQL Editor if the app reports that people.opposition is missing.

alter table public.people
  add column if not exists opposition text;

comment on column public.people.opposition is
  'Opposition, blockers, rivals, resistance, political constraints, or relationship risks relevant to this person.';
