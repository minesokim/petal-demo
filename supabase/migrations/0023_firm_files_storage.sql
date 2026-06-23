-- ③ Documents — Supabase Storage backing for the firm's file library.
-- Private bucket 'firm-files'; blobs stored at {firmId}/{uuid}-{filename}.
-- RLS on storage.objects (defense-in-depth) so a firm only ever touches its own
-- folder. The first path segment ((storage.foldername(name))[1]) is the firm id,
-- matched against public.current_firm_id() (the same firm-scoping used elsewhere).

insert into storage.buckets (id, name, public)
values ('firm-files', 'firm-files', false)
on conflict (id) do nothing;

-- RLS is already enabled on storage.objects in Supabase by default; we only manage
-- our own policy here (the role running migrations is not the table owner).
drop policy if exists firm_files_objects_rw on storage.objects;
create policy firm_files_objects_rw on storage.objects
  for all to authenticated
  using (
    bucket_id = 'firm-files'
    and (storage.foldername(name))[1] = public.current_firm_id()::text
  )
  with check (
    bucket_id = 'firm-files'
    and (storage.foldername(name))[1] = public.current_firm_id()::text
  );
