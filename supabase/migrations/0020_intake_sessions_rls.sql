grant select, insert, update, delete on intake_sessions to authenticated;
alter table intake_sessions enable row level security;
create policy intake_sessions_rw on intake_sessions for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
