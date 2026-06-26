# Research-AI Scorecard (refreshed 2026-06-25, multi-agent audit)

> 7 independent read-only auditors graded one dimension each against the LIVE code + measured results;
> a skeptical EA synthesizer stripped generosity + built-but-not-wired inflation. Re-run via the
> `research-ai-scorecard` workflow after each lift.

| Dimension | Grade | Target | Hit |
|---|---|---|---|
| retrieval | **A-** | A | no |
| grounding | **A-** | A | no |
| deterministic-numbers-eval | **B+** | A | no |
| calibration | **A-** | A | no |
| research-to-execution-trust | **B** | A | no |
| authority-weighting | **A-** | A- | yes |
| primary-authority-coverage | **B+** | A- | no |

**Dimensions at target: 1/7. Clears the 5-of-6 bar: NO.**

## Verdict

This is a strong-B prototype with genuine A-grade SAFETY architecture, not yet an A engine. After downgrading the generous auditors against the code, exactly ONE of the seven dimensions sits at its resource-scoped target (authority-weighting at A-); the others land A- or B+/B. It decisively fails the '5 of 6 at target' bar. The single most important correction: the celebrated '5.3% error / 36/38' is the codex/GPT-5.5 proposer path from a changelog entry, while the published Claude --no-judge baseline TABLE is still 32/38 = 15.8% — so the headline understates the Claude-path error ~3x, and even that number is on a 38-case, ~60-chunk, individual-federal prototype set with zero case law, explicitly disclaimed as 'not a general tax-research accuracy claim.' What is genuinely excellent and verified-wired is the fail-safe design: no-cite-no-claim enforcement, a deterministic figure gate, the named-form fabrication guard, point-in-time/supersession filtering, an honesty-capped §6662 weigher, and a separate adversarial freshness judge — the engine over-abstains rather than asserting wrong figures, which is the right failure mode for tax. But three things keep it short of 'A engine': (1) the moat number is NOT CI-gated (CI runs only vitest; golden.test.ts tests the grader, not the live engine; the benchmark is manual, so a regression ships silently); (2) the research-to-execution trust path is built-not-wired — runtime.ts:254 calls classifyRisk WITHOUT confidence signals, so a hedging research answer never demotes an agent-staged tier-3 write even though the recon path threads it correctly; and (3) the post-fabrication-guard graph A/B is still landing, so the retrieval upgrade is correctly withheld. Verdict: a safety-first prototype whose architecture would earn an A but whose measured evidence, integration completeness, and corpus breadth are B-tier. Demo-credible and honest-by-construction; not yet production-grade across the board.

## Per-dimension notes

- **retrieval (A-)** — DOWNGRADE from auditor's A-/hits-true to A-/MISS. Hybrid RRF + point-in-time year/jurisdiction filtering + supersession + fabrication guard are all real and wired (graph-retrieve.ts, store.ts:105-225). But the dimension's own evidence shows graph TIES in-memory (33/38) and is correctly withheld, and the production path is keyword-only over a ~60-chunk corpus (20+25+15, verified) with ZERO case law. Three known retrieval/reasoning gaps remain (salt-cap-2026 over-abstention, post-sunset, compound stitching). 'A' retrieval needs graph to BEAT in-memory + corpus depth. This is a strong A- but does not clear A.
- **grounding (A-)** — DOWNGRADE from hits-true to MISS. The no-cite-no-claim enforcement, verifyCite, ungroundedFigures gate, faithfulness gate, and separate freshness judge are all genuinely wired (engine.ts:55-390, 720-743) and the architecture fails SAFE (zero wrong-figure assertions is the strongest single fact in the audit). This is the best dimension. But contra-authority search is NOT wired (assessAuthorityWeight honesty-caps at substantial-authority, verified authority-assess.ts:52), and grounding is graph-shape-sensitive (salt-cap-2026: right node #1, engine won't commit). Excellent A-, not yet A.
- **deterministic-numbers-eval (B+)** — CONFIRMED B+/MISS — the most honest auditor. Deterministic compute() handoff, getFigures-throws-on-missing-year, pinned verified=true OBBBA figures, and MONEY_RE \b fix are all real and wired. But the moat number is NOT CI-gated: backend-ci.yml runs only 'npm run test'; golden.test.ts's own header says 'the live engine isn't wired into the grader yet' (it tests the GRADER, not the engine); the benchmark is manual. A regression would not block a merge. B+ until the error-rate gate is shipped + enforced.
- **calibration (A-)** — DOWNGRADE from A to A-. The fail-safe behavior is real and excellent (named-form guard, lifecycle point-in-time, figure gate, §6662 honesty cap, adversarial freshness judge all verified wired). But the 'A' rested heavily on '36/38 = 5.3%', which is the CODEX/GPT-5.5 path (changelog line 152) — the published Claude --no-judge baseline TABLE is 32/38 = 15.8%. The headline understates the Claude-path error rate ~3x. CalibrationReason='unsettled' is dormant (no non-final corpus tier). Calibration discipline is A-grade in design; the measured-number support is thinner than the A claimed.
- **research-to-execution-trust (B)** — CONFIRMED B/MISS — the hard gap, verified at source. risk.ts is complete: lowConfidence() demotes confirm->review on researchBucket abstain/coverage_gap (risk.ts:49-56,104-107). The recon path threads it (run.ts:165,208 pass {confidence,...}). But the agent path at runtime.ts:254 calls classifyRisk(tool, toolArgs) with NO signals arg, so lowConfidence(undefined)===false and a hedging/abstaining research answer NEVER demotes an agent-staged tier-3 write. runtime.ts:247 admits 'threaded in a follow-up'. No integration test. Built-not-wired on the path that matters. Honest B.
- **authority-weighting (A-)** — DOWNGRADE from auditor's A to A- — which is exactly the target, so HITS. weighAuthorities() 6 invariants are deterministic + unit-tested (6/6), assessAuthorityWeight is LIVE on the answer + lifecycle paths (engine.ts:492,782) and returned to the API. The honesty cap is correct, not a defect. But the auditor's 'A' over-credited: contra search is unwired, the corpus has ZERO case-law chunks so the in-circuit-controlling-holding logic is untested end-to-end, and weighting was never measured against the golden set. Deterministic code is A-quality; the live system is a correct, honest A- at target.
- **primary-authority-coverage (B+)** — CONFIRMED B+/MISS. 60 live chunks verified (corpus-2025:20, corpus-obbba:25, corpus-ingested:15). Individual-federal + CA only; no other states; no case law; no entity depth beyond QBI framing; §168(k) Jan-10 boundary unresolved. Self-described as 'not a general tax-research accuracy claim,' 38 cases vs Blue J's 350+. A starter corpus, not yet A- defensible coverage. Reaching A- is a real corpus sub-project (100+ chunks, multistate, case law), not a wire.

## Prioritized path

1. QUICK WIRE (hours, highest leverage): Thread research confidence into the agent path. At lib/agent/runtime.ts:254, pass a RiskSignals object built from the research tool's SourcedAnswer (map bucket->researchBucket, calibration->confidence). The consuming logic in risk.ts:49-107 is already complete and the recon path already does this — this is a one-call wire that flips research-to-execution-trust from B toward A and removes the single most dangerous built-not-wired gap. Add the integration test runtime.ts lacks (low-confidence answer demotes confirm->review on a tier-3 write).

2. QUICK WIRE (hours): Stop overstating the moat number. Re-run scripts/research-benchmark.mts --no-judge on the CLAUDE path and publish that figure (currently 32/38 = 15.8%) as the headline in RESEARCH_BENCHMARK.md and any external claim, with the codex 36/38 clearly labeled as a separate model path. Lands the post-fab-guard A/B that is 'still landing' and corrects calibration's evidence base. Cheap, restores honesty of the scorecard.

3. SMALL SUB-PROJECT (days): CI-gate the error rate. Commit a frozen golden-set JSON + a CI step (deterministic scripted-seam, or a periodic keyed live run) that fails the build below the committed floor. This is the named blocker that holds deterministic-numbers-eval at B+ and calibration short of a defensible A. Without it every other improvement can silently regress.

4. REAL SUB-PROJECT (weeks): Corpus depth — the gate on BOTH primary-authority-coverage (B+) and retrieval (A-). Ingest 100+ chunks: case law (≥1 real circuit-split pair to exercise the in-circuit controlling-holding logic end-to-end), entity depth (S-corp/partnership/QBI mechanics), multistate scaffold, and the §168(k) Jan-10 boundary. Then expand the golden set toward 100+ and rebaseline. This is the largest spend and cannot be faked with a wire.

5. REAL SUB-PROJECT (weeks): Two engine capabilities that the corpus alone won't fix — post-sunset reasoning (tips-deduction-sunset-2029: answer 'expired after 2028' instead of hedging when the point-in-time filter hides the only governing provision) and compound-question stitching (tips-se-tax-2025). Both are genuine reasoning-layer work, not retrieval tuning.

6. DEFERRED until corpus + grounding land: Automated contra-authority search to lift the §6662 honesty cap from substantial-authority to MLTN, and the graph-retrieval default flip — flip ONLY when graph BEATS in-memory with zero fabrication regressions (fab-schedule-tip-2025 must stay a clean decline). Resolve the salt-cap-2026 grounding-step commit failure first.

## CRITICAL honesty note (the number)

The ~5.3% / 36-of-38 figure quoted this session is the CODEX / GPT-5.5 DEV path. Production runs on Claude
(Anthropic). Claude's last full --no-judge measurement is 32/38 = 15.8%, and it PREDATES this session's
engine/corpus fixes (figure-gate, Circ 230 ingest, fabrication guard, lifecycle) which apply to both models.
The true production (Claude) error rate post-fixes is therefore UNMEASURED. Do not quote a hard % externally
until the Claude path is re-measured; say "in our internal evals".
