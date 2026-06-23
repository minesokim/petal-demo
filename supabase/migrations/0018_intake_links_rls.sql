-- ⑧ RLS — preparer side is firm-scoped. The prospect (unauthenticated) side reaches its
-- own invite by capability token via a service-role action, never through these policies.
grant select, insert, update, delete on intake_links to authenticated;
alter table intake_links enable row level security;
create policy intake_links_rw on intake_links for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
