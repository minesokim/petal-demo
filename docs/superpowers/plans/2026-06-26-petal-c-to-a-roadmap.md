# Petal: C+ → A Master Roadmap

> Built from a brutal evidence-grounded audit (C+) + 6 code-grounded category plans. This is the program
> roadmap; each phase gets its own TDD implementation plan when executed. Grades are the audit's.

**North star:** Petal is graded C+ not because the architecture is weak — it is best-in-class — but because
**no real client data has ever flowed through it end-to-end.** Four of six categories are capped on that one
fact. So the spine of this plan is: **make real data flow through one real firm, end-to-end, on a real
deploy** — that single move uncaps product-completeness, agentic-OS, filing, AND the thesis at once. The
research moat and the SOC2 attestation run as **parallel tracks** because neither depends on the data spine.

## The dependency map (why the phases are ordered this way)

```
PHASE 0  honesty + record what exists  ──┐
                                         ▼
PHASE 1  REAL-DATA BACKBONE  ────────────┼──► uncaps Product, Agentic, Filing, Thesis
 (wire surfaces, real-firm onboarding,   │
  E2E seams, prod deploy)                │
                                         ├──► PHASE 2  first real external action (agentic)
                                         └──► PHASE 3  OLT draft-only bridge (filing)

PHASE 4  RESEARCH MOAT DEPTH   ── parallel from day 1 (public authority, no data dependency)
PHASE 5  SOC2 / SECURITY ATTEST ── parallel from day 1 (6-month clock — START NOW)
```

**Critical path to "A overall":** the *build* work (Phases 0→1→2/3 + Phase 4) is ~8–12 focused weeks. But a
true enterprise A includes **SOC2 Type II, which has a ~6-month observation window**. That calendar clock is
the real gate, so Phase 5's founder decisions (engage an auditor, §7216 counsel) must start **week 1** to
finish in parallel with the build, not after it.

---

## Reconciliations (where the planners were slightly off — corrected here)

- **Auth is NOT a gap.** The audit/planners flagged "fix /os/* auth redirect / no middleware." Verified false:
  Next 16 uses `proxy.ts` (not `middleware.ts`), which already gates `/os` + `/onboarding` in production and
  now 401s the data APIs too (this session, `c013f2a`). Drop this from the backlog.
- **Record the HONEST baseline, not 97.4%.** The 97.4% is the *currency/plumbing* golden set (easy). The real,
  broader measurement established this session is **62.5% settled-law (verified set) / 47% hard-unsettled /
  94% currency.** The release gate must record the honest triple — hiding behind 97.4% violates the engine's
  own abstention philosophy.
- **Surface inventory needs a precise `app/os/*` pass.** One planner cited `app/dashboard/*` paths
  (conversations/returns/evals) that look like the older mockup. Phase 1 step 1 is an exact inventory of the
  ~16 still-fixture `app/os/*` surfaces before batch-wiring.

---

## PHASE 0 — Honesty + record (days; mostly S, low-risk)
**Goal:** stop lying (no silent fixture fallbacks), record the moat, and grab the cheap unlocks.
- Remove the silent `loadFirmData` `!real → fixtureFirmData()` fallback → an honest onboarding/empty state.
- Record the honest measured baseline: `lib/research/measured-baseline.ts` (62.5/47/94, date, model, gate
  threshold) + update `docs/RESEARCH_BENCHMARK.md` to cite it as source of truth.
- Fix the **contraSearch asymmetry** in `lib/agent/tools/intent.ts` (one flag) → the agent research path gets
  the full §6662 weight-of-authorities tier, not capped at substantial-authority.
- `GET /api/health` subsystem probe; mark all fixtures with a deprecation-boundary JSDoc + a `WHITELIST.md`.
**Exit:** no silent fixture fallback on the core path; the moat is recorded + machine-readable; agent research
uses full authority weighting. **Moves:** research-moat (recorded), product honesty.

## PHASE 1 — The real-data backbone (2–4 weeks; the uncapper, critical path)
**Goal:** real data behind every pixel for one real firm, on a real deploy, with the seams tested.
- Exact inventory of the still-fixture `app/os/*` surfaces, then **batch-wire each to a real RLS-scoped query**
  (RULE 2: swap the data source, same shape; never restyle).
- **Real-firm onboarding path**: sign-up → firm row → seeded-or-blank → clients/engagements created as *real*
  rows (not fixtures). Clerk webhook test (sign-up → firm creation).
- **E2E seam tests** (the spec's named seams): task lifecycle, upload→storage→extraction, agent SSE,
  risk-gate approval, portal (invite+OTP), calendar.
- **Production deploy** 1:1 to the frozen design + monitoring (APM) + smoke tests.
- One **real firm/client/return** walked end-to-end by the founder.
**Exit:** prod deploy renders 1:1 with real audited data behind every surface; E2E suite green; one real flow.
**Moves:** product-completeness **C- → A**; uncaps the thesis.

## PHASE 2 — First real external action (1–2 weeks; agentic-OS proof)
**Goal:** prove the agentic OS by executing ONE real external action safely through the gate.
- Wire **Composio + Gmail `send_email`** (low-stakes, reversible) as the first MCP connector, behind
  draft-everything/human-commits, reusing the existing vault secret path.
- Attach the full **ReviewArtifact** (field→source) to every staged action.
- **Real end-to-end agent-loop test**: task → agent → staged write → approval → execution.
- Activate the **scheduler** cron poller; start a measured agent-action error rate (error taxonomy + audit).
**Exit:** ≥1 real external action runs through the risk gate with an evidenced artifact + a real-loop test.
**Moves:** agentic-OS **B → A**.

## PHASE 3 — OLT draft-only bridge (2–3 weeks; filing thesis; needs creds)
**Goal:** the draft-only filing thesis, real. (NOT a filing engine — Petal orchestrates OLT.)
- Resurrect the dead `lib/automation/olt.ts` Stagehand puller as a **post-approval actor**: drive OLT to
  PREPARE a draft return; the **human does the final submit** — never auto.
- Wire into the risk gate as **draft-only** with an evidenced OLT field→source artifact; enable `olt:*` in
  `ENABLED_WRITE_TOOLS` only after vault + Stagehand are ready.
- **Sandbox first**, measure 10 successful drafts + error rate, then graduate to live.
**Exit:** a real draft return prepared in OLT via Stagehand, draft-only/human-submit, evidenced.
**Moves:** filing/data **C → A**.

## PHASE 4 — Research moat depth (parallel from day 1; 3–6 weeks)
**Goal:** refill the starved fuel tank + ship the premise gate.
- **Corpus breadth**, batched + measured: entity depth (S-corp basis/§704/§722 → partnership → C-corp), then
  a second state (TX), then a real **circuit split** to exercise the §6662 in-circuit invariant on a true
  conflict.
- Build the designed **premise gate** (promote external/time-sensitive premises to code-gated objects; cap
  tier at hedge when an outcome-determinative premise is unverified) — closes the Q6/§280E class.
- Activate the **CI measured-error gate** (`--fetch`, ANTHROPIC_API_KEY secret); scale the golden set toward
  100+ stratified cases, measuring after each batch.
**Exit:** entity+multistate+circuit-split depth live; premise gate shipped; recorded error rate on 100+ cases.
**Moves:** research-moat **B → A**.

## PHASE 5 — SOC2 / security attestation (parallel from day 1; ~6-month clock)
**Goal:** turn a strong *built* security posture into an *attested* one.
- **Code:** encrypt remaining workflow/task-text PII (5 fields); KMS-managed KEK (Supabase Vault or AWS KMS)
  with rotation; AV scanning on upload; SOC2 control-evidence doc; incident-response runbook; subprocessor
  register + DPAs.
- **Founder/vendor (start week 1):** §7216 counsel opinion (or documented accepted-risk memo) — **blocks real
  taxpayer data in prod**; SOC2 Type II auditor (6-month observation); independent pentest.
**Exit:** all PII encrypted + KMS-managed; §7216 proven; pentest passed; SOC2 Type II in/through observation.
**Moves:** security-soc2 **B- → A**.

---

## Consolidated founder decisions (only you can make these)

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| 1 | **§7216**: counsel opinion vs accepted-risk memo | Counsel opinion (it's the moat's legal floor) | Real taxpayer data in prod |
| 2 | **SOC2 Type II** auditor + budget | Start the 6-month clock NOW (mid-market ~$15K) | Enterprise "A" (calendar) |
| 3 | **Pentest** vendor + budget | After KMS, before SOC2 ($5–15K) | Security A |
| 4 | **CI eval gate** — spend API quota for daily evals | Yes, daily on Claude, threshold 97% of golden | Enforced moat |
| 5 | **First MCP connector** | Composio + Gmail send (low-stakes, reversible) | Agentic A |
| 6 | **OLT**: cred storage + env + Stagehand cost | Vault + sandbox-first + Opus (~$30/mo sandbox) | Filing A |
| 7 | **Research priority**: entity type + 2nd state | S-corp first; TX second | Moat sequencing |
| 8 | **KMS provider** | Supabase Vault (integrated) | Security A |
| 9 | **APM vendor** | Sentry | Deploy monitoring |

## First week (start now)
1. Remove the silent `loadFirmData` fixture fallback → honest onboarding state.
2. `measured-baseline.ts` (the honest 62.5/47/94) + update the benchmark doc.
3. Fix `contraSearch` in `intent.ts` (the §6662 unlock — one flag).
4. `GET /api/health` + fixture deprecation boundary.
5. Inventory + wire the first 2–3 `app/os/*` fixture surfaces to RLS.
6. **Founder:** engage a SOC2 auditor + §7216 counsel (start the long clocks).
7. **Founder:** add `ANTHROPIC_API_KEY` to CI + flip the gate on.

## Grade trajectory
**C+** → Phase 0 (honesty + recorded moat) **C+/B-** → Phase 1 (real-data backbone) **B** → Phases 2–3
(agentic + OLT real) **B+** → Phase 4 (research depth + premise gate) **A-** → Phase 5 (SOC2 attestation
completes) **A**.

## Biggest risks
- **SOC2 Type II is a calendar gate, not a code gate** — if not started week 1, "A" slips ~6 months.
- **Surface-wiring is a long, repetitive slog** (the bulk of Phase 1); resist restyling (RULE 2).
- **OLT Stagehand fragility** — browser automation breaks on UI drift; sandbox-first + error escalation.
- **§7216 is the hard legal floor** — until cleared, prod runs on synthetic/demo data only.

---

## Roadmap addenda (2026-06-26, from live QA + the durable-runtime/§7216 design workflow)

### Real notifications backbone (RULE 1 — kill the mock)
The notification bell was a client-side fabricated seed. SHIPPED interim: it now hydrates from real firm data
(`getNotificationsAction` → `deriveNotifications` over pending `action_proposals`); demo shows honestly empty,
a seeded firm shows real pending approvals. REMAINING (this slice): add the other real sources (@mention
comments, task assignments, connector sync alerts); a **persisted per-user read-state** table (read survives
reload — today it's in-session); and **realtime push** via a Supabase subscription instead of fetch-on-open.

### Per-client §7216 (replaces the global flag)
Today §7216 is one global flag (`PETAL_7216_CLEARED`) — wrong for a 300-client firm (one unsigned client must
not block all AI, and pure research must never be gated). Target model: consent is **per client (per
household)**, checked only when a SPECIFIC client's data enters the model; research/general questions are never
gated. Phased: (1) schema — `section7216_signed_at` + `section7216_signed_by_person_id` on `engagements` +
firm-scoped RLS migration + `getClientConsent()` helper (the portal already CAPTURES consent in
intake-flow.ts `consent7216`, but nothing durable is queryable yet); (2) `assertClientConsent(firmId,
householdId)` in lib/ai/guard.ts (skips when no household = research; throws named error when unsigned), ordered
after `assertZdrModel`, before `redactValue`; (3) tag each agent tool firm|client scope, call the gate before
any client-reading tool (batch both sides for multi-client questions), and REMOVE the deploy-level scope
ternary so turns run scope='real' with per-client consent doing the gating; emit an audit_log row per check;
(4) populate from the portal consent step + a `tests/security/consent-per-client.test.ts`.

### Durable runtime / long-running + recurring agents (do we switch platforms? No.)
The durable runtime is largely ALREADY built (agent_tasks/agent_runs + RLS [0028], action_proposals approval
gate, agent_schedules + the Vercel cron→/api/cron/schedules with no-storm catch-up [0038], reconnect-durable
streaming). Gap to background/scheduled/reconnect-durable ≈ zero. Keep the Next.js app on Vercel; Postgres
agent_tasks/runs stays the source of truth. Phase 0 (now): Vercel Pro + `maxDuration` 300→800 (one line) likely
carries past the demo. Phase 1 (only when ONE run must exceed ~800s): add **Trigger.dev v3** (own containers, no
per-task limit, open-source — primary pick) OR **Vercel Workflows** (zero new vendor, unlimited run/sleep,
wait-for-event fits the §7216 human-approval gate; per-step still capped). NOT Supabase Edge Functions as the
executor (≤150s). Rough cost: ~$25/mo demo; ~$45–95/mo early prod.
