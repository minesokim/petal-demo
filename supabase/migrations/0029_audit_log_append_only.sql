-- 0029: DB-enforce audit_log append-only (INV-7).
--
-- Until now append-only was a CODE convention (only lib/repository/audit.ts writeAudit inserts;
-- nothing updates or deletes). The adversarial security review (2026-06-23) flagged that nothing
-- enforced it at the database. This revokes UPDATE and DELETE on audit_log from the application
-- roles so a tampered or compromised app path cannot rewrite history — INSERT (append) and SELECT
-- (read) remain. RLS firm-isolation is unchanged.
--
-- Guarded with role-existence checks so it is a clean no-op where the Supabase roles are absent
-- (e.g. the PGlite test harness), and idempotent (REVOKE of an absent privilege is harmless).

-- UPDATE/DELETE rewrite history; TRUNCATE (a table privilege that bypasses RLS) would wipe the
-- whole log. Revoke all three from the app roles; INSERT (append) + SELECT (read) remain.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke update, delete, truncate on table public.audit_log from authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke update, delete, truncate on table public.audit_log from anon;
  end if;
end $$;
