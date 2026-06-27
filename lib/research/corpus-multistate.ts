import type { AuthorityChunk } from "../tax/authority/store";

// ── MULTISTATE / STATE income-tax authority (corpus-depth phase). These are the non-IRC authorities a
// preparer reaches for on apportionment and state-nexus questions: the federal PL 86-272 immunity, the
// UDITPA / Multistate Tax Compact sales-factor rules, and California's apportionment statutes. Each is a
// faithful public-domain paraphrase of the operative rule, web-verified against the primary source
// (uscode.house.gov for 15 U.S.C. §381; the Multistate Tax Compact text; leginfo.legislature.ca.gov for
// the Cal. Rev. & Tax. Code sections). PL 86-272 and the Compact are tagged FEDERAL/interstate; the
// Cal. R&TC sections are tagged "CA" so they surface only on California-jurisdiction queries.
const YEARS = [2024, 2025, 2026, 2027, 2028];
const INGESTED = "2026-06-27T00:00:00Z";

export const CORPUS_MULTISTATE: AuthorityChunk[] = [
  {
    chunkId: "multistate-pl-86-272",
    authorityType: "statute",
    citation: "Public Law 86-272, 15 U.S.C. §381 (Interstate Income Act)",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1959-09-14",
    sourceUrl: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title15-section381",
    ingestedAt: INGESTED,
    text:
      "Public Law 86-272 (the Interstate Income Act, 15 U.S.C. §381) prohibits a state from imposing a NET INCOME TAX on income derived within the state from interstate commerce when the taxpayer's ONLY business activity in the state is the SOLICITATION OF ORDERS for sales of TANGIBLE PERSONAL PROPERTY, where those orders are sent outside the state for approval or rejection and, if approved, are filled by shipment or delivery from a point outside the state. The immunity is expressly limited to the solicitation of orders for TANGIBLE PERSONAL PROPERTY. It does NOT protect the solicitation of sales of SERVICES, intangibles, leases, or real property. Therefore solicitation of a SaaS / software-as-a-service subscription (a service or intangible, not tangible personal property) is NOT shielded by PL 86-272 the way solicitation of tangible goods is — the state may tax the income from the SaaS solicitation even though it cannot tax the income from the protected tangible-goods solicitation.",
    keywords: [
      "pl 86-272", "86-272", "381", "public law 86-272", "interstate income act", "15 u.s.c. 381",
      "solicitation of orders", "tangible personal property", "net income tax", "nexus", "immunity",
      "shielded", "protected activity", "saas", "software as a service", "services", "intangibles",
      "interstate commerce", "sent outside the state", "approval",
    ],
    precedential: true,
  },
  {
    chunkId: "multistate-tax-compact-uditpa-16b",
    authorityType: "statute",
    citation: "Multistate Tax Compact Art. IV §16(b) (UDITPA §16(b)) — throwback rule",
    jurisdiction: "federal",
    taxYear: YEARS,
    effectiveDate: "1967-08-04",
    sourceUrl: "https://www.mtc.gov/the-commission/multistate-tax-compact/",
    ingestedAt: INGESTED,
    text:
      "Under the UDITPA / Multistate Tax Compact sales factor (Art. IV §16), sales of TANGIBLE PERSONAL PROPERTY are in this state if the property is delivered or shipped to a purchaser within this state; OR, under the THROWBACK rule of §16(b), if the property is shipped from an office, store, warehouse, factory, or other place of storage IN THIS STATE and EITHER (1) the purchaser is the United States Government, OR (2) the taxpayer is NOT TAXABLE in the state of the purchaser. So goods shipped from an in-state warehouse to a purchaser in another state are 'thrown back' into this state's sales-factor numerator when the taxpayer is not taxable in (lacks nexus with) that destination state, or when the purchaser is the U.S. Government — preventing 'nowhere sales' that would otherwise escape apportionment to any state.",
    keywords: [
      "multistate tax compact", "uditpa", "udipta", "throwback", "16(b)", "sales factor", "numerator",
      "tangible personal property", "shipped from", "warehouse", "place of storage", "not taxable",
      "united states government", "nowhere sales", "apportionment", "destination state", "nexus",
    ],
    precedential: true,
  },
  {
    chunkId: "ca-rtc-25136-market-sourcing",
    authorityType: "statute",
    citation: "Cal. Rev. & Tax. Code §25136(a)",
    jurisdiction: "CA",
    taxYear: YEARS,
    effectiveDate: "2013-01-01",
    sourceUrl: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=25136.",
    ingestedAt: INGESTED,
    text:
      "California assigns sales OTHER THAN sales of tangible personal property to the California sales-factor numerator using MARKET-BASED SOURCING. Under Cal. Rev. & Tax. Code §25136(a)(1), sales from SERVICES are in California to the extent the PURCHASER of the service RECEIVED THE BENEFIT of the service in California. Sales from intangible property are in California to the extent the intangible property is used in California (§25136(a)(2)). This market-based rule (effective for tax years beginning on or after Jan 1, 2013) replaced California's former COST-OF-PERFORMANCE approach, so a service provider sources service receipts to California based on where its customer receives the benefit, not where the provider performs the work.",
    keywords: [
      "25136", "california", "market-based sourcing", "benefit of the service", "received the benefit",
      "services", "sales factor", "numerator", "apportionment", "purchaser", "franchise tax",
      "cost of performance", "intangible", "single sales factor", "sourcing",
    ],
    precedential: true,
  },
  {
    chunkId: "ca-rtc-25137-alternative-apportionment",
    authorityType: "statute",
    citation: "Cal. Rev. & Tax. Code §25137",
    jurisdiction: "CA",
    taxYear: YEARS,
    effectiveDate: "1966-01-01",
    sourceUrl: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=RTC&sectionNum=25137.",
    ingestedAt: INGESTED,
    text:
      "Cal. Rev. & Tax. Code §25137 is California's ALTERNATIVE-APPORTIONMENT relief provision. It applies only on a finding that the standard allocation and apportionment provisions DO NOT FAIRLY REPRESENT the extent of the taxpayer's business activity in California (a distortion standard — a high bar, not mere taxpayer preference). On that showing, the taxpayer may petition for, or the Franchise Tax Board may require, in respect to all or any part of the taxpayer's business activity, one of: (a) SEPARATE ACCOUNTING; (b) the EXCLUSION of any one or more of the standard factors; (c) the INCLUSION of one or more ADDITIONAL factors that will fairly represent the taxpayer's business activity in the state; or (d) the employment of ANY OTHER METHOD to effectuate an equitable allocation and apportionment of the taxpayer's income. The party seeking to deviate from the standard formula bears the burden of proving both that the standard formula distorts and that the proposed alternative is reasonable.",
    keywords: [
      "25137", "california", "alternative apportionment", "fairly represent", "do not fairly represent",
      "distortion", "separate accounting", "additional factor", "exclusion of factor", "any other method",
      "equitable", "ftb", "franchise tax board", "relief", "standard formula", "single sales factor", "burden",
    ],
    precedential: true,
  },
];
