# Agentic Capability Layer — Security Posture & Review Record

> Scope: the agent runtime, tool registry, approval gate, credential model, System-of-Record
> manifest, and reconciliation proposer shipped 2026-06-23 (migration `0028`). This document is
> the security addendum for that layer; it supplements [WISP.md](./WISP.md) and
> [soc2-controls.md](./soc2-controls.md), which should fold the controls below into their
> control catalogs at the next review.

## 1. Invariants (the controls, stated as laws)

| ID | Invariant | Where enforced (code) |
|----|-----------|------------------------|
| INV-1 | The model never decides a match or a number; deterministic engines own all figures | `lib/recon/match.ts` (integer-cents, model-free); `lib/tax/**` worksheets; the research engine's numeric gate exempts only engine-computed values |
| INV-3 | No external write executes without a recorded human approval; tier-3 writes never run in the agent loop | `lib/agent/registry.ts` `runTool` (refuses `access:"write"` unless `allowWrite`); `lib/agent/runtime.ts` stages writes as proposals only; `lib/agent/approve.ts` is the sole `allowWrite:true` path, gated by an atomic claim |
| INV-4 | Credentials least-privilege + use-without-seeing; secrets never in model context, logs, audit, or client | `agent_connections.secret_ref` is a pointer only; `lib/repository/agent.ts` audit metadata records provider/authType, never the secret; dispatch scope check fail-closed |
| INV-7 | Every mutation / proposal / approval / write is appended to `audit_log` | every mutator in `lib/repository/agent.ts` calls `writeAudit` |
| Tenancy | Postgres RLS `firm_id = current_firm_id()` on every table; `agent_runs` scoped via its parent task | migration `0028` policies; 10 cross-tenant isolation tests in `tests/rls/agent-layer-isolation.test.ts` |
| §7216 | No real taxpayer data reaches a model without `assertCleared(scope)`; inputs redacted | `lib/ai/guard.ts`; `runSubAgent` + `runReconciliation` assert scope and redact |

## 2. Adversarial security review (2026-06-23)

A 5-dimension adversarial review (tenant isolation, approval-gate integrity, tool-dispatch
privilege, credential-leak + prompt injection, recon/audit/§7216) surfaced **8 findings**; each was
independently refuted-or-confirmed against the code. All 8 were confirmed and fixed; the two HIGH
closures were independently re-verified. Fix commit: `a4828f6`.

| Sev | Finding | Fix |
|-----|---------|-----|
| HIGH | Non-atomic approval gate (TOCTOU): a double-click/retry/concurrent approval could execute one tier-3 write **twice** | `claimProposal()` — atomic compare-and-swap `UPDATE … WHERE status='pending' RETURNING`; only the winner runs the write. Re-verified: Postgres row-lock serializes; loser executes nothing |
| HIGH | Read-tool results re-entered the model context **unredacted** (redaction was persistence-only) | `redactValue()` wraps every read result before re-entry, in both `runtime.ts` and `runner.ts`. Re-verified closed in both paths |
| MED | Dispatch scope-check was dead code (`callerScopes` always `undefined`) | fail-closed (undefined = empty set); `ALL_SCOPES` threaded at authorized call sites |
| MED | Recon rationale path could send client PII to a model with no §7216 gate | `assertCleared` trip-wire added; party-name/free-text fields dropped from drafter facts; `redactValue` second pass |
| LOW | Proposal `evidence` persisted raw connector free-text | redacted at `createProposal` |
| LOW | In-memory confirm path left no approval audit row | `confirmAgentAction` now emits `agent.confirm` audit |
| LOW (deferred) | Recon model-turns not recorded in `agent_runs` | only applies once a model-backed drafter exists (default is deterministic); interface change documented at the call site |
| LOW (deferred) | Legacy `runner.ts` doesn't route reads through `runTool` | redaction fix applied; dispatch-routing left as a one-line TODO |

## 2b. Foundation review — slices ①–③ (2026-06-23)

A second adversarial review covered the crown-jewel foundation (tenancy trust chain, RLS coverage +
repository, PII/crypto, documents/storage). The trust chain, RLS coverage, and AES-256-GCM envelope
encryption (`lib/crypto/envelope.ts`) came back **clean**. **One** hole was confirmed and fixed:

| Sev | Finding | Fix |
|-----|---------|-----|
| HIGH (latent) | `extract_document` signed a **model-supplied `storageKey` via the service-role client** (bypassing storage RLS) with no firm-ownership check → once the agent read-loop is wired to Ask Petal, firm B could read firm A's stored documents | `signedUrlForFirmFile(path, firmId)` now **requires the caller's firmId and refuses any path outside that firm's prefix** (thrown before any network call); the intake loader is bound to `ctx.firmId` and always runs inside `withFirm`; the safe download path passes `ctx.firmId` too. 4 guard tests pin it (cross-firm / bare / empty-firmId / sibling-prefix-spoof all refused). |

Latent today (no live HTTP route reaches the intake read-loop yet), closed before that loop ships.

## 3. Residual risks — stated honestly, not hidden

These are known and accepted for the current beta posture. They must be closed before the
corresponding capability handles real, unattended, production data:

1. **`audit_log` append-only is a code convention, not DB-enforced.** Only `writeAudit` inserts and
   nothing updates/deletes — but no `REVOKE UPDATE, DELETE` exists on the table. **Recommended:** a
   migration revoking `UPDATE, DELETE` on `audit_log` from the `authenticated`/`anon` roles so
   append-only is enforced at the database, not just by discipline.
2. **`redactValue` is best-effort pattern-masking, not a guarantee.** It masks structured PII
   (SSN/EIN/account/phone shapes), not arbitrary free-text PII (names, addresses). The load-bearing
   §7216 controls remain `assertCleared(scope)` + Anthropic ZDR + the no-real-PII-without-clearance
   posture — redaction is data-minimization defense-in-depth on top of those.
3. **§7216 is an accepted-risk beta posture, not a cleared one.** `PETAL_7216_CLEARED=true` is set by
   the firm owner's informed choice; **the written tax-attorney opinion is not yet in hand.**
   Reversible by unsetting the flag. See [project §7216 gate].
4. **Scope-gating is fail-closed but coarse.** With no role→scope model yet, every active firm member
   effectively holds all firm scopes (`ALL_SCOPES`). The dispatch check now fails closed and is
   *ready* for per-role narrowing; the narrowing itself is a follow-up.
5. **External connectors are non-live in v1.** The Xero/connector write tools throw
   `"external connector not enabled in v1"` and are excluded from `ENABLED_WRITE_TOOLS`; no agent
   path performs an external write. Credential vault uses a KMS/Vault KEK in production and a
   `DATA_ENCRYPTION_KEY` env key in dev only.
6. **Prompt-injection surface.** The agent reads untrusted content (client docs/messages/recon
   memos). Tool grants are kept out of any model-controllable path (the model can only *stage*
   writes; a human approves), so injected content cannot escalate privileges or trigger a write on
   its own — but this property must be preserved as new tools are added.

## 4. What an auditor can replay

Because `agent_runs` stores transcripts and `audit_log` records every proposal/approval/write, any
agent task can be reconstructed end-to-end. Cross-tenant isolation, the approval gate's
exactly-once property, the fail-closed scope check, and the redaction path each have executable
tests (`tests/rls/agent-layer-isolation.test.ts`, `tests/agent/security-fixes.test.ts`).

_Last updated: 2026-06-23 (agentic layer Phase 0+1 + adversarial review)._
