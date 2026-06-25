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

| Retrieval | Pass | Error | New regressions vs in-memory |
|---|---|---|---|
| In-memory keyword corpus | **33/38 (86.8%)** | 13.2% | — |
| Authority graph (RRF sparse+dense) | 32/38 (84.2%) | 15.8% | 2 |

**Verdict: do NOT flip the default to the graph.** It is one case worse and adds two regressions
against one new win (`tips-se-tax-2025`). All 6 graph failures are real engine-gaps (0 codex-flakes,
0 eval-misspecs per the synthesis agent), so the number is trustworthy without a re-run.

**Precise cause — a retrieval probe, not the failure reasons (which mislead).** The graph is NOT
missing nodes. For both regressed queries `graphRetrieve` returns the CORRECT authority as the **#1**
hit: `salt-cap-2026` → `OBBBA §70120 amending §164(b)(6),(7)`; `bonus-depreciation-2025` →
`OBBBA §168(k) 100%` (and the stale 40% node is correctly year-filtered out, tagged 2023/2024). The
regression lives in the REST of the retrieved set: the dense layer (all-MiniLM-L6-v2, 384-dim) injects
topically-adjacent-but-wrong neighbors that tight keyword retrieval never surfaces — §2010 estate +
§199A QBI for the bonus question; §68 / §70111 itemized-limitation for SALT. That noise makes the
model hedge/abstain (SALT) or fall back to the parametric "40%" (bonus). **Dense recall dilutes the
context.** This *falsifies* the earlier naive hypothesis below that "hybrid embeddings + a citation
graph" would by itself lift the score.

**Fix attempt + reframe (see changelog 2026-06-25):** the obvious gated-hybrid (dense cosine floor 0.50
+ k cap 6) was tried and **reverted** — it cleared neither target and starved a third case. The failure
proved `bonus-depreciation-2025` is **parametric** (stale "40%" survives even a single-correct-node
context), so the real fix is a **faithfulness gate** that rejects a stale figure contradicting the
retrieved current authority (confident-wrong is the worst failure mode), not retrieval tuning. The graph
earns the default only when it ≥ in-memory AND closes the 4 shared corpus-depth gaps below, with no new
regressions. Re-run this A/B after each change.

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
hallucinate. **Correction (measured 2026-06-25, see the A/B above):** the obvious fix — "hybrid
embeddings + a citation graph" — did **not** help as built; naive RRF dense recall *added noise* and
regressed two cases. The actual fix is a *gated* hybrid (similarity floor + rerank), not raw dense.

## Honest scope of this number

- It measures the **corpus path** over a **thin (~58-chunk) corpus**, on OBBBA-currency individual-
  federal questions + fabrication/abstention probes. It is **not** a general tax-research accuracy claim.
- 38 cases vs Blue J's 350+. Scaling the set (toward hundreds) is a named next step.
- This is a **manual** baseline. It is **not yet wired into CI** (a live-model CI gate needs API keys +
  is slow/nondeterministic). Next: a committed baseline JSON + a CI step that runs a deterministic
  scripted-seam pipeline check, plus a periodic live run that updates this file.

## Changelog

- **2026-06-25** — First published baseline. Golden set 26→38 (authority-grounded). Floor ~84% Claude
  `--no-judge` (~87% adjusting one eval false-positive). Failure mode: over-cautious abstention from
  lexically-brittle retrieval; zero wrong-figure assertions.
- **2026-06-25** — Sharded A/B (codex `--no-judge`): in-memory **33/38 (86.8%)** vs authority graph
  **32/38 (84.2%)**. Graph does NOT yet earn the default — naive RRF dense recall injects off-topic
  chunks (probed: right node is #1, but §2010/§199A/§68 noise rides along) and regresses `salt-cap-2026`
  + `bonus-depreciation-2025`. Next: gated hybrid (similarity floor + rerank), then re-A/B.
- **2026-06-25** — Gated-hybrid fix ATTEMPTED (dense cosine floor 0.50 + final k cap 6) and **reverted**.
  Re-measured graph: still **32/38** — neither target cleared, and a NEW regression (`senior-6k-deduction-2025`,
  starved of its §70103 chunk by the floor/cap). KEY FINDING from the failure: `bonus-depreciation-2025`
  still leaked "40%" even with retrieval reduced to ONLY the correct 100% node — so that figure is
  **parametric recall (training), not a retrieval artifact.** In-memory passes it *only because* its keyword
  search accidentally surfaces the superseded "40% is the OLD answer" probe chunk; the graph's correct
  year-filter removes that warning. Reframed fix: this is a **faithfulness-gate gap** (catch a stale figure
  that contradicts the retrieved CURRENT authority — confident-wrong is the worst failure mode), plus
  optionally surfacing superseded nodes as LABELED negative context via the graph's supersession edges.
  Retrieval tuning alone cannot close it.
