import type { AuthorityChunk } from "../tax/authority/store";

// ── Federal tax CASE LAW (corpus-depth phase). Foundational doctrines, each WEB-VERIFIED and
// adversarially fact-checked (exact reporter citations confirmed against Cornell LII / Justia; holdings
// faithful, public-domain paraphrases) by the caselaw-ingest-verify workflow on 2026-06-25. These are
// EVERGREEN judicial doctrines (substance-over-form, the definition of gross income, "ordinary and
// necessary", the Cohan estimate rule, Crane debt-in-basis, INDOPCO capitalization), so each governs the
// full in-scope year range. They give the §6662 weight-of-authorities engine REAL court authority to weigh
// (a unanimous Supreme Court holding; a Second-Circuit holding) — the in-circuit-controlling-holding
// invariant was previously exercised only on synthetic inputs. authorityClass omitted: the case KIND
// weight (70) × the courtLevel multiplier (supreme 1.3 / circuit 1.15) ranks them per §1.6662-4.
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
const INGESTED = "2026-06-25T00:00:00Z";

export const CORPUS_CASELAW: AuthorityChunk[] = [
  {
    chunkId: "case-gregory-v-helvering",
    authorityType: "case",
    citation: "Gregory v. Helvering, 293 U.S. 465 (1935)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1935-01-07",
    sourceUrl: "https://www.law.cornell.edu/supremecourt/text/293/465",
    ingestedAt: INGESTED,
    text: "A taxpayer has the legal right to arrange affairs to minimize tax, but a transaction must be what it purports to be in substance, not merely in form. Although the taxpayer's transfer of corporate shares through a newly created corporation (which was then dissolved) literally satisfied the words of the reorganization statute, the maneuver served no business or corporate purpose and was an operation having no purpose other than to avoid tax by recasting an ordinary dividend distribution as a tax-favored reorganization. Because the transaction lacked any genuine business purpose and was a mere device masquerading as a corporate reorganization, the Court disregarded it and taxed the taxpayer as if she had simply received the underlying shares as a dividend. (Business-purpose / substance-over-form doctrine; the economic-substance doctrine was later partially codified at IRC §7701(o).)",
    keywords: ["economic substance", "business purpose", "substance over form", "sham transaction", "step transaction", "tax avoidance", "gregory", "helvering", "7701(o)", "reorganization"],
    courtLevel: "supreme",
    precedential: true,
  },
  {
    chunkId: "case-glenshaw-glass",
    authorityType: "case",
    citation: "Commissioner v. Glenshaw Glass Co., 348 U.S. 426 (1955)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1955-03-28",
    sourceUrl: "https://www.law.cornell.edu/supremecourt/text/348/426",
    ingestedAt: INGESTED,
    text: "Construing the broad statutory definition of gross income as income 'from any source whatever' (then §22(a) of the 1939 Code, now IRC §61(a)), the Court held that Congress intended to tax all economic gains not specifically exempted. Gross income is NOT confined to gain derived from capital, from labor, or from both combined; it reaches 'undeniable accessions to wealth, clearly realized, and over which the taxpayers have complete dominion.' Applying that standard, the punitive (exemplary) portion of damages recovered in fraud and antitrust litigation was taxable income even though not derived from capital or labor. This is the governing definition of gross income.",
    keywords: ["gross income", "accession to wealth", "income from any source", "section 61", "61(a)", "22(a)", "punitive damages taxable", "glenshaw glass", "complete dominion", "clearly realized"],
    courtLevel: "supreme",
    precedential: true,
  },
  {
    chunkId: "case-welch-v-helvering",
    authorityType: "case",
    citation: "Welch v. Helvering, 290 U.S. 111 (1933)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1933-11-06",
    sourceUrl: "https://www.law.cornell.edu/supremecourt/text/290/111",
    ingestedAt: INGESTED,
    text: "A business expense is deductible under the 'ordinary and necessary' standard (now IRC §162(a)) only if it is BOTH ordinary AND necessary. The Court (Justice Cardozo) treated 'necessary' as a low threshold: an expense is necessary when it is 'appropriate and helpful' to the taxpayer's business. But the taxpayer's voluntary payments of a bankrupt former employer's debts — made to rebuild his own reputation and credit — were not 'ordinary,' because people do not customarily pay the debts of others to whom they owe no legal obligation; such payments resemble capital outlays building goodwill. They were therefore not deductible as ordinary and necessary business expenses.",
    keywords: ["ordinary and necessary", "business expense", "section 162", "162(a)", "appropriate and helpful", "necessary expense", "welch", "helvering", "deduction standard", "goodwill capital"],
    courtLevel: "supreme",
    precedential: true,
  },
  {
    chunkId: "case-cohan-v-commissioner",
    authorityType: "case",
    citation: "Cohan v. Commissioner, 39 F.2d 540 (2d Cir. 1930)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1930-03-03",
    sourceUrl: "https://law.justia.com/cases/federal/appellate-courts/F2/39/540/1543179/",
    ingestedAt: INGESTED,
    text: "The 'Cohan rule': where a taxpayer's testimony and the surrounding facts convince the factfinder that deductible business expenses WERE in fact incurred, it is error to disallow the deductions entirely merely because the taxpayer kept no records and cannot prove exact amounts. The Board (now the Tax Court) should instead ESTIMATE the allowable amount, making as close an approximation as it can. Absolute certainty is usually impossible and is not required, but the estimate may bear heavily against the taxpayer whose own failure to keep records caused the uncertainty. (Note: by statute the Cohan estimate does NOT apply to expenses subject to the strict substantiation rules of IRC §274(d) — e.g., travel, meals, listed property.)",
    keywords: ["cohan", "estimate", "estimated", "records", "receipts", "deduction", "deductible", "expenses", "disallow", "substantiation", "substantiate", "approximation", "274"],
    courtLevel: "circuit",
    circuit: "2",
    precedential: true,
  },
  {
    chunkId: "case-crane-v-commissioner",
    authorityType: "case",
    citation: "Crane v. Commissioner, 331 U.S. 1 (1947)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1947-04-14",
    sourceUrl: "https://www.law.cornell.edu/supremecourt/text/331/1",
    ingestedAt: INGESTED,
    text: "When a taxpayer acquires real property subject to a nonrecourse mortgage the taxpayer does not personally assume, the unadjusted BASIS is the full fair market value of the property, undiminished by the mortgage (not merely the equity). Correspondingly, when the taxpayer later sells subject to that still-outstanding nonrecourse mortgage, the AMOUNT REALIZED includes the cash received PLUS the outstanding mortgage principal, because relief from the mortgage confers a real benefit equal to its amount. 'Property' means the physical property and the owner's rights in it, not merely net equity, so the mortgage is reflected on both the basis and amount-realized sides of the gain computation.",
    keywords: ["crane", "basis", "mortgage", "nonrecourse", "property", "assume", "assumed", "realized", "debt", "equity", "1001", "1012"],
    courtLevel: "supreme",
    precedential: true,
  },
  {
    chunkId: "case-indopco-v-commissioner",
    authorityType: "case",
    citation: "INDOPCO, Inc. v. Commissioner, 503 U.S. 79 (1992)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1992-03-24",
    sourceUrl: "https://www.law.cornell.edu/supremecourt/text/503/79",
    ingestedAt: INGESTED,
    text: "Professional fees and similar expenses a corporation incurs in a friendly takeover are nondeductible CAPITAL expenditures, not ordinary and necessary business expenses. An expenditure need NOT create or enhance a separate and distinct asset to require capitalization; creating such an asset is a sufficient but not a necessary condition. The key factor is whether the taxpayer realizes benefits extending BEYOND the tax year of the expenditure. Because the acquisition produced significant long-term benefits, the costs had to be capitalized — deductions being narrowly construed exceptions to the norm of capitalization that the taxpayer must clearly establish.",
    keywords: ["indopco", "capitalize", "capitalized", "capitalization", "capital", "deductible", "deduct", "fees", "acquisition", "merger", "takeover", "expense", "benefit", "263"],
    courtLevel: "supreme",
    precedential: true,
  },
];
