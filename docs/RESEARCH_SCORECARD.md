# Research-AI Scorecard — honest grade vs the resource-scoped target

> Independent grade (2026-06-25): 7 read-only auditor agents graded one dimension each against the real
> code/tests/measured results, then a skeptical EA synthesizer downgraded generosity and "built-but-not-
> wired" inflation. The target (per `2026-06-25-authority-graph-spine.md` §0): A on the five we control,
> A- on authority-weighting (compliance lane) + primary-authority coverage; two axes (licensed editorial
> commentary, 50-state depth) scoped OUT.

| Dimension | Grade | Target | Hit? | Note |
|---|---|---|---|---|
| Calibration | A- | A | ~ | The one intact dimension. Fails safe (abstains, never hallucinates) — the real moat |
| Deterministic numbers / eval | B+ | A | no | Worksheets are source-of-truth, figure-gate works; eval not gating CI |
| Grounding | B | A | no | No-cite-no-claim holds; the adversarial judge skips the chat path |
| Retrieval | B | A | no | Authority graph TIES in-memory (86.8%), does not beat it |
| Research → execution / trust | B | A | no | Risk gate + draft-everything exist; the gate never receives confidence signals |
| Authority-weighting (compliance) | C | A- | no | §6662 engine is **built but dead code** — never called by the live engine |
| Primary-authority coverage | C+ | A- | no | 58 chunks, no case law, mostly individual-federal |

**Verdict: NOT 5 of 6.** At the A/A- bar it is 0 of 6 (one at A-). Plainly: a strong **B prototype**, not
yet an **A engine**. 86.8% on 38 cases is real and fails-safe, but it is a prototype-sized proof, not a moat.

**The unifying cause:** the A-grade machinery is largely **built but not wired**. §6662 weighting is dead
code; the benchmark doesn't gate releases; calibration doesn't feed the risk gate; the graph isn't default.
Several grades can rise by WIRING before the slow corpus/case-law work.

## Path to 5 of 6 (with TRUE costs — not all "cheap wins" are cheap)

1. **Authority-weighting → contra-authority finder (SUB-PROJECT, needs a spec).** Wiring `weighAuthorities`
   on supporting authority ALONE manufactures "more-likely-than-not" on every grounded answer (no contrary
   authority is searched) — false confidence that violates the calibration principle. The honest unlock is
   a contra-authority finder: search the corpus/graph for authority AGAINST each position, classify stance,
   then weigh for-vs-against. This is the real moat-lift for the C dimension. Spec before building.
2. **Calibration → risk gate.** `classifyRisk(tool, args)` in `lib/agent/runtime.ts:254` is called WITHOUT
   the signals arg (the recon path passes `{confidence,...}`; the agent path doesn't). Feed the engine's
   calibration/confidence in. Bounded — but the agent runtime has no live route yet, so it lifts the tested
   capability, not a live surface.
3. **Eval → release gate.** The golden-set integrity gate already runs in vitest; a true LIVE-MODEL gate is
   hard in CI (no local codex proxy; Anthropic key = cost/nondeterminism). Feasible: commit a baseline JSON
   + a deterministic scripted-seam check in CI, plus a periodic live run that updates the floor.
4. **Retrieval → beat in-memory.** Fix the graph grounding gap (`salt-cap-2026` retrieves §164 #1 but the
   engine won't commit) + automate embedding backfill into ingest. Re-A/B; flip default only when it BEATS.
5. **Coverage (heaviest lift).** Resident-load case law + business/entity authority + the 4 shared corpus
   gaps; grow the golden set from 38 toward ~200. This is the slow, real work behind a defensible coverage A-.

## How to re-grade

Re-run the scorecard workflow (`research-ai-scorecard`) after each wiring/lift; it reads the live code +
`docs/RESEARCH_BENCHMARK.md`, so the grades move as the engine does. Never grade your own work inline —
the bonus-depreciation false-positive (2026-06-25) is the cautionary tale: trust the OUTPUT, not the summary.
