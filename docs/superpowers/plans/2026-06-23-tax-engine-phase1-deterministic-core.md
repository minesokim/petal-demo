# Tax Engine Phase 1 — Deterministic Core (L1 + L2 + L6 seed) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic, fully-testable correctness core of Petal's tax engine — a year+jurisdiction-versioned structured-figures store (L1), pure-function worksheets for the four due-diligence credits + standard deduction + QBI (L2) parameterized by those figures and tied to cited authority, MeF-style validators + internal tie-outs (L2/L4), and a golden-scenario harness seeded with known-answer cases (L6) — for Form 1040 + EITC/CTC/AOTC/HoH + OBBBA, federal **and** California (540), with **no model involvement**.

**Architecture:** Three pure-TypeScript modules with no I/O and no AI: `lib/tax/figures/*` (typed constants keyed by `{year, jurisdiction}`, each carrying its authority citation), `lib/tax/worksheets/*` (deterministic functions `(facts, figures) → WorksheetResult{ value, lines[], citations[], flags[] }`), and `lib/tax/validators/*` (MeF-reject-style rules + 1040↔schedule tie-outs). A golden harness (`tests/tax/golden/*`) runs known-answer scenarios end-to-end. The reasoning model (L3) is intentionally absent — it later only *proposes inputs* to these functions; the functions, not the model, produce every filed number. This matches the spec's hard rule: "the model never performs arithmetic that lands on a filed line."

**Tech Stack:** TypeScript (strict), Vitest (existing test runner, `npx vitest run`), Zod (existing — for the figures + result schemas). No new runtime deps. No database (figures are code, versioned in git, which is the spec's "never overwrite — version + mark superseded" discipline expressed as source control + a `supersededBy` field).

## Global Constraints

- **No citation, no claim** (spec §0): every figure and every worksheet result carries a resolvable `citation` string + `sourceUrl`; a result with an unsourced material number is a bug.
- **Confidence is derived, not declared** (spec §0): these are deterministic — they return exact values + `flags`, never a self-rated confidence.
- **The model never does filed-line arithmetic** (spec L2): this entire module is model-free. Do not import anything from `lib/ai/*` here.
- **Structured figures as data, versioned, never overwritten** (spec L1): figures are keyed by `taxYear` + `jurisdiction`; superseding a value adds a new entry with `supersededBy`/`effectiveFrom`, never edits in place.
- **Figure values are authority-sourced and MUST be verified** against the cited primary source during execution: federal → Rev. Proc. 2025-32 + OBBBA P.L. 119-1 + the relevant IRC/CFR; California → CA RTC + FTB 540 instructions. Where the controlling spec (`docs/superpowers/specs/2026-06-23-tax-ai-master-spec.md`) states a figure (e.g. 2026 std deduction $16,100 single / $32,200 MFJ / $24,150 HoH; CTC $2,200 / $1,700 refundable; §6695(g) $650), use it and cite it; for every other figure, fetch the value from the cited source and record the URL — **never guess a tax figure**. A figure whose source can't be confirmed is committed as `verified: false` and excluded from golden scenarios until confirmed.
- **Cut scope, never safety** (spec final review #6): if time-boxed, drop a *form/credit*, never the validators or the golden harness.
- **ZDR / §7216:** N/A to this plan — no taxpayer data and no API calls occur in the deterministic core. (It runs identically on synthetic facts.)
- Tests live under `tests/tax/`; run with `npx vitest run tests/tax`.

---

## File Structure

- `lib/tax/types.ts` — shared types: `FilingStatus`, `Jurisdiction`, `Citation`, `Figure<T>`, `WorksheetResult`, `WorksheetLine`, `Flag`.
- `lib/tax/figures/federal-2025.ts` — federal structured figures for TY2025 (OBBBA), each a `Figure<T>` with citation.
- `lib/tax/figures/california-2025.ts` — CA 540 structured figures for TY2025.
- `lib/tax/figures/index.ts` — `getFigures(year, jurisdiction)` lookup + a registry; throws on an unknown/unverified key when `requireVerified`.
- `lib/tax/worksheets/standard-deduction.ts` — `standardDeduction(facts, figures)`.
- `lib/tax/worksheets/eitc.ts` — `eitc(facts, figures)` (phase-in/plateau/phase-out, investment-income disqualifier, childless rules).
- `lib/tax/worksheets/ctc.ts` — `childTaxCredit(facts, figures)` (CTC + ACTC refundable portion + phaseout).
- `lib/tax/worksheets/aotc.ts` — `aotc(facts, figures)` (100%/25% structure, 40% refundable, MAGI phaseout, per-student).
- `lib/tax/worksheets/qbi.ts` — `qbi(facts, figures)` (20% of QBI, taxable-income threshold/phase-in, SSTB).
- `lib/tax/worksheets/hoh.ts` — `headOfHousehold(facts)` (filing-status qualification test for the §6695(g) HoH due-diligence item).
- `lib/tax/worksheets/california.ts` — CA deltas: CA standard deduction, CalEITC, Young Child Tax Credit.
- `lib/tax/worksheets/index.ts` — barrel + a `runFederal1040(facts)` orchestrator that calls the worksheets in dependency order and assembles a `ReturnComputation`.
- `lib/tax/validators/mef.ts` — MeF-reject-style deterministic validators (e.g. EITC investment-income cap, SSN/ITIN eligibility for credits, AOTC years-claimed ≤ 4) returning `Flag[]`.
- `lib/tax/validators/tieouts.ts` — internal 1040↔schedule tie-outs + prior-year delta anomaly flags.
- `lib/tax/authority/store.ts` — typed authority store: `AuthorityChunk` + `retrieve(query, {year, jurisdiction, k})` with mandatory metadata (authority type, citation, taxYear[], jurisdiction, effectiveDate, supersededBy, sourceUrl, ingestedAt); year+jurisdiction filter before ranking.
- `lib/tax/authority/corpus-2025.ts` — the starter primary-authority corpus (IRC §63/§24/§32/§25A/§199A/§2; the §6695 penalty; CA RTC equivalents), chunked on legal structure.
- `tests/tax/figures.test.ts`, `tests/tax/worksheets/*.test.ts`, `tests/tax/validators.test.ts`, `tests/tax/authority.test.ts` — unit tests.
- `tests/tax/golden/scenarios.ts` + `tests/tax/golden/golden.test.ts` — known-answer end-to-end scenarios (L6 seed).

> This replaces the 6-entry toy `lib/ai/authority.ts` once `lib/tax/authority/*` is in place (Task 9 migrates callers); until then both coexist so nothing breaks.

---

### Task 1: Shared types

**Files:**
- Create: `lib/tax/types.ts`
- Test: `tests/tax/types.test.ts`

**Interfaces:**
- Produces: `FilingStatus = "single" | "mfj" | "mfs" | "hoh" | "qss"`; `Jurisdiction = "federal" | "CA"`; `Citation = { authority: string; cite: string; sourceUrl: string }`; `Figure<T> = { value: T; taxYear: number; jurisdiction: Jurisdiction; citation: Citation; verified: boolean; effectiveFrom?: string; supersededBy?: string }`; `Flag = { code: string; severity: "reject" | "review" | "info"; message: string; citation?: Citation }`; `WorksheetLine = { line: string; label: string; amount: number }`; `WorksheetResult = { value: number; lines: WorksheetLine[]; citations: Citation[]; flags: Flag[] }`.

- [ ] **Step 1: Write the failing test** — assert the Zod schema for `Figure` rejects `verified: undefined` and accepts a full object; assert `WorksheetResult` requires `citations` non-empty.
- [ ] **Step 2:** `npx vitest run tests/tax/types.test.ts` → FAIL (module not found).
- [ ] **Step 3:** Implement the types + a Zod `figureSchema`/`worksheetResultSchema` (refine `citations.min(1)`).
- [ ] **Step 4:** Re-run → PASS.
- [ ] **Step 5:** Commit `feat(tax): shared types for the deterministic core`.

### Task 2: Federal structured figures (TY2025, OBBBA)

**Files:**
- Create: `lib/tax/figures/federal-2025.ts`, `lib/tax/figures/index.ts`
- Test: `tests/tax/figures.test.ts`

**Interfaces:**
- Consumes: `Figure<T>`, `Citation` (Task 1).
- Produces: `getFigures(taxYear: number, jurisdiction: Jurisdiction)` → a typed `FigureSet` (standardDeduction by status, ctcPerChild, ctcRefundableCap, ctcPhaseoutThreshold, eitc params by #children {rate, earnedIncomeAmount, maxCredit, phaseoutThreshold, phaseoutRate, investmentIncomeLimit}, aocPhaseoutMAGI by status, qbiThreshold by status, dueDiligencePenalty). Every field is a `Figure<T>`.

- [ ] **Step 1: Write the failing test** — `getFigures(2025,"federal").standardDeduction.mfj.value` is a positive number and `.citation.sourceUrl` matches `/irs\.gov|govinfo\.gov/`; `.verified === true` for spec-stated figures.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Populate from the controlling spec where stated (std deduction $16,100/$32,200/$24,150; CTC $2,200/$1,700; §6695(g) $650 → Rev. Proc. 2025-32 / OBBBA P.L. 119-1) and **fetch + cite** every other value from Rev. Proc. 2025-32 + IRC; mark any unconfirmed value `verified: false`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(tax): federal TY2025 structured figures (cited)`.

### Task 3: Standard deduction worksheet

**Files:** Create `lib/tax/worksheets/standard-deduction.ts`; Test `tests/tax/worksheets/standard-deduction.test.ts`.

**Interfaces:** Consumes `getFigures` (Task 2). Produces `standardDeduction(facts: { filingStatus: FilingStatus; age65OrOlder?: number; blind?: number; canBeClaimedAsDependent?: boolean; earnedIncome?: number }, figures): WorksheetResult`.

- [ ] **Step 1:** Failing test — MFJ both under 65 returns the base MFJ figure; a single dependent caps at `max(earnedIncome+$450, floor)` per the dependent worksheet; each 65/blind box adds the additional-amount figure. Use figure-derived expected values (read them from `getFigures`, don't hardcode dollars in the test).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement per IRS 1040 std-deduction worksheet + the dependent worksheet, pulling all dollar amounts from `figures`. **Step 4:** PASS. **Step 5:** Commit.

### Task 4: EITC worksheet

**Files:** Create `lib/tax/worksheets/eitc.ts`; Test `tests/tax/worksheets/eitc.test.ts`.

**Interfaces:** Produces `eitc(facts: { earnedIncome: number; agi: number; investmentIncome: number; qualifyingChildren: number; filingStatus: FilingStatus; taxpayerSsnValidForWork: boolean; age?: number }, figures): WorksheetResult`. Logic: credit = `min(rate*earnedIncome, maxCredit)`, then phase out at `phaseoutRate*(max(agi,earnedIncome) - phaseoutThreshold)`; `0` if `investmentIncome > investmentIncomeLimit` (flag `EITC_INVESTMENT_INCOME`), if `mfs` (pre-OBBBA) / per current rule, or childless age outside 25–64.

- [ ] **Step 1:** Failing tests — (a) 1-child case in the plateau returns `maxCredit`; (b) AGI above phaseout returns a correctly reduced amount; (c) `investmentIncome` one dollar over the limit returns `value:0` + a `reject` flag. Expected values computed from the figure params in the test (formula-derived), not magic numbers.
- [ ] **Step 2–5:** FAIL → implement per IRS Pub 596 worksheet using `figures` params → PASS → commit.

### Task 5: CTC / ACTC worksheet

**Files:** Create `lib/tax/worksheets/ctc.ts`; Test `tests/tax/worksheets/ctc.test.ts`.

**Interfaces:** Produces `childTaxCredit(facts: { qualifyingChildren: number; otherDependents: number; agi: number; filingStatus: FilingStatus; earnedIncome: number; taxLiabilityBeforeCredits: number }, figures): WorksheetResult` returning `{ value: nonRefundableCTC, ... }` plus `lines` carrying the refundable ACTC (`min(refundableCap*children, 15%*(earnedIncome-$2,500))`) and the `$50-per-$1,000` phaseout above `ctcPhaseoutThreshold`.

- [ ] **Step 1:** Failing tests — 2 children under threshold → `2*ctcPerChild` limited by tax liability with ACTC for the remainder; MFJ AGI $30k over threshold → reduced by `$50 * 30`. **Step 2–5:** FAIL → implement per Schedule 8812 → PASS → commit.

### Task 6: AOTC worksheet

**Files:** Create `lib/tax/worksheets/aotc.ts`; Test `tests/tax/worksheets/aotc.test.ts`.

**Interfaces:** Produces `aotc(facts: { students: { qualifiedExpenses: number; yearsAOTCClaimed: number; halfTimeOneAcademicPeriod: boolean; felonyDrugConviction: boolean }[]; magi: number; filingStatus: FilingStatus }, figures): WorksheetResult`. Per student: `100% of first $2,000 + 25% of next $2,000` (max $2,500), MAGI phaseout over `aocPhaseoutMAGI`, 40% refundable; flag `AOTC_YEARS_EXCEEDED` if `yearsAOTCClaimed >= 4`.

- [ ] **Step 1:** Failing tests — one student $4,000 expenses, MAGI under phaseout → $2,500 ($1,000 refundable); a student with `yearsAOTCClaimed:4` → excluded + `reject` flag. **Step 2–5:** FAIL → implement per Form 8863 → PASS → commit.

### Task 7: QBI / §199A worksheet

**Files:** Create `lib/tax/worksheets/qbi.ts`; Test `tests/tax/worksheets/qbi.test.ts`.

**Interfaces:** Produces `qbi(facts: { qbi: number; taxableIncomeBeforeQBI: number; filingStatus: FilingStatus; isSSTB: boolean; w2Wages?: number; ubia?: number }, figures): WorksheetResult`. Below the threshold: `20% * min(qbi, taxableIncome - netCapGain)`. In/above the phase-in: apply the W-2/UBIA limit and SSTB phase-out per §199A.

- [ ] **Step 1:** Failing tests — under-threshold simple case → `20%*qbi`; SSTB fully above the phase-out range → `0`. **Step 2–5:** FAIL → implement → PASS → commit.

### Task 8: Head-of-Household qualification

**Files:** Create `lib/tax/worksheets/hoh.ts`; Test `tests/tax/worksheets/hoh.test.ts`.

**Interfaces:** Produces `headOfHousehold(facts: { unmarriedOrConsideredUnmarried: boolean; paidMoreThanHalfHomeCost: boolean; qualifyingPerson: boolean }): { qualifies: boolean; flags: Flag[] }` — the §6695(g) HoH due-diligence determination (not a dollar amount).

- [ ] **Step 1:** Failing tests — all three true → qualifies; any false → not, with an `info` flag naming the failed prong. **Step 2–5:** FAIL → implement → PASS → commit.

### Task 9: California figures + worksheets (540)

**Files:** Create `lib/tax/figures/california-2025.ts`, `lib/tax/worksheets/california.ts`; Test `tests/tax/worksheets/california.test.ts`.

**Interfaces:** Extends `getFigures(2025,"CA")`. Produces `caStandardDeduction(facts, figures)`, `calEITC(facts, figures)` (CA EITC as a % of federal with CA-specific phaseout), `youngChildTaxCredit(facts, figures)` (YCTC eligibility tied to CalEITC + a child under 6). Cite CA RTC + FTB 540 instructions; mark unconfirmed values `verified:false`.

- [ ] **Step 1:** Failing tests — CA std deduction for single returns the FTB figure; CalEITC for a qualifying low-income case returns a positive credit; YCTC requires a child < 6. **Step 2–5:** FAIL → implement → PASS → commit.

### Task 10: MeF-style validators + tie-outs

**Files:** Create `lib/tax/validators/mef.ts`, `lib/tax/validators/tieouts.ts`; Test `tests/tax/validators.test.ts`.

**Interfaces:** Consumes the worksheet results + facts. Produces `validateReturn(computation: ReturnComputation, facts): Flag[]` — deterministic reject-style rules (EITC investment-income cap; credit SSN/ITIN eligibility; AOTC ≤4 years; CTC child SSN-required) + tie-outs (sum of credit lines ≤ tax where non-refundable; 1040 totals match schedule subtotals) + a prior-year delta anomaly flag when a year-over-year field swing exceeds a threshold.

- [ ] **Step 1:** Failing tests — a computation that violates the EITC investment cap yields a `reject` flag with a citation; a clean computation yields none. **Step 2–5:** FAIL → implement → PASS → commit.

### Task 11: Authority store + starter corpus (replaces the toy)

**Files:** Create `lib/tax/authority/store.ts`, `lib/tax/authority/corpus-2025.ts`; Test `tests/tax/authority.test.ts`. Modify callers of `lib/ai/authority.ts` (`lib/ai/reasoning.ts`) to import from the new store.

**Interfaces:** Produces `AuthorityChunk` (mandatory metadata per Global Constraints) + `retrieve(query: string, opts: { taxYear: number; jurisdiction: Jurisdiction; k?: number }): AuthorityChunk[]` — **year+jurisdiction filter first**, then keyword/semantic rank; never returns a superseded chunk for its superseding year. Corpus chunked on legal structure: IRC §63 (std deduction), §24 (CTC), §32 (EITC), §25A (AOTC), §199A (QBI), §2(b) (HoH), §6695(g) (penalty), plus CA RTC §17052/§17052.1 (CalEITC/YCTC).

- [ ] **Step 1:** Failing tests — `retrieve("child tax credit", {taxYear:2025, jurisdiction:"federal"})` returns a chunk citing §24; a 2024-only superseded chunk is excluded for 2025; every chunk has all mandatory metadata fields. **Step 2–4:** FAIL → implement + ingest the starter corpus (cite + sourceUrl each) → PASS. **Step 5:** Repoint `lib/ai/reasoning.ts` import; run the full suite `npx vitest run` → green; commit `feat(tax): real authority store + starter primary-source corpus`.

### Task 12: Golden-scenario harness (L6 seed)

**Files:** Create `tests/tax/golden/scenarios.ts`, `tests/tax/golden/golden.test.ts`; Create `lib/tax/worksheets/index.ts` (`runFederal1040(facts): ReturnComputation`).

**Interfaces:** `runFederal1040(facts)` orchestrates Tasks 3–8 + 10 in dependency order → `ReturnComputation { lines, credits, flags, citations }`. `scenarios.ts` exports known-answer cases `{ name, facts, expect: { eitc, ctc, aotc, qbi, stdDeduction, flags[] } }` — start with hand-constructed cases whose expected numbers are derived from the IRS worksheets (and, where available during execution, real IRS ATS scenario values; mark each scenario `source: "ATS" | "constructed"`).

- [ ] **Step 1:** Failing test — `golden.test.ts` iterates `scenarios`, runs `runFederal1040`, asserts each `expect` field (only over `verified` figures). **Step 2:** Run → FAIL. **Step 3:** Implement `runFederal1040` + ≥4 scenarios (childless EITC, 2-child EITC+CTC, AOTC student, QBI sole-prop). **Step 4:** PASS. **Step 5:** Commit `feat(tax): golden-scenario harness (L6 seed) — known-answer 1040s`.

---

## Self-Review

**Spec coverage:** L1 figures (Tasks 2,9) + authority store (Task 11) ✓; L2 worksheets (Tasks 3–9) + validators/MeF (Task 10) ✓; L6 golden harness seed (Task 12) ✓; the "model never does filed-line arithmetic" hard rule is structurally enforced (module is model-free) ✓; "structured figures as data, versioned, cited" ✓; CA scope (Task 9) ✓. **Deferred to the follow-on plan (Phase 1b):** L3 grounded reasoning (Citations, structured position objects, model routing), L4 faithfulness + adversarial judge, L5 conformal abstention + tiers, L0 onboarding consent/WISP templates, OLT/Drake calculator automation (depends on ⑥). These are listed here so the gap is explicit, not forgotten.

**Placeholder scan:** worksheet *bodies* reference the controlling IRS worksheet rather than reproducing every line of arithmetic inline — acceptable and intended for legal-transcription work, but each task names the exact IRS source (Pub 596, Schedule 8812, Form 8863, §199A, FTB 540) so there is no ambiguity about *what* to transcribe; figure *values* are sourced + cited, never invented.

**Type consistency:** `WorksheetResult`, `Figure<T>`, `Flag`, `Citation`, `getFigures`, `retrieve` names are used identically across Tasks 1–12.

**Known risk carried from the spec (final review #3):** golden correctness is only as good as the scenario set; the harness is seeded small and must grow with real ATS data + Antonio's returns before any "accuracy" claim. Recorded, not hidden.
