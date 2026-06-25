# SUBGOAL: drive the research AI to its resource-bounded maximum score

> Standing subgoal under the production-grade goal (`2026-06-24-production-grade-goal.md`). David, 2026-06-25:
> "write a subgoal to keep going until you hit the highest score that you can with the given resource."
> This is an AUTONOMOUS LOOP: keep lifting the research-AI scorecard, re-measuring, and lifting again,
> until the score plateaus at the resource-bounded ceiling — pausing only for a credential or legal gate.

## Objective

Maximize the research-AI scorecard (`docs/RESEARCH_SCORECARD.md`) — the 7 dimensions — to the highest
grade DEFENSIBLE with our resources. Target from the spine spec §0: **A on the five we control**
(retrieval, grounding, deterministic-numbers/eval, calibration, research→execution/trust); **A- on
authority-weighting (compliance lane) + primary-authority coverage**. Two axes are out of scope and must
be declared as honest boundaries, never bluffed: licensed editorial commentary, 50-state formalized depth.

The measured proxy for "score" is the golden-set error rate (`docs/RESEARCH_BENCHMARK.md`) PLUS the
independent scorecard grades. Both must move; neither alone is the goal.

## The loop (each iteration)

1. **Pick** the highest-leverage HONEST lift from the queue below (cheap wiring before slow corpus work).
2. **Build** it TDD, RLS-first where it touches data, committed task-by-task.
3. **Re-measure**: re-run the golden benchmark A/B (`research-benchmark.mts`, sharded workflow) and/or the
   `research-ai-scorecard` workflow. Numbers move or the lift didn't land.
4. **Record** the delta in RESEARCH_BENCHMARK.md / RESEARCH_SCORECARD.md (keep the audit trail).
5. **Repeat.**

## Honesty rails (non-negotiable — this session earned them)

- **Never fake a grade.** Do not wire a signal that manufactures confidence the analysis didn't establish
  (the §6662 MLTN cap is the canonical example: no "more-likely-than-not" without a real contra search).
- **Verify against the model OUTPUT, not a summary.** The `bonus-depreciation-2025` false-positive (a
  grader that forbade a substring matching legitimate current law) slipped past a reason-string synthesis
  agent. Read the actual answer before concluding.
- **Don't grade your own homework.** Re-grade via the independent `research-ai-scorecard` workflow.
- **Fix the engine, not the eval** — UNLESS the eval is provably wrong (then fix it with a cited source).

## Resource constraints (the "given resources")

- Dev inference = codex proxy ONLY (no `PETAL_DEV_INFERENCE` override; never burn Petal's metered
  Anthropic key on dev/benchmarks). Production stays Anthropic ZDR.
- Embeddings = free/local (all-MiniLM-L6-v2). Authority = free/public sources (IRC/CFR/IRB/GovInfo/
  CourtListener/DAWSON). No paid editorial corpora.
- Claude Code + Workflow subagents are fine (not the metered key).

## Stopping condition

Stop and report the **resource-bounded ceiling** when EITHER: (a) two consecutive lifts yield no scorecard
or error-rate improvement (plateau), or (b) further honest progress is blocked by a credential/legal gate
(§7216 counsel sign-off before real taxpayer data; a paid data source; a deploy credential). At a stop,
state the final grade per dimension and exactly which gate or resource bounds it.

## Lift queue (highest leverage first; update as grades move)

- [x] **Authority-weighting — make §6662 weighting LIVE** (was dead code). DONE 2026-06-25: assessAuthorityWeight
      wired into the engine + route, honesty-capped. Next within this dim ↓.
- [ ] **Contra-authority finder** (the real A- unlock): retrieve authority AGAINST each position, classify
      stance (model), weigh for-vs-against, lift the MLTN cap when the search is comprehensive.
- [ ] **Calibration → risk gate**: pass the engine's confidence/calibration as the `signals` arg to
      `classifyRisk` (currently called bare in `lib/agent/runtime.ts`).
- [ ] **Eval → release gate**: commit a baseline JSON + a deterministic scripted-seam CI check; periodic
      live run updates the floor.
- [ ] **Retrieval — beat in-memory**: fix the `salt-cap-2026` graph grounding gap (retrieves §164 #1 but
      won't commit); automate embedding backfill into ingest; re-A/B; flip default only when it BEATS.
- [ ] **Coverage (heaviest)**: ingest case law (DAWSON/CourtListener) + business/entity authority + the 4
      shared corpus gaps; grow the golden set from 38 toward ~200 with a held-out split.
