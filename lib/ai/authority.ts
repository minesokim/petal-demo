// ④ Legacy authority shim — kept so the existing ④ reasoning tests keep their simple
// `retrieve(question, k)` keyword seam. The canonical AuthorityChunk type + the real,
// metadata-rich, year+jurisdiction-filtered store now live in lib/tax/authority/* ; this
// file re-exports that type (single source of truth) and exposes a thin keyword retriever
// over a small synthetic/public corpus. New callers should use lib/tax/authority/store's
// retrieve(query, {taxYear, jurisdiction, k}) instead. PUBLIC/synthetic authority only —
// real client return data stays §7216-gated.

import type { AuthorityChunk } from "../tax/authority/store";

export type { AuthorityChunk } from "../tax/authority/store";

const INGESTED = "2026-06-23T00:00:00.000Z";

// Minimal corpus for the ④ vertical-slice tests. Each entry satisfies the canonical
// AuthorityChunk shape (mandatory metadata included) so it is type-identical to what the
// real store returns — the reasoning/verifier/faithfulness layers can't tell them apart.
export const AUTHORITY_CORPUS: AuthorityChunk[] = [
  {
    chunkId: "irc-63-c-2",
    authorityType: "statute",
    citation: "IRC §63(c)(2)",
    jurisdiction: "federal",
    taxYear: [2025],
    effectiveDate: "1986-10-22",
    sourceUrl: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section63",
    ingestedAt: INGESTED,
    text: "The basic standard deduction amount is set by filing status and adjusted annually for inflation.",
    keywords: ["standard deduction", "filing status"],
  },
  {
    chunkId: "irc-63-c-5",
    authorityType: "statute",
    citation: "IRC §63(c)(5)",
    jurisdiction: "federal",
    taxYear: [2025],
    effectiveDate: "1986-10-22",
    sourceUrl: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section63",
    ingestedAt: INGESTED,
    text: "For an individual who can be claimed as a dependent on another taxpayer's return, the basic standard deduction is limited to the greater of a small fixed dollar amount or the dependent's earned income plus a fixed add-on, and may not exceed the regular standard deduction.",
    keywords: ["dependent", "standard deduction", "limit", "earned income"],
  },
  {
    chunkId: "irc-199a-b-2",
    authorityType: "statute",
    citation: "IRC §199A(b)(2)",
    jurisdiction: "federal",
    taxYear: [2025],
    effectiveDate: "2018-01-01",
    sourceUrl: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section199A",
    ingestedAt: INGESTED,
    text: "The qualified business income deduction for a trade or business is the lesser of 20% of QBI, or the greater of 50% of W-2 wages or 25% of W-2 wages plus 2.5% of the unadjusted basis of qualified property.",
    keywords: ["qbi", "qualified business income", "deduction", "w-2 wages", "199a"],
  },
  {
    chunkId: "irc-24-h",
    authorityType: "statute",
    citation: "IRC §24(h)",
    jurisdiction: "federal",
    taxYear: [2025],
    effectiveDate: "2018-01-01",
    sourceUrl: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section24",
    ingestedAt: INGESTED,
    text: "The child tax credit is a per-qualifying-child credit for children under 17, with a refundable portion, phasing out above income thresholds that differ for joint and other filers.",
    keywords: ["child tax credit", "qualifying child", "ctc", "dependent"],
  },
  {
    chunkId: "irc-32-a",
    authorityType: "statute",
    citation: "IRC §32",
    jurisdiction: "federal",
    taxYear: [2025],
    effectiveDate: "1990-01-01",
    sourceUrl: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section32",
    ingestedAt: INGESTED,
    text: "The earned income tax credit is a refundable credit for lower-income working taxpayers, scaling with earned income and the number of qualifying children.",
    keywords: ["eitc", "earned income credit", "refundable"],
  },
];

// Naive keyword retriever. A production impl uses the real store; this is deterministic
// and testable, and returns ONLY corpus chunks (so retrieval can never invent authority).
export function retrieve(question: string, k = 3): AuthorityChunk[] {
  const q = question.toLowerCase();
  return AUTHORITY_CORPUS
    .map((c) => ({ c, score: c.keywords.reduce((s, kw) => s + (q.includes(kw) ? 1 : 0), 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.c);
}
