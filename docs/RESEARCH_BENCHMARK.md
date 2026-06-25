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
abstains. The fix is retrieval (hybrid embeddings + a citation graph), not more guardrails. The
near-zero **wrong-answer** rate is the point: Petal fails SAFE (abstains), it does not hallucinate.

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
