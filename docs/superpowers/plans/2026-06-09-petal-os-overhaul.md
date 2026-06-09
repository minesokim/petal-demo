# Petal OS Mockup Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/os` mockup around one canonical fixture world (June 25, 2026 · solo EA Antonio + admin Elena) so every number derives at render time, one status vocabulary rules everywhere, and the new surfaces (Returns board, Review mode, Skills + trust tiers, Notices, Positions, Activity log, ROI strip, tie-out page) exist — with zero visual-system changes.

**Architecture:** A new `lib/fixtures/` module set (`vocab.ts` → enums/meta, `firm.ts` → the world, `derive.ts` → every displayed aggregate + tie-out checks) replaces `os-entities/os-triage/os-runs/os-agents/os-news/os-close/os-chats/os-files`. Pages import ONLY from `lib/fixtures/*` (+ `os-api.ts` for MCP, `os-integrations.ts` edited in place). Shared UI lands in `components/os/` before any page work so parallel page tasks never touch shared files.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4, existing `.petal-os` theme tokens (`app/os/os-theme.css`), Hugeicons via `components/os/icon.tsx`, motion/react. NO new fonts/colors. Design rules: `docs/DESIGN.md` (LOCKED — read before any visual decision).

**Test strategy (TDD-adapted):** no JS test runner exists in this repo; the acceptance harness is `scripts/tieout.ts` (run `npx -y tsx scripts/tieout.ts`, exits 1 on any mismatch) + `/os/debug/tie-out` page + `npx tsc --noEmit`. The tie-out checks are written WITH the canon (Task 2) and stay green through every page task.

---

## Phase 0 — Baseline

### Task 0: Commit in-flight WIP as baseline

**Files:** none created.

- [ ] **Step 0.1:** `cd /Users/davidkim/Desktop/docket-v4 && git add -A && git commit -m "wip: extract doc-gallery/task-detail/thread-conversation components (pre-overhaul baseline)"`
- [ ] **Step 0.2:** `npx tsc --noEmit` — record pre-existing errors (do not fix legacy `/dashboard` errors; only `/os` + `lib/fixtures` must be clean at the end).

---

## Phase 1 — Canon (the keystone; sequential)

### Task 1: `lib/fixtures/vocab.ts` — one vocabulary

**Files:** Create `lib/fixtures/vocab.ts`. Internal imports between fixture files must be RELATIVE (`./vocab`) so `npx tsx scripts/tieout.ts` runs without the `@/` alias.

```ts
// Petal OS — single status/stage/category vocabulary. Used identically on every surface.

// ── Demo clock ─────────────────────────────────────────────
export const DEMO_DATE = new Date(2026, 5, 25); // Thursday, June 25, 2026
export const DEMO_DATE_LABEL = "Thursday, June 25, 2026";
export function daysUntil(iso: string): number {
  const d = new Date(iso + "T00:00:00");
  return Math.round((d.getTime() - DEMO_DATE.getTime()) / 86_400_000);
}
export function fmtDate(iso: string): string {       // "Sep 15"
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
export function fmtDateYear(iso: string): string {   // "Sep 15, 2026"
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Task status (THE vocabulary — no other status words anywhere) ──
export type TaskStatus =
  | "needs_decision" | "ready_to_approve" | "running" | "scheduled"
  | "waiting_client" | "waiting_third_party" | "done";
export const TASK_STATUS_ORDER: TaskStatus[] = [
  "needs_decision", "ready_to_approve", "running", "scheduled",
  "waiting_client", "waiting_third_party", "done",
];
export const taskStatusMeta: Record<TaskStatus, { label: string; dot: string; verb: string | null }> = {
  needs_decision:      { label: "Needs decision",         dot: "bg-red-500",                 verb: "Decide" },
  ready_to_approve:    { label: "Ready to approve",       dot: "bg-amber-500",               verb: "Approve" },
  running:             { label: "Running",                dot: "bg-blue-500",                verb: "View run" },
  scheduled:           { label: "Scheduled",              dot: "bg-[var(--os-ink-subtle)]",  verb: null },
  waiting_client:      { label: "Waiting on client",      dot: "bg-slate-400",               verb: "Nudge" },
  waiting_third_party: { label: "Waiting on third party", dot: "bg-slate-400",               verb: null },
  done:                { label: "Done",                   dot: "bg-emerald-500",             verb: null },
};
/** "Needs you" — THE number. Today headline, Tasks badge, Review entry all call this. */
export const NEEDS_YOU_STATUSES: TaskStatus[] = ["needs_decision", "ready_to_approve"];

// ── Engagement stages (7 — extensions are a deadline attribute, not a stage) ──
export type Stage =
  | "collecting_docs" | "ready_to_prep" | "in_preparation" | "in_review"
  | "pay_and_sign" | "e_filed" | "accepted";
export const STAGE_ORDER: Stage[] = [
  "collecting_docs", "ready_to_prep", "in_preparation", "in_review",
  "pay_and_sign", "e_filed", "accepted",
];
export const stageMeta: Record<Stage, { label: string; dot: string }> = {
  collecting_docs: { label: "Collecting Docs", dot: "bg-amber-500" },
  ready_to_prep:   { label: "Ready to Prep",   dot: "bg-cyan-500" },
  in_preparation:  { label: "In Preparation",  dot: "bg-blue-500" },
  in_review:       { label: "In Review",       dot: "bg-purple-500" },
  pay_and_sign:    { label: "Pay & Sign",      dot: "bg-orange-500" },
  e_filed:         { label: "E-filed",         dot: "bg-emerald-500" },
  accepted:        { label: "Accepted",        dot: "bg-emerald-600" },
};
export const ACTIVE_STAGES: Stage[] = STAGE_ORDER.filter(s => s !== "e_filed" && s !== "accepted");

// ── Skill categories ↔ the six petal colors (THE legend) ──
export type SkillCategory =
  | "prep_filing" | "signatures_chase" | "books" | "meetings_calls" | "briefs" | "estimates_deadlines";
export const skillCategoryMeta: Record<SkillCategory, { label: string; petal: string; dot: string }> = {
  prep_filing:          { label: "Tax prep & filing",     petal: "/petals/purplepetal.png", dot: "bg-violet-500" },
  signatures_chase:     { label: "Signatures & chase",    petal: "/petals/orangepetal.png", dot: "bg-orange-500" },
  books:                { label: "Books",                 petal: "/petals/cyanpetal.png",   dot: "bg-cyan-500" },
  meetings_calls:       { label: "Meetings & calls",      petal: "/petals/yellowpetal.png", dot: "bg-yellow-500" },
  briefs:               { label: "Briefs",                petal: "/petals/redpetal.png",    dot: "bg-rose-500" },
  estimates_deadlines:  { label: "Estimates & deadlines", petal: "/petals/bluepetal.png",   dot: "bg-blue-500" },
};
export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
  "prep_filing", "signatures_chase", "books", "meetings_calls", "briefs", "estimates_deadlines",
];

// ── Trust tiers (per skill, 4-step dial) ──
export type TrustTier = 0 | 1 | 2 | 3;
export const trustTierMeta: Record<TrustTier, { code: string; label: string; blurb: string }> = {
  0: { code: "T0", label: "Suggest",          blurb: "Petal proposes only." },
  1: { code: "T1", label: "Draft",            blurb: "Petal prepares everything; you approve each send." },
  2: { code: "T2", label: "Act after window", blurb: "Petal acts after 24h unless you stop it." },
  3: { code: "T3", label: "Act & report",     blurb: "Petal acts and logs." },
};

// ── Expected-doc status ──
export type ExpectedDocStatus = "have" | "requested" | "needs_review" | "na";
export const expectedDocMeta: Record<ExpectedDocStatus, { label: string; dot: string }> = {
  have:         { label: "Have",         dot: "bg-emerald-500" },
  needs_review: { label: "Needs review", dot: "bg-amber-500" },
  requested:    { label: "Requested",    dot: "bg-[var(--os-ink-subtle)]" },
  na:           { label: "N/A",          dot: "bg-[var(--os-border-strong)]" },
};

// ── Client health (ONE function's vocabulary — Today + Practice share it) ──
export type Health = "at_risk" | "watch" | "healthy";
export const healthMeta: Record<Health, { label: string; dot: string; text: string }> = {
  at_risk: { label: "At risk", dot: "bg-red-500",     text: "text-[var(--os-danger)]" },
  watch:   { label: "Watch",   dot: "bg-amber-500",   text: "text-[var(--os-warning)]" },
  healthy: { label: "Healthy", dot: "bg-emerald-500", text: "text-[var(--os-success)]" },
};

// ── ROI: minutes returned per activity kind (drives "~X hrs returned") ──
export type ActivityKind =
  | "draft" | "send" | "doc_collected" | "extraction" | "reconciliation"
  | "efile" | "notice_draft" | "brief" | "transcript_check" | "approval" | "edit";
export const MINUTES_RETURNED: Record<ActivityKind, number> = {
  draft: 8, send: 3, doc_collected: 5, extraction: 9, reconciliation: 35,
  efile: 25, notice_draft: 45, brief: 15, transcript_check: 4, approval: 0, edit: 0,
};
```

- [ ] **Step 1.1:** Write the file exactly as above.
- [ ] **Step 1.2:** `npx tsc --noEmit` (no new errors).
- [ ] **Step 1.3:** Commit: `feat(os): canonical vocabulary — statuses, stages, petal legend, trust tiers`.

### Task 2: `lib/fixtures/firm.ts` + `lib/fixtures/derive.ts` + tie-out harness

**Files:**
- Create `lib/fixtures/firm.ts` (the world — every entity below)
- Create `lib/fixtures/derive.ts` (every displayed aggregate + `tieOutChecks()`)
- Create `scripts/tieout.ts`
- Create `app/os/debug/tie-out/page.tsx`

**The canonical world (LOCKED — page tasks must not invent data):**

**Firm:** `FIRM_PROFILE = { name: "Vazant EA", owner: { id: "u-antonio", name: "Antonio Vazquez", credential: "EA" }, admin: { id: "u-elena", name: "Elena Reyes", role: "Part-time admin" } }`. **No other staff exist anywhere.** Every authored message/approval is Antonio or Elena. (Kill: Marcus Lee, James Okafor/Chen, Maria Santos, "Elena Martinez".)

**Households (11):** h-chen Chen Household · h-sharma Priya Sharma · h-rodriguez Rodriguez Family · h-williams DeShawn Williams · h-park Park Family Dental · h-nakamura Linda Nakamura · h-fuentes Fuentes Transport · h-sandoval Sandoval Plumbing · h-obrien Karen O'Brien · h-mendez Mendez Auto · **h-russo Anthony Russo (NEW — the ex-ghost; Standard tier, since 2024, individual w/ brokerage activity)**. Keep existing people/contact data; move the Russo 1099-B document + capital-gains story to h-russo. Add `has8821: boolean` per household — true for 9 of 11 (false: h-obrien, h-williams) → drives "8821 on file for 9 clients" + "watching transcripts for 9 clients".

**Entity links (relationship graph):** entities carry `owners?: { personId: string; pct: number }[]` and engagements carry `k1FlowsTo?: engagementId`. Locked examples: David Park 100% of Park Family Dental (1120S→K-1→park 1040); Marcus Chen 100% Golden Dragon LLC; Marcus & Lin 50/50 Riverside Rental LLC (1065); Carlos & Elena Mendez 50/50 Mendez Auto Repair (1065→K-1→mendez 1040).

**Engagements (19, taxYear 2025).** Statutory deadlines: 1040 `2026-04-15`; 1120S/1065 `2026-03-16`. Every non-accepted engagement has `extendedDeadline` (1040 `2026-10-15`, 1120S/1065 `2026-09-15`) — it is June 25; extension season. Table (id · form · stage · fee · docs have/expected · blockedBy?):

| id | household | form | stage | fee | docs | notes |
|---|---|---|---|---|---|---|
| en-chen-1040 | h-chen | 1040 | in_preparation | 500 | 12/12 | wage variance flag (−40%) |
| en-golden | h-chen | 1120S | in_preparation | 900 | 18/20 | 2 requested |
| en-riverside | h-chen | 1065 | collecting_docs | 600 | 5/9 | |
| en-sharma-1040 | h-sharma | 1040 | collecting_docs | 350 | 3/7 | |
| en-sharma-c | h-sharma | Sch C | collecting_docs | 250 | 2/5 | |
| en-rod-1040 | h-rodriguez | 1040 | accepted | 500 | 13/13 | filed Apr 9, refund $2,840 |
| en-rod-rental | h-rodriguez | Sch E | accepted | 250 | 4/4 | |
| en-williams | h-williams | 1040 | collecting_docs | 150 | 1/6 | blockedBy "W-2 — DeShawn (employer: Hartline Logistics)" |
| en-parkdental | h-park | 1120S | in_preparation | 1400 | 18/20 | books close dependency |
| en-park-1040 | h-park | 1040 | ready_to_prep | 500 | 14/14 | blockedBy "K-1 — Park Family Dental 1120S" |
| en-nak-1040 | h-nakamura | 1040 | accepted | 350 | 7/7 | e-filed **Jun 23**, accepted Jun 24 |
| en-nak-etsy | h-nakamura | Sch C | accepted | 200 | 4/4 | e-filed **Jun 23**, accepted Jun 24 |
| en-fuentes-s | h-fuentes | 1120S | pay_and_sign | 1200 | 15/15 | blockedBy "8879 signature — Roberto (viewed Jun 23, unsigned 2 days)" |
| en-fuentes-1040 | h-fuentes | 1040 | in_review | 500 | 11/11 | |
| en-sandoval | h-sandoval | 1040 | ready_to_prep | 600 | 9/9 | |
| en-obrien | h-obrien | 1040 | accepted | 150 | 4/4 | e-filed **Jun 23**, accepted Jun 24, refund $610 |
| en-mendez-p | h-mendez | 1065 | in_preparation | 1100 | 13/14 | K-1 allocation running |
| en-mendez-1040 | h-mendez | 1040 | ready_to_prep | 500 | 9/9 | blockedBy "K-1 — Mendez Auto 1065" |
| en-russo | h-russo | 1040 | in_preparation | 450 | 8/9 | blockedBy "Cost basis — 7 of 23 lots (Schwab 1099-B)" |

Park household rollup MUST equal the locked header: Stage (representative = least-progressed active = Ready to Prep) · Docs **32/34** · Fee **$1,900** · Balance **$1,140** (invoiced 1900 − 40% deposit 760).

**ExpectedDoc:** per engagement, `{ id, engagementId, type, source, status: ExpectedDocStatus, priorYearValue?, fields?: { label, value, confidence, flag? }[], receivedVia?, when? }` — derived-from-prior-year framing ("Based on the 2024 return"). Seed full checklists for en-parkdental (20), en-park-1040 (14), en-chen-1040 (12), en-williams (6), en-sharma-1040 (7), en-russo (9); for the other engagements seed the *missing/needs-review* docs individually plus a `bulkHave: n` count field so docs math ties without 200 rows. Needs-review exemplar: Chen W-2 — Golden Dragon LLC, Box 1 $58,000 (confidence 0.99) but "Box 12 — code DD" at **0.91 < 0.95 → flagged**, plus priorYearValue $96,400 → variance rule line "wages $58,000 vs $96,400 prior year → −40% variance flag".

**Skills (11)** `{ id, name, category, trust: TrustTier, description, trigger, steps[], channels[], tone, escalation, variants?: [{ name, householdId, delta }] }`:
Doc Chase (signatures_chase, **T1**, graduation: `{ approvedNoEditStreak: 12, prompt: "You've approved 12 Doc Chase drafts without edits — promote Doc Chase to send automatically?" }`, variant: "Doc Chase — Chen Household variant: SMS only, Mandarin greeting, weekly cadence") · Notice Response (prep_filing, T1) · Pre-call Brief (meetings_calls, **T3**) · Estimate Reminders (estimates_deadlines, T1) · Signature Follow-up (signatures_chase, T1) · Variance Review (prep_filing, T1) · Books-to-Tax Close (books, T1) · 1099 Batch (prep_filing, T0 — off-season) · Invoice Chase (signatures_chase, T1) · Transcript Watch (prep_filing, **T3**) · Deadline/Extension Filing (estimates_deadlines, T1).

**SkillRuns (12)** `{ id, skillId, engagementId?, householdId, startedAt, status: "running"|"done", inputs: { ref, page? }[], outputs: string[], extracted?: { label, value, confidence, flag? }[], rule?: string, confidence?: number, approvedBy?: "Antonio Vazquez", approvedAt?, trustTierAtRun: TrustTier, summary, reasoning }` — the provenance backbone. Locked roster: run-w2-chen (extraction Jun 23) · run-variance-chen (variance rule, Jun 23) · run-recon-park (Books reconciliation, done, 142/145 matched, May books, approved Jun 22) · run-cp2000 (Notice Response draft, Jun 19) · run-cp14-russo (Notice Response, done Jun 11) · run-transcript-rod (Transcript Watch hit, Jun 24, T3) · run-efile-nak / run-efile-etsy / run-efile-obrien (Jun 23, approvedBy Antonio, approvedAt "Jun 23") · run-brief-fuentes (Pre-call Brief, running, T3) · run-1065-mendez (running, K-1 allocation) · run-est-q2 (Estimate Reminders follow-up draft, Jun 22).

**Tasks (19)** `{ id, engagementId?, householdId, status: TaskStatus, kind, title, why, proposedActions?: { key: "A"|"B"|"C", label, detail }[], recommendedAction?: "A"|"B"|"C", recommendation?, draftText?, skillId, runId?, deadline?, feeContext?, flagged?: boolean, estimatedMin }`.
**needs_decision (5):** t-russo-basis (THE exemplar — title "Capital gains: 7 of 23 lots missing basis"; A "Request statements from client (drafted)" / B "Broker lookup" / C "Proceed with $0 basis (adds ~$3.1k tax)"; recommends **A**) · t-cp2000-rod (links to notice n-cp2000, does NOT own it) · t-park-1098 (mortgage interest 3× — A confirm refinance w/ David / B request closing disclosure / C cap at $750k acquisition debt; recommends A) · t-nak-1040x (1040-X for late $420 1099-DIV, +$63 tax — A file now / B wait for IRS notice; recommends A) · t-chen-wages (A accept Marcus's email confirmation + log to memory / B schedule a call; recommends A).
**ready_to_approve (7):** t-williams-chase (chase #4 — escalate to call) · t-sharma-chase (4 docs reminder) · t-fuentes-8879 (signature nudge) · t-park-w9 (3 contractor W-9 requests, $11,400 paid) · t-est-q2 (Q2 estimate follow-up — Sandoval + Park Dental missed Jun 15) · t-obrien-refund (refund-status reply — "Petal can answer") · t-park-books (categorize 3 expenses from David's email: $2,800 sterilizer→Equipment, $910 team dinner→Meals 50%, $500 renewal→Software).
**running (2):** t-mendez-1065 · t-brief-fuentes. **scheduled (2):** t-est-q3 (computes Sep 1 for Sep 15) · t-ext-watch (deadline check on extended returns, weekly). **waiting_client (2):** t-golden-docs (2 docs, chase #2 sent Jun 20) · t-riverside-docs (4 docs). **waiting_third_party (1):** t-mendez-k1 ("Waiting on K-1 — Mendez Auto 1065"). **done (4 receipts):** t-efiled-3 (3 returns e-filed clean Jun 23 — pre-approved, runIds) · t-recon-park (books run receipt) · t-transcript-rod (watch hit → links notice) · t-cp14-russo.
**Derived: needsYou = 12.** Tasks badge, Today headline, Review mode count — all 12.

**Threads (8)** — add `channel: "call"` to the union; `{ ..., waitingOnFirmSince?, attachments?, extraction?: { runId, summary: "Petal extracted W-2 — Golden Dragon LLC → filed to Chen 2025 · 1 field needs review", docId }, petalCanAnswer?: { draft } , transcript?: { lines: {speaker,text}[], followUps: string[] } }`. Locked: th-chen (email — Marcus attaches W-2 → extraction moment; aging "client waiting 2 days" since Jun 23) · th-park-call (NEW, channel call — "Park books review call · Jun 24, 11:00 AM", transcript + 2 extracted follow-ups linking t-park-books) · th-obrien (NEW portal — "Where's my refund?" → petalCanAnswer with drafted reply citing accepted Jun 24 + $610 + IRS "Where's My Refund" timing) · th-sharma (portal, Doc Chase draft) · th-park-q4→books · th-williams (sms) · th-fuentes (bonus-depreciation question) · th-nakamura (thanks, done). All firm authors: Antonio or Elena only. June dates.

**Invoices:** keep `os-billing.ts` derivation pattern but move into firm.ts importing engagements (40% deposit; per-household). Status strings move to June world: overdue = h-williams "Issued Jun 10 · 15 days late"; balance_due due "On acceptance"; Park = in_progress, balance $1,140. KPI rollups derived in derive.ts.

**Notices (2):** n-cp2000 `{ type: "CP2000", householdId: h-rodriguez, taxYear: 2024, received: "2026-06-18", respondBy: "2026-07-18", status: "response_drafted", amount: "+$1,210 proposed", draftedResponse (full letter text — position: interest reported on Schedule B, IRS matched wrong year), runId: run-cp2000, linkedTranscript: run-transcript-rod }` · n-cp14-russo `{ type: "CP14", taxYear: 2025, received: "2026-06-08", respondBy: "2026-06-29", status: "resolved", resolvedBy: "Antonio Vazquez", note: balance paid online Jun 12 }`.

**Positions (2):** p-park-ho `{ engagementId: en-park-1040, issue: "Home office + vehicle mixed-use", authorityLevel: "Substantial authority", confidence: 0.74, documentation: ["Home-office floor plan + sq ft worksheet", "Mileage log Jan–Dec 2025"], status: "open" }` · p-chen-qbi `{ engagementId: en-chen-1040, issue: "QBI deduction — SSTB threshold", authorityLevel: "Settled", confidence: 0.96, documentation: ["§199A worksheet"], status: "resolved", resolvedBy: "Antonio Vazquez", resolvedOn: "2026-06-20" }`.

**Workpaper (1):** wp-parkdental — rows `{ line: "Gross receipts $612,400" → source "POS export 2025.csv p.2" + run-recon-park; "Officer compensation $145,000" → "Gusto W-2 summary p.1"; "Depreciation $42,100" → "Fixed-asset schedule p.3"; "Meals (50%) $4,210" → run-recon-park }`. UI tagline (exact copy): "Trace any line on the return back to the run, the workpaper, and the source document."

**Activity events (~45, week of Jun 22–25)** `{ id, at, kind: ActivityKind, label, householdId?, runId?, actor: "Petal" | "Antonio Vazquez" }` — seeds the ROI strip + `/os/activity`. Must yield (derived, not hardcoded): **41 Petal actions · 9 documents collected · 3 returns filed · 2 notices drafted** and MINUTES_RETURNED sum ≈ 390 min → "~6.5 hrs returned".

**Brief items (6)** incl. (exact copy): win "Petal filed 3 returns clean — pre-approved by you Jun 23" (provenance → t-efiled-3) · transcript-watch "Transcript change detected for Rodriguez — matches the CP2000 already in Notices." (→ /os/notices) · no-action "2025 safe-harbor amounts unchanged — your estimate math needs no action." · alert "CP2000s for tax year 2024 are landing — 1 received, response drafted." · deadline "Q3 estimates due Sep 15 — vouchers compute Sep 1 for 9 clients." · info "5 business returns on the Sep 15 extension track — all in motion."

**Recent chats (6)** `{ id, title, when, artifact?: { label, href } }` — c-cp2000 → `{ "CP2000 response — Rodriguez", href: "/os/notices/n-cp2000" }`; c-recon → `{ "Books run — Park Family Dental", href: "/os/books" }`; c-russo → /os/tasks?task=t-russo-basis; others link to client records. Chats and tasks reference the SAME objects.

**`lib/fixtures/derive.ts` (signatures locked — pages call these, never recompute):**
```ts
needsYouCount(): number                       // tasks in NEEDS_YOU_STATUSES — THE number (12)
needsYouTasks(): Task[]
docsOf(engagementId): { expected, have, requested, needsReview, na }
docsOfHousehold(hid): same shape (sums)       // Park = { expected: 34, have: 32, ... }
householdStage(hid): Stage                    // least-progressed active engagement
householdFee(hid): number                     // Park = 1900
invoiceOf(hid): Invoice; invoices(): Invoice[]
billingKpis(): { outstandingTotal, outstandingCount, overdueTotal, overdueCount, collectedTotal, billedTotal }
clientHealth(hid): { health: Health; reason: string; nextAction?: { label: string; href: string } }
  // at_risk: h-williams ("Missing 5 docs — chase #3 sent Tue · Escalate to call?"), h-russo
  // watch: h-park (open position + 1098 anomaly), h-chen (wage variance + 2 docs), h-sharma (4 docs, first year)
  // healthy: the rest. Rule-based on docs gaps + open needs_decision + open notice + open position. ONE function.
stageCounts(): Record<Stage, number>
feesInPipeline(): number                      // fees of active (non-accepted/e_filed) engagements
feesBlockedByDocs(): number                   // active engagements with requested docs > 0
roiWeek(): { actions, docsCollected, returnsFiled, noticesDrafted, hoursReturned }   // from activity × MINUTES_RETURNED
atRiskHouseholds(): { householdId, ...clientHealth }[]   // health === at_risk | watch
booksClients(): Household[]                   // h-park, h-fuentes, h-sandoval (hasBooks flag)
openNotices(): Notice[]; noticeCountdown(n): number      // daysUntil(respondBy)
runsOfSkill(skillId): SkillRun[]; runById(id): SkillRun
activityFeed(filter?): ActivityEvent[]
tieOutChecks(): { surface: string; label: string; displayed: string; derivation: string; ok: boolean }[]
```
`tieOutChecks()` asserts at minimum: needs-you (Today = Tasks badge = Review = 12) · Park docs 32/34 across chat/Documents/header · Park fee 1900 / balance 1140 · 11 households everywhere (clients list = billing invoices = health function coverage) · at-risk set identical Today vs Practice · stage counts sum = engagement count · ROI numbers match activity · brief "filed 3 returns" = e-filed-Jun-23 count = 3 · "9 clients" (8821) = has8821 count · books module clients = 3 · every Task.runId / Notice.runId / Workpaper row runId resolves · every task has exactly one verb (from vocab) · no engagement past statutory deadline without extendedDeadline.

**`scripts/tieout.ts`:**
```ts
import { tieOutChecks } from "../lib/fixtures/derive";
const checks = tieOutChecks();
const bad = checks.filter(c => !c.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} · ${c.surface} · ${c.label}: ${c.displayed} ⇐ ${c.derivation}`);
if (bad.length) { console.error(`\n${bad.length} mismatch(es)`); process.exit(1); }
console.log(`\nAll ${checks.length} checks tie out.`);
```

**`app/os/debug/tie-out/page.tsx`:** plain table (design tokens, no nav entry) rendering `tieOutChecks()` rows — Surface · Label · Displayed · Derivation · PASS/FAIL chip; red banner if any FAIL.

- [ ] **Step 2.1:** Write `firm.ts` (entities in the order above; JSDoc header explaining canon rules).
- [ ] **Step 2.2:** Write `derive.ts` incl. `tieOutChecks()`.
- [ ] **Step 2.3:** Write `scripts/tieout.ts`; run `npx -y tsx scripts/tieout.ts` → expect ALL PASS (fix data, not checks).
- [ ] **Step 2.4:** Write the debug page; `npx tsc --noEmit`.
- [ ] **Step 2.5:** Commit: `feat(os): canonical fixture world + derivations + tie-out harness`.

### Task 3: Shared UI primitives (pre-built so page tasks never touch shared files)

**Files:** Modify `components/os/primitives.tsx` (append; keep existing exports until sweep). Create `components/os/provenance.tsx`, `components/os/roi-strip.tsx`. Modify `components/os/icon.tsx` (add only: `play`, `pause`, `phone`, `alert`, `calendar`, `building`, `link`, `keyboard`, `export` glyphs from `@hugeicons/core-free-icons`).

New exports (contracts locked):
```ts
// primitives.tsx additions
export function StatusPill({ status }: { status: TaskStatus })            // dot + taskStatusMeta label, monochrome text
export function StageTag({ stage }: { stage: Stage })                     // dot + label
export function DeadlineChip({ iso, extended }: { iso: string; extended?: boolean })
  // label: `${extended ? "Ext " : ""}${fmtDate(iso)}`; color by daysUntil: <14 danger, <45 warning, else muted
export function SkillPetal({ category, size = 16 }: { category: SkillCategory; size?: number })
  // <img src={skillCategoryMeta[category].petal} mix-blend-multiply> — replaces AgentAvatar for the AI layer
export function PetalLegend()                                              // 6 rows: petal + category label; used on Tasks/Skills/Settings
export function TrustDial({ tier, onChange? }: { tier: TrustTier; onChange?: (t: TrustTier) => void })
  // 4-step segmented dial, T0–T3, active = near-black; read-only without onChange
// provenance.tsx
export function ProvenancePanel({ runId, dense }: { runId: string; dense?: boolean })
  // "Sources & reasoning" disclosure: inputs (doc + page refs) · extracted fields w/ confidence (flag <95% amber)
  // · rule line · "Run by {skill} · {startedAt} · {trustTierMeta[tier].code} {label}" · "Approved by {approvedBy} · {approvedAt}"
  // · footer link "View in activity log" → /os/activity?run={runId}
// roi-strip.tsx
export function RoiStrip()  // "This week: {actions} actions · {docsCollected} documents collected · {returnsFiled} returns filed ·
                            //  {noticesDrafted} notices drafted · ~{hoursReturned} hrs returned" + "Weekly digest" link → digest preview modal (email-styled)
```
Rule (repeat in every page task): **every Petal-produced artifact rendered without `ProvenancePanel` is a bug.**

- [ ] **Step 3.1:** Implement; `npx tsc --noEmit`.
- [ ] **Step 3.2:** Commit: `feat(os): shared status/provenance/ROI primitives + petal legend`.

### Task 4: Nav + layout + sidebar chat artifacts + review-mode escape hatch

**Files:** Modify `app/os/layout.tsx`, `components/os/sidebar-chat.tsx`, `lib/os-api.ts` (repoint counts to fixtures).

- [ ] **Step 4.1:** Final nav exactly: Today `/os/today` · Tasks `/os/tasks` (badge `needsYouCount()`) · Inbox `/os/inbox` — divider — Records group: **Returns `/os/returns`** · Clients · Documents · **Notices `/os/notices`** · Billing — Petal AI group: **Skills `/os/skills`** — divider — **Practice `/os/practice`** · Settings. Remove: Agents, Knowledge, Reports entries. Records group `defaultOpen` so Returns/Notices are visible.
- [ ] **Step 4.2:** In `OsLayout`, before the shell: `if (pathname.startsWith("/os/review") || pathname.startsWith("/os/debug")) return <div className="petal-os h-screen w-full overflow-hidden bg-[var(--os-shell)] text-[13px]">{children}</div>;` (Review mode is full-screen).
- [ ] **Step 4.3:** `sidebar-chat.tsx`: switch to fixtures `recentChats`; when a chat has `artifact`, row click → `artifact.href` and show a muted `→ {artifact.label}` second line.
- [ ] **Step 4.4:** `os-api.ts`: import counts from `../fixtures/firm` equivalents (tasks/households/entities/engagements/people lengths); copy "Agents & runs" resource → "Skills & runs".
- [ ] **Step 4.5:** `npx tsc --noEmit` (pages still importing old libs keep compiling — old libs stay until Phase 3 sweep); commit `feat(os): final nav, review-mode chrome escape, sidebar chat artifacts`.

---

## Phase 2 — Surfaces (parallel; each task owns ONLY its listed files; import canon + shared primitives; NEVER edit `lib/fixtures/*`, `primitives.tsx`, `provenance.tsx`, `icon.tsx`, `layout.tsx`)

Common acceptance for every task in this phase: `npx tsc --noEmit` clean for owned files · zero hard-coded counts (grep your file for numerals in copy — all from `derive.ts`) · status words only from `taskStatusMeta` · one assistant "Petal", no agent names ("1040 Drafter", "Reconciler", "Notetaker", "Meeting Prep", "Estimated Payments" must not appear) · accountant register, sentence case, no AI hype ("magic", "supercharge", "agents") · no "without hiring"/"fully autonomous" · Petal artifacts carry `ProvenancePanel` · keyboard focus visible · empty states are invitations ("No notices. Petal is watching transcripts for 9 clients.") · responsive at 390px.

### Task 5: Today — `app/os/today/page.tsx` (rewrite)
Banner image REMOVED → `<RoiStrip/>` at top. Headline: "Good morning, Antonio — Thursday, June 25." + sentence with `needsYouCount()` and a primary button **"Review 12 items"** → `/os/review` (count derived). Sections: Today's brief (6 fixture items; tone dots; win item links provenance; transcript-watch item present; no-action item kept) · At-risk module (from `atRiskHouseholds()`; each card shows `clientHealth().reason` + inline `nextAction` link, e.g. "Missing 5 docs — chase #3 sent Tue · Escalate to call?") · "Petal filed 3 returns clean — pre-approved by you Jun 23" receipt w/ ProvenancePanel · Books close widget rendered ONLY because `booksClients().length > 0`, links `/os/books`, labeled "May 2026 books — wrapping up" · Today's calls (Fuentes 1120S review, brief by Pre-call Brief w/ provenance).

### Task 6: Tasks — `app/os/tasks/page.tsx` + `components/os/task-detail.tsx` (rewrite both)
Unified vocab everywhere (StatusPill). NO "Flags" tab — single list grouped by `TASK_STATUS_ORDER`; "Flagged" is a filter chip + small flag icon on flagged tasks. Toolbar: sort (Deadline / Client / Status) · "Group by client" toggle · filter chips (Flagged · Blocked) · **"Approve all ({n})"** bulk action over `ready_to_approve` with confirm. Card grammar: `SkillPetal(category)` + title + client + StatusPill + DeadlineChip + fee context where relevant + **exactly ONE primary verb button** = `taskStatusMeta[status].verb` (Decide / Approve [+"& send" when draftText] / View run / Nudge; none for scheduled/waiting_third_party/done). Detail panel: why · proposedActions A/B/C with `recommendedAction` highlighted ("Petal recommends A") — t-russo-basis is the exemplar — · draftText block (PetalMark monochrome) · ProvenancePanel(runId) · deep links (CP2000 task links to `/os/notices/n-cp2000` — "View notice", does not own the draft). Tasks badge ≡ Today ≡ Review (it's all `needsYouCount()`).

### Task 7: Review mode — Create `app/os/review/page.tsx`
Full-screen (chrome escape ships in Task 4). Queue = `needsYouTasks()` ordered needs_decision→ready_to_approve. One item at a time: header "{i} of {n}" + progress hairline; left = the artifact (draftText / return summary / notice response / voucher), right = ProvenancePanel (always open); actions **Approve / Edit / Skip** with keys **A / E / S** (visible kbd hints; Edit opens textarea over draftText; on save show quiet line "Edit logged — Petal will learn from this edit"). End card: "{approved} approved · {edited} edited · ~{hrs} hrs returned" (hrs = MINUTES_RETURNED over actioned tasks) + "Back to Today". Esc exits to /os/today. Session state only (useState).

### Task 8: Returns board — Replace `app/os/returns/page.tsx` (redirect → board) + update `app/os/returns/[id]/page.tsx` to canon
Board: 7 stage columns (STAGE_ORDER), header strip: per-stage counts + "Fees in pipeline {feesInPipeline()} · Blocked by missing docs {feesBlockedByDocs()}". Card: client + form/year ("1120S · 2025") + DeadlineChip (extended shown when set) + docs progress "9/12" mini-bar + blockedBy line + fee + `SkillPetal` of active run (if any). Filters: deadline window (14d/45d/all) · form type · stage · "Blocked only". Card click → `/os/returns/[id]`. Detail page: repoint to engagements/derive (StageTag, docsOf, ProvenancePanel for active run, link to household).

### Task 9: Skills — Rewrite `app/os/skills/page.tsx` (list + detail, existing two-pane pattern)
Library = the 11 fixture skills grouped by category with `PetalLegend` atop. Detail: plain-language description · trigger · steps · channels · tone · escalation rules · **TrustDial** (current tier) · **Variants block** ("Firm default" + Chen Doc Chase fork) · run history = `runsOfSkill()` rows w/ ProvenancePanel. Doc Chase shows the graduation banner: "You've approved 12 Doc Chase drafts without edits — promote Doc Chase to send automatically?" [Promote to T2 · Keep approving]. No "owner agent": byline is "Run by Petal".

### Task 10: Notices — Create `app/os/notices/page.tsx` + `app/os/notices/[id]/page.tsx`
List: type · client · received · **respond-by countdown** ("23 days left", danger <14) · status. Detail (n-cp2000): notice facts · drafted response letter (full text, PetalMark) · ProvenancePanel(run-cp2000) · linked transcript row (run-transcript-rod: "Transcript change detected Jun 24 — matches this notice") · actions "Approve & mail" / "Edit". n-cp14 renders resolved state (resolvedBy + date). Filtered-empty copy: "No notices. Petal is watching transcripts for 9 clients."

### Task 11: Activity — Create `app/os/activity/page.tsx`
Firm-wide immutable log from `activityFeed()`: time · actor (Petal/Antonio) · label · client · run link (ProvenancePanel popover or link to source surface). Filters: client · skill · date range. "Export" button (downloads CSV via blob — actually works). Supports `?run=` highlight (ProvenancePanel footer deep-links here).

### Task 12: Clients list — Rewrite `app/os/clients/page.tsx`
All **11** households. Columns exactly: Name · Forms · Stage (`householdStage`) · **Deadline** (soonest active engagement deadline chip) · **Docs** (`docsOfHousehold` → "32/34") · **Balance** (`invoiceOf().balance`) · Tier. "Created" column removed. Keep Returns/People views + board layout (board uses 7 canon stages), row click-through unchanged. Remove "Mine/All" scope (solo firm — there is no one else).

### Task 13: Client record — Rewrite `app/os/clients/[id]/page.tsx`
Header strip (all derived): `StageTag · DeadlineChip · Docs 32/34 · Fee $1,900 · Balance $1,140`. Tabs explicit (no "3 more"): Activity · Returns · Documents · Tasks · Messages · Billing · **Notices** · **Positions** · Notes. Returns tab: engagement rows + **relationship graph block** ("David & Grace Park (1040) ← K-1 ← Park Family Dental (1120S, 100%)" from entity owners/k1FlowsTo) + **Workpaper block** for wp-parkdental (rows: line → source doc p.X → run link; tagline: "Trace any line on the return back to the run, the workpaper, and the source document."). Positions tab: fixture positions (authority level, confidence, docs, status, resolvedBy) — at-risk "position unresolved" deep-links here (`?tab=positions`). Notices tab: household notices → /os/notices/[id]. "Run skill" button → menu of applicable skills with `trustTierMeta[tier].code` shown per row. **"View as client"** toggle: read-only portal preview (their checklist status, signed docs, balance — simple card stack). @Petal chat panel answer derives from canon (same stage + doc strings via `householdStage`/`docsOfHousehold` — Park says Ready to Prep + 32/34 here AND everywhere).

### Task 14: Documents — Rewrite `app/os/documents/page.tsx` + modify `components/os/doc-gallery.tsx`
Docs attach to **engagements** (client + year + form chips). Left rail: by client → engagement. Per-engagement header: `Expected 12 · Have 9 · Requested 2 · N/A 1` + progress bar + "Based on the 2024 return". Needs-review detail (ReviewModal) shows the extraction diff: fields, values, per-field confidence, low-confidence (<95%) row highlighted amber, ProvenancePanel. Footer hint: "Forward documents to vazant@docs.petal.app — client photo uploads land here too." Russo 1099-B lives under h-russo/en-russo.

### Task 15: Books — Create `app/os/books/page.tsx`; replace `app/os/close/page.tsx` with `redirect("/os/books")`
Frame: **books-to-tax readiness** for May 2026 — NEVER "month-end close automation" (Ramp Stack boundary; do not expand scope beyond the existing checklist). Each line: status + either **"Run with Petal"** (reconciliations/categorization — skill Books-to-Tax Close, T1) or "Owner review" (sign-off items). The completed reconciliation row shows run-recon-park receipt + ProvenancePanel. Owners: Antonio/Elena only. Clients: Park, Fuentes, Sandoval, Mendez line items per fixtures.

### Task 16: Practice — Create `app/os/practice/page.tsx`; replace `app/os/reports/page.tsx` with `redirect("/os/practice")`
KPIs: Active clients (11, "Antonio + Elena") · Open returns (`ACTIVE_STAGES` count) · Fees booked · **"Fees blocked by missing docs: $X"** (`feesBlockedByDocs`). Charts: Returns by stage (links each bar → `/os/returns?stage=`) · Fees by tier · Workload (Antonio + Elena ONLY — no "across 5 preparers") · Client health from `clientHealth()` (ties to Today's at-risk by construction).

### Task 17: Billing — Update `app/os/billing/page.tsx`
Keep table/KPIs/drawer (it ties; now via derive). Overdue drawer: **"Chase with Petal"** primary → routes `/os/review?task=t-williams-chase`-style focus (drafted reminder reviewed in Review mode; Invoice Chase skill attribution + ProvenancePanel). Rows where the engagement has requested docs: chip "Fee blocked by missing docs" → `/os/documents?client=`. June dates only.

### Task 18: Settings — Update `app/os/settings/page.tsx` + `lib/os-integrations.ts`
Un-"Soon" **Trust & autonomy** section: per-skill rows (SkillPetal + name + TrustDial interactive local-state) · the Doc Chase graduation prompt instance · static assurances block (exact copy): "Your skills, processes, and client data are never shared with other firms and never used to train models. Zero-data-retention agreements with model providers. §7216 consent templates included." · onboarding strip: "Set up in under an hour: import last year's returns → Petal builds each client's checklist → the chase is running." General/Members stay "Soon". Integrations edits: Xero → available (QBO stays connected) · IRS e-Services → connected, account "Transcripts + CAF · 8821 on file for 9 clients" · new category "Client data sources" containing Square (moved from Payments) · OLT Pro desc → "Transmits approved returns; acknowledgments sync back." Existing copy "writes stay gated by trust tiers" becomes a link to the Trust & autonomy section. **API & MCP section untouched.**

### Task 19: Inbox — Update `app/os/inbox/page.tsx` + `components/os/thread-conversation.tsx`
Add **Calls** channel (channelMeta + filter): th-park-call renders transcript lines + "Petal extracted 2 follow-ups" linking t-park-books (ProvenancePanel). th-chen extraction moment: attachment row + "Petal extracted W-2 — Golden Dragon LLC → filed to Chen 2025 · 1 field needs review" → documents review modal link. Thread aging chip from `waitingOnFirmSince` ("client waiting 2 days"). th-obrien: "Petal can answer" suggestion chip → reveals drafted reply in composer. Compose demoted to ghost icon; composer primary = "Draft with Petal". Authors: Antonio/Elena only.

---

## Phase 3 — Sweep, verify, ship

### Task 20: Remove list + dead code
- [ ] `app/os/agents/page.tsx` → `redirect("/os/skills")`. `app/os/knowledge/page.tsx` stays but unlisted (already out of nav).
- [ ] `app/os/ask/page.tsx`: starters/example reference canon names only; figures match canon (wages 58,000 vs 96,400); "Runs the Draft 1040 skill" not "1040 Drafter".
- [ ] Delete now-unimported libs: `os-entities.ts`, `os-triage.ts`, `os-runs.ts`, `os-agents.ts`, `os-news.ts`, `os-close.ts`, `os-chats.ts`, `os-files.ts`, `os-documents.ts`, `os-inbox.ts`, `os-billing.ts` (verify with grep first; `firm-mock-data.ts`, `mock-data.ts`, `positions-mock-data.ts` belong to legacy `/dashboard` — untouched). Remove `AgentAvatar`/`PETAL_BY_GRADIENT`/`TierGlyph`/`TrustPill`/`AutonomyPill` from primitives once unreferenced.
- [ ] Banned-string grep over `app/os` + `components/os` + `lib/fixtures` (all must return nothing):
  `grep -rn -e "5 preparers" -e "James Okafor" -e "James Chen" -e "Marcus Lee" -e "Maria Santos" -e "Elena Martinez" -e "1040 Drafter" -e "Reconciler" -e "Notetaker" -e "Meeting Prep" -e "Estimated Payments" -e "Draft ready" -e "Your call" -e "Petal handled" -e "Apr 15" -e "magic" -e "supercharge" -e "without hiring" -e "fully autonomous" -e "month-end close automation" app/os components/os lib/fixtures`
  (“Petal filed … clean” must always be followed by “pre-approved by you”.)

### Task 21: Verification (Definition of Done)
- [ ] `npx -y tsx scripts/tieout.ts` → all PASS, exit 0.
- [ ] `npx tsc --noEmit` → no errors in `app/os`, `components/os`, `lib/fixtures`, `scripts`.
- [ ] `npm run build` → succeeds.
- [ ] Preview every route: /os/today /os/tasks /os/inbox /os/returns /os/returns/en-parkdental /os/clients /os/clients/h-park (all 9 tabs) /os/documents /os/notices /os/notices/n-cp2000 /os/billing /os/skills /os/books /os/practice /os/settings /os/review /os/activity /os/debug/tie-out — console clean.
- [ ] The 12 ties: Today headline = Tasks badge = Review count. Park: same stage + 32/34 in chat, header, Documents, Returns board.
- [ ] 390px pass on Today, Review, Returns board. Keyboard: A/E/S in review; focus rings everywhere.
- [ ] Cold-viewer queries resolvable in <60s each: approve queue (Today button), where is every return (/os/returns), why is a draft right (ProvenancePanel), what did Petal save (RoiStrip).
- [ ] Commit per task throughout; final commit `feat(os): Petal OS overhaul — canonical fixtures, returns board, review mode, trust tiers, notices, provenance`.

## Self-review notes
- Spec coverage: brief §0–§8 each map to Tasks 1–20 (§0→T2 data, §1→T2+T21, §2→T1+T6, §3.1→T8, §3.2→T7, §3.3→T9+T18, §3.4→T3+all, §3.5→T10, §3.6→T13, §3.7→T3+T5, §4 per-page→T5–T19, §5→T20, §6→common acceptance, §7→T21, §8.1→T9, §8.2→T13, §8.3/8.4→T18, §8.5→T15, §8.6→sweep grep).
- Type consistency: all pages consume `vocab.ts`/`derive.ts` signatures defined in Tasks 1–2; shared components defined once in Task 3.
- No placeholders: copy strings, counts, and entity tables are locked above; page tasks may write layout JSX freely within `docs/DESIGN.md` but may not invent data or labels.
