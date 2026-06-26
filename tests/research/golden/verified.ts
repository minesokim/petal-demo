import type { GoldenCase } from "./cases";

// SOURCE-VERIFIED golden set. Unlike a hand-authored answer key, EVERY answer here was confirmed to appear
// LITERALLY in the cited primary source via a live fetch through Petal's own sources (GovInfo Title 26 /
// eCFR), not asserted from memory. These are settled, bright-line rules — there is exactly one right
// answer and it is in the statute/reg text — so this set measures whether the engine gets SETTLED law
// right (an unambiguous gate), complementing the hard-edge / unsettled Blue J set. Each note records the
// exact source and the verification. expectedBucket is "answer" for all: a settled rule must be answered.
export const VERIFIED_CASES: GoldenCase[] = [
  {
    id: "verified-121-home-sale-mfj",
    question: "What is the maximum gain a married couple filing jointly can exclude on the sale of their principal residence under IRC section 121?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustClaim: "500,000",
    mustCiteAuthorityLike: "121",
    notes: "VERIFIED in 26 U.S.C. §121(b)(2): the MFJ exclusion is $500,000 ($250,000 otherwise). Confirmed present in the fetched GovInfo Title-26 source text.",
  },
  {
    id: "verified-1031-real-property-only",
    question: "After the Tax Cuts and Jobs Act, what kind of property qualifies for a like-kind exchange under IRC section 1031?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustClaim: "real property",
    mustCiteAuthorityLike: "1031",
    notes: "VERIFIED in 26 U.S.C. §1031(a)(1): post-TCJA, like-kind exchange treatment applies ONLY to real property held for productive use or investment. Confirmed in the fetched source.",
  },
  {
    id: "verified-61-gross-income",
    question: "How does IRC section 61 define gross income?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustClaim: "whatever source derived",
    mustCiteAuthorityLike: "61",
    notes: "VERIFIED in 26 U.S.C. §61(a): gross income means all income from whatever source derived. Confirmed present in the fetched source.",
  },
  {
    id: "verified-6662-accuracy-penalty-rate",
    question: "What is the rate of the IRC section 6662 accuracy-related penalty on an underpayment?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustClaim: "20",
    mustCiteAuthorityLike: "6662",
    notes: "VERIFIED in 26 U.S.C. §6662(a): the accuracy-related penalty is 20 percent of the portion of the underpayment to which it applies. Confirmed in the fetched source.",
  },
  {
    id: "verified-163j-business-interest-limit",
    question: "What percentage of adjusted taxable income is the base limit on the IRC section 163(j) business interest deduction?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustClaim: "30",
    mustCiteAuthorityLike: "163",
    notes: "VERIFIED in 26 U.S.C. §163(j)(1): business interest is limited to business interest income plus 30 percent of adjusted taxable income (plus floor plan financing). Confirmed in the fetched source.",
  },
  {
    id: "verified-1202-qsbs-holding-period",
    question: "How long must a taxpayer hold qualified small business stock under IRC section 1202 to claim the gain exclusion (pre-OBBBA rule)?",
    taxYear: 2024,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustClaim: "five years",
    mustCiteAuthorityLike: "1202",
    notes: "VERIFIED in 26 U.S.C. §1202(a)/(b): the stock must be held for MORE THAN FIVE YEARS. Confirmed present in the fetched source.",
  },
  {
    id: "verified-7703-marital-status-yearend",
    question: "Under IRC section 7703, when is a taxpayer's marital status determined for the tax year?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustClaim: "close of",
    mustCiteAuthorityLike: "7703",
    notes: "VERIFIED in 26 U.S.C. §7703(a): marital status is determined as of the close of the taxable year (with a special rule for a spouse who dies during the year). Confirmed in the fetched source.",
  },
  {
    id: "verified-199A5-sstb-reputation-skill",
    question: "Under the section 199A regulations, the 'reputation or skill' SSTB clause is limited to which kinds of income?",
    taxYear: 2025,
    jurisdiction: "federal",
    expectedBucket: "answer",
    mustClaim: "endors",
    mustCiteAuthorityLike: "199A",
    notes: "VERIFIED in 26 C.F.R. §1.199A-5(b)(2)(xiv): limited to (1) endorsement income, (2) licensing an individual's image/likeness/name, and (3) appearance/media-event fees. Confirmed present in the fetched eCFR source text.",
  },
];
