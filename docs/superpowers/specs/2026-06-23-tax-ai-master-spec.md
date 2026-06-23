# Petal: Master Specification for a Tax AI You Can Defend

> **Status:** controlling reference for the AI build (Layers 0–6). Provided by David, 2026-06-23.
> Engineering + compliance spec informed by primary-source research. **Not legal advice.**
> The §7216 disclosure posture requires a written opinion from a tax attorney before launch.

## 0. The reframe that governs everything
The goal is **not** a model that is "confidently right" — that claim is false and a liability
(leading models calculate <1/3 of simplified federal returns correctly, while sounding certain).
The defensible target: **right, grounded in cited authority, checkable line by line, abstains and
routes to a human when unsure, with a measurable/provable bound on the error rate of answers it
actually emits.** Correctness comes from the architecture around the model, not the weights.
Fine-tuning a bespoke tax model is the wrong primary bet (cf. Blue J: retrieval over a curated
authority corpus on a frontier model with inline citations).

**Two hard rules:**
- **No citation, no claim.** Any substantive tax statement must carry a resolvable citation to
  authority in the store, or it is suppressed.
- **Confidence is derived, not declared.** Confidence comes from measurable signals (did retrieval
  find on-point authority, did the deterministic calc validate, do independent passes agree),
  never the model's verbalized confidence.

## Layer 0 (Foundation): Compliance and guardrails
The EA still signs under penalty of perjury, completes Form 8867, answers to OPR. Petal makes the
EA's diligence stronger and documented — never substitutes for it.
- **Penalty/license map:** §6694(a) unreasonable position (greater of $1,000 / 50% income);
  §6694(b) willful/reckless ($5,000 / 75%); §6695(g) due-diligence **$650 per failure, up to
  $2,600/return** (returns filed 2026; per IRS i8867 + EITC Central); §6695(a)-(e) $65/failure,
  $33,000 cap (Rev. Proc. 2025-32); §6701/§7407 structural; **a 6694/6695 assessment → likely OPR
  referral → suspend/disbar/censure.** This is how a tool error becomes a license event.
- **§7216 / §6713 (the biggest landmine):** §7216 is **criminal** (misdemeanor, up to $1,000 + 1yr
  per violation; $100,000 with a 6713(b) identity-theft predicate). §6713 is strict-liability civil
  ($250/disclosure, $10,000 cap). "Disclosure" reaches info furnished "in any manner whatever" —
  **every Anthropic API call with taxpayer data is, on its face, a 7216 disclosure.** Two paths in
  26 CFR 301.7216-2: (1) contractor/software exception (no consent, but written 7216/6713 notice to
  every recipient incl. Anthropic by contract), (2) substantive-determination trigger (consent
  required under 301.7216-3). **Unresolved — needs counsel:** is Petal "software/contractor" or
  "providing substantive determinations"? Conservative posture until counsel says otherwise:
  obtain a §7216 consent anyway (Rev. Proc. 2013-14 language), issue the 7216/6713 notice to all
  sub-processors, and **engineer Petal so the preparer makes the substantive determination** (Petal
  surfaces + proposes; the EA reviews, adopts, signs).
- **Data security (GLBA / FTC Safeguards 16 CFR 314 / IRS Pub 4557 / WISP):** up to $53,088/violation
  + $10,000 personal officer liability. **ZDR with Anthropic** (no retention at rest). **Mythos/Fable
  tiers cannot run under ZDR (30-day retention) — client data must never touch them.** Use ZDR-eligible
  models (Opus 4.8, Sonnet 4.6, Haiku 4.5). US regions only, encrypt in transit + at rest, RBAC,
  tamper-evident per-return audit log. Ship WISP + 7216 consent templates in onboarding.
- **Circular 230:** §10.22 diligence, §10.34 standards; proposed §10.35 (technological competence,
  not finalized) — Petal should be the *answer* to it. AICPA SSTS 1.4 names AI a "tool" under a
  reliance standard. CA §17530.5 (misdemeanor) applies directly (David + Antonio in CA).
- **Layer 0 requires of the build:** per-return audit record; citation trail per position; Form 8867
  due-diligence assist for any EITC/CTC/AOTC/HoH return; a record that the human reviewed and adopted
  each material position. These artifacts defend the license.

## Layer 1: Versioned authority store
Year-versioned, citation-tagged corpus of **primary** tax authority — the only thing the reasoning
layer may cite. Sources (official, free, programmatic): IRC Title 26 (GovInfo USLM XML + MCP),
26 CFR (eCFR API; verify high-stakes against GovInfo official edition), Federal Register API (TDs/
NPRMs), IRS forms/instructions/pubs + IRB (Rev. Procs/Rulings/Notices), Tax Court + federal opinions
(GovInfo USCOURTS / CourtListener), state (CA FTB individually — multi-state is a later phase).
- **Phase 1: primary sources only.** Phase 2: license one commentary source (Tax Notes/IBFD) iff the
  validation sprint shows demand.
- **Structured figures as data, not prose:** typed, versioned table keyed by tax year + citation,
  looked up deterministically (e.g. 2026 std deduction $16,100 single/$32,200 MFJ/$24,150 HoH; CTC
  $2,200/$1,700 refundable; §6695(g) $650 — all → Rev. Proc. 2025-32 / OBBBA P.L. 119-1). Prevents
  the "model recalls the wrong figure" failure (sources disagree $768,600 vs $768,700; $650 vs $665).
- **Chunk on legal structure** (section/subsection/definition = citable unit). Mandatory metadata:
  authority type, citation string, tax year(s), jurisdiction, effective date, supersession pointer,
  source URL, ingestion date. **Never overwrite — version + mark superseded.** Year-filter before
  retrieval. Use Anthropic contextual-retrieval (prepend a context line per chunk).

## Layer 2: Deterministic computation and validation
Remove arithmetic/rule-application from the model entirely. Model emits structured inputs;
deterministic code computes + validates.
- **Calculator: wrap, don't rebuild.** OLT (first) then Drake (second) are the source-of-truth,
  IRS-accepted engines; Petal drives them (browser automation is a **correctness mechanism**, not
  just UX). Build deterministic TS worksheets only for high-frequency/high-penalty pre-checks: EITC,
  CTC/ACTC, AOTC, QBI/199A, AMT. Unit-test vs IRS worksheet examples + ATS scenarios.
- **Validate via the IRS's own machine-readable rules:** MeF XML schemas + business rules (reject
  criteria → deterministic validators) + ATS scenarios (golden known-answer returns; must pass all;
  seed the Layer 6 eval). Petal does **not** transmit initially (OLT/Drake transmit; EFIN/ATS is a
  separate path). Uses MeF rules as validation only.
- **Hard rule:** the model never performs arithmetic that lands on a filed line. Proposes inputs;
  deterministic code computes; engine confirms; validators check. Prose math = draft, never filed.

## Layer 3: Grounded reasoning (Claude)
- **Grounding contract:** retrieval-augmented only; **native Claude Citations** (ZDR-eligible) tied
  to provided documents — no citation, no claim; **tool use for all computation** (no mental math);
  **structured output** (typed position objects: claim, authority citation, computed-value ref,
  confidence inputs).
- **Model routing:** Opus 4.8 (hard reasoning + judge), Sonnet 4.6 (routine grounded generation),
  Haiku 4.5 (classification/extraction/routing — a worker, not the reasoner).
- **Cost:** prompt-cache the (large, stable) authority block; reuse across reasoning/verify/explain
  passes; Message Batches API for bulk embedding/classification.

## Layer 4: Verification and adversarial check (independent of the generator)
1. **Deterministic validators** — MeF business rules; internal tie-outs (1040 ↔ schedules, totals,
   carryforwards); prior-year delta anomaly flags (OmniContext discrepancy detection doubling as an
   error catcher).
2. **Faithfulness check (claim-grounded)** — decompose answer into claims, NLI each against retrieved
   authority, score proportion verified (RAGAS faithfulness).
3. **Cross-model adversarial pass** — different model as judge than generator; recompute, confirm
   every citation resolves, check consistency; **binary, unambiguous rubrics** (drives judge accuracy
   high). Certified self-consistency for statistical guarantees.
- **Caveat that ties it together:** *faithfulness ≠ correctness.* A system can score 0.95 faithfulness
  and be wrong (faithfully reporting a stale/incorrect chunk). Hence Layer 1 must be correct/current
  and Layer 6 must check ground-truth correctness vs known answers.

## Layer 5: Calibrated confidence and routing
- **Confidence from signals, not self-report:** retrieval (on-point authority for this tax year),
  computation (calc ↔ engine agree, MeF validators pass), agreement (semantic entropy across multiple
  generations), edge-case (multi-state, ambiguous facts, novel OBBBA).
- **Abstention with a provable bound:** conformal abstention (Yadkori et al. 2405.01563) — calibrate
  so that, among emitted answers, expected error rate is bounded at a chosen level. Track ECE, AUROC
  (hallucination), AUARC (selective generation).
- **Four tiers → bound action:** High (auto-surface, preparer one-click confirms); Medium (preparer
  must review cited authority before adopting); Low (Petal takes no position, surfaces the question +
  authority); **Abstain (refuse): "I do not have sufficient on-point authority to take a position
  here"** — a correct and required output. Link tiers to disclosure: flag Form 8275 candidates (don't
  decide).

## Layer 6: Evaluation harness (the layer most startups skip)
- **Golden dataset:** IRS ATS scenarios (deterministic correctness); Antonio's real returns + 2 live
  audits (under 7216 consent + de-identification — a counsel question); the 20-EA validation sprint;
  synthetic hard cases (OBBBA, multi-state, the four due-diligence credits).
- **Metrics:** correctness vs known answers (the only metric that proves the number); RAG triad
  (faithfulness / context relevance / answer relevance via RAGAS/DeepEval/TruLens); retrieval
  (Recall@k, MRR, NDCG); calibration (ECE/AUROC/AUARC); citation validity (every citation resolves to
  a real on-point chunk).
- **Judge calibration + regression gating:** calibrate judges to 85–90% human agreement, different
  model than generator, binary rubrics. **Gate releases per cohort, not aggregate** (block if "EITC
  returns" regresses even if aggregate improves). Promote failing production traces into the dataset.
  Close the loop (sample live traffic back in).

## Cross-cutting moat
Curated current primary-sourced authority store (L1); OLT/Drake last-mile automation (L2); the
firm-validated golden eval set from Antonio's audits + the EA sprint (L6); the defensible audit trail
+ confidence record that protects the license (L0/L5). Built on Claude SDK; the moat is the vertical
layer, the last mile, the eval asset, the trust posture, and distribution.

## Build sequence (two people, pre-YC)
1. L0 consent + security path + a thin L1 for a narrow scope (1040 + the four due-diligence credits +
   OBBBA changes; structured figures from Rev. Proc. 2025-32; primary sources only). Minimum that is
   safe and useful; serves the 8867 use case.
2. L2 validation via MeF rules + ATS scenarios; OLT automation as calculator. Correctness before breadth.
3. L3 grounded reasoning with Citations + caching over the narrow scope.
4. L6 eval harness seeded with ATS scenarios — stand up early.
5. L4 verification + L5 confidence/abstention, then widen scope only as the eval set proves each addition.
- **Resist widening scope before the eval harness can prove the addition is correct.**

## Open decisions (needed from David)
1. **§7216 posture:** confirm consent (conservative) + a written attorney opinion on the
   substantive-determination question. **Gates launch + shapes the data path.** Who is the tax
   attorney of record?
2. **Calculator strategy:** confirm OLT/Drake as source-of-truth + selective TS pre-checks (wrap-first)
   vs building a fuller engine.
3. **Phase 1 authority scope:** which forms, which credits, federal-only or CA too.
4. **Commentary licensing:** primary-only Phase 1, Phase 2 decision pending the sprint.
5. **Conformal target:** what bounded error rate is acceptable for auto-surfaced positions vs mandatory
   human review. A risk-tolerance call only David can make.

## Final adversarial review (cold, hostile — as requested)
1. **It is still a probabilistic system on irreversible, signed work.** Conformal abstention bounds but
   doesn't remove error; one wrong EITC determination the EA signs → 6695(g) + OPR + client harm. Petal
   *reduces and documents* risk; it does not remove it. The EA's signature/judgment remain controlling —
   the UI must make that unavoidable, not bury it.
2. **§7216 is the highest risk and unresolved.** If counsel says Petal makes "substantive determinations"
   and the software exception fails, every engagement needs a valid 7216 consent before any data is
   processed; a missing/defective consent is criminal + strict-liability exposure. **Do not ship taxpayer
   data through the API until the written opinion exists.** The one place "move fast" is wrong.
3. **Faithfulness-is-not-correctness is under-defended operationally.** ATS is small/fixed; one client's
   returns aren't representative. The eval set is the moat and the weakest link at the start. Early
   "accuracy" figures are provisional — be honest internally.
4. **Platform dependency is real and not fully priced.** Engine/cost/ceiling track Anthropic (Citations,
   caching, ZDR eligibility could change). The mitigation (vertical layer is the moat) only holds if that
   layer is genuinely deep; right now it's mostly a plan.
5. **State/multi-state is hand-waved.** "Ingest each state individually" = a large ongoing expensive data
   problem; solo-EA customers will have multi-state returns. Narrow Phase 1 is right, but state coverage
   is not a quick follow-on.
6. **The build sequence assumes capacity two people may not have.** The realistic risk: Layers 4/5/6
   (verification, calibration, evals) get deferred under time pressure — exactly backwards. **If anything
   is cut it must be scope (fewer forms), never the safety layers. Make this a written rule, not a 2am
   judgment call.**
7. **Missing:** model/prompt change management (review + rollback, since a prompt edit changes every
   answer); incident response (a wrong position reaches a filed return — who is notified, how corrected
   + disclosed); end-to-end PII retention/deletion mechanics (not just the Anthropic boundary); E&O
   insurance posture (2025–26 carrier signals point to AI exclusions); explicit human-factors design so
   the EA doesn't rubber-stamp high-confidence outputs (automation bias).

**Bottom line:** architecture is sound and matches how credible vertical players build. The two things
most likely to hurt an EA: (a) shipping before the §7216 opinion, and (b) the safety layers being
deferred while the system already touches real returns. Hold both lines; the rest is execution.
