// ④ Authority store — PUBLIC domain only (the Internal Revenue Code is US federal
// law, not copyrightable). Concise factual summaries keyed by a resolvable chunkId.
// This is the corpus the reasoning agent may cite; "no citation, no claim" is enforced
// against these chunkIds in code (see reasoning.ts), never trusted to the model.
// NOTE: synthetic/public only — real client return data stays §7216-gated.

export type AuthorityChunk = {
  chunkId: string;
  citation: string;
  taxYear: number;
  text: string;
  keywords: string[];
};

export const AUTHORITY_CORPUS: AuthorityChunk[] = [
  {
    chunkId: "irc-63-c-2", citation: "IRC §63(c)(2)", taxYear: 2025,
    text: "The basic standard deduction amount is set by filing status and adjusted annually for inflation.",
    keywords: ["standard deduction", "filing status"],
  },
  {
    chunkId: "irc-63-c-5", citation: "IRC §63(c)(5)", taxYear: 2025,
    text: "For an individual who can be claimed as a dependent on another taxpayer's return, the basic standard deduction is limited to the greater of a small fixed dollar amount or the dependent's earned income plus a fixed add-on, and may not exceed the regular standard deduction.",
    keywords: ["dependent", "standard deduction", "limit", "earned income"],
  },
  {
    chunkId: "irc-199a-b-2", citation: "IRC §199A(b)(2)", taxYear: 2025,
    text: "The qualified business income deduction for a trade or business is the lesser of 20% of QBI, or the greater of 50% of W-2 wages or 25% of W-2 wages plus 2.5% of the unadjusted basis of qualified property.",
    keywords: ["qbi", "qualified business income", "deduction", "w-2 wages", "199a"],
  },
  {
    chunkId: "irc-24-h", citation: "IRC §24(h)", taxYear: 2025,
    text: "The child tax credit is a per-qualifying-child credit for children under 17, with a refundable portion, phasing out above income thresholds that differ for joint and other filers.",
    keywords: ["child tax credit", "qualifying child", "ctc", "dependent"],
  },
  {
    chunkId: "irc-32-a", citation: "IRC §32", taxYear: 2025,
    text: "The earned income tax credit is a refundable credit for lower-income working taxpayers, scaling with earned income and the number of qualifying children.",
    keywords: ["eitc", "earned income credit", "refundable"],
  },
];

// Naive keyword retriever. A production impl uses embeddings; this is deterministic
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
