-- Run this in Supabase SQL Editor if the app reports:
-- "Could not find the 'avatar_url' column of 'people' in the schema cache".

alter table public.people
  add column if not exists avatar_url text;

select pg_notify('pgrst', 'reload schema');

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'people'
  and column_name = 'avatar_url';
