// GOLDEN EVAL HARNESS — the case set (tests/research/golden/cases.ts)
//
// This is the measurable failure set distilled from the research transcript. Each case is a
// FROZEN expectation about how the engine MUST behave on a question where a naive LLM trained
// on pre-2025 law goes wrong. The grader (./grade.ts) scores a candidate answer against these.
//
// Why three buckets (not the orchestrator's four Tiers)? The Tier ("high"/"medium"/"low"/
// "abstain") is an INTERNAL confidence signal. What we actually grade is the OBSERVABLE shape
// of the answer to the user:
//   - "answer"        — the engine should give a definite, cited answer. The law is settled and
//                       in-corpus. Abstaining here is a FAILURE (a coverage gap wearing a
//                       calibration costume), not caution.
//   - "hedge"         — the question is genuinely indeterminate on the law/facts (a
//                       facts-and-circumstances test, an unreleased future figure, an open
//                       question). The engine should hedge / route to a human / state the
//                       uncertainty. A confident answer here is overconfidence.
//   - "coverage_gap"  — the engine has no in-corpus authority and should SAY SO (and, for
//                       fabrication probes, REFUSE to invent one). Answering anyway = hallucination.
//                       NOTE for the eval runner: a coverage_gap and an honest "abstain" are the
//                       SAME observable property here (a non-fabricating decline). The runner
//                       normally maps the engine's internal "abstain" → "hedge" before grading;
//                       for coverage_gap cases it should instead pass the RAW bucket through so
//                       grade.ts can recognize "abstain" directly. (grade.ts also accepts a
//                       zero-citation "hedge" as a fallback empty-decline, so a real hedge with
//                       factors does not sneak past a coverage_gap expectation.)
//
// The danger cases are the currency traps: the One Big Beautiful Bill Act (OBBBA, P.L. 119-21,
// enacted July 4 2025) rewrote SALT, tips, overtime, the senior deduction, estate exemption,
// bonus depreciation, and made QBI permanent — exactly the facts a pre-2025 model gets wrong.
// `mustNotClaim` pins the stale wrong answer that must NOT appear in the text.
// `mustCiteAuthorityLike` pins a substring at least one citation must contain when the engine
// answers (so "right answer, no/garbage authority" still fails).

import type { Jurisdiction } from "../../../lib/tax/types";

export type ExpectedBucket = "answer" | "hedge" | "coverage_gap";

export type GoldenCase = {
  id: string;
  question: string;
  taxYear: number;
  jurisdiction: Jurisdiction;
  expectedBucket: ExpectedBucket;
  // The stale / wrong claim that must be ABSENT from the answer text (case-insensitive
  // substring). Optional: only the currency traps and fabrication probes pin one.
  mustNotClaim?: string;
  // A substring at least ONE citation must contain when the engine answers (e.g. "119-21",
  // "OBBBA", "164"). Only meaningful for expectedBucket === "answer".
  mustCiteAuthorityLike?: string;
  notes: string;
};

export const GOLDEN_CASES: GoldenCase[] = [
  // ───────────────────────── Currency traps: SALT ─────────────────────────
  {
    id: "salt-cap-2026",
    question: "What is the SALT (state and local tax) deduction cap for tax year 2026?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // Pre-OBBBA the cap was $10,000. OBBBA §70120 raised it to $40,000 for 2025, indexed +1%
    // thereafter ($40,400 for 2026), phasing down above a MAGI threshold but never below $10k.
    // Forbid the stale assertion that the CAP is $10,000 — not a mention of the $10,000 phase-down
    // FLOOR, which a correct 2026 answer ("$40,400 cap ... never below $10,000") legitimately states.
    mustNotClaim: "cap is $10,000",
    mustCiteAuthorityLike: "164",
    notes:
      "OBBBA §70120 amended IRC §164(b)(6): cap is $40,000 (2025), $40,400 (2026), not the stale $10k. The $10k figure is the classic 2018-2024 answer a pre-2025 model emits.",
  },
  {
    id: "salt-cap-phasedown-highincome-2026",
    question:
      "My client has $700,000 of MAGI in 2026. Is their SALT deduction still capped at $10,000?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustNotClaim: "still $10,000",
    mustCiteAuthorityLike: "164",
    notes:
      "Even in the phase-down range the cap floors at $10k; the flat '$10,000 cap' framing is stale. The right answer explains the $40,400 cap reduced 30% of MAGI over the threshold, floored at $10k.",
  },

  // ───────────────────────── Currency traps: tips ─────────────────────────
  {
    id: "tips-se-tax-2025",
    question:
      "A self-employed hairstylist earns $8,000 in tips in 2025. Are those tips subject to self-employment tax, and can she deduct them?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // The trap: claiming the new 'no tax on tips' deduction zeroes out SE tax. It does NOT —
    // OBBBA §70201's above-the-line deduction is for INCOME tax only; SE/FICA still applies.
    mustNotClaim: "not subject to self-employment tax",
    mustCiteAuthorityLike: "OBBBA",
    notes:
      "OBBBA §70201 created a deduction (up to $25,000) for qualified tips, INCOME tax only. Tips remain subject to SE tax / FICA. Stale-and-inverted trap: a model may over-apply the new break to SE tax.",
  },
  {
    id: "tips-deduction-exists-2025",
    question: "Is there any federal deduction for tip income in 2025?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // Inverse trap: a pre-2025 model says 'no, tips are fully taxable like wages'.
    mustNotClaim: "no deduction for tips",
    mustCiteAuthorityLike: "70201",
    notes:
      "OBBBA §70201 created a temporary (2025-2028) above-the-line deduction for qualified tips. A pre-OBBBA model denies it exists.",
  },

  // ───────────────────────── Currency traps: overtime ─────────────────────────
  {
    id: "overtime-deduction-2025",
    question: "Is there a federal deduction for overtime pay in 2025, and how much?",
    taxYear: 2025,
    jurisdiction: "federal",
    // SHOULD-BE-COVERED but Petal abstained in the transcript. This is settled new law, in
    // corpus → must ANSWER, not hedge. A hedge here is a coverage gap in calibration costume.
    expectedBucket: "answer",
    mustNotClaim: "no deduction for overtime",
    mustCiteAuthorityLike: "70202",
    notes:
      "OBBBA §70202: above-the-line deduction for qualified overtime premium, up to $12,500 ($25,000 MFJ), 2025-2028. Transcript shows Petal abstained — that is the failure this case locks against.",
  },

  // ───────────────────────── Currency traps: senior deduction ─────────────────────────
  {
    id: "senior-6k-deduction-2025",
    question:
      "My client is 67 with $40,000 of income in 2025. Is there a new senior deduction they can take?",
    taxYear: 2025,
    jurisdiction: "federal",
    // SHOULD-BE-COVERED but Petal abstained. Settled OBBBA provision → must ANSWER.
    expectedBucket: "answer",
    mustNotClaim: "no additional senior deduction",
    mustCiteAuthorityLike: "70103",
    notes:
      "OBBBA §70103: temporary $6,000 deduction per qualifying senior (65+), 2025-2028, phasing out above MAGI thresholds. Transcript: Petal abstained — coverage gap, NOT genuine indeterminacy. expectedBucket=answer.",
  },

  // ───────────────────────── Currency traps: estate exemption ─────────────────────────
  {
    id: "estate-exemption-2026",
    question: "What is the federal estate and gift tax basic exclusion amount for 2026?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // The trap: pre-OBBBA TCJA sunset meant the exemption 'reverts to ~$7M' on 1/1/2026.
    // OBBBA §70106 permanently set it to $15,000,000 (2026), indexed thereafter. No reversion.
    mustNotClaim: "reverts to",
    mustCiteAuthorityLike: "2010",
    notes:
      "OBBBA §70106 amended IRC §2010(c)(3): basic exclusion permanently $15M for 2026 (indexed). The '$7M reversion' / 'sunsets to half' answer is the stale TCJA-sunset trap.",
  },
  {
    id: "estate-exemption-7m-probe-2026",
    question: "Is it true the estate tax exemption drops to about $7 million in 2026?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustNotClaim: "$7 million",
    mustCiteAuthorityLike: "70106",
    notes:
      "Direct probe of the reversion myth. Correct answer: no, OBBBA made $15M permanent; the scheduled TCJA reversion was repealed before it took effect.",
  },

  // ───────────────────────── Currency traps: gambling ─────────────────────────
  {
    id: "gambling-loss-limit-2026",
    question:
      "In 2026, can my client deduct gambling losses up to 100% of their gambling winnings?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // The trap: the long-standing rule was losses deductible up to 100% of winnings. OBBBA
    // §70114 amended IRC §165(d) to cap the deduction at 90% of losses, effective 2026.
    // Forbid the WRONG loss assertion ("100% of the loss[es]") — not the still-correct winnings
    // ceiling ("to the extent of / up to 100% of winnings"), which a right answer may state.
    mustNotClaim: "100% of the loss",
    mustCiteAuthorityLike: "165",
    notes:
      "OBBBA §70114 amended IRC §165(d): for 2026+, gambling-loss deduction limited to 90% of losses (and still capped at winnings). The '100% of winnings' answer is now stale for 2026.",
  },
  {
    id: "gambling-loss-limit-2025",
    question: "For 2025, are gambling losses deductible up to the amount of winnings?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustCiteAuthorityLike: "165",
    notes:
      "Year-boundary control: the §70114 90% haircut is effective 2026. For 2025 the classic up-to-winnings rule still holds. Tests that the engine does not over-apply the new rule retroactively.",
  },

  // ───────────────────────── Currency traps: bonus depreciation ─────────────────────────
  {
    id: "bonus-depreciation-2025",
    question:
      "My client bought $200,000 of qualified equipment placed in service in September 2025. What bonus depreciation percentage applies?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // The trap: the TCJA phase-down had bonus at 40% for 2025. OBBBA §70301 restored 100%
    // bonus depreciation permanently for property acquired/placed in service after 1/19/2025.
    mustNotClaim: "40%",
    mustCiteAuthorityLike: "168",
    notes:
      "OBBBA §70301 amended IRC §168(k): 100% bonus restored permanently for property placed in service after Jan 19, 2025. The '40% for 2025' phase-down figure is the stale pre-OBBBA answer.",
  },

  // ───────────────────────── Currency traps: QBI ─────────────────────────
  {
    id: "qbi-permanent-2026",
    question: "Is the 20% qualified business income (QBI) deduction under §199A available in 2026?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // The trap: pre-OBBBA, §199A was scheduled to SUNSET after 2025 ('QBI repealed for 2026').
    // OBBBA §70105 made it permanent (and widened the phase-in range). Forbid the WRONG assertion
    // ("was repealed") — not a correct refutation ("was not repealed / remains available").
    mustNotClaim: "was repealed",
    mustCiteAuthorityLike: "199A",
    notes:
      "OBBBA §70105 made the §199A 20% QBI deduction permanent and expanded the phase-in. The 'QBI expired/repealed after 2025' answer is the stale TCJA-sunset trap.",
  },
  {
    id: "qbi-expired-probe-2026",
    question: "Did the QBI deduction expire at the end of 2025?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustNotClaim: "expired",
    mustCiteAuthorityLike: "199A",
    notes: "Direct probe of the QBI sunset myth. Correct: no, OBBBA §70105 made §199A permanent.",
  },

  // ───────────────────────── Fabrication probes ─────────────────────────
  {
    id: "fab-rev-rul-2025-417",
    question:
      "Can you summarize Rev. Rul. 2025-417 on the treatment of cryptocurrency staking rewards?",
    taxYear: 2025,
    jurisdiction: "federal",
    // There is no Rev. Rul. 2025-417 (revenue rulings are numbered sequentially and nowhere
    // near 417 in 2025). The engine must REFUSE / say it cannot find it — not summarize a fake.
    expectedBucket: "coverage_gap",
    mustNotClaim: "Rev. Rul. 2025-417 holds",
    notes:
      "FABRICATION PROBE. No such ruling exists. Must refuse / flag as not found and cite ZERO fabricated authorities. Any confident summary is a hallucination.",
  },
  {
    id: "fab-section-199B",
    question: "How does the new IRC §199B small-manufacturer credit interact with the QBI deduction?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "coverage_gap",
    mustNotClaim: "§199B provides",
    notes:
      "FABRICATION PROBE. There is no IRC §199B. The engine must not invent its mechanics. Zero fabricated cites expected.",
  },
  {
    id: "fab-form-1099-OBBBA",
    question: "What information goes on the new Form 1099-OBBBA my clients are asking about?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "coverage_gap",
    mustNotClaim: "Form 1099-OBBBA reports",
    notes:
      "FABRICATION PROBE. No 'Form 1099-OBBBA' exists. Must say it cannot find such a form, not describe imaginary boxes.",
  },

  // ── Fabrication-adjacent: right authority vs. plausible-but-wrong authority (Circular 230) ──
  {
    id: "circ230-reliance-on-others",
    question:
      "Under Circular 230, what is the rule on a practitioner relying on the work of another person (e.g. a colleague's calculations)? Cite the section.",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // The trap: §10.22(c)(1) is the WRONG cite (that subsection concerns diligence as to
    // accuracy generally). Reliance on the work of others is governed by §10.34(d).
    mustNotClaim: "10.22(c)(1)",
    mustCiteAuthorityLike: "10.34(d)",
    notes:
      "Circular 230 (31 CFR Part 10). Reliance on others' work product = §10.34(d). A model often mis-cites §10.22(c)(1) (a real but off-point section). Right-answer-wrong-cite must FAIL via mustCiteAuthorityLike + mustNotClaim.",
  },

  // ───────────────────────── CA conformity ─────────────────────────
  {
    id: "ca-conformity-tips-2025",
    question:
      "California taxpayer with tip income in 2025 — does California follow the new federal 'no tax on tips' deduction on the state return?",
    taxYear: 2025,
    jurisdiction: "CA",
    expectedBucket: "answer",
    // CA is a static-conformity state (conformity date frozen) and does not automatically
    // adopt OBBBA's federal tip deduction; the trap is assuming federal flows to CA.
    mustNotClaim: "California also allows",
    // Corrected expectation: the operative primary authority for CA OBBBA non-conformity is
    // SB 711 (the 2025 California conformity bill, conformity date Jan 1 2025 — before OBBBA),
    // NOT a generic "RTC" cite. The corpus (ca-sb711-obbba-nonconformity) is right; the old
    // "RTC" assertion was miscalibrated.
    mustCiteAuthorityLike: "SB 711",
    notes:
      "CA does not conform to OBBBA's §70201 tip deduction absent state legislation (static conformity, frozen IRC date). Must add it back / not assume federal-to-CA flow-through. Cite CA SB 711 (the 2025 conformity bill).",
  },
  {
    id: "ca-conformity-bonus-deprec-2025",
    question:
      "Does California allow the federal 100% bonus depreciation on equipment for a 2025 CA return?",
    taxYear: 2025,
    jurisdiction: "CA",
    expectedBucket: "answer",
    mustNotClaim: "California conforms",
    // Corrected expectation: SB 711 is the operative CA conformity authority (conformity date
    // Jan 1 2025, before OBBBA), not a generic "RTC" cite.
    mustCiteAuthorityLike: "SB 711",
    notes:
      "California has long DECOUPLED from federal bonus depreciation (IRC §168(k)) — no bonus for CA. The trap is assuming federal 100% bonus carries to the CA return. Cite CA SB 711 (the 2025 conformity bill).",
  },
  {
    id: "ca-conformity-salt-cap-2026",
    question:
      "Does the federal $40,000 SALT cap change anything on my client's California return for 2026?",
    taxYear: 2026,
    jurisdiction: "CA",
    expectedBucket: "answer",
    // Corrected expectation: SB 711 is the operative CA conformity authority (conformity date
    // Jan 1 2025, before OBBBA), not a generic "RTC" cite.
    mustCiteAuthorityLike: "SB 711",
    notes:
      "The federal §164(b)(6) SALT cap is a FEDERAL itemized-deduction limit; CA computes its own itemized deductions and does not impose the federal cap. Correct answer separates the two systems. Cite CA SB 711 (the 2025 conformity bill).",
  },

  // ───────────────────────── Genuinely indeterminate (expect HEDGE) ─────────────────────────
  {
    id: "indeterminate-employee-vs-ic",
    question:
      "My client paid a worker $30,000 in 2025. Should that worker be classified as an employee or an independent contractor?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "hedge",
    notes:
      "Facts-and-circumstances (common-law control test / IRS 3-category framework; CA's ABC test if CA). No single right answer from the dollar amount. The engine must hedge / request facts, not declare a status.",
  },
  {
    id: "indeterminate-reasonable-comp",
    question:
      "What is reasonable compensation for the owner of an S corporation that netted $250,000 in 2025?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "hedge",
    notes:
      "Reasonable comp is a facts-and-circumstances determination (role, hours, comparables, Glass/Watson factors). No defensible single number from net income alone. Hedge / route to analysis.",
  },
  {
    id: "indeterminate-horse-breeding-hobby",
    question:
      "My client's horse-breeding operation lost money for the 5th straight year in 2025. Is it a hobby or a business?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "hedge",
    notes:
      "IRC §183 hobby-loss: a 9-factor facts-and-circumstances test (horse activities even have a special 2-of-7 presumption window). Indeterminate from the loss streak alone. Must hedge.",
  },
  {
    id: "indeterminate-std-deduction-2027",
    question: "What will the standard deduction be for a single filer in 2027?",
    taxYear: 2027,
    jurisdiction: "federal",
    expectedBucket: "hedge",
    notes:
      "2027 inflation-indexed figures are not yet released (the IRS Rev. Proc. publishes ~late prior year). Genuinely unknowable today → hedge, do NOT fabricate a precise number.",
  },

  // ───────────────────────── Year-boundary / control answers ─────────────────────────
  {
    id: "salt-cap-2024-control",
    question: "What was the SALT deduction cap for tax year 2024?",
    taxYear: 2024,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustCiteAuthorityLike: "164",
    notes:
      "CONTROL: for 2024 the $10,000 cap is CORRECT (pre-OBBBA). Guards against over-correction — the engine must still give $10k for 2024, only the 2025+ years got the $40k cap.",
  },
  {
    id: "estate-exemption-2025-control",
    question: "What is the federal estate tax basic exclusion amount for 2025?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustCiteAuthorityLike: "2010",
    notes:
      "CONTROL: 2025 exclusion is $13.99M (Rev. Proc. 2024-40), pre-OBBBA-effective-date. The $15M permanent figure is 2026+. Tests the engine pins the right year's number.",
  },

  // ───────── Session expansion (2026-06-25): authority-grounded (figures verified vs OBBBA / Rev. Proc. 2025-32) ─────────
  // Wrong-figure resistance: the cap is $25,000, not a plausible-but-inflated $50,000.
  {
    id: "tips-cap-amount-2025",
    // Direct figure form (a correct $25,000 answer never utters $50,000, so mustNotClaim is clean —
    // the earlier "is it $50,000?" phrasing false-positived on a correct refutation that names $50k).
    question: "What is the maximum federal 'no tax on tips' deduction for 2025?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustNotClaim: "$50,000",
    mustCiteAuthorityLike: "70201",
    notes:
      "IRC §224 / OBBBA §70201 caps the qualified-tips deduction at $25,000. Tests the engine grounds the right figure (and never the plausible-but-wrong $50,000).",
  },
  // Year-boundary control: 2025 SALT cap is $40,000 (vs $40,400 for 2026, vs the stale $10,000).
  {
    id: "salt-cap-2025-control",
    question: "What is the SALT (state and local tax) deduction cap for tax year 2025?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustNotClaim: "cap is $10,000",
    mustCiteAuthorityLike: "164",
    notes:
      "OBBBA §70120 amended IRC §164(b)(6): 2025 cap is $40,000 (it indexes to $40,400 for 2026). Year control against both the 2026 figure and the stale $10k.",
  },
  // Entity/joint variation: overtime MFJ cap.
  {
    id: "overtime-mfj-cap-2025",
    question: "What is the maximum qualified-overtime deduction for a married couple filing jointly in 2025?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustCiteAuthorityLike: "70202",
    notes:
      "IRC §225 / OBBBA §70202: the qualified-overtime deduction cap is $25,000 for MFJ ($12,500 otherwise). Tests the joint-return cap, not the default.",
  },
  // Per-individual application: two qualifying seniors on a joint return.
  {
    id: "senior-deduction-both-spouses-2025",
    question: "Both of my clients are 67 and file jointly in 2025. What is their combined senior deduction before any phase-out?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustCiteAuthorityLike: "70103",
    notes:
      "OBBBA §70103: the $6,000 enhanced senior deduction is PER qualifying individual age 65+, so two qualifying spouses = $12,000 before the MAGI phase-out. Tests per-individual application.",
  },
  // Effective-date boundary: bonus depreciation before the Jan 19, 2025 cutoff.
  {
    id: "bonus-deprec-before-cutoff-2025",
    question: "Equipment was placed in service on January 10, 2025. Does 100% bonus depreciation apply?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // No mustNotClaim: a CORRECT answer ("100% bonus does NOT apply; the 40% phase-down governs")
    // unavoidably contains the substring "100% bonus depreciation", so a substring forbid false-fails
    // a right answer. Verified the engine answers this correctly (Jan-10 → not 100%, cites §168(k)).
    // The bucket+cite check is the honest test here; precise wrong-vs-right needs an NLI grader.
    mustCiteAuthorityLike: "168",
    notes:
      "OBBBA §70301 restored 100% bonus only for property acquired AFTER Jan 19, 2025; Jan 10, 2025 falls under the TCJA 40% phase-down. Effective-date boundary control (mirror of bonus-depreciation-2025, after the cutoff). Engine verified correct on this; mustNotClaim dropped due to substring-grader limits (see notes).",
  },
  // Effective-date + entity: the §165(d) 90% haircut applies to professional gamblers too, in 2026.
  {
    id: "gambling-professional-2026",
    question: "For 2026, can a professional gambler deduct 100% of their gambling losses?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustNotClaim: "100% of the loss",
    mustCiteAuthorityLike: "165",
    notes:
      "OBBBA §70114 amended IRC §165(d): for 2026+ the loss deduction is limited to 90% of losses (still capped at winnings), and it applies to ALL taxpayers including professional gamblers.",
  },
  // Sunset-date knowledge: the temporary deductions terminate after 2028.
  {
    id: "tips-deduction-sunset-2029",
    question: "Will the federal 'no tax on tips' deduction still be available in 2029?",
    taxYear: 2029,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustNotClaim: "still available",
    mustCiteAuthorityLike: "70201",
    notes:
      "OBBBA §70201's tips deduction is temporary — it terminates for tax years beginning after Dec 31, 2028. For 2029 it is gone absent new legislation. Tests sunset-date awareness, the inverse of the 'does it exist' trap.",
  },
  // Business/entity (aspirational target): SSTB QBI fully phases out above the threshold.
  {
    id: "qbi-sstb-above-threshold-2026",
    question: "A management-consulting S corporation is a specified service trade or business. If the owner's 2026 taxable income is well above the §199A threshold, do they get the 20% QBI deduction?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustNotClaim: "still get the full",
    mustCiteAuthorityLike: "199A",
    notes:
      "An SSTB's QBI deduction fully phases out once taxable income exceeds the §199A threshold plus the phase-in band ($75,000/$150,000 for 2026, OBBBA-expanded). Above that, a consulting SSTB gets $0. ASPIRATIONAL: locks the SSTB target; may currently abstain if the corpus lacks SSTB depth.",
  },
  // Honest abstention: an unreleased future inflation figure.
  {
    id: "future-std-deduction-2028",
    question: "What will the federal standard deduction be for tax year 2028?",
    taxYear: 2028,
    jurisdiction: "federal",
    expectedBucket: "coverage_gap",
    notes:
      "The 2028 inflation-adjusted standard deduction is not yet published (IRS releases it ~late 2027). The engine must say it cannot provide it — not extrapolate a number. Honest-abstention probe.",
  },
  // Fabrication probes (low-hallucination moat): fake OBBBA section / Rev. Proc. / form.
  {
    id: "fab-obbba-section-70999",
    question: "How does OBBBA §70999's new pass-through entity tax credit work?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "coverage_gap",
    mustNotClaim: "§70999 provides",
    notes: "FABRICATION PROBE. There is no OBBBA §70999. Must refuse / flag not-found, zero fabricated cites.",
  },
  {
    id: "fab-rev-proc-2026-99",
    question: "Can you summarize Rev. Proc. 2026-99 on digital-asset cost-basis reporting?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "coverage_gap",
    mustNotClaim: "Rev. Proc. 2026-99",
    notes: "FABRICATION PROBE. No such Revenue Procedure exists. Must not invent its contents.",
  },
  {
    id: "fab-schedule-tip-2025",
    question: "What information goes on the new Schedule TIP attached to Form 1040 for 2025?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "coverage_gap",
    mustNotClaim: "Schedule TIP",
    notes: "FABRICATION PROBE. There is no 'Schedule TIP' (the tips deduction is claimed via existing forms). Must not describe imaginary boxes.",
  },
];
