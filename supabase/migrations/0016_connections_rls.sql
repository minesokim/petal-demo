-- ⑤ RLS — firm-scoped isolation on connectors.
grant select, insert, update, delete on connections to authenticated;
alter table connections enable row level security;
create policy connections_rw on connections for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
