// Starter primary-source authority corpus for TY2025 (federal + California).
//
// PUBLIC DOMAIN ONLY. The Internal Revenue Code and the California Revenue & Taxation
// Code are statute — not copyrightable — so concise factual paraphrases keyed to a
// resolvable cite + sourceUrl are safe to ship. NO taxpayer return data lives here
// (this corpus is §7216-clean by construction).
//
// Each chunk is split on LEGAL STRUCTURE (one operative rule per chunk), not on a fixed
// token window: §63 (standard deduction), §24 (CTC), §32 (EITC), §25A (AOTC), §199A
// (QBI), §2(b) (head-of-household status), §6695(g) (preparer due-diligence penalty),
// plus CA RTC §17052 (CalEITC) and §17052.1 (Young Child Tax Credit). Every chunk
// carries the mandatory metadata the store filters and ranks on; the model may cite
// ONLY these chunkIds ("no citation, no claim" — enforced in lib/ai/reasoning.ts).

import type { AuthorityChunk } from "./store";

// Official, free primary-source URLs (one per authority family).
const URL = {
  // House Office of the Law Revision Counsel — current US Code, free + official.
  irc24: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section24",
  irc25A: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section25A",
  irc32: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section32",
  irc63: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section63",
  irc199A: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section199A",
  irc2: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section2",
  irc6695: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section6695",
  // Circular 230 (31 CFR Part 10) — Treasury practice regulations, public domain (eCFR).
  cir230_1022: "https://www.ecfr.gov/current/title-31/subtitle-A/part-10/subpart-B/section-10.22",
  cir230_1034: "https://www.ecfr.gov/current/title-31/subtitle-A/part-10/subpart-B/section-10.34",
  // California Legislative Information — official RTC text.
  rtc17052: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=17052.",
  rtc170521: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=17052.1.",
  // OBBBA (P.L. 119-1) — IRS plain-language summary of the 2025 changes.
  obbba: "https://www.irs.gov/newsroom/one-big-beautiful-bill-provisions-individuals-and-workers",
};

const INGESTED = "2026-06-23T00:00:00.000Z"; // when this corpus was committed to the store

// federal chunks all currently apply to TY2025; most are statutory (no annual sunset),
// so they list 2024 and 2025. OBBBA-changed provisions list 2025 (effective 2025).
export const FEDERAL_CHUNKS: AuthorityChunk[] = [
  {
    chunkId: "irc-63-c-2",
    authorityType: "statute",
    citation: "IRC §63(c)(2)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "1986-10-22", // §63(c) as enacted; amount inflation-adjusted annually
    sourceUrl: URL.irc63,
    ingestedAt: INGESTED,
    text: "The basic standard deduction is a fixed amount that depends on the taxpayer's filing status (married filing jointly / surviving spouse, head of household, single, married filing separately) and is adjusted for inflation each year.",
    keywords: ["standard deduction", "filing status", "basic standard deduction"],
  },
  {
    chunkId: "irc-63-c-5",
    authorityType: "statute",
    citation: "IRC §63(c)(5)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "1986-10-22",
    sourceUrl: URL.irc63,
    ingestedAt: INGESTED,
    text: "For an individual who can be claimed as a dependent on another taxpayer's return, the basic standard deduction is limited to the greater of a small fixed dollar amount or the dependent's earned income plus a fixed add-on, and may not exceed the regular standard deduction for the filing status.",
    keywords: ["dependent", "standard deduction", "limit", "earned income", "kiddie"],
  },
  {
    chunkId: "irc-63-obbba-2025",
    authorityType: "statute",
    citation: "OBBBA §70102 (amending IRC §63(c)) — TY2025 standard deduction",
    jurisdiction: "federal",
    taxYear: [2025],
    effectiveDate: "2025-01-01",
    sourceUrl: URL.obbba,
    ingestedAt: INGESTED,
    text: "The One Big Beautiful Bill Act increased the basic standard deduction for tax year 2025 to $15,750 (single / MFS), $31,500 (MFJ / surviving spouse), and $23,625 (head of household), and made the increase permanent with annual inflation adjustment.",
    keywords: ["standard deduction", "obbba", "2025", "filing status"],
  },
  {
    chunkId: "irc-24-a-h",
    authorityType: "statute",
    citation: "IRC §24(a),(h)",
    jurisdiction: "federal",
    taxYear: [2025],
    effectiveDate: "2025-01-01",
    sourceUrl: URL.irc24,
    ingestedAt: INGESTED,
    text: "The child tax credit is a per-qualifying-child credit for a qualifying child under age 17 who has a valid Social Security number. Under OBBBA the credit is $2,200 per child for 2025, with a refundable additional child tax credit capped per child, and a $500 nonrefundable credit for each other dependent.",
    keywords: ["child tax credit", "ctc", "qualifying child", "dependent", "section 24"],
  },
  {
    chunkId: "irc-24-b",
    authorityType: "statute",
    citation: "IRC §24(b)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "2018-01-01",
    sourceUrl: URL.irc24,
    ingestedAt: INGESTED,
    text: "The child tax credit phases out by $50 for each $1,000 (or fraction) by which modified adjusted gross income exceeds the threshold: $400,000 for a joint return and $200,000 for any other filer.",
    keywords: ["child tax credit", "phaseout", "modified adjusted gross income", "threshold", "ctc"],
  },
  {
    chunkId: "irc-24-d",
    authorityType: "statute",
    citation: "IRC §24(d)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "2018-01-01",
    sourceUrl: URL.irc24,
    ingestedAt: INGESTED,
    text: "The additional (refundable) child tax credit equals the lesser of the unallowed nonrefundable credit or 15% of earned income over $2,500, subject to a per-child refundable cap.",
    keywords: ["additional child tax credit", "actc", "refundable", "earned income", "15 percent"],
  },
  {
    chunkId: "irc-32-a-b",
    authorityType: "statute",
    citation: "IRC §32(a),(b)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "1990-01-01",
    sourceUrl: URL.irc32,
    ingestedAt: INGESTED,
    text: "The earned income tax credit is a refundable credit equal to the credit percentage times earned income (up to an earned-income amount), reduced by the phaseout percentage times the excess of adjusted gross income (or earned income, if greater) over the phaseout threshold. The credit and phaseout percentages scale with the number of qualifying children (0, 1, 2, or 3+).",
    keywords: ["eitc", "earned income tax credit", "refundable", "phaseout", "credit percentage", "section 32"],
  },
  {
    chunkId: "irc-32-i",
    authorityType: "statute",
    citation: "IRC §32(i)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "1995-01-01",
    sourceUrl: URL.irc32,
    ingestedAt: INGESTED,
    text: "No earned income tax credit is allowed if the taxpayer's aggregate disqualified investment income for the year exceeds the inflation-adjusted limit.",
    keywords: ["eitc", "investment income", "disqualified income", "limit", "section 32"],
  },
  {
    chunkId: "irc-32-c-1-a-ii",
    authorityType: "statute",
    citation: "IRC §32(c)(1)(A)(ii)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "1990-01-01",
    sourceUrl: URL.irc32,
    ingestedAt: INGESTED,
    text: "An individual with no qualifying children may claim the earned income tax credit only if the individual (or spouse) is at least age 25 but under age 65 at the close of the tax year, is not a dependent of another, and resides in the United States for more than half the year.",
    keywords: ["eitc", "childless", "age 25", "age 65", "no qualifying children"],
  },
  {
    chunkId: "irc-25A-b-i",
    authorityType: "statute",
    citation: "IRC §25A(b),(i)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "2009-01-01",
    sourceUrl: URL.irc25A,
    ingestedAt: INGESTED,
    text: "The American Opportunity Tax Credit equals 100% of the first $2,000 of qualified tuition and related expenses plus 25% of the next $2,000 (maximum $2,500 per eligible student), for the first four years of postsecondary education; 40% of the otherwise-allowable credit is refundable.",
    keywords: ["american opportunity", "aotc", "education credit", "tuition", "refundable", "section 25a"],
  },
  {
    chunkId: "irc-25A-i-phaseout",
    authorityType: "statute",
    citation: "IRC §25A(i)(4),(d)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "2009-01-01",
    sourceUrl: URL.irc25A,
    ingestedAt: INGESTED,
    text: "The American Opportunity Tax Credit phases out ratably as modified adjusted gross income rises through a band ($80,000–$90,000 for single filers, $160,000–$180,000 for joint filers) and is fully disallowed above the band. No credit is allowed for a student with a felony drug conviction.",
    keywords: ["aotc", "magi", "phaseout", "modified adjusted gross income", "felony drug"],
  },
  {
    chunkId: "irc-199A-a-b",
    authorityType: "statute",
    citation: "IRC §199A(a),(b)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "2018-01-01",
    sourceUrl: URL.irc199A,
    ingestedAt: INGESTED,
    text: "The qualified business income deduction generally equals 20% of qualified business income from a trade or business. Above the taxable-income threshold the deduction for each business is limited to the greater of 50% of W-2 wages, or 25% of W-2 wages plus 2.5% of the unadjusted basis of qualified property.",
    keywords: ["qbi", "qualified business income", "deduction", "199a", "w-2 wages", "20 percent"],
  },
  {
    chunkId: "irc-199A-d-e",
    authorityType: "statute",
    citation: "IRC §199A(d),(e)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "2018-01-01",
    sourceUrl: URL.irc199A,
    ingestedAt: INGESTED,
    text: "A specified service trade or business (SSTB) is phased out of the qualified business income deduction over the income range above the threshold ($50,000 single / $100,000 MFJ band) and is fully excluded once taxable income exceeds the top of that range.",
    keywords: ["qbi", "sstb", "specified service", "phase-in", "threshold", "199a"],
  },
  {
    chunkId: "irc-2-b",
    authorityType: "statute",
    citation: "IRC §2(b)",
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "1954-08-16",
    sourceUrl: URL.irc2,
    ingestedAt: INGESTED,
    text: "A taxpayer qualifies as head of household if unmarried (or considered unmarried) at year end, not a surviving spouse, and maintains as their home a household that is the principal place of abode for more than half the year of a qualifying child or qualifying relative — paying more than half the cost of keeping up that home.",
    keywords: ["head of household", "hoh", "unmarried", "qualifying person", "household", "section 2"],
  },
  {
    chunkId: "irc-6695-g",
    authorityType: "statute",
    citation: "IRC §6695(g)",
    jurisdiction: "federal",
    taxYear: [2025],
    effectiveDate: "2025-01-01",
    sourceUrl: URL.irc6695,
    ingestedAt: INGESTED,
    text: "A tax return preparer who fails to comply with the due-diligence requirements for the earned income credit, child tax credit / additional child tax credit / credit for other dependents, American Opportunity Tax Credit, or head-of-household filing status is liable for a penalty for each such failure, indexed for inflation.",
    keywords: ["due diligence", "preparer penalty", "6695", "eitc", "ctc", "aotc", "head of household"],
  },
  {
    // Circular 230 RELIANCE ON OTHERS — the work product of ANOTHER PERSON (e.g. a colleague's
    // calculations). Distinct from §10.34(d) (reliance on CLIENT-furnished information).
    chunkId: "cir230-10-22-b",
    authorityType: "regulation",
    citation: "31 CFR §10.22(b) (Circular 230)",
    jurisdiction: "federal",
    taxYear: [2024, 2025, 2026],
    effectiveDate: "2014-06-12", // current Circular 230 revision (Rev. 6-2014)
    sourceUrl: URL.cir230_1022,
    ingestedAt: INGESTED,
    delegationBasis: "express", // issued under 31 U.S.C. §330 (express authority to regulate practice)
    text: "Reliance on others: a practitioner is presumed to have exercised due diligence (as to accuracy under §10.22(a)) if the practitioner relies on the work product of another person and used reasonable care in engaging, supervising, training, and evaluating that person, taking proper account of the nature of the relationship between the practitioner and the person. This reliance standard is modified by §§10.34 and 10.37.",
    keywords: ["reliance on others", "work product of another person", "colleague", "calculations", "due diligence", "reasonable care", "supervising", "Circular 230", "10.22"],
  },
  {
    // Circular 230 RELIANCE ON CLIENT INFORMATION — the GOOD-FAITH-without-verification rule for
    // information furnished BY THE CLIENT. NOT the rule for relying on another practitioner's work.
    chunkId: "cir230-10-34-d",
    authorityType: "regulation",
    citation: "31 CFR §10.34(d) (Circular 230)",
    jurisdiction: "federal",
    taxYear: [2024, 2025, 2026],
    effectiveDate: "2014-06-12",
    sourceUrl: URL.cir230_1034,
    ingestedAt: INGESTED,
    delegationBasis: "express",
    text: "Relying on information furnished by clients: a practitioner advising a client to take a position on, or preparing or signing, a tax return, document, affidavit, or other paper submitted to the IRS generally may rely in good faith without verification on information furnished by the client. The practitioner may not, however, ignore the implications of information furnished to or actually known by the practitioner, and must make reasonable inquiries if the information appears to be incorrect, inconsistent with another known fact or assumption, or incomplete.",
    keywords: ["reliance on client information", "information furnished by client", "good faith", "without verification", "reasonable inquiries", "Circular 230", "10.34"],
  },
];

// California chunks (RTC). CalEITC and YCTC are the CA-specific credits.
export const CALIFORNIA_CHUNKS: AuthorityChunk[] = [
  {
    chunkId: "ca-rtc-17052",
    authorityType: "statute",
    citation: "CA RTC §17052",
    jurisdiction: "CA",
    taxYear: [2024, 2025],
    effectiveDate: "2015-01-01",
    sourceUrl: URL.rtc17052,
    ingestedAt: INGESTED,
    text: "The California Earned Income Tax Credit (CalEITC) is a refundable credit for low-income California residents, computed as a percentage of the federal earned income credit amount with California-specific earned-income and phaseout ranges; eligibility includes taxpayers with earned income within the state limit.",
    keywords: ["caleitc", "california earned income", "earned income credit", "eitc", "refundable", "rtc 17052"],
  },
  {
    chunkId: "ca-rtc-17052-1",
    authorityType: "statute",
    citation: "CA RTC §17052.1",
    jurisdiction: "CA",
    taxYear: [2024, 2025],
    effectiveDate: "2019-01-01",
    sourceUrl: URL.rtc170521,
    ingestedAt: INGESTED,
    text: "The Young Child Tax Credit (YCTC) is a refundable California credit available to taxpayers who qualify for the CalEITC (or meet the earned-income condition) and have at least one qualifying child who is younger than six years old at the close of the tax year.",
    keywords: ["yctc", "young child tax credit", "caleitc", "under six", "refundable", "rtc 17052.1"],
  },
];

// A deliberately-superseded probe chunk: a 2024-only standard-deduction figure that
// OBBBA replaced for 2025. It lists ONLY 2024 and is marked supersededBy, so the store
// must never surface it for 2025 (proves the supersession + year filters work together).
export const SUPERSEDED_CHUNKS: AuthorityChunk[] = [
  {
    chunkId: "irc-63-pre-obbba-2024",
    authorityType: "statute",
    citation: "IRC §63(c) (pre-OBBBA, TY2024)",
    jurisdiction: "federal",
    taxYear: [2024],
    effectiveDate: "2024-01-01",
    supersededBy: "OBBBA §70102 (amending IRC §63(c)) — TY2025 standard deduction",
    sourceUrl: URL.irc63,
    ingestedAt: INGESTED,
    text: "Pre-OBBBA standard deduction superseding probe: the TY2024 basic standard deduction amounts, replaced for 2025 by OBBBA. Retained for audit history only; never cite for 2025.",
    keywords: ["standard deduction", "obbba", "superseded", "2024", "superseding probe"],
  },
];

export const CORPUS_2025: AuthorityChunk[] = [
  ...FEDERAL_CHUNKS,
  ...CALIFORNIA_CHUNKS,
  ...SUPERSEDED_CHUNKS,
];
