# Written Information Security Plan (WISP) — Petal

> IRS Pub. 4557 / FTC Safeguards Rule posture for a tax-practice SaaS handling
> taxpayer PII. Living document; review each release and at least annually.
> Status legend: **[live]** implemented + tested · **[wiring]** built, pending
> credential/deploy · **[planned]** not yet built.

## 1. Scope & data inventory

Petal stores tax-practice data for multiple firms (tenants). Data classes:

| Class | Examples | Handling |
|---|---|---|
| **Crown-jewel PII** | SSN/ITIN, bank/account/routing numbers | App-level envelope encryption; never logged; excluded from default reads + AI prompts |
| **Sensitive** | names, addresses, income figures, returns, documents | Tenant-isolated (RLS); access-controlled; audited |
| **Operational** | tasks, deadlines, statuses, audit log | Tenant-isolated; audited |
| **Secrets** | DB/service keys, API keys, KEK | Env / KMS only; never in git (`.env.local` gitignored, `.env.example` blank) |

## 2. Tenant isolation — the security floor **[live]**

- Every tenant row carries `firm_id`. Postgres **Row-Level Security** policies
  (`firm_id = public.current_firm_id()`) enforce isolation underneath all app
  code, so a missed app-level filter cannot leak across firms.
- Enforced via `SET LOCAL ROLE authenticated` + JWT claims, mirrored at runtime
  by `withTenant`. Cross-tenant isolation is proven by an automated suite
  (`tests/rls/*`) run in CI **and** verified live against cloud Postgres.
- Service-role (RLS-bypassing) access is confined to trusted server jobs (Clerk
  webhook sync, migrations) — never reachable from user input.

## 3. Access control **[live / wiring]**

- Firm/preparer auth via **Clerk Organizations**; roles owner/admin/reviewer/
  preparer. **MFA available via Clerk** for preparers.
- Least privilege enforced in two layers: RLS (DB) + `requireRole` (app), e.g.
  only owner/admin change firm settings; only reviewer/owner/admin promote AI
  output.
- Client portal accounts authenticate via **Supabase OTP** (passwordless); a
  custom access-token hook scopes each client to exactly their firm.
- **Agentic actions** run under a tier-gated tool registry (reads auto-run; tier-3
  writes are *staged* and never execute in the agent loop). **No external write
  happens without a recorded human approval**, gated by an atomic compare-and-swap
  claim (so one approval = one execution, even under double-click/retry). Scoped,
  use-without-seeing credentials (`agent_connections.secret_ref` — never in model
  context/logs/audit). Full posture + the 2026-06-23 red-team record:
  `docs/security/agentic-layer-security.md`.

## 4. Encryption

- **In transit:** TLS to Supabase/Clerk/Anthropic/Vercel (provider-enforced).
- **At rest (infra):** Supabase-managed disk encryption (AES-256).
- **At rest (crown-jewel PII):** app-level **envelope encryption** — AES-256-GCM,
  per-record data key wrapped by a master key (KEK). KEK in env for dev, **KMS /
  Supabase Vault in prod**. Tamper-evident (GCM). **[live]** for `people.ssn`;
  extend to bank fields as those columns are added.

## 5. Logging & monitoring **[live]**

- Append-only `audit_log` row on every mutation (actor, action, resource,
  firm_id). **No crown-jewel PII in audit metadata** (enforced + tested).
  Append-only is **DB-enforced** — UPDATE/DELETE/TRUNCATE revoked from the app
  roles (migration `0029`), so history cannot be rewritten even by a compromised
  app path.
- Supabase platform logs (auth, postgres, api) retained per provider.
- Security advisor (lint) run after every DDL change; currently **clean**.

## 6. AI data handling **[live]**

- **Anthropic-direct, no LangChain.** Zero-data-retention + no-training are
  contractual (DPA / account configuration) — to be confirmed on the production key.
- **Data minimization:** prompts pass through `redact()` (strips SSN/EIN/bank
  keys + SSN-shaped strings) before leaving the server.
- **AI quarantine:** model output lands in `ai_suggestions` as `pending_review`
  and **never touches a production table** until a human (reviewer+) promotes it.

## 7. Vendor management

Sub-processors: Supabase (DB/Auth/Storage), Clerk (identity), Anthropic (AI),
Vercel (hosting), Stripe (payments — PCI handled by Stripe, card data never
touches our servers). **[planned]** execute DPAs + collect SOC 2 reports for each.

## 8. Retention, disposal, incident response **[planned]**

- Retention schedule per IRS record-retention rules; cascade-delete on firm
  removal (`on delete cascade`).
- Incident response runbook (detect → contain → eradicate → notify) and breach
  notification per state law + IRS — to be documented before GA.

## 9. Change management & review **[live]**

- All changes via git + CI (isolation/security suite must be green). Migrations
  are versioned SQL. WISP reviewed every release; owner: founder.
