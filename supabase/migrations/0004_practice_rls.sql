-- ② RLS — firm-scoped isolation on the practice tables (same floor as ①).
grant select, insert, update, delete on
  households, people, entities, engagements, expected_docs, skills, notices, tasks
  to authenticated;

alter table households enable row level security;
alter table people enable row level security;
alter table entities enable row level security;
alter table engagements enable row level security;
alter table expected_docs enable row level security;
alter table skills enable row level security;
alter table notices enable row level security;
alter table tasks enable row level security;

create policy households_rw on households for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy people_rw on people for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy entities_rw on entities for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy engagements_rw on engagements for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy expected_docs_rw on expected_docs for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy skills_rw on skills for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy notices_rw on notices for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy tasks_rw on tasks for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
