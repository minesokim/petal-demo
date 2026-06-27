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
];
