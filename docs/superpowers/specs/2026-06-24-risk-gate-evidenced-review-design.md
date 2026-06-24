# Risk Gate + Evidenced Review Artifact — Design Spec

> Sub-project of the production-grade goal (`docs/superpowers/specs/2026-06-24-production-grade-goal.md`),
> AGENTIC OS pillar. This is the keystone: it turns the existing staged-approval plumbing into a
> first-class, risk-aware, evidence-backed human-in-the-loop gate.

**Date:** 2026-06-24
**Status:** Approved in-conversation (the 4-lane model + draft-everything/human-commits + draft-only-external
+ evidenced artifact were settled with the user via the OS-vision discussion and the three autonomy decisions:
*draft-everything/human-commits*, *draft-only on OLT/Xero (never auto-submit)*, *MCP-first connectors*).

---

## 1. Why

The agent runtime already does the hard part: tier-3 write tools never execute from the model — they are
**staged** as `action_proposals` rows and only run after a recorded human approval (`resolveProposalCore`,
RBAC-gated to reviewer/admin/owner). What is missing for the OS pillar is the *judgment layer* on top:

1. **No first-class risk classification.** Every staged write is treated the same. A reversible internal note
   and an irreversible IRS e-file land in the same one-size gate. We need the action routed to a **lane** by
   `reversibility × stakes × connector-reliability × confidence`.
2. **No standardized evidence.** `action_proposals.evidence` is free-form jsonb; OLT entries carry a `source`
   string; recon carries `matchReasons`. Nothing forces *every output field → its source* into one shape the
   reviewer can scan in 30 seconds. Verification must be **cheap**, or humans rubber-stamp.
3. **"Draft-only, never submit" is implicit, not enforced.** OLT/Xero writes happen to be disabled in v1
   (`ENABLED_WRITE_TOOLS`), so nothing irreversible runs today. That is an accident of phasing, not a rule.
   The pillar requires that for high-stakes external commits (e-file a return, post a journal) **Petal never
   performs the irreversible step even after approval** — the human does.

This spec adds the classifier, the artifact, and the never-auto-submit rule, **without restyling** the
existing approval card (the artifact renders as an additive, frozen-design section).

## 2. Scope

**In scope (one implementation plan):**
- A pure, deterministic risk classifier (`lib/agent/risk.ts`) + tool-level risk metadata.
- The `ReviewArtifact` / `EvidencedField` types and builders for the three real producers
  (research bucket, recon match, OLT field entries).
- Schema additions to `action_proposals` (risk + artifact + proposer identity columns) with RLS unchanged.
- Enforcement in `resolveProposalCore`: lane-gated approval, no self-approval on high-stakes, and the
  **never-auto-submit** rule for `irreversibleSubmit` tools (approval → `ready_to_submit`, not execution).
- Tests: classifier truth table, artifact builders, the no-self-approve + never-auto-submit invariants,
  and an RLS/round-trip integration test on the new columns.

**Out of scope (later plans, explicitly noted so coverage isn't assumed):**
- The full reviewer **UI card** redesign — this spec ships the data + a minimal additive render; the rich
  badge/expand/checkbox card is a follow-up under the frozen design system.
- Real OLT browser execution (stays deferred; `irreversibleSubmit` tools remain human-performed regardless).
- The scheduler / recurring runs and the MCP client (separate OS-pillar plans).

## 3. The risk model

A pure function classifies a proposed action into one of four **lanes**:

| Lane | Meaning | Who/what acts |
|------|---------|---------------|
| `auto` | reversible, no stakes (reads, research, drafts, internal notes) | executes immediately (already the tier-1 path) |
| `confirm` | reversible-ish internal write, low stakes (create task, internal status) | one-click human approval → Petal executes |
| `review` | external write, money/IRS/official-record stakes, or low confidence, or browser-driven | mandatory line-by-line review → reviewer+ approval → Petal executes (if not irreversibleSubmit) |
| `blocked` | prohibited autonomous action (reserved; nothing maps here yet) | never staged |

Lane is a deterministic function of four axes, each declared on the tool and/or derived from live signals:

```ts
// lib/agent/risk.ts (NEW)
export type RiskLane = "auto" | "confirm" | "review" | "blocked";
export type RiskLevel = "low" | "medium" | "high";
export type Stakes = "none" | "low" | "high";              // high = money / IRS / official record
export type ConnectorReliability = "internal" | "api" | "mcp" | "browser"; // browser = least reliable

export type RiskFactor = { name: string; level: RiskLevel; detail: string };

export type RiskAssessment = {
  lane: RiskLane;
  level: RiskLevel;
  reversible: boolean;
  stakes: Stakes;
  connector: ConnectorReliability;
  confidence: number | null;        // 0..1, from research bucket / recon matchScore; null = n/a
  humanMustSubmit: boolean;         // true for irreversible external commits (e-file, post journal)
  factors: RiskFactor[];            // the human-readable "why this lane"
};

export type RiskSignals = {
  confidence?: number | null;
  researchBucket?: "answer" | "hedge" | "coverage_gap" | "abstain";
  reconMismatches?: string[];
  validationErrors?: number;        // e.g. OLT efileErrors
};

export function classifyRisk(tool: ClassifiableTool, args: Record<string, unknown>, signals?: RiskSignals): RiskAssessment;
```

**Tool metadata** (additive fields on `AgentTool`; sensible defaults so unannotated tools keep working):

```ts
stakes?: Stakes;                    // default: tier<=2 -> "none", tier-3 internal -> "low", external -> "high"
reversible?: boolean;               // default: tier<=2 -> true,  tier-3 -> false
connector?: ConnectorReliability;   // default: "internal"; recon/xero -> "api", olt -> "browser"
irreversibleSubmit?: boolean;       // olt_submit_return, xero post -> humanMustSubmit
```

**Lane rules (deterministic, testable):**
1. `access === "read"` or `tier <= 2` → `auto`.
2. tier-3, `stakes === "low"`, reversible, `connector === "internal"` → `confirm`.
3. tier-3 with `stakes === "high"` OR `connector === "browser"` OR `irreversibleSubmit` → `review`.
4. **Confidence demotion:** `researchBucket ∈ {abstain, coverage_gap}`, or `reconMismatches.length > 0`, or
   `validationErrors > 0`, or `confidence < 0.6` → bump one lane toward `review` (a `confirm` becomes `review`).
5. `humanMustSubmit = !!tool.irreversibleSubmit`. These are **always** `review` and Petal never executes them.

`level` is a coarse rollup (`auto`→low, `confirm`→low/medium, `review`→medium/high) used only for the badge.

## 4. The evidenced review artifact

The standard shape attached to every `confirm`/`review` proposal so the reviewer verifies against evidence,
not by redoing the work. Each output **field links to its source**.

```ts
export type EvidenceSource = {
  kind: "document" | "extraction" | "bank_txn" | "ledger" | "research" | "intake" | "prior_return" | "message" | "manual";
  ref: string;          // id / locator (a doc id, txn id, citation ref, …)
  label: string;        // human label, e.g. "W-2 — Hartline Logistics"
  detail?: string;      // e.g. "box 1"
};
export type EvidencedField = {
  label: string;        // "Wages (1040 line 1a)"
  value: string;        // the staged value (decimal string for money — never float)
  source: EvidenceSource;
  confidence?: number | null;
  note?: string;
};
export type ReviewArtifact = {
  summary: string;                 // one line: what this action does
  fields: EvidencedField[];        // output field -> its source (the core of cheap verification)
  research?: {                     // when a tax position backs the action
    bucket: "answer" | "hedge" | "coverage_gap" | "abstain";
    citations: { label: string; ref: string }[];
    reviewNotes: string[];
    currencyNote?: string;
  };
  warnings: string[];              // mismatches, low-confidence flags, validation errors
};
```

**Builders** (one per real producer; each maps existing data into the artifact — no new data sources):
- `artifactFromOltPlan(plan: OltStagePlan): ReviewArtifact` — each `OltFieldEntry` → `EvidencedField`
  (`screen/field` → label, `value` → value, `source` provenance string → `EvidenceSource`).
- `artifactFromReconMatch(evidence): ReviewArtifact` — bank/ledger amounts → fields; `matchReasons` →
  source detail; `mismatches` → warnings; `matchScore` → confidence.
- `artifactFromResearch(answer: SourcedAnswer): ReviewArtifact` — for actions backed by a tax position
  (bucket, citations, reviewNotes, currencyNote).
- `artifactGeneric(tool, args): ReviewArtifact` — fallback for internal writes (summary + the args as fields,
  source `manual`), so every proposal has *some* artifact.

## 5. Schema changes

Additive columns on `action_proposals` (new migration `0033_risk_gate.sql`; RLS policy unchanged — still
`firm_id = current_firm_id()`):

```sql
alter table public.action_proposals
  add column if not exists risk_lane text,                    -- 'auto'|'confirm'|'review'|'blocked'
  add column if not exists risk_level text,                   -- 'low'|'medium'|'high'
  add column if not exists risk_factors jsonb,                -- RiskFactor[]
  add column if not exists human_must_submit boolean not null default false,
  add column if not exists review_artifact jsonb,             -- ReviewArtifact
  add column if not exists proposed_by_user_id text,          -- the actor who staged it (for no-self-approve)
  add column if not exists proposed_by_role text;             -- their role at stage time
-- new terminal/intermediate status value 'ready_to_submit' (for humanMustSubmit proposals); status stays text.
```

Drizzle `actionProposals` in `lib/db/schema.ts` gains the matching fields. `createProposal()` accepts and
stores `risk` + `reviewArtifact` + proposer identity.

## 6. Integration points (grounded in the real code)

1. **Classify at staging** — `lib/agent/runtime.ts` (~line 217, before `createProposal`): call
   `classifyRisk(tool, args, signals)` where `signals` is gathered from the run context (the research
   `bucket` already flows from `tax_research`; recon `mismatches`/`matchScore` from the recon evidence;
   OLT `efileErrors` from `olt_list_return_status`). Build the `ReviewArtifact` via the matching builder.
   Pass both to `createProposal`.
2. **Persist** — `lib/repository/agent.ts` `createProposal()`: write the new columns (redaction unchanged —
   `evidence`/artifact values are firm-internal but still pass through `redactValue` for cross-tenant safety).
3. **Enforce at approval** — `lib/agent/approve.ts` `resolveProposalCore()`:
   - `review` lane → require `canApprove(ctx.role)` (already true) **and** `ctx.actorId !== proposed_by_user_id`
     (no self-approval on the high-stakes lane).
   - `human_must_submit` proposals → on approve, **do not** `runTool`. Set `status = 'ready_to_submit'`,
     stamp the artifact as reviewed, audit `proposal.cleared_for_human_submit`. Petal never executes the
     irreversible external commit; a separate, explicit **human-performed** submit action does (and is audited
     as human-performed). This is the draft-only rule, enforced.
   - all other approved lanes → execute as today (`runTool(..., { allowWrite: true })`).
4. **Surface — BUILT, inside Tasks.** Approvals are NOT a separate page (per user direction: "approvals should
   be in tasks — that's the whole point"; staged agent actions are work the human acts on, so they belong in
   the unified work surface). `components/os/approval-card.tsx` (`ProposalCard`) renders a staged proposal with
   the risk badge, the source-linked evidence list, risk factors, and approve/reject; for `humanMustSubmit` it
   shows the "ready to submit — you perform it" affordance. Pending proposals flow through the firm-data seam
   (`loadFirmData` → `FirmData.proposals`, PII decrypted server-side) and render as a "Needs your approval"
   section at the top of `/os/tasks` (the empty state already anticipated this: "New tasks and Petal approvals
   land here"). `resolveProposalAction` revalidates `/os/tasks`. Browser-verified populated (risk chip +
   field→source evidence + actions). No standalone /os/approvals route.

## 7. Honest degradation

- If signal gathering fails (research errored, recon unavailable), classify on tool metadata alone and add a
  `RiskFactor{ name:"signals_unavailable", level:"medium" }` — **never silently downgrade** risk.
- If the artifact builder can't resolve a source, the field's `source.kind = "manual"` with a `note`, and a
  `warning` is added — the gap is shown, not hidden.
- A proposal with no artifact is impossible (the generic builder always produces one).

## 8. Testing

- **Classifier truth table** (`tests/agent/risk.test.ts`): each lane rule + the confidence-demotion bump +
  `humanMustSubmit` for the two irreversible tools; assert deterministic output.
- **Artifact builders** (`tests/agent/review-artifact.test.ts`): OLT plan, recon match, research answer →
  expected fields/warnings; every field has a `source`.
- **Approval invariants** (extend `tests/agent/*`): (a) preparer cannot self-approve a `review` proposal even
  if their role could otherwise approve; (b) approving a `human_must_submit` proposal yields
  `ready_to_submit` and does **not** call the tool runner; (c) a `confirm` proposal still executes on approve.
- **Schema round-trip / RLS** (`tests/repository/agent-risk.test.ts`): the new columns persist + read back
  RLS-scoped; firm B never sees firm A's proposals (regression guard on the added columns).

## 9. Self-review

- **Coverage:** every clause of the AGENTIC-OS goal paragraph that this sub-project owns — risk gate,
  draft-everything/human-commits, draft-only-external/never-auto-submit, evidenced artifact — maps to a
  section (§3, §6.3, §6.3, §4). The scheduler / MCP client are explicitly deferred (§2).
- **Frozen design:** §6.4 keeps changes additive; no component restyle.
- **No mock:** all signals come from real producers (research engine, recon evidence, OLT plan); the generic
  builder uses the action's own args, not fixtures.
- **Ambiguity resolved:** "high-stakes" is concretely `stakes==="high"` (money/IRS/official record) declared
  per tool; "never auto-submit" is concretely the `irreversibleSubmit` flag → `ready_to_submit` status.
