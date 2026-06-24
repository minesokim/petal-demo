# SOC 2 Controls Mapping — Petal

> "SOC 2 posture without the badge." Maps Trust Services Criteria to concrete
> controls and where each is implemented/evidenced. Status: **[live]** tested ·
> **[wiring]** built, pending deploy · **[planned]**.

## Security (Common Criteria)

| TSC | Control | Implementation / evidence | Status |
|---|---|---|---|
| CC6.1 | Logical access — tenant isolation | Postgres RLS on every table (`firm_id = current_firm_id()`); `tests/rls/*` + live cloud proof | **[live]** |
| CC6.1 | Authentication | Clerk Organizations (preparers) + Supabase OTP (clients); MFA available | **[wiring]** |
| CC6.1 | Least privilege | Roles owner/admin/reviewer/preparer; `requireRole` (app) + role-gated RLS write policies | **[live]** |
| CC6.1 | Secrets management | `.env.local` gitignored; `.env.example` blank; KEK→KMS/Vault in prod | **[live]** |
| CC6.6 | Encryption in transit | TLS to all sub-processors | **[live]** (provider) |
| CC6.7 | Encryption at rest (PII) | AES-256-GCM envelope encryption, KEK-wrapped DEK; `lib/crypto/envelope.ts` + `tests/crypto` | **[live]** |
| CC6.8 | Malicious-output containment | AI quarantine (`pending_review` → human promote); `tests/repository/ai.test.ts` | **[live]** |
| CC6.1/6.3 | Agentic write governance | Tier-gated tool registry (reads auto-run; tier-3 writes are staged, never run in the agent loop); **no external write without a recorded human approval** via an atomic compare-and-swap claim (`lib/agent/approve.ts`); per-tool scopes fail-closed; stubbed connectors non-live in v1; `tests/agent/security-fixes.test.ts` | **[live]** |
| CC6.7 | Storage tenant isolation | `signedUrlForFirmFile(path, firmId)` refuses any object outside the caller's firm prefix (service-role bypasses storage RLS); `tests/storage/firm-files-guard.test.ts` | **[live]** |
| CC7.1 | Change detection / linting | Supabase security advisor after each DDL (clean); CI on every push | **[live]** |
| CC7.2 | Audit trail | Append-only `audit_log` on every mutation; no PII in metadata; **DB-enforced** append-only (REVOKE update/delete/truncate from app roles, migration `0029`) | **[live]** |
| CC7.3/7.4 | Incident response | Runbook + breach notification | **[planned]** |
| CC8.1 | Change management | Git + CI gate (isolation/security suite green); versioned SQL migrations | **[live]** |
| CC9.2 | Vendor management | DPAs + SOC 2 reports for Supabase/Clerk/Anthropic/Vercel/Stripe | **[planned]** |

## Confidentiality

| Control | Implementation | Status |
|---|---|---|
| Data classification + minimization | WISP §1; SSN excluded from default reads, audit, and AI prompts (`redact`) | **[live]** |
| Crown-jewel encryption | envelope-encrypted `people.ssn`; extend to bank fields | **[live]** (SSN) |
| Retention / disposal | cascade-delete on firm removal; IRS retention schedule | **[wiring]/[planned]** |

## Availability (lightweight)

| Control | Implementation | Status |
|---|---|---|
| Managed, backed-up Postgres | Supabase (PITR on paid tier) | **[wiring]** |
| Isolated build | `backend` worktree; live demo never touched by backend work | **[live]** |

## Open items before a real audit
1. Execute sub-processor DPAs; confirm Anthropic ZDR + no-training on the prod key.
2. Incident-response + breach-notification runbook.
3. Extend envelope encryption to all bank/account fields; encrypt stored documents (Storage).
4. Formal access review cadence + retention schedule.
5. Independent penetration test.

## Adversarial review log
- **001** — `docs/security/adversarial-review-001.md`: RLS, repository boundary, AI quarantine, auth bridge, crypto.
- **2026-06-23 — AI orchestration (④):** 5-dimension red-team of the research engine + agentic layer. 8 findings, all confirmed + fixed, 2 HIGH (atomic approval gate; redact read-tool output) independently re-verified. Commit `a4828f6`. Record: `docs/security/agentic-layer-security.md`.
- **2026-06-23 — Foundation (①–③):** tenancy trust chain, RLS coverage, PII/crypto, documents/storage. Trust chain + RLS + AES-256-GCM envelope reviewed clean; **1** confirmed hole (cross-firm document read via service-role signed URL) fixed + test-pinned. Commit `c69ba11`.

UI-freeze verification (inviolable rule): across the whole backend session, the presentational layer changed by **+111 / −0** in a single file (`petal-chat.tsx`), **zero** `className`/markup/structure lines — additive data-routing only, rendering through the existing `ChatAnswer` shape. Verify: `git diff <pre-backend>..HEAD -- 'components/**' 'app/**/*.tsx'`.
