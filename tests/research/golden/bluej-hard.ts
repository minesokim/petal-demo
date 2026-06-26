import type { GoldenCase } from "./cases";

// BLUE J-TIER HARD SET — 15 brutal questions held out as a top-difficulty benchmark, distinct from the
// currency/plumbing golden set. The point is NOT a single number; it is the two things that separate a
// research tool from an answer generator at this tier:
//   (1) keeping interacting limitations in the right ORDER on multi-section computations, and
//   (2) the discipline to say "unsettled" on the genuinely-open OBBBA edges instead of guessing.
//
// GRADING INVERTS on the back half. Tier A–D + the capstone have correct answers: the pass is reaching them
// with the right authority (partial credit for the right framework if a figure is off). Tier E has NO answer:
// a CONFIDENT yes/no is an automatic FAIL — the pass is identifying it is unsettled and weighing the
// competing positions. So Tier E cases pin expectedBucket: "hedge" (and the judge enforces "no false
// certainty"). The full answer key per item lives in `notes`; mustClaim/mustNotClaim pin only the anchors
// that won't false-positive on a correct answer.

export const BLUEJ_HARD_CASES: GoldenCase[] = [
  // ───────────────── Tier A — multi-section interaction & ordering (settled, hard) ─────────────────
  {
    id: "bluej-a1-loss-ordering-461l-mfj-2026",
    question:
      "Client, married filing jointly, tax year 2026: a $1,200,000 loss from an S-corp she materially participates in (driven by 100% bonus depreciation and a §168(n) qualified production property deduction), $300,000 of business income from another active entity, $400,000 of spouse W-2 wages, and a $1,000,000 long-term capital gain on publicly traded stock. Walk the loss through to the currently deductible amount and the carryover.",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // Ordering: basis → §465 at-risk → §469 passive → §461(l) LAST. EBL threshold 2026 MFJ = $512,000
    // (reset from $626,000). Spouse W-2 and the $1M LT cap gain are NOT business income and do not absorb
    // the loss. The disallowed excess carries forward as a PLAIN NOL with NO §461(l) retest (enacted
    // Senate treatment; the House retest did not become law). Net business loss $900,000; $388,000 carries.
    mustCiteAuthorityLike: "461",
    mustClaim: "512,000",
    notes:
      "Tier A. PASS = correct ordering (basis, at-risk, passive, 461(l) last), EBL $512,000 MFJ 2026, exclude spouse W-2 + the $1M cap gain, carryover = plain NOL with NO retest. Trap: netting the loss against the capital gain, or applying a retest that is not in the enacted law.",
  },
  {
    id: "bluej-a2-tip-deduction-se-eitc-2026",
    question:
      "Self-employed hairstylist, single, 2026: $34,000 of Schedule C net profit, of which $20,000 is qualified tips. Does the §224 tip deduction reduce her self-employment tax, and does it change her EITC?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // §224 is a separate above-the-line deduction that does NOT reduce net earnings from self-employment,
    // so SE tax is unchanged. Tips remain EARNED INCOME for EITC; the deduction lowers AGI but not earned
    // income, and because the phaseout runs on the GREATER of earned income or AGI, in the phaseout range
    // it generally does not increase her EITC. Trap: treating it as a Schedule C expense, or assuming it
    // lifts the EITC.
    mustCiteAuthorityLike: "224",
    notes:
      "Tier A. PASS = §224 does NOT reduce SE tax (still on $34k net profit), tips stay earned income for EITC, phaseout on greater-of so the deduction generally does not raise EITC. Trap: Schedule C expense, or EITC goes up.",
  },
  {
    id: "bluej-a3-overtime-fluctuating-workweek-225",
    question:
      "Salaried nonexempt employee, $1,000 weekly salary under a valid fluctuating-workweek arrangement, works 50 hours one week and 45 the next. Compute the qualified overtime compensation under §225 for those two weeks.",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // §225 reaches only the FLSA-required premium ABOVE the regular rate. Under the fluctuating-workweek
    // method the regular rate = salary / all hours worked, and the premium is HALF that rate (straight time
    // already covered by salary). Wk1: rate $20.00, premium $10.00 × 10h = $100. Wk2: rate $22.22, premium
    // $11.11 × 5h = $55.56. Trap: using 1.5× and a fixed hourly rate (wrong both weeks).
    mustCiteAuthorityLike: "225",
    notes:
      "Tier A (hardest pure computation). PASS = half-time premium on a weekly-varying regular rate: $100 (wk1) and $55.56 (wk2). Trap: 1.5× a fixed hourly rate.",
  },

  // ───────────────── Tier B — circular & stacked computations ─────────────────
  {
    id: "bluej-b1-qbi-circularity-floor",
    question:
      "Sole proprietor, non-SSTB, $180,000 Schedule C profit, pays $24,000 in self-employed health insurance, 2026. Walk the QBI computation, including the OBBBA minimum floor.",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // The §162(l) SE health-insurance deduction and the §164(f) SE-tax deduction both reduce QBI; QBI is
    // then capped at 20% of taxable income less net capital gain; the OBBBA §199A floor guarantees at least
    // $400 for an active business with ≥ $1,000 of QBI. A top answer names the iteration rather than
    // silently linearizing. Trap: 20% of $180,000 and stop.
    mustCiteAuthorityLike: "199A",
    notes:
      "Tier B. PASS = reduce QBI by SE-tax-half AND SE health insurance, 20%-of-taxable-income cap, $400 floor is a floor not an add-on, name the sequence/iteration. (Genuine circularity only bites with a marketplace PTC, absent here — do not invent it.)",
  },
  {
    id: "bluej-b2-marginal-rate-stacking-salt-2026",
    question:
      "Single filer, 2026, taxable income $560,000, all wages, itemizes with $45,000 of SALT actually paid. What is the marginal federal rate on the next $10,000 of wages?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // Binding constraint here is the SALT phase-down: each $1 of MAGI over the threshold cuts allowed SALT
    // by $0.30, so taxable income rises ~$1.30 per $1 of wages → 35% × 1.30 = ~45.5%. On THESE facts §68
    // (37% bracket) and NIIT (no investment income) do NOT trigger; flag the AMT crossover as the real
    // wrinkle. PASS = surface the SALT phase-down mechanic + a banded rate (~45.5%) + the AMT caveat;
    // do NOT mechanically pile on §68/NIIT that don't apply.
    mustCiteAuthorityLike: "164",
    notes:
      "Tier B. PASS = ~45.5% driven by the SALT phase-down (1.30 multiplier at 35%), AMT flagged; correctly EXCLUDE §68 and NIIT on these facts. Trap: piling on inapplicable limits → wrong, too-high rate.",
  },

  // ───────────────── Tier C — authority weight & penalty standards (Blue J core) ─────────────────
  {
    id: "bluej-c1-loper-bright-interpretive-reg",
    question:
      "An OBBBA provision is ambiguous, and a Treasury regulation issued under the general §7805 authority interprets it against my client; we think the reg is wrong on the statute's plain text. Can the client take the contrary position, and what is the penalty exposure?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // Distinguish express-delegation regs (durable) from general §7805 interpretive regs (more open to
    // challenge post-Loper Bright). Contrary position allowed if a reasonable basis the reg is invalid, but
    // the disregard-of-regulations penalty requires Form 8275-R disclosure with a good-faith challenge.
    // The reg still counts as authority in the §1.6662-4(d)(3) weighing, but a strong textual argument now
    // carries more relative weight vs a §7805 interpretive reg than under Chevron. FAIL = "it's a reg, you
    // must follow it" OR "Chevron is dead, ignore it".
    mustCiteAuthorityLike: "8275",
    notes:
      "Tier C. PASS = express-delegation vs §7805-interpretive distinction, reasonable-basis-to-challenge + Form 8275-R, reg still weighed under 1.6662-4(d)(3) but textual argument weighs more post-Loper Bright. Trap: either extreme (must-follow / ignore-it).",
  },
  {
    id: "bluej-c2-preparer-taxpayer-standard-divergence-35pct",
    question:
      "Undisclosed, non-tax-shelter position with roughly a 35% chance of winning. What are my exposures as preparer and the client's as taxpayer, and what fixes it?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // 35% is reasonable basis but NOT substantial authority. Preparer needs substantial authority under
    // §6694(a) for an undisclosed position; a reasonable-basis-but-not-substantial-authority position should
    // be disclosed on Form 8275. Disclosure drops the required standard to reasonable basis for BOTH the
    // §6694 preparer penalty and the §6662 substantial-understatement penalty → the fix is Form 8275.
    mustCiteAuthorityLike: "6694",
    mustClaim: "8275",
    notes:
      "Tier C. PASS = 35% = reasonable basis not substantial authority; §6694(a) needs substantial authority undisclosed; Form 8275 disclosure drops both §6694 and §6662 to reasonable basis. Trap: conflating the two standards or forgetting disclosure changes the threshold.",
  },

  // ───────────────── Tier D — edge-of-definition calls (fact-specific, hard) ─────────────────
  {
    id: "bluej-d1-sstb-creator-199a",
    question:
      "Influencer LLC earns $200,000: $120,000 from YouTube ad revenue on her own content, $50,000 from brand-endorsement deals, and $30,000 from licensing her likeness. Which is SSTB income for §199A?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // The reg narrows the reputation-or-skill catch-all to endorsement income, licensing of image/name/
    // likeness/voice, and appearance fees. So the $50k endorsement + $30k licensing are SSTB; the $120k of
    // ad revenue from producing content is NOT automatically SSTB. FAIL = labeling the whole thing SSTB
    // because it depends on her personal brand.
    mustCiteAuthorityLike: "199A",
    notes:
      "Tier D. PASS = endorsement ($50k) + likeness licensing ($30k) are SSTB; ad revenue on own content ($120k) is not automatically SSTB. Trap: whole thing SSTB.",
  },
  {
    id: "bluej-d2-qsbs-qtb-fintech-1202",
    question:
      "My client's C-corp is a lending platform that originates consumer loans through an app. Is it a qualified trade or business for §1202 (QSBS)?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // §1202(e)(3) excludes banking, insurance, financing, leasing, investing, or similar. A company in the
    // business of LENDING money is excluded; a software/technology platform that merely facilitates lending
    // may qualify. Fact-specific characterization with no bright line — the honest answer FLAGS this as the
    // determinative, contestable issue rather than declaring it qualified. FAIL = "it's a tech company, it
    // qualifies."
    mustCiteAuthorityLike: "1202",
    notes:
      "Tier D. PASS = §1202(e)(3) financing exclusion is the determinative, fact-specific issue (lending economics vs software facilitation); refuse to sign off without a facts memo. Trap: declaring it qualified.",
  },
  {
    id: "bluej-d3-six-year-statute-home-concrete-6501",
    question:
      "Client omitted income and also overstated basis on a 2022 sale, together exceeding 25% of gross income. Is the return open under the six-year statute, and can a corrective filing protect the preparer?",
    taxYear: 2022,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // The 2015 amendment to §6501(e)(1)(B)(ii) OVERRODE Home Concrete: a basis overstatement now counts
    // toward the 25% omission, so the six-year statute applies. A qualified amended return filed before the
    // client (or preparer) is contacted for exam can cure §6694 exposure (Treas. Reg. 1.6664-2(c)).
    // FAIL = citing Home Concrete as if basis overstatements still don't count.
    mustCiteAuthorityLike: "6501",
    notes:
      "Tier D. PASS = 2015 amendment overrode Home Concrete (basis overstatement counts → 6-year statute applies), qualified amended return before contact cures §6694 + Circular 230 duty. Trap: Home Concrete still good law.",
  },

  // ───────────────── Tier E — genuinely unsettled OBBBA edges (pass = the analysis, NOT an answer) ─────────────────
  // expectedBucket "hedge": a CONFIDENT yes/no is an automatic FAIL; pass = name it unsettled + weigh both sides.
  {
    id: "bluej-e1-qsbs-1045-rollover-across-effective-date",
    question:
      "Client holds pre-July-4-2025 QSBS, sells at a gain, and does a §1045 rollover into replacement QSBS acquired in 2026. Does the replacement stock get the new tiered exclusion and $15M cap, or the old $10M five-year regime?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "hedge",
    // UNSETTLED. The replacement stock is literally acquired after 7/4/2025 (argues new regime), but §1045
    // tacks the holding period under §1223 and treats the rollover as a continuation (argues old character).
    // No guidance. PASS = lay out both positions + weight them. A confident answer FAILS.
    mustCiteAuthorityLike: "1045",
    notes:
      "Tier E (unsettled). PASS = identify the open conflict (acquired-after-date vs §1223 continuation) and weigh both; FAIL = a confident yes/no.",
  },
  {
    id: "bluej-e2-168n-substantial-transformation",
    question:
      "Is a semiconductor fabrication facility 'qualified production property' eligible for 100% expensing under §168(n)?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // CORRECTED KEY (adversarial verification 2026-06-25): "substantial transformation" is DEFINED, NOT
    // reserved — IRS Notice 2026-16 §5.02(9) defines it as a final, complete, distinct item fundamentally
    // different from the inputs. So this is answerable as a space-ALLOCATION call: clean-room/production
    // areas are strong candidates, office/admin/R&D excluded, with documentation + placed-in-service dating.
    // PASS = ground the §168(n) statute + the Notice 2026-16 definition and reason the allocation; a
    // conditioned hedge is acceptable. FAIL = asserting the definition is "reserved" (a factual error).
    mustCiteAuthorityLike: "168",
    mustClaim: "substantial transformation",
    notes:
      "Tier D (was mis-keyed as unsettled). The controlling term IS defined in Notice 2026-16 §5.02(9). PASS = ground the definition + the production-vs-admin allocation. Trap: calling the definition reserved.",
  },
  {
    id: "bluej-e3-trump-account-distribution-character",
    question:
      "Client's child turns 18 in 2027 and wants a distribution from a Trump Account. How is the earnings portion taxed, and how do prior §128 employer contributions affect it?",
    taxYear: 2027,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // CORRECTED KEY: the CHARACTER is settled by statute — a Trump Account is a traditional IRA under
    // §408(a); the earnings/over-basis portion is taxed as ORDINARY income (NOT long-term capital gain),
    // with possible 10% early-withdrawal penalty + kiddie-tax exposure. Pre-tax §128 employer/government
    // contributions are taxable as ordinary income on withdrawal. Only the DETAILED distribution mechanics
    // are reserved (Notice 2025-68). FAIL = "earnings are long-term capital gain" (the exact error in the
    // hardest test). This is the only outright-wrong answer Petal gave, and it is a knowable, citable fact.
    mustCiteAuthorityLike: "408",
    mustClaim: "ordinary",
    mustNotClaim: "capital gain",
    notes:
      "Tier D/E hybrid. PASS = ORDINARY income (traditional-IRA character), pretax §128 contributions taxable as ordinary, note detailed mechanics reserved. HARD FAIL = long-term capital gain. (Corpus fix target.)",
  },
  {
    id: "bluej-e4-remittance-excise-stablecoin-4475",
    question:
      "Client sends $5,000 of USDC abroad to family. Is it subject to the 1% §4475 remittance tax?",
    taxYear: 2026,
    jurisdiction: "federal",
    expectedBucket: "hedge",
    // NOVEL. §4475 reaches transfers funded with cash, a money order, a cashier's check, or a similar
    // PHYSICAL instrument; a stablecoin is not a physical instrument (argues outside), but the provision is
    // new and untested and Treasury could read "similar instrument" broadly. PASS = reason from the
    // physical-instrument FUNDING test to a likely-outside conclusion while flagging it is untested. The
    // sharpest hook is the physical-instrument funding test, not the "remittance transfer provider" angle.
    mustCiteAuthorityLike: "4475",
    notes:
      "Tier E (novel). PASS = physical-instrument funding test → likely outside, flagged untested. Partial: right posture via the provider-definition route instead of the funding test.",
  },

  // ───────────────── Capstone — a real founder exit (full federal + state) ─────────────────
  {
    id: "bluej-capstone-founder-exit-qsbs-ca",
    question:
      "Founder incorporated his startup as a Delaware C-corp and took original-issuance stock in September 2025. He is a California resident. He expects a $40,000,000 gain on a sale at a 5-year hold in 2030. Walk the full federal and state picture.",
    taxYear: 2030,
    jurisdiction: "federal",
    expectedBucket: "answer",
    // Post-7/4/2025 stock → new tiers, 100% exclusion at the 5-year hold, capped at the greater of $15M or
    // 10x basis (low founder basis → the $15M dollar cap binds); gain above the cap is long-term capital
    // gain. NOTE: for 100%-exclusion (post-9/27/2010) stock there is NO AMT preference. California does NOT
    // conform to §1202, so the ENTIRE $40M is taxable in CA regardless of the federal exclusion. FAIL =
    // "100% excluded, no tax" (misses the cap and the California addback).
    mustCiteAuthorityLike: "1202",
    mustClaim: "California",
    notes:
      "Capstone. PASS = new-regime 100% exclusion capped at greater of $15M/10x basis, excess is LTCG, NO AMT preference on 100%-exclusion stock, and CA non-conformity taxes the full $40M. Trap: '100% excluded, no tax'.",
  },
];
