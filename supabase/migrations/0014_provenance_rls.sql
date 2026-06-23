-- RLS — firm-scoped isolation on the provenance/activity/inbox tables.
grant select, insert, update, delete on positions, skill_runs, activity, threads to authenticated;

alter table positions enable row level security;
alter table skill_runs enable row level security;
alter table activity enable row level security;
alter table threads enable row level security;

create policy positions_rw on positions for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy skill_runs_rw on skill_runs for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy activity_rw on activity for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
create policy threads_rw on threads for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
