-- ⑧ Portal RLS hardening — firm co-check on the two household-scoped client policies.
--
-- 0011_portal_rls.sql gates a portal client's reads on household_id matching the
-- `household_id` JWT claim. But household_id is an attacker-influenceable claim and is
-- globally unique only by convention — a forged/stale claim pointing at ANOTHER firm's
-- household would satisfy the predicate and leak that firm's engagements + expected_docs.
--
-- Fix: co-check that the row's firm_id equals the calling client's own firm_id (resolved
-- from the clients table via current_client_id(), which is the trusted identity claim).
-- This ties every household read back to the client's firm, so a cross-firm household_id
-- claim now reads nothing. clients_self_read is already self-scoped (id = current_client_id())
-- and needs no change.
--
-- Idempotent: drop-if-exists then recreate so re-runs are safe.

drop policy if exists engagements_client_read on engagements;
create policy engagements_client_read on engagements for select to authenticated
  using (
    public.current_user_type() = 'client'
    and household_id = public.current_household_id()
    and firm_id = (select firm_id from clients where id = public.current_client_id())
  );

drop policy if exists expected_docs_client_read on expected_docs;
create policy expected_docs_client_read on expected_docs for select to authenticated
  using (
    public.current_user_type() = 'client'
    and engagement_id in (select id from engagements where household_id = public.current_household_id())
    and firm_id = (select firm_id from clients where id = public.current_client_id())
  );
