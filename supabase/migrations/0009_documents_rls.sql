-- ③ RLS — firm-scoped isolation on the document library.
grant select, insert, update, delete on firm_folders, firm_files to authenticated;
alter table firm_folders enable row level security;
alter table firm_files enable row level security;

create policy firm_folders_rw on firm_folders for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy firm_files_rw on firm_files for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
