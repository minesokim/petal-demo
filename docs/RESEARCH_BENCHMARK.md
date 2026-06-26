# Research-AI Measured Error Rate — Baseline & Release Gate

> The research AI's **moat is a measured error rate**, not a vibe. This file is the published,
> version-controlled baseline. Re-run it before any change that touches the research engine, corpus,
> retrieval, or prompts; a regression below the threshold blocks the release.

## How to run

```bash
# Live engine over the golden set, graded by tests/research/golden/grade.ts.
PETAL_DEV_INFERENCE= node --env-file=.env.local --import tsx scripts/research-benchmark.mts --no-judge   # Claude floor
node --env-file=.env.local --import tsx scripts/research-benchmark.mts --no-judge                        # codex/GPT-5.5
# Drop --no-judge to add the Opus freshness/verification judge (lifts the floor).
```

`--no-judge` is the **conservative floor** (proposer only). The Opus judge rescues a few borderline
cases, so the judge-on rate is higher; the floor is the honest release gate.

## Baseline (2026-06-25)

| Run | Model path | Config | Golden set | Pass | Error |
|---|---|---|---|---|---|
| A | Claude (Anthropic) | `--no-judge` | 38 cases | 32/38 | 15.8% |
| B | Claude (Anthropic) | `--no-judge` | 38 cases | 32/38 | 15.8% |

**Published floor: ~84% (Claude, `--no-judge`).** One of the six "failures" (`bonus-deprec-before-cutoff`)
was an **eval false-positive** — the engine answered *correctly* (Jan-10 purchase → not 100% bonus,
cites §168(k)) but a substring `mustNotClaim` couldn't distinguish "100% does **not** apply" from
"100% applies"; that check was removed. Adjusting for it, the effective floor is **~87% (33/38)**.

**RELEASE-GATE THRESHOLD: 32/38 (84%) on the Claude `--no-judge` floor.** A run below this blocks a
release of the research engine until the regression is explained or fixed. Raise the threshold as the
engine improves; never lower it to make a release pass, and never edit a golden case to dodge a real
failure (fix the engine).

## Measured A/B (2026-06-25): in-memory corpus vs authority graph (codex `--no-judge`)

Ran the full 38-case golden set twice on the codex (GPT-5.5) path, identical except retrieval, via the
sharded parallel harness (`--shard k/N --json`, 6 shards/mode, codex concurrency bounded). An
adversarial synthesis agent read `cases.ts` + `grade.ts` and classified every failure.

| Retrieval | As first measured | **Corrected** (grader bug fixed) | Error |
|---|---|---|---|
| In-memory keyword corpus | 33/38 (86.8%) | **33/38 (86.8%)** | 13.2% |
| Authority graph (RRF sparse+dense) | 32/38 (84.2%) | **33/38 (86.8%)** | 13.2% |

**CORRECTION (verified 2026-06-25): the graph TIES in-memory; it is NOT a case worse.** The "32/38"
graph number was an **eval false-positive**. `bonus-depreciation-2025` pinned `mustNotClaim: "40%"`, but
OBBBA added a *legitimate* first-year transition ELECTION to use 40% (60% for long-production / aircraft)
per IRS Notice 2026-11 — so the model's *more complete, correct* answer (100% default + the 40% election)
tripped a blanket substring forbid. Verified against Grant Thornton / RSM / BDO alerts; fixed the case to
require the restored `100%` (a new `mustClaim` check) instead of forbidding `40%`. Re-graded live: graph
PASSES bonus in both modes → **graph 33/38 = in-memory 33/38**. Lesson: trust the model OUTPUT over a
synthesis agent's reason-string classification — that agent called this an "engine-gap"; it was an eval
bug. salt-cap-2026 IS a real graph over-abstention, offset by graph's win on tips-se-tax-2025.

**Verdict: still do NOT flip the default — graph TIES, does not BEAT.** The bar is "beats in-memory + no
regressions." Graph and in-memory each have one distinct failure (graph: salt-cap-2026; in-memory:
tips-se-tax-2025) plus 4 shared corpus-depth gaps.

**The one real graph-specific issue — `salt-cap-2026` over-abstention.** `graphRetrieve` returns the
CORRECT authority as its **#1** hit (`OBBBA §70120 amending §164(b)(6),(7)`), yet the engine abstains
("found potentially relevant authority but could not ground a definite position") while in-memory
grounds and answers. So the §164 node is retrieved but the reason/ground step doesn't commit on it. A
suspected contributor is dense noise — for this query the graph set also carries §68 / §70111
itemized-limitation chunks (cosine ~0.46-0.51) that the tight keyword path never surfaces — but the
gated-hybrid fix below did NOT clear it, so noise is not the whole story; the grounding step itself is
graph-shape-sensitive. Open.

**Gated-hybrid fix ATTEMPTED + reverted (changelog 2026-06-25).** Dense cosine floor 0.50 + final k cap
6 cleared neither `salt-cap-2026` nor a then-misdiagnosed `bonus` (the bonus "fail" turned out to be the
eval bug above, not retrieval), and it **starved** `senior-6k-deduction-2025` of its §70103 chunk — a
real new regression. Reverted. Retrieval tuning alone has not moved the graph past in-memory; the next
levers are the grounding/reason step on graph chunks (why §164 doesn't commit) and corpus depth for the
4 shared gaps. Graph earns the default only when it BEATS in-memory with no regressions. Re-run this A/B
after each change.

## Dominant failure mode (the real signal)

The failure SET **varies run-to-run** while the count stays ~stable — the engine hovers right at the
**abstain/answer margin** and is **over-cautious**, not wrong. Across both runs the recurring failures
are should-answer questions the engine *abstains* on (it does **not** assert a wrong figure — the
safety architecture holds; it just declines too often):

- `salt-cap-2026`, `salt-cap-2025-control` — abstains on a plainly-phrased "what is the SALT cap" though §164 is in the corpus.
- `tips-se-tax-2025` — a compound question (SE-tax interaction) it can't stitch together.
- `tips-deduction-sunset-2029` — hedges on the post-2028 sunset instead of asserting it.
- `estate-exemption-2025-control` — intermittently abstains on a year-control it elsewhere answers.

**Root cause (per the engine audit):** keyword-overlap retrieval is *lexically brittle* — a question
whose wording doesn't hit a chunk's keywords retrieves nothing on-topic and the engine honestly
abstains. The near-zero **wrong-answer** rate is the point: Petal fails SAFE (abstains), it does not
hallucinate. **Update (measured 2026-06-25, see the A/B above):** the obvious fix — "hybrid embeddings +
a citation graph" — TIED in-memory, it did not beat it; a gated-hybrid tweak (floor+k-cap) was tried and
reverted (no gain, one regression). The graph retrieves the right node #1 yet the engine still won't
*ground* on it (`salt-cap-2026`), so the next lever is the reason/ground step on graph chunks, plus
corpus depth — not just retrieval mechanics.

## Honest scope of this number

- It measures the **corpus path** over a **thin (~58-chunk) corpus**, on OBBBA-currency individual-
  federal questions + fabrication/abstention probes. It is **not** a general tax-research accuracy claim.
- 38 cases vs Blue J's 350+. Scaling the set (toward hundreds) is a named next step.
- **CI gate (wired 2026-06-25), in two halves:** (1) a model-free DETERMINISTIC recall gate runs per-PR in
  the normal vitest suite (`tests/research/golden/retrieval-gate.test.ts`) — every settled answer-case's
  required authority MUST be retrievable, so a corpus/keyword edit can never silently drop recall. (2) a
  scheduled LIVE-model gate (`.github/workflows/research-eval.yml`) runs the full benchmark on production
  Claude daily + on demand and FAILS below the committed floor (`--gate 44` of 50); activate by adding the
  `ANTHROPIC_API_KEY` repo secret. The moat is now an enforced gate, not just a number in this file.

## Changelog

- **2026-06-25** — First published baseline. Golden set 26→38 (authority-grounded). Floor ~84% Claude
  `--no-judge` (~87% adjusting one eval false-positive). Failure mode: over-cautious abstention from
  lexically-brittle retrieval; zero wrong-figure assertions.
- **2026-06-25** — Sharded A/B (codex `--no-judge`): in-memory **33/38 (86.8%)** vs authority graph
  **32/38 (84.2%)**. Graph does NOT yet earn the default — naive RRF dense recall injects off-topic
  chunks (probed: right node is #1, but §2010/§199A/§68 noise rides along) and regresses `salt-cap-2026`
  + `bonus-depreciation-2025`. Next: gated hybrid (similarity floor + rerank), then re-A/B.
- **2026-06-25** — Gated-hybrid fix ATTEMPTED (dense cosine floor 0.50 + final k cap 6) and **reverted**:
  cleared no target and starved `senior-6k-deduction-2025` of its §70103 chunk (a real new regression).
- **2026-06-25 (CORRECTION — supersedes the two entries above).** Eyeballing the actual model OUTPUT (not
  reason-strings) overturned the "graph is worse" + "parametric 40%" conclusions. `bonus-depreciation-2025`
  was an **eval false-positive**: the case forbade the substring "40%", but OBBBA's first-year transition
  ELECTION legitimately uses 40%/60% (IRS Notice 2026-11, verified vs Grant Thornton/RSM/BDO). The model's
  answer was grounded and *more complete* (100% default + the election). Fixed the eval: added a `mustClaim`
  check, set the case to require `100%` instead of forbidding `40%`. Re-graded live: **graph 33/38 =
  in-memory 33/38 — a TIE** (each has one distinct failure: graph `salt-cap-2026`, in-memory `tips-se-tax-2025`,
  + 4 shared corpus-depth gaps). Graph still does not BEAT in-memory, so the default stays in-memory. Real
  open work: the grounding step on graph chunks (`salt-cap-2026` retrieves §164 #1 but won't commit) + corpus
  depth for the 4 shared gaps. Lesson: a synthesis agent grading from reason-strings mislabeled an eval bug
  as an "engine-gap" — always verify against the model's actual output.
- **2026-06-25 — FIGURE-GATE FIX re-measured (the moat number MOVED).** Root-caused (systematic debugging)
  that `salt-cap-2026` abstained despite retrieving §164 #1: MONEY_RE over-captured ("$505,000, but" →
  "$505,000, b" → parsed 505 BILLION → a GROUNDED figure false-flagged as ungrounded → the position dropped).
  Fixed the regex (thousands grouping + unit `\b`). Re-A/B (codex `--no-judge`): **in-memory 34/38 (89.5%),
  up from 33/38 — error rate 13.2% → 10.5%.** (Newly passes the two SALT phase-down cases that hit the same
  bug; one harder case, qbi-sstb-above-threshold-2026, regressed.) Graph **33/38 (86.8%)** — still behind, and
  it introduced a SAFETY regression: `fab-schedule-tip-2025` flipped from an honest coverage-gap decline to
  HALLUCINATING a non-existent "Schedule TIP" form (dense retrieval surfaced tips-adjacent authority the engine
  over-grounded). Do NOT flip. Two eval-misspecs surfaced for careful (source-verified) correction:
  `tips-deduction-sunset-2029` (year-filter correctly excludes §70201 for 2029 → unsatisfiable cite demand)
  and `estate-exemption-7m-probe-2026` (demands bill-section "70106" though §2010 is the correct cite the
  sibling case accepts). Shared coverage holes: §168(k) Jan-10 boundary, Circ 230 §10.34(d) (uningested).
- **2026-06-25 — VERIFIED the two candidate "eval-misspecs"; NEITHER is a cheap fix (do not game the eval).**
  `estate-7m-probe` is GRAPH-ONLY (in-memory already passes it citing §70106); the graph folds the OBBBA
  estate amendment into the §2010 node, so it's a graph storage difference, not a default-path miss — fixing
  it would not move the shipped (in-memory) score. `tips-sunset-2029` is NOT an eval bug: it's a real engine
  capability gap — the point-in-time filter correctly hides the expired §70201 for 2029, so the engine hedges
  for lack of governing authority; the correct answer ("expired after 2028, not available in 2029") needs
  post-sunset reasoning the engine lacks. Loosening the eval to accept the hedge would game it. CONCLUSION:
  the cheap-win plateau on the DEFAULT path is reached; remaining in-memory lifts are real engineering —
  post-sunset reasoning (tips-sunset), compound-question stitching (tips-se-tax-2025), and corpus ingestion
  (Circ 230 §10.34(d); §168(k) Jan-10 boundary). The figure-gate fix (13.2%→10.5%) was the last cheap win.
- **2026-06-25 — Circ 230 ingestion re-measured: in-memory 36/38 (94.7%), ERROR RATE 13.2% → 5.3% this session.**
  Verify-first caught a SECOND wrong golden case: `circ230-reliance-on-others` demanded §10.34(d) (client-info
  reliance) for a question about relying on a COLLEAGUE's work product, which is §10.22(b) (verified vs eCFR /
  Cornell LII / IRS). Ingested BOTH reliance rules (faithful public-domain paraphrases) + reframed the case as
  a discrimination test → now passes. Cumulative session climb: 86.8% → 94.7% (in-memory). Only 2 in-memory
  failures remain, both real engine features: `tips-deduction-sunset-2029` (post-expiration reasoning — §70201
  is in-corpus but the engine hedges instead of answering "expired after 2028") and `tips-se-tax-2025` (compound
  SE-tax stitching). Graph ALSO 36/38 but STILL DO NOT FLIP: it regressed `fab-schedule-tip-2025` from a correct
  decline to a HALLUCINATION (confidently answered a fake-form probe) — a strictly worse trade for a cited-and-
  abstaining engine, even at equal headline rate. Two patterns banked: (1) 2 of this session's "failures" were
  flawed TESTS, not the engine — the benchmark needs the same scrutiny as the model; (2) the graph's dense recall
  can induce fabrication, the one failure class that disqualifies a flip regardless of pass rate.
- **2026-06-25 — Fabrication guard shipped; graph EARNS the default flip (codex A/B).** The deterministic
  named-form guard (unestablishedNamedForm) eliminated the Schedule-TIP hallucination (was ~40%/run). Re-A/B:
  in-memory **37/38 (97.4%)** (sole miss: tips-se-tax-2025, an OBBBA SE-tax abstain), graph **38/38 (100%)** —
  the graph is now a STRICT SUPERSET (grounds the OBBBA §70201 case in-memory abstains on; zero regressions,
  zero fabrications). The bar I committed to ("graph beats in-memory with no fab regressions") is MET → flip
  candidate. CAVEATS: (a) this is the CODEX/GPT-5.5 eval, not the production Claude path; the relative result
  (graph > in-memory) is model-independent but the absolute 100% is not a prod claim; (b) graph adds a runtime
  dependency (DATABASE_URL + transformers.js embeddings) — keep the honest-degradation fallback-to-in-memory on
  graph error + add a startup health check before/at cutover.
- **2026-06-25 — REAL number measured on PRODUCTION CLAUDE (not the codex proxy): 86.8% (33/38), both engines.**
  The codex proxy (37/38 in-memory, 38/38 graph) was inflated ~10 pts — its "perfect" graph run returned
  over-fitted citations, not true grounding. Honest grade is **86.8%, ~13% error**. 4 of 5 failures were the
  spec's named anti-pattern: ABSTAINING on settled OBBBA law it has ("a coverage gap wearing a calibration
  costume"). ROOT CAUSE (diagnosed): the model states a DERIVED figure (MFS half, ×2 spouses, indexed per-year)
  and the figure gate correctly drops it — the chunks carry the RULE but not the pre-computed FIGURES.
  FIXED + verified live on Claude before the cap: salt-cap-2026 + salt-cap-2025-control (explicit MFS figures
  $20,000/$20,200 in the §70120 chunk), tips-se-tax-2025 (§224 chunk now states it does NOT reduce SE tax),
  estate-exemption-7m-probe-2026 (3rd brittle-mustNotClaim eval bug → require $15M). REMAINING: senior-deduction-
  both-spouses (the model HAS the $12,000 but over-hedges on the phase-out — genuine calibration over-abstention,
  a reasoning-layer fix, NOT corpus). Also fixed: reasoning service-errors now SURFACE (were silently swallowed
  into false abstentions — that swallow is what made the over-concurrent Claude A/B crater to a bogus 31.6%).
  BLOCKER: the Anthropic key hit its usage limit ("regain access 2026-07-01"); a full Claude re-measure to
  CONFIRM the post-fix number is pending the key reset or a raised limit. Do NOT run the heavy parallel A/B on
  the production key again without headroom — it exhausts the quota.
- **2026-06-25 — CONFIRMED on production Claude (sequential, no rate-limiting): SHIPPED engine 37/38 = 97.4%,
  error rate 2.6%** — up from the pre-fix 86.8%. The targeted corpus enrichment (explicit figures the model
  was illegally computing) + the 3 eval-bug fixes delivered an honest ~10-point climb on the real model. The
  ONE remaining in-memory failure is `tips-deduction-exists-2025`, a borderline over-abstention (it answers on
  spot-checks; the engine sits right at the answer/abstain margin) — the calibration-layer fix (faithfulness
  gate flooring caveated answers), tested carefully, is the last lift. NOTE — the GRAPH path measured 33/38
  (86.8%) but that is STALE, not a regression: the corpus edits live in lib/research/corpus-obbba.ts (in-memory)
  and were NOT re-backfilled into the authority_versions DB the graph reads, so the graph used the OLD chunk
  text (e.g. it answered tips-se-tax BACKWARDS — "not subject to SE tax" — for lack of the SE-tax enrichment).
  Re-running scripts/backfill-authority-graph.mts will bring the graph to in-memory parity; deferred since
  in-memory is the shipped default. Real shipped grade: 97.4% / 2.6% error on production Claude.
- **2026-06-25 — CASE-LAW corpus layer added (the brutal grade's hardest gate, "zero case law", closed).**
  6 foundational federal doctrines — Gregory (economic substance), Glenshaw Glass (gross income), Welch
  (ordinary & necessary), Cohan (estimate rule, a 2d-Cir holding), Crane (nonrecourse basis), INDOPCO
  (capitalization) — each citation + holding WEB-VERIFIED and adversarially fact-checked (Cornell LII /
  Justia) via the caselaw-ingest-verify workflow; nothing from memory. Authored 6 matching golden cases
  (golden set 38→44) so the depth is MEASURED. Verified on production Claude: **6/6 pass** (each answers +
  cites the right case). Combined with the OBBBA set (37/38) the engine is ~43/44 (~97.7%) on the expanded
  set. Impact on the scorecard: authority-weighting (the §6662 in-circuit-controlling-holding invariant now
  has a REAL Supreme + circuit holding to weigh, not synthetic) and coverage (first real case law) both
  advance. Backfilled + embedded into the graph too. Next coverage lifts: more case law (a circuit SPLIT to
  fully exercise the in-circuit logic), entity (S-corp/partnership) depth, multistate.
- **2026-06-25 — Case-law batch 2 (golden set 44→50); 12/12 case-law cases pass on Claude.** Added Lucas
  v. Earl + Helvering v. Horst (assignment of income), Old Colony Trust (employer-paid taxes = income),
  James v. US (illegal income), Duberstein (gift standard), North American Oil (claim of right) — all
  web-verified + adversarially checked. Caught + fixed a keyword over-trigger (generic "control" matched
  "controlled-foreign-corporation," breaking the Subpart-F coverage-gap test) by curating case keywords to
  distinctive doctrine terms. CUMULATIVE on production Claude: OBBBA 37/38 + case-law 12/12 = ~49/50 (~98%)
  on the expanded 50-case set. Two of the brutal-grade gates moving: coverage (zero→12 real cases across
  foundational doctrines) and authority-weighting (the §6662 in-circuit invariant now has real Supreme +
  circuit holdings). Still a START on coverage BREADTH, not the finish — true domain-A needs sustained
  ingestion (more case law incl. a circuit SPLIT, entity/partnership depth, multistate).
- **2026-06-26 — HONEST broad measurement recorded (`lib/research/measured-baseline.ts`).** The 97.4%/98%
  above is the GOLDEN (currency/plumbing) set — the easy tier. This session measured the harder, more honest
  sets on the live engine (judge-graded, `--fetch`, both models) and recorded them machine-readably:
  **VERIFIED settled bright-line law = 5/8 (62.5%)** on BOTH Claude and GPT-5.5 (identical failures ⇒ engine-
  bound: §1202 statute-collision, §163(j) buried-subsection — concrete fetch gaps, not reasoning), lifted
  from 1/8 this session by fixing real fetch-routing bugs (Title-26 collision, Public-Law pollution, statute-
  lookup precision). **BLUEJ hard/unsettled = 7/15 (47%) Claude vs 6/15 (40%) GPT-5.5** — Claude held
  calibrated hedges where GPT-5.5 over-answered 2 hedge-required cases (the calibration edge that IS the
  moat). **GOLDEN currency = 47/50 (94%) GPT-5.5.** These — not the flattering 97.4% — are the real
  correctness picture; the engine's own abstention philosophy forbids hiding from the measurement. Release-
  gate floors now live in `RELEASE_GATE` (measured-baseline.ts), guarded by `tests/research/measured-
  baseline.test.ts` (the floor can never be set above what was measured). Next: close the §1202/§163(j) fetch
  gaps to lift the settled-law floor, then corpus BREADTH (entity/multistate/circuit-split) per the C→A roadmap.
