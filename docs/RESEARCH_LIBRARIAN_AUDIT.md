# Librarian (Research AI) Brutal Audit — vs a CERTIFIED WORLD-CLASS bar (2026-06-26)

> 6 code-grounded dimension auditors + 3 adversaries (a tax attorney who signs returns, a Blue J/Thomson AI
> lead, a calibration skeptic) → synthesized verdict. Bar = "a librarian a tax attorney relies on for a
> SIGNED client position (Circ 230 / §6694 exposure)," NOT "is it good." (2 of 6 dimension agents failed on a
> transient API error; verdict synthesized from the 4 that returned + the 3 attackers.)

## Verdict: **D+** — "an attorney-grade reasoning engine bolted to a go-kart corpus"

The §6662 weighting, four-bucket calibration, and grounding guards are genuinely best-in-class in DESIGN —
but the librarian fails settled bright-line law at a MEASURED 62.5%, has zero entity law, no premise gate,
and a moat that does not gate. **Not world-class, and not borderline.**

> **UPDATE (2026-06-26, same day): the #1 gap — the settled-law floor — is CLOSED.** Fixed the two engine-
> bound fetch bugs (§1202 cross-title collision; §163(j) buried-subsection truncation). VERIFIED settled-law
> set now **8/8 (100%) on the prod model (Claude)**, codex 7/8. So "62.5%, 33 pts under world-class" no longer
> holds. The OTHER gaps in this audit remain the real work: corpus BREADTH (entity/multistate/circuit-split),
> the premise gate (still zero code), the contra-search corpus-emptiness honesty bug, and making the moat GATE
> (wire the verified set into CI). The reasoning engine was always strong; the fuel and enforcement are next.

| Dimension | Grade | The honest read |
|---|---|---|
| Retrieval / corpus | **D** | 62 chunks, 59 federal + 3 CA, 12 cases (11 Supreme + 1 circuit), ZERO entity law, zero circuit splits. ~18% of Blue J's breadth. The 16-source live fetch + cite-verify are the only thing off D-/F. |
| Calibration | **C** | Machinery real (4 buckets, fabricated-cite drop, figure gate). But `unsettled` is admitted DEAD code (no non-final tier in corpus), and the freshness judge is structurally blind to external (Title-21) premises — so the Q6 §280E confident-wrong miss is an unguarded failure CLASS. |
| Measured-error moat | **C-** | Doesn't gate what matters: CI live-model job skips without the API key, runs `--no-judge` (recall, not correctness), gates GOLDEN+BLUEJ but NEVER the VERIFIED settled-law set; two files contradict on the BLUEJ floor (8/15 vs 6/15). A settled-law regression ships green. The honest re-baselining is the one thing keeping it off D. |
| Real-world correctness | **D+** | 62.5% on settled bright-line law (§1202 5-yr hold, §163(j) 30%-of-ATI — one-line constants); zero entity coverage; the §6662 delegation factors are dead branches (only 2 chunks carry delegationBasis, ZERO carry authorityClass). |

## Why it's NOT world-class (5 code-verified, each disqualifying for reliance)
1. Misses SETTLED one-line statutory law at a measured 62.5% (§1202, §163(j)) — and CI gates it NOWHERE.
2. Entity tax is effectively ZERO — half of partner practice (S-corp/partnership/C-corp) returns nothing.
3. The premise gate (stops confident-wrong on external facts like §280E scheduling) is ZERO lines of code.
4. The §6662 MLTN lift can fire on **corpus-emptiness** (contra-finder returns searched=true when the tiny
   corpus yields no adverse candidate) — so penalty-protection confidence is an artifact of a thin corpus.
5. The moat does not gate.

## Where it GENUINELY beats incumbents (real, rare)
- §6662 weight-of-authorities as a deterministic, model-free PURE FUNCTION with code-locked hard invariants
  (a ruling/PLR/reg never outweighs a contrary controlling in-circuit holding; non-precedential-sole → 8275).
- Post-Loper-Bright delegation weighting in code (express 1.0 / §7805-general 0.7 / Skidmore 0.5).
- Intellectual-honesty caps + self-incriminating honest measurement (recording 62.5%, not hiding behind 97.4%).
- Token-layer grounding guards that genuinely stop hallucination (cite re-resolution, ungrounded-figure drop).

## The certification gap = 4 gaps, in dependency order
1. **Correctness floor**: VERIFIED settled-law 5/8 → 8/8 (fix the two engine-bound fetch/parse bugs: §1202
   Title-26-vs-PL-119-21 collision; §163(j) buried-subsection). World-class ≈ 95%+; we're 33 pts under on the EASY tier.
2. **Enforcement**: wire the VERIFIED set into research-eval.yml as a HARD judge-graded floor; add the
   ANTHROPIC_API_KEY secret; reconcile the 8/15-vs-6/15 contradiction. A measured number that gates nothing is not a moat.
3. **Premise gate**: build the zero-code structural fix (external/time-sensitive premises → code-gated, floor to hedge when unverified).
4. **Corpus**: 10–50x the primary corpus with real entity depth + multistate + BOTH SIDES (circuit splits); re-validate on an EA-reviewed 300+ set.

## Prioritized path (highest leverage first)
1. Close the settled-law floor (§1202 + §163(j) fetch/parse bugs) → VERIFIED 8/8. Smallest surface, ends the reliance question.
2. Make the moat GATE: verified set as a hard judge-graded CI floor + the key + one source of truth for the floors.
3. Ship the premise gate (the only architectural HOLE, not a grind).
4. Fix the contra-search honesty bug (don't lift MLTN on corpus-emptiness).
5. Add entity depth (S-corp §1366/§1367/§1374; partnership §704(b)/§752/§754; C-corp).
6. Broaden the corpus with contested-issue coverage (circuit splits) so `unsettled` can be revived; re-baseline on 300+.

## The measured truth
The measured error rate is the most honest thing in the repo and it says the librarian is NOT world-class by
its own harness. The load-bearing number is **62.5% on SETTLED law** — the tier where world-class means ~95%+
and being wrong is indefensible. Same two failures on Claude AND GPT-5.5 prove it's engine/fetch-bound, not a
model ceiling: good news (fixable), bad news (it genuinely retrieves the wrong authority on black-letter law).
Strong-B engineering, D-tier fuel, an unfired moat. Fix the settled-law floor and make the gate actually gate,
and the measured number becomes a real competitive weapon.
