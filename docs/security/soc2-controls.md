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
| CC7.1 | Change detection / linting | Supabase security advisor after each DDL (clean); CI on every push | **[live]** |
| CC7.2 | Audit trail | Append-only `audit_log` on every mutation; no PII in metadata | **[live]** |
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
See `docs/security/adversarial-review-001.md` for the latest red-team pass over
RLS, the repository boundary, AI quarantine, auth bridge, and crypto.
