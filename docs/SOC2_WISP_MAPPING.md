# Petal — SOC2 + WISP control mapping

> Honest control inventory for the Petal backend. Each control maps to the code that implements it and the
> test that proves it, with **GAPS called out explicitly** (no overclaiming — the same honest-degradation
> discipline the product holds itself to). This is a readiness map, not an attestation: a SOC2 Type II report
> requires an auditor and an observation period, and several controls below are partial or not yet built.
>
> Status legend: **IMPLEMENTED** (code + passing test) · **PARTIAL** (built, gap noted) · **GAP** (not yet built).

Last reviewed: 2026-06-25. Test suite at review: 648 passing.

---

## A. SOC2 Trust Services Criteria

### CC6.1 / CC6.3 — Logical access, tenant isolation (Security + Confidentiality)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| Row-level firm isolation (multi-tenant) | IMPLEMENTED | Postgres RLS `firm_id = public.current_firm_id()` on every firm-scoped table; firm_id stamped from the auth context on write, never trusted from the caller | `supabase/migrations/0028_agent_layer_schema.sql` (+ per-table policies); `tests/rls/*` (isolation, session-tables, practice, agent-layer, ai-usage, provenance, scheduler-skills) — cross-tenant read/write/update all proven blocked |
| Cross-tenant write rejection (WITH CHECK) | IMPLEMENTED | Every firm-scoped policy has `with check (firm_id = current_firm_id())` | `tests/rls/agent-layer-isolation.test.ts`, `tests/rls/scheduler-skills-isolation.test.ts` |
| Service-role boundary | IMPLEMENTED | `getServiceDb()` (RLS-bypassing) used ONLY for trusted system jobs (Clerk sync, the scheduler cron); user-facing paths go through `withTenant`/`withFirm` | `lib/db/client.ts`, `lib/auth/tenant.ts` |

### CC6.2 / CC6.6 — Authentication & route protection

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| Authenticated firm context | IMPLEMENTED | Clerk org → internal firm; `getFirmContext()` resolves the firm; API routes 401 without it | `lib/auth/context.ts`, `app/api/*/route.ts` |
| `/os/*` unauth redirect (never a fixture shell) | **GAP** | The Clerk `middleware.ts` approach is incompatible with Next.js 16 (it 404'd every route) and was reverted. The spec'd redirect must be re-done as a server-component auth check in `app/os/layout.tsx`, verified against a running server | reverted in commit `9ef9d6d`; tracked for re-implementation |

### CC6.7 / C1.1 / C1.2 — Confidentiality of data at rest & in transit

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| Envelope encryption of sensitive PII | PARTIAL | AES-256-GCM envelope (`encryptPII`/`decryptPII`); applied to SSN, client memory, intake answers, and the staged-action payload | `lib/crypto/envelope.ts`; `lib/repository/pii.ts`, `client_memory.text_enc`, `intake_sessions.answers_ciphertext`, `action_proposals.payload_enc` (`lib/repository/agent.ts`) |
| **GAP within the above** | GAP | A few workflow-text fields remain plaintext: `expected_docs.note`, `notices.note`, `tasks.title`/`why`, `agent_tasks.input`. Encrypting them is a multi-surface change (search + agent runtime) — spun off as a focused task | spawned task `task_c7a71e89` |
| AI prompt minimization (no PII to the model) | IMPLEMENTED | `redactText`/`redactValue` strip SSN/EIN/account-shaped strings before any model call; read-tool output is redacted before re-entering the model context | `lib/ai/redact.ts`; `tests/ai/redact.test.ts`; `lib/agent/runner.ts` (HIGH-5 redaction) |

### CC7.x — System operations, monitoring, honest degradation

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| Append-only audit log | IMPLEMENTED | `writeAudit` appends an immutable row on every task/proposal/approval/skill/schedule mutation (INV-7) | `lib/repository/audit.ts`; called from `lib/repository/agent.ts`, `lib/repository/schedules.ts`, `lib/repository/skills.ts`, `lib/agent/approve.ts` |
| Honest degradation (no silent fallbacks) | IMPLEMENTED | A model/service failure surfaces a `serviceError`/degraded note rather than a false answer or a fixture; a failed contra-search returns `searched=false`; a cost-accounting failure never fails the answer | `lib/ai/reasoning.ts`, `lib/research/engine.ts` (degraded/serviceError returns), `lib/research/contra-finder.ts`, `app/api/research/route.ts` |

### CC8.1 / PI1.x — Change management & processing integrity (the research moat)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| Measured-error-rate release gate | PARTIAL | The research AI's defensibility is a measured error rate that gates CI: the 50-case golden set (`--gate 44`) + the 15-case Blue J hard set (`--gate 8`, interim) on production Claude | `.github/workflows/research-eval.yml`; `scripts/research-benchmark.mts`; `tests/research/golden/*`, `tests/research/golden/bluej-hard.ts` |
| **GAP within the above** | GAP | The gate is dormant until the `ANTHROPIC_API_KEY` repo secret is added; the Blue J floor is an interim 8/15 pending the first judge-graded baseline | requires credential (operator action) |
| Deterministic math (model never does arithmetic) | IMPLEMENTED | `lib/tax` worksheets are the source of truth; the figure gate drops any model-stated number not present in cited authority | `lib/research/engine.ts` (`ungroundedFigures` / MONEY_RE); `tests/research/golden/*` |
| No-citation-no-claim grounding | IMPLEMENTED | Faithfulness scorer + verifyPositions drop any ungrounded position; an abstain ships an honest decline, not a guess | `lib/ai/faithfulness.ts`, `lib/research/engine.ts` `verifyPositions` |

### §7216 — Taxpayer-data disclosure (legal control, mapped here as Confidentiality)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| ZDR-only model allowlist | IMPLEMENTED | `assertZdrModel` rejects any non-ZDR model before a prompt is built; the codex dev proxy is hard-gated to non-deployed | `lib/ai/guard.ts` (`ZDR_MODELS`); `tests/security/no-leak-7216.test.ts` (wall 2) |
| Cleared-scope gate | IMPLEMENTED | `assertCleared` blocks real taxpayer-scope model calls until `PETAL_7216_CLEARED` | `lib/ai/guard.ts`; `tests/security/no-leak-7216.test.ts` (wall 3) |
| No-leak on the live fetch | IMPLEMENTED | `assertPublicLawQuery` blocks any PII-shaped fetch query before an external request is made (GovInfo/Federal Register/DAWSON/IRB) | `lib/research/fetch/guard.ts`; `tests/research/fetch-no-leak.test.ts` (the spy proves the network is never reached) |
| §7216 legal determination | GAP | A documented counsel opinion or accepted-risk memo is still required before real taxpayer data flows through any cleared path in production | operator/legal action |

### Risk gate / draft-everything (Processing Integrity for agent actions)

| Control | Status | Implementation | Evidence |
|---|---|---|---|
| Action risk classification | IMPLEMENTED | `classifyRisk` routes each action by reversibility × stakes × connector × confidence into auto/confirm/review/blocked; low research confidence demotes a write to mandatory review — on BOTH the Tasks runtime and the live chat path | `lib/agent/risk.ts`; `lib/agent/runtime.ts`, `lib/agent/runner.ts`; `tests/agent/live-risk-gate.test.ts`, `tests/agent/research-confidence-gate.test.ts` |
| Draft-everything / human-commits | IMPLEMENTED | No external side effect without a recorded human approval via `action_proposals`; reviewer/admin/owner-only approval; no self-approval on the review lane | `lib/agent/approve.ts` (`resolveProposalCore`); `lib/auth/roles.ts` (`canApprove`); `tests/agent/risk-gate-approval.test.ts`, `tests/agent/runtime.test.ts` (preparer cannot approve) |
| Never-auto-submit (irreversible external) | IMPLEMENTED | Approving an irreversible submit (e-file, post journal) yields `ready_to_submit` and does NOT run the tool; a human performs the submit | `lib/agent/approve.ts`; `tests/agent/risk-gate-approval.test.ts` (b) |
| Evidenced review artifact | IMPLEMENTED | Every staged action ships a field→source artifact for a 30-second check | `lib/agent/review-artifact.ts`; `lib/agent/stage-proposals.ts`, `lib/agent/runtime.ts` |

---

## B. WISP (Written Information Security Plan) mapping

The IRS-required WISP (Pub. 5708) sections, mapped to the controls above.

| WISP section | Status | Where it lives |
|---|---|---|
| Designate a security coordinator | GAP (operator) | Org/policy doc — not a code control |
| Identify & assess risks to PII | PARTIAL | This document + the threat surface (multi-tenant data, AI prompts, external fetch); formal risk assessment doc still owed |
| Data inventory & classification | IMPLEMENTED (data layer) | The encrypted-vs-plaintext inventory in section A (C1.1) is the live classification; one plaintext gap tracked |
| Access controls (least privilege) | IMPLEMENTED | RLS firm isolation + intra-firm RBAC (preparer drafts, reviewer approves) — section A CC6.1/PI |
| Encryption of PII at rest & in transit | PARTIAL | Envelope encryption (section A C1.1); TLS in transit via the platform; the plaintext-workflow-text gap is the open item |
| Authentication | PARTIAL | Clerk org auth; the `/os/*` redirect gap is open |
| Audit / logging | IMPLEMENTED | Append-only `audit_log` (section A CC7) |
| Incident-response plan | GAP (operator) | Policy doc — not a code control |
| Service-provider oversight (subprocessors) | PARTIAL | Anthropic (ZDR), Clerk, Supabase, the fetch sources (public data only); a subprocessor register is owed |
| Vendor/upload hardening (MIME + AV) | GAP | Upload MIME validation + antivirus scanning on document upload is not yet built (slice 3) |
| Employee training | GAP (operator) | Policy/process — not a code control |

---

## C. Open security items (the honest gap list)

1. **`/os/*` auth redirect** — re-implement at the layout level (Next-16-safe), verified against a running server.
2. **Encrypt remaining workflow-text PII** — `expected_docs.note`, `notices.note`, `tasks.title`/`why`, `agent_tasks.input` (task `task_c7a71e89`).
3. **Upload hardening** — MIME validation + AV scan on document upload (slice 3).
4. **§7216 legal sign-off** — counsel opinion or documented accepted-risk before real taxpayer data flows in production.
5. **Activate the measured-error-rate gate** — add the `ANTHROPIC_API_KEY` CI secret; set the Blue J floor from the first judge-graded baseline.
6. **Operator/policy docs** — security coordinator, incident response, subprocessor register, training (WISP non-code sections).
7. **Cross-slice E2E security suite + production deploy** — the remaining product slices (identity/RBAC surfaces, documents, connectors, OLT, payments, portal) must each pass adversarial prod+security review before the DONE-WHEN bar is met.

This list is the truthful distance to the spec's SOC2/WISP bar. Nothing above is marked done that isn't backed by a passing test or a cited control.
