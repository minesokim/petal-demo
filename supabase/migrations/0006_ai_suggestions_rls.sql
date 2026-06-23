-- ④ RLS — AI quarantine is firm-scoped like everything else. Role-gating of
-- promotion (only reviewers/owners promote) is enforced in the repository.
grant select, insert, update, delete on ai_suggestions to authenticated;
alter table ai_suggestions enable row level security;
create policy ai_suggestions_rw on ai_suggestions for all to authenticated
  using (firm_id = public.current_firm_id()) with check (firm_id = public.current_firm_id());
