import type { AuthorityChunk } from "../tax/authority/store";

// ── SUBSECTION-DEPTH authority (corpus-depth phase). The general-section distilled chunks state a section's
// BROAD rule but omit the specific operative SUBSECTION a real question turns on — so the engine correctly
// ABSTAINED (it had §368 generally but not the §368(a)(1)(B) "solely for voting stock" rule, etc.). These are
// faithful public-domain paraphrases of the specific subsection, each VERIFIED against the primary statutory
// text on Cornell LII by the verify-subsection-rules workflow (2026-06-27) — benchmarkExpectedCorrect "yes" on
// all six, figures quoted exactly as the statute gives them. They give the model the precise sub-rule to ground
// on; the abstention moat is untouched (the model still abstains when it lacks the rule — we are giving it the
// rule, not loosening the calibration).
const YEARS = [2024, 2025, 2026, 2027, 2028];
const INGESTED = "2026-06-27T00:00:00Z";

export const CORPUS_SUBSECTIONS: AuthorityChunk[] = [
  {
    chunkId: "ingested-irc-368-a-1-b",
    authorityType: "statute",
    citation: "IRC §368(a)(1)(B)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1954-08-16",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/26/368",
    ingestedAt: INGESTED,
    text:
      "A 'B' reorganization (IRC §368(a)(1)(B)) is the acquisition by one corporation, in exchange SOLELY for all or a part of its own voting stock (or solely for voting stock of a corporation in control of the acquiring corporation), of stock of another corporation, if immediately after the acquisition the acquiring corporation has control of that other corporation. The 'solely for voting stock' requirement is strict: ANY non-stock consideration — cash, notes, or other boot, even a small amount paid only to cash out fractional shares or dissenting shareholders — DISQUALIFIES the transaction as a B reorganization. Unlike an 'A' or 'C' reorganization, a B reorganization allows no boot relaxation; the consideration must be exclusively voting stock. ('Control' here means at least 80 percent of voting power and 80 percent of each other class of stock, per §368(c).)",
    keywords: [
      "368", "368(a)(1)(b)", "b reorganization", "reorganization", "solely for voting stock", "voting stock",
      "boot", "cash consideration", "disqualifies", "stock-for-stock", "stock for stock", "fractional shares",
      "dissenting shareholders", "control", "acquisition", "tax-free reorganization", "non-stock consideration",
    ],
    precedential: true,
  },
  {
    chunkId: "ingested-irc-1031-f",
    authorityType: "statute",
    citation: "IRC §1031(f)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1989-07-10",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/26/1031",
    ingestedAt: INGESTED,
    text:
      "IRC §1031(f) is the RELATED-PARTY anti-abuse rule for like-kind exchanges. If a taxpayer exchanges like-kind property with a RELATED PERSON (related under §267(b) or §707(b)(1)) and, before the date 2 YEARS after the date of the last transfer that was part of the exchange, EITHER the related person disposes of the property received OR the taxpayer disposes of the like-kind property received, then the original nonrecognition does NOT apply — the gain or loss is taken into account as of the date of that later disposition. The 2-year clock is measured from the last transfer in the exchange, and the early-disposition trigger applies whether the related person or the taxpayer disposes. Exceptions (§1031(f)(2)): a disposition after the death of either party, a compulsory or involuntary conversion (§1033), or one established not to have tax avoidance as a principal purpose. A further anti-abuse rule (§1031(f)(4)) reaches exchanges structured to avoid the subsection.",
    keywords: [
      "1031", "1031(f)", "like-kind exchange", "like kind", "related party", "related person", "2 years",
      "two year", "two-year", "disposition", "nonrecognition", "267(b)", "707(b)", "basis shifting", "anti-abuse",
      "investment real estate", "gain recognized", "swap and drop",
    ],
    precedential: true,
  },
  {
    chunkId: "ingested-irc-3121-v-2",
    authorityType: "statute",
    citation: "IRC §3121(v)(2)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1983-04-20",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/26/3121",
    ingestedAt: INGESTED,
    text:
      "IRC §3121(v)(2) is the FICA SPECIAL TIMING RULE for nonqualified deferred compensation (NQDC). Under §3121(v)(2)(A), an amount deferred under a nonqualified deferred compensation plan is taken into account as FICA wages as of the LATER of (i) when the services are performed, or (ii) when there is no substantial risk of forfeiture of the rights to that amount — that is, at VESTING, not when the amount is actually paid out. Under the nonduplication rule of §3121(v)(2)(B) ('taxed only once'), any amount already taken into account as wages under (A), plus the income attributable to it, is NOT treated as FICA wages again when later distributed. A 'nonqualified deferred compensation plan' (§3121(v)(2)(C)) is any plan or arrangement for the deferral of compensation other than a qualified plan described in §3121(a)(5).",
    keywords: [
      "3121", "3121(v)(2)", "3121(v)", "fica", "nonqualified deferred compensation", "nqdc", "deferred compensation",
      "special timing rule", "substantial risk of forfeiture", "vesting", "wages", "later of", "nonduplication",
      "taxed only once", "payroll tax", "social security", "medicare", "account balance", "not be paid",
    ],
    precedential: true,
  },
  {
    chunkId: "ingested-irc-461-h-3",
    authorityType: "statute",
    citation: "IRC §461(h)(3)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1984-07-18",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/26/461",
    ingestedAt: INGESTED,
    text:
      "IRC §461(h)(3) is the RECURRING-ITEM EXCEPTION to the economic-performance requirement. An accrual-method taxpayer may treat a liability as INCURRED (and deduct it) in the taxable year even though economic performance has not yet occurred, if ALL of the following are met: (i) the all-events test (the fact of the liability is fixed and its amount is determinable with reasonable accuracy) is met during the year, determined without regard to economic performance; (ii) economic performance occurs within the SHORTER of a reasonable period after the close of the year OR 8½ MONTHS after the close of the year; (iii) the item is recurring in nature and the taxpayer consistently treats such items as incurred in the year the all-events test is met; and (iv) either the item is not material OR accruing it in that year results in a better match against the related income. The exception does NOT apply to workers' compensation or tort liabilities (§461(h)(2)(C)).",
    keywords: [
      "461", "461(h)(3)", "461(h)", "recurring item exception", "recurring-item", "economic performance",
      "all-events test", "all events test", "accrual method", "8.5 months", "8½ months", "8 1/2 months",
      "incurred", "deduction", "fixed and determinable", "matching", "reasonable period", "recurring liability",
    ],
    precedential: true,
  },
  {
    chunkId: "ingested-irc-6662-d-1-a",
    authorityType: "statute",
    citation: "IRC §6662(d)(1)(A)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1989-12-19",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/26/6662",
    ingestedAt: INGESTED,
    text:
      "IRC §6662(d)(1)(A) defines a SUBSTANTIAL UNDERSTATEMENT of income tax — the threshold that triggers the §6662 accuracy-related penalty on that ground. For an INDIVIDUAL, there is a substantial understatement for a taxable year if the amount of the understatement EXCEEDS THE GREATER OF (i) 10 PERCENT of the tax required to be shown on the return for the year, or (ii) $5,000. (For a C corporation other than an S corporation or a personal holding company, §6662(d)(1)(B) instead uses the lesser of 10 percent (or $10,000 if greater) of the tax required to be shown, or $10,000,000.) The understatement is reduced for any item supported by substantial authority, or adequately disclosed and supported by a reasonable basis.",
    keywords: [
      "6662", "6662(d)", "6662(d)(1)", "substantial understatement", "accuracy-related penalty", "accuracy related",
      "greater of", "10 percent", "5000", "$5,000", "tax required to be shown", "understatement", "threshold",
      "individual", "penalty", "substantial authority", "adequate disclosure",
    ],
    precedential: true,
  },
  {
    chunkId: "ingested-irc-513-h",
    authorityType: "statute",
    citation: "IRC §513(h)(2)(A)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1987-12-22",
    sourceUrl: "https://www.law.cornell.edu/uscode/text/26/513",
    ingestedAt: INGESTED,
    text:
      "IRC §513(h) excludes the distribution of LOW COST ARTICLES from the definition of an unrelated trade or business. Under §513(h)(1)(A), the distribution of 'low cost articles' incidental to the solicitation of charitable contributions is NOT an unrelated trade or business, so it generates no unrelated business taxable income (UBTI). Under §513(h)(2)(A), a 'low cost article' is any article that has a COST NOT IN EXCESS OF $5 to the organization that distributes it (or on whose behalf it is distributed); §513(h)(2)(C) indexes the $5 amount for cost of living for taxable years beginning after 1987. Typical examples are unsolicited address labels, greeting cards, or stickers mailed to prospective donors, which the recipient may keep whether or not they contribute.",
    keywords: [
      "513", "513(h)", "513(h)(2)", "low cost article", "low-cost article", "unrelated trade or business",
      "ubti", "unrelated business taxable income", "5", "$5", "charity", "charitable contributions",
      "address labels", "greeting card", "unsolicited", "exempt organization", "fundraising", "incidental",
    ],
    precedential: true,
  },
];
