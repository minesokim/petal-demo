-- The AI skill catalog is a GLOBAL product definition readable by every firm (no client data).
alter table skills alter column firm_id drop not null;
drop policy if exists skills_rw on skills;
drop policy if exists skills_read on skills;
drop policy if exists skills_write on skills;
create policy skills_read on skills for select to authenticated
  using (firm_id is null or firm_id = public.current_firm_id());
create policy skills_write on skills for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
-- promote the seeded catalog to global (firm_id NULL) so all firms see it
update skills set firm_id = null;
