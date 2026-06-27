import type { GoldenCase } from "./cases";

// SOURCE-VERIFIED ENTITY + CAPITAL-GAINS set. These measure the corpus ingested 2026-06-26 (Subchapters S/K/C
// + the capital-gains/property spine + high-frequency individual/SMB provisions). Like verified.ts, every
// answer here is a SETTLED, bright-line rule whose key fact appears in the cited primary statute — so this set
// gates whether the NEW business-entity coverage is actually grounded, not just present. mustClaim uses
// `|`-alternatives so a correct answer phrased differently is NOT false-failed (per the verify-test rule).
export const ENTITY_CASES: GoldenCase[] = [
  // ── Subchapter S ──
  {
    id: "entity-1361-max-shareholders",
    question: "What is the maximum number of shareholders an S corporation may have under IRC section 1361?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "100", mustCiteAuthorityLike: "1361",
    notes: "VERIFIED §1361(b)(1)(A): a small business corporation may not have more than 100 shareholders.",
  },
  {
    id: "entity-1361-one-class",
    question: "How many classes of stock may an S corporation have under IRC section 1361?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "one class|single class|1 class|one (1) class", mustCiteAuthorityLike: "1361",
    notes: "VERIFIED §1361(b)(1)(D): only one class of stock (voting-right differences allowed).",
  },
  {
    id: "entity-1366-loss-limited-to-basis",
    question: "What limits the amount of an S corporation loss a shareholder may deduct in a year under IRC section 1366?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "basis", mustCiteAuthorityLike: "1366",
    notes: "VERIFIED §1366(d)(1): loss/deduction allowed only up to stock basis plus basis of debt owed to the shareholder.",
  },
  // ── Subchapter K ──
  {
    id: "entity-752-liability-increase",
    question: "How does an increase in a partner's share of partnership liabilities affect that partner under IRC section 752?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "contribution of money|contribution|increase in", mustCiteAuthorityLike: "752",
    notes: "VERIFIED §752(a): an increase in a partner's share of liabilities is treated as a contribution of money (raising outside basis).",
  },
  {
    id: "entity-754-election",
    question: "What does a section 754 election allow a partnership to do?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "adjust the basis|basis of partnership property|adjust", mustCiteAuthorityLike: "754",
    notes: "VERIFIED §754: elect to adjust the basis of partnership property on transfers (§743(b)) and distributions (§734(b)).",
  },
  {
    id: "entity-731-distribution-gain",
    question: "When does a partner recognize gain on a current partnership distribution of money under IRC section 731?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "exceeds|in excess of", mustCiteAuthorityLike: "731",
    notes: "VERIFIED §731(a)(1): gain only to the extent money distributed exceeds the partner's adjusted outside basis.",
  },
  // ── Subchapter C ──
  {
    id: "entity-351-control",
    question: "What percentage of control is required for nonrecognition on a transfer of property to a corporation under IRC section 351?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "80", mustCiteAuthorityLike: "351",
    notes: "VERIFIED §351(a) + §368(c): transferors must control at least 80% of voting power and shares immediately after.",
  },
  {
    id: "entity-316-dividend",
    question: "Out of what must a corporate distribution be made to be a dividend under IRC section 316?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "earnings and profits", mustCiteAuthorityLike: "316",
    notes: "VERIFIED §316(a): a dividend is a distribution out of earnings and profits (current or accumulated).",
  },
  // ── Capital gains / property spine ──
  {
    id: "entity-1061-carried-interest",
    question: "How long must an applicable partnership interest (carried interest) be held for the gain to be long-term capital gain under IRC section 1061?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "3 year|three year|more than 3|more than three", mustCiteAuthorityLike: "1061",
    mustNotClaim: "5 year", // OBBBA did NOT change it to five years
    notes: "VERIFIED §1061(a): more-than-3-year holding period; OBBBA did not change it to 5.",
  },
  {
    id: "entity-1222-long-term",
    question: "How long must a capital asset be held to qualify for long-term capital gain treatment under IRC section 1222?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "more than 1 year|more than one year|longer than one year|more than a year", mustCiteAuthorityLike: "1222",
    notes: "VERIFIED §1222(3): long-term means held for more than 1 year.",
  },
  {
    id: "entity-1231-net-gain",
    question: "How is a net section 1231 gain treated for the year under IRC section 1231?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "long-term capital|capital gain", mustCiteAuthorityLike: "1231",
    notes: "VERIFIED §1231(a)(1): a net §1231 gain is treated as long-term capital gain.",
  },
  {
    id: "entity-1014-stepped-up-basis",
    question: "What is the basis of property acquired from a decedent under IRC section 1014?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "fair market value|FMV", mustCiteAuthorityLike: "1014",
    notes: "VERIFIED §1014(a): basis is the property's fair market value at the date of death (stepped-up basis).",
  },
  {
    id: "entity-1015-gift-basis",
    question: "What is the basis of property acquired by gift under IRC section 1015?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "carryover|donor's basis|donor's adjusted basis|same as", mustCiteAuthorityLike: "1015",
    notes: "VERIFIED §1015(a): carryover basis — the donor's adjusted basis (with a dual-basis rule for loss).",
  },
  {
    id: "entity-1041-spousal-transfer",
    question: "Is gain or loss recognized on a transfer of property between spouses under IRC section 1041?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "no gain or loss|not recognized|nonrecognition|no gain", mustCiteAuthorityLike: "1041",
    notes: "VERIFIED §1041(a): no gain or loss recognized on a transfer to a spouse (or former spouse incident to divorce).",
  },
  // ── Depreciation / deduction + high-frequency individual (the 2026-06-26 ingest, now scored not just present) ──
  {
    id: "entity-179-expensing",
    question: "What does an election under IRC section 179 allow a taxpayer to do with the cost of qualifying business property?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "expense|deduct the cost|current expense|deduct it", mustCiteAuthorityLike: "179",
    notes: "VERIFIED §179(a): elect to treat the cost of qualifying property as a current expense rather than capitalize/depreciate it.",
  },
  {
    id: "entity-453-installment",
    question: "How is gain reported on an installment sale under IRC section 453?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "gross profit|payments received|installment method|portion of payments", mustCiteAuthorityLike: "453",
    notes: "VERIFIED §453(a)-(c): gain reported as payments are received, the portion equal to gross profit divided by total contract price (the engine grounds 'gross profit divided by total contract price').",
  },
  {
    id: "entity-170-charitable-agi-limit",
    question: "What is the adjusted-gross-income ceiling for cash contributions to public charities under IRC section 170?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "60", mustCiteAuthorityLike: "170",
    notes: "VERIFIED §170(b)(1)(G): cash to public charities is deductible up to 60% of AGI.",
  },
  {
    id: "entity-166-nonbusiness-bad-debt",
    question: "How is a nonbusiness bad debt that becomes totally worthless treated under IRC section 166?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "short-term capital loss|short term capital loss|not more than 1 year|capital asset held for not more", mustCiteAuthorityLike: "166",
    notes: "VERIFIED §166(d): a wholly worthless nonbusiness bad debt is treated as a short-term capital loss — i.e. a loss from sale of a capital asset held NOT MORE THAN 1 YEAR (the engine grounds the statutory phrasing).",
  },
  {
    id: "entity-280A-home-office",
    question: "What use of part of a home is required to deduct a home office under IRC section 280A?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "exclusively", mustCiteAuthorityLike: "280A",
    notes: "VERIFIED §280A(c)(1): the portion must be used EXCLUSIVELY and on a regular basis as the principal place of business (or to meet clients).",
  },
  {
    id: "entity-469-passive-loss",
    question: "Against what income may passive activity losses be deducted under IRC section 469?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "passive income|income from passive|income or gain from all other passive", mustCiteAuthorityLike: "469",
    notes: "VERIFIED §469(a)-(d): passive losses are deductible only to the extent of passive-activity income; the excess is suspended/carried forward (the engine grounds 'income or gain from all other passive activities').",
  },
  {
    id: "entity-318-family-attribution",
    question: "Under the IRC section 318 family attribution rules, an individual is treated as owning stock owned by which family members?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "spouse|children|grandchildren|parents", mustCiteAuthorityLike: "318",
    notes: "VERIFIED §318(a)(1): an individual is treated as owning stock owned by spouse, children, grandchildren, and parents.",
  },
  {
    id: "entity-165-personal-casualty",
    question: "After the TCJA, when is a personal casualty loss deductible by an individual under IRC section 165?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "federally declared disaster|federally-declared disaster|disaster", mustCiteAuthorityLike: "165",
    notes: "VERIFIED §165(h)(5): a personal casualty loss is deductible only to the extent attributable to a federally declared disaster.",
  },
  {
    id: "entity-1245-recapture",
    question: "How is gain on the sale of depreciable personal property treated, to the extent of prior depreciation, under IRC section 1245?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "ordinary income|ordinary", mustCiteAuthorityLike: "1245",
    notes: "VERIFIED §1245(a): gain is recaptured as ordinary income to the extent of prior depreciation/amortization.",
  },
  // ── Equity compensation (verified GROUNDING via live probe) ──
  {
    id: "entity-409A-additional-tax",
    question: "What additional tax applies under IRC section 409A if a nonqualified deferred compensation plan fails to meet its requirements?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "20 percent|20%|20 per", mustCiteAuthorityLike: "409A",
    notes: "VERIFIED §409A(a)(1)(B): a 20% additional tax (plus premium interest) on the amount included; the engine grounds 'additional tax equal to 20 percent'.",
  },
  {
    id: "entity-83b-30-day-election",
    question: "How many days does a service provider have to make an IRC section 83(b) election?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "30 day|30 days|thirty day", mustCiteAuthorityLike: "83",
    notes: "VERIFIED §83(b)(2): the election must be made no later than 30 days after the transfer (engine grounds it).",
  },
  {
    id: "entity-422-iso-price",
    question: "What must the exercise price of an incentive stock option be, relative to the stock value at grant, under IRC section 422?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "fair market value|at least the fair market|not less than the fair market|FMV", mustCiteAuthorityLike: "422",
    notes: "VERIFIED §422(b)(4): the ISO exercise price must be at least the fair market value of the stock at grant.",
  },
  {
    id: "entity-423-espp-price",
    question: "What is the minimum option price allowed under a qualified IRC section 423 employee stock purchase plan?",
    taxYear: 2026, jurisdiction: "federal", expectedBucket: "answer",
    mustClaim: "85", mustCiteAuthorityLike: "423",
    notes: "VERIFIED §423(b)(6): the option price may not be less than 85% of the FMV (at grant or exercise).",
  },
];
