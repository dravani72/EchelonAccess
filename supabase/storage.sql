-- Run this in Supabase SQL Editor if file uploads return "Bucket not found".
-- It creates the private workspace-scoped artifact bucket used for avatars,
-- business cards, and contact imports.

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

drop policy if exists "members read relationship artifacts" on storage.objects;
drop policy if exists "writers upload relationship artifacts" on storage.objects;
drop policy if exists "writers update relationship artifacts" on storage.objects;
drop policy if exists "writers delete relationship artifacts" on storage.objects;

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
