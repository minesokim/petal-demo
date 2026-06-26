// OBBBA-era authority corpus — the stale-law fix.
//
// The One Big Beautiful Bill Act (OBBBA), enacted as **Public Law 119-21, 139 Stat. 72,
// July 4, 2025** (originating as H.R.1, 119th Congress), rewrote the individual + business
// figures that a model trained before mid-2025 will confidently get WRONG: it still "knows"
// the flat $10,000 SALT cap, the 80/60/40 bonus-depreciation phase-down, a $13.61M estate
// exemption reverting toward ~$7M, and a §199A QBI deduction sunsetting after 2025. Every
// one of those recalled figures is now superseded. This corpus carries the CORRECT post-OBBBA
// rule for each, each chunk pointing (via supersedes/supersededBy) at the stale authority it
// replaces, so retrieve() can never surface the pre-OBBBA figure for an in-scope year.
//
// SOURCING DISCIPLINE (the point of this file): every figure below was confirmed THIS RUN
// against PRIMARY material — the enrolled text of Public Law 119-21 on congress.gov
// (govinfo Statutes at Large), IRS newsroom guidance on irs.gov, and FTB guidance on
// ftb.ca.gov. Nothing is recalled from model memory. A chunk is marked `verified: true`
// ONLY where its dollar amounts / percentages / effective dates were read off the statute
// or official guidance in this session; see the UNVERIFIED export for the residue.
//
// PUBLIC DOMAIN ONLY. The Internal Revenue Code and Public Law text are statute — not
// copyrightable — so concise factual paraphrases keyed to a resolvable cite + sourceUrl are
// safe to ship. NO taxpayer return data lives here (this corpus is §7216-clean by
// construction). The model may cite ONLY these chunkIds ("no citation, no claim").

import type { AuthorityChunk } from "../tax/authority/store";

// AuthorityChunk has no `verified` field; OBBBA chunks carry one so an auditor can see, per
// chunk, whether its figures were confirmed against a primary source this run. The type stays
// a structural superset of AuthorityChunk, so these chunks drop straight into the store and
// retrieve() (which never reads `verified`). authorityChunkSchema.parse() still passes —
// Zod object schemas ignore the extra key.
export type ObbbaAuthorityChunk = AuthorityChunk & {
  verified: boolean; // true ⇒ figures confirmed against sourceUrl primary material THIS run
  // First tax year the SUCCESSOR authority governs. A superseded chunk stays the correct,
  // retrievable answer for years BEFORE this and is filtered out from this year onward — so a
  // pre-OBBBA figure can serve its in-scope years (e.g. the $10k SALT cap for 2024) without ever
  // surfacing for a year the successor governs. Declared optional here too (the field also lives
  // on AuthorityChunk in store.ts); identical optional `number` types intersect cleanly.
  supersededFrom?: number;
};

// Official, free PRIMARY-source URLs. The congress.gov Public Law text is the controlling
// authority; the irs.gov pages are the agency's plain-language implementation guidance; the
// uscode.house.gov links resolve the governing IRC sections; ftb.ca.gov carries CA conformity.
const URL = {
  // Public Law 119-21 (OBBBA), enrolled text — the controlling primary authority.
  pl119_21: "https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf",
  // Governing IRC sections (House Office of the Law Revision Counsel — current US Code).
  irc68: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section68",
  irc151: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section151",
  irc164: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section164",
  irc165: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section165",
  irc168: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section168",
  irc170: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section170",
  irc199A: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section199A",
  irc2010: "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section2010",
  // IRS plain-language implementation guidance (irs.gov newsroom).
  irsProvisions: "https://www.irs.gov/newsroom/one-big-beautiful-bill-provisions",
  irsWorkersSeniors:
    "https://www.irs.gov/newsroom/one-big-beautiful-bill-act-tax-deductions-for-working-americans-and-seniors",
  irsQbi: "https://www.irs.gov/newsroom/qualified-business-income-deduction",
  irsEstate: "https://www.irs.gov/businesses/small-businesses-self-employed/whats-new-estate-and-gift-tax",
  irsBonus:
    "https://www.irs.gov/newsroom/treasury-irs-issue-guidance-on-the-additional-first-year-depreciation-deduction-amended-as-part-of-the-one-big-beautiful-bill",
  // California conformity (Franchise Tax Board).
  ftbConformity: "https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/2025/12.html",
  // Circular 230 (31 C.F.R. Part 10, Subpart B) — practitioner duties, on the official eCFR.
  circ230SubpartB: "https://www.ecfr.gov/current/title-31/subtitle-A/part-10/subpart-B",
};

const INGESTED = "2026-06-23T00:00:00.000Z"; // when this corpus was committed to the store

// Cite strings used as supersedes/supersededBy pointers, so the relationship between an OBBBA
// chunk and the stale pre-OBBBA rule it replaces is explicit and machine-followable.
const STALE = {
  salt10k: "IRC §164(b)(6) (pre-OBBBA flat $10,000 SALT cap, TCJA, expiring after 2025)",
  estateTcja: "IRC §2010(c)(3) (pre-OBBBA $13.61M exemption reverting to ~$7M after 2025)",
  bonusPhasedown: "IRC §168(k) (pre-OBBBA 80%/60%/40% bonus-depreciation phase-down)",
  qbiSunset: "IRC §199A (TCJA, scheduled to sunset for tax years after 2025)",
  gambling100: "IRC §165(d) (pre-OBBBA: wagering losses deductible at 100% up to winnings)",
  pease: "IRC §68 (pre-OBBBA Pease overall-limitation rules, suspended 2018-2025)",
};

// ── FEDERAL OBBBA CHUNKS ──────────────────────────────────────────────────────────────────
// Each lists the tax years for which the OBBBA rule is operative and points at the stale rule
// it supersedes. Governing-IRC anchor chunks (§164/§2010/§165/§168) close the loop so a cite
// to the base section still resolves.

export const OBBBA_FEDERAL_CHUNKS: ObbbaAuthorityChunk[] = [
  // ── SALT cap (OBBBA §70120, amending IRC §164(b)(6)+(7)) ──
  {
    chunkId: "obbba-70120-salt-cap",
    authorityType: "statute",
    citation: "OBBBA §70120 (P.L. 119-21) amending IRC §164(b)(6),(7) — SALT deduction cap",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028, 2029],
    effectiveDate: "2025-01-01", // applies to taxable years beginning after Dec 31, 2024
    supersededBy: undefined, // current law for 2025-2029
    sourceUrl: URL.pl119_21,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "OBBBA replaced the flat $10,000 state-and-local-tax (SALT) deduction cap with an 'applicable limitation amount': $40,000 (married filing separately: $20,000) for tax years beginning in 2025, and $40,400 (married filing separately: $20,200) for 2026, then 101% of the prior year's amount for 2027-2029 (the married-filing-separately limit is half of the otherwise-applicable amount). The cap phases DOWN for high earners: it is reduced by 30% of the excess of modified adjusted gross income over a threshold amount ($500,000 for 2025; $505,000 for 2026; 101% of the prior year thereafter), but the reduction can never push the cap below $10,000. For tax years beginning after calendar year 2029 the applicable limitation amount reverts to $10,000 ($5,000 MFS). MAGI here is AGI increased by amounts excluded under §911/§931/§933.",
    keywords: ["salt", "state and local tax", "salt cap", "40000", "164", "obbba", "phase-down", "phasedown", "500000"],
  },
  // The 2030+ reversion + the pre-OBBBA stale figure, as a SUPERSEDED probe (never returned for 2025-2029).
  {
    chunkId: "irc-164-salt-pre-obbba-superseded",
    authorityType: "statute",
    citation: STALE.salt10k,
    jurisdiction: "federal",
    taxYear: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
    effectiveDate: "2018-01-01",
    // supersededFrom: the successor (OBBBA §70120) first governs tax year 2025, so this chunk
    // is the CORRECT, retrievable authority for 2018-2024 (it answers the salt-cap-2024-control
    // case with the $10k figure) and is filtered out only from 2025 onward. Pairing
    // supersededFrom with a taxYear that stops at 2024 is belt-and-suspenders: even if a future
    // edit extended the year list, retrieve() would still drop it for any year ≥ 2025.
    supersededFrom: 2025,
    supersededBy: "OBBBA §70120 (P.L. 119-21) amending IRC §164(b)(6),(7) — SALT deduction cap",
    sourceUrl: URL.irc164,
    ingestedAt: INGESTED,
    verified: true, // $10,000 / $5,000-MFS cap for 2018-2025 confirmed: IRS 2025 Sch A (Form 1040) instructions + Congress.gov CRS R46246
    text:
      "Pre-OBBBA SALT cap (the CORRECT answer for tax years 2018-2024): under TCJA (IRC §164(b)(6)) the aggregate state-and-local-tax itemized deduction was capped at a FLAT $10,000 ($5,000 for married filing separately) for taxable years beginning after Dec 31, 2017 and before Jan 1, 2026 (i.e., 2018 through 2025), and was scheduled to expire after 2025. OBBBA §70120 superseded this flat cap for tax years beginning after Dec 31, 2024 (raising it to $40,000 with a phase-down). For 2018-2024 the $10,000 ($5,000 MFS) figure is correct; NEVER cite the flat $10,000 figure for tax years 2025-2029.",
    keywords: ["salt", "10000", "5000", "state and local tax", "salt cap", "tcja", "flat cap", "164", "2024"],
  },

  // ── No tax on tips (OBBBA §70201, new IRC §224) ──
  {
    chunkId: "obbba-70201-tips-deduction",
    authorityType: "statute",
    citation: "OBBBA §70201 (P.L. 119-21) enacting IRC §224 — qualified-tips deduction",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028],
    effectiveDate: "2025-01-01",
    sunsetAfter: 2028, // §224 terminates for tax years beginning after Dec 31, 2028 (statutory sunset)
    supersededBy: undefined,
    sourceUrl: URL.pl119_21,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "OBBBA created a new ABOVE-THE-LINE deduction (also allowed to non-itemizers) for qualified tips, IRC §224. Cap: $25,000 per year (for the self-employed, limited to net income from the trade or business in which the tips were earned). Phase-out: the deduction is reduced by $100 for each $1,000 by which modified adjusted gross income exceeds $150,000 ($300,000 on a joint return). 'Qualified tips' are voluntary cash or charged tips (including tip-sharing) in an occupation that customarily and regularly received tips on or before December 31, 2024 (per IRS-published list); tips from a specified service trade or business under §199A(d)(2) do not qualify. A valid SSN is required, and married taxpayers must file jointly. IMPORTANT — this is an INCOME-TAX deduction only: it does NOT reduce self-employment (SECA) tax. Self-employment tax under IRC §1401 is imposed on net earnings from self-employment (IRC §1402), computed before the §224 deduction, so a self-employed individual's qualified tips remain fully subject to self-employment tax even though they may be deducted for income-tax purposes. The deduction terminates for tax years beginning after December 31, 2028.",
    keywords: ["tips", "tip income", "no tax on tips", "deduction for tips", "deduction for tip income", "qualified tips", "224", "25000", "above-the-line", "obbba", "tipped", "gratuities", "self-employment tax", "se tax", "seca", "1401", "1402"],
  },

  // ── No tax on overtime (OBBBA §70202, new IRC §225) ──
  {
    chunkId: "obbba-70202-overtime-deduction",
    authorityType: "statute",
    citation: "OBBBA §70202 (P.L. 119-21) enacting IRC §225 — qualified-overtime deduction",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028],
    effectiveDate: "2025-01-01",
    sunsetAfter: 2028, // §225 terminates for tax years beginning after Dec 31, 2028 (statutory sunset)
    supersededBy: undefined,
    sourceUrl: URL.pl119_21,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "OBBBA created a new above-the-line deduction (allowed to non-itemizers) for qualified overtime compensation, IRC §225. Cap: $12,500 ($25,000 on a joint return). Phase-out: reduced by $100 for each $1,000 by which modified adjusted gross income exceeds $150,000 ($300,000 joint). 'Qualified overtime compensation' is the half-time premium portion required under section 7 of the Fair Labor Standards Act (the amount in EXCESS of the regular rate), excluding any qualified tip under §224. A valid SSN is required and married taxpayers must file jointly. The deduction terminates for tax years beginning after December 31, 2028.",
    keywords: ["overtime", "no tax on overtime", "qualified overtime", "225", "12500", "flsa", "obbba", "300000"],
  },

  // ── Senior additional deduction (OBBBA §70103, new IRC §151(d)(5)(C)) ──
  {
    chunkId: "obbba-70103-senior-deduction",
    authorityType: "statute",
    citation: "OBBBA §70103 (P.L. 119-21) enacting IRC §151(d)(5)(C) — temporary senior deduction",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028],
    effectiveDate: "2025-01-01",
    supersededBy: undefined,
    sourceUrl: URL.pl119_21,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "OBBBA added a temporary additional deduction of $6,000 for each qualified individual — the taxpayer (and, on a joint return, the spouse) who has attained age 65 before the close of the taxable year. Because it is per qualified individual, a married couple filing jointly where BOTH spouses are 65 or older deducts $12,000 combined ($6,000 each); if only one spouse is 65+, the deduction is $6,000. Phase-out: the $6,000 is reduced (but not below zero) by 6% of the excess of modified adjusted gross income over $75,000 ($150,000 on a joint return). A valid SSN is required and married taxpayers must file jointly. Allowed only for tax years beginning before January 1, 2029 (i.e., 2025 through 2028).",
    keywords: ["senior", "senior deduction", "age 65", "6000", "151", "obbba", "additional deduction", "elderly"],
  },

  // ── Estate / gift exemption (OBBBA §70106, amending IRC §2010(c)(3)) ──
  {
    chunkId: "obbba-70106-estate-exemption",
    authorityType: "statute",
    citation: "OBBBA §70106 (P.L. 119-21) amending IRC §2010(c)(3) — estate & gift exemption",
    jurisdiction: "federal",
    taxYear: [2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2026-01-01", // estates of decedents dying / gifts made after Dec 31, 2025
    supersededBy: undefined,
    sourceUrl: URL.pl119_21,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "OBBBA PERMANENTLY raised the unified estate, gift, and generation-skipping-transfer basic exclusion amount to $15,000,000 per individual (effectively $30,000,000 for a married couple via portability), indexed for inflation off a 2025 base, for estates of decedents dying and gifts made after December 31, 2025. The statute struck the prior sunset subparagraph, so the exemption does NOT revert to the ~$7M (half of the inflation-adjusted ~$13.99M 2025 figure) that pre-OBBBA law had scheduled for 2026.",
    keywords: ["estate tax", "gift tax", "exemption", "exclusion", "15000000", "15 million", "30 million", "2010", "obbba"],
  },
  {
    chunkId: "irc-2010-estate-pre-obbba-superseded",
    authorityType: "statute",
    citation: STALE.estateTcja,
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "2018-01-01",
    // Pure NEGATIVE stale probe (the $13.61M / scheduled-$7M-reversion myth) — must NEVER surface
    // in retrieval. supersededFrom set at/below the start of its taxYear list so year < supersededFrom
    // is always false for its in-scope years ⇒ always dropped. The correct, citable 2025 estate
    // figure lives in irc-2010-estate-2025 ($13.99M); 2026+ lives in obbba-70106-estate-exemption.
    supersededFrom: 2024,
    supersededBy: "OBBBA §70106 (P.L. 119-21) amending IRC §2010(c)(3) — estate & gift exemption",
    sourceUrl: URL.irc2010,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "Pre-OBBBA stale-law probe: under TCJA the basic exclusion amount was the inflation-adjusted doubled figure ($13.61M for 2024; ~$13.99M for 2025) and was SCHEDULED to revert to roughly $7M (the un-doubled $5M base, inflation-adjusted) for decedents dying / gifts made after December 31, 2025. OBBBA §70106 superseded that reversion, making $15,000,000 permanent from 2026. NEVER cite the ~$7M reversion or the $13.61M figure for tax year 2026 or later.",
    keywords: ["estate tax", "exemption", "13.61", "13610000", "7 million", "revert", "stale", "superseded", "2010"],
  },
  // The CORRECT 2025 estate/gift basic exclusion (over-correction guard for estate-exemption-2025-control).
  // This is the operative, citable answer for a 2025 estate question: $13,990,000 (Rev. Proc. 2024-40,
  // the pre-OBBBA inflation amount). OBBBA §70106's $15M permanent figure first governs decedents dying /
  // gifts made AFTER Dec 31, 2025 — i.e. tax year 2026 — so supersededFrom: 2026 keeps this chunk
  // retrievable for 2025 only and lets the $15M chunk govern 2026+. A 2025 question answers $13.99M;
  // a 2026 question answers $15M.
  {
    chunkId: "irc-2010-estate-2025",
    authorityType: "statute",
    citation: "IRC §2010(c)(3) — estate & gift basic exclusion amount, TY2025 (Rev. Proc. 2024-40)",
    jurisdiction: "federal",
    taxYear: [2025],
    effectiveDate: "2025-01-01",
    supersededFrom: 2026, // OBBBA §70106's $15M permanent figure first governs decedents dying after Dec 31, 2025 (TY2026)
    supersededBy: "OBBBA §70106 (P.L. 119-21) amending IRC §2010(c)(3) — estate & gift exemption",
    sourceUrl: URL.irsEstate,
    ingestedAt: INGESTED,
    verified: true, // $13,990,000 for 2025 confirmed: IRS Instructions for Form 709 (2025) + Rev. Proc. 2024-40 (rp-24-40)
    text:
      "For decedents dying and gifts made in calendar year 2025, the unified estate and gift tax basic exclusion amount under IRC §2010(c)(3) is $13,990,000 per individual (Rev. Proc. 2024-40, the 2025 inflation adjustment). This is the PRE-OBBBA 2025 figure. OBBBA §70106 raised the basic exclusion to a permanent $15,000,000 only for decedents dying and gifts made AFTER December 31, 2025 — i.e., beginning tax year 2026 — so the 2025 amount remains $13,990,000. NEVER cite the $15,000,000 figure for a 2025 estate or gift, and never cite the scheduled-but-repealed ~$7M reversion.",
    keywords: ["estate tax", "gift tax", "exemption", "exclusion", "basic exclusion amount", "13990000", "13.99", "2025", "2010", "rev. proc. 2024-40"],
  },

  // ── Gambling / wagering losses (OBBBA §70114, amending IRC §165(d)) ──
  {
    chunkId: "obbba-70114-wagering-losses",
    authorityType: "statute",
    citation: "OBBBA §70114 (P.L. 119-21) amending IRC §165(d) — wagering-loss limitation",
    jurisdiction: "federal",
    taxYear: [2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2026-01-01", // taxable years beginning after Dec 31, 2025
    supersededBy: undefined,
    sourceUrl: URL.pl119_21,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "OBBBA rewrote IRC §165(d): for tax years beginning after December 31, 2025, the deduction for losses from wagering transactions is limited to 90% of such losses, and is allowed only to the extent of gains from wagering transactions during the year. 'Losses from wagering transactions' is expanded to include any otherwise-allowable deduction incurred in carrying on a wagering transaction (e.g., expenses of a professional gambler). This is a tightening: pre-OBBBA law allowed 100% of wagering losses up to winnings.",
    keywords: ["gambling", "wagering", "wagering losses", "gambling losses", "90 percent", "165", "obbba", "professional gambler"],
  },
  // The CORRECT pre-OBBBA gambling rule for tax year 2025 (and earlier). OBBBA §70114's 90%
  // haircut first governs tax years beginning after Dec 31, 2025 (TY2026), so supersededFrom: 2026
  // keeps this chunk retrievable for ≤2025 and lets the 90% chunk govern 2026+. A 2025 gambling-loss
  // question answers the classic 100%-of-winnings ceiling; a 2026 one answers the 90% haircut.
  {
    chunkId: "irc-165d-gambling-2025",
    authorityType: "statute",
    citation: "IRC §165(d) — wagering-loss limitation, TY2025 and earlier (pre-OBBBA)",
    jurisdiction: "federal",
    taxYear: [2021, 2022, 2023, 2024, 2025],
    effectiveDate: "1954-08-16", // §165(d) wagering-loss rule long predates 2025; bounded here for the modern window
    supersededFrom: 2026, // OBBBA §70114's 90% rule first governs tax years beginning after Dec 31, 2025 (TY2026)
    supersededBy: "OBBBA §70114 (P.L. 119-21) amending IRC §165(d) — wagering-loss limitation",
    sourceUrl: URL.irc165,
    ingestedAt: INGESTED,
    verified: true, // §165(d) 100%-up-to-winnings rule confirmed: 26 U.S.C. §165(d) (pre-OBBBA text) + IRS Pub. 529 / Topic 419
    text:
      "For tax year 2025 and earlier (pre-OBBBA), IRC §165(d) allows a deduction for losses from wagering transactions only to the extent of the gains from wagering transactions during the same taxable year. There is NO percentage haircut: the full amount of wagering losses is deductible up to (but not exceeding) wagering winnings — the classic 100%-of-winnings ceiling. Losses above winnings are not deductible and may not be carried over. (For a non-professional, the losses are an itemized deduction; a professional gambler reports on Schedule C but is still capped at gains under §165(d).) OBBBA §70114 superseded this for tax years beginning after December 31, 2025, limiting the deduction to 90% of losses (still only to the extent of gains) — do NOT apply the 90% haircut for tax year 2025 or earlier.",
    keywords: ["gambling", "gambling losses", "wagering", "wagering losses", "winnings", "100 percent", "up to winnings", "165", "165(d)", "professional gambler"],
  },

  // ── Bonus depreciation (OBBBA §70301, amending IRC §168(k)) ──
  {
    chunkId: "obbba-bonus-depreciation-100",
    authorityType: "statute",
    citation: "OBBBA (P.L. 119-21) amending IRC §168(k) — 100% additional first-year depreciation",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2025-01-20", // property acquired after Jan 19, 2025
    supersededBy: undefined,
    sourceUrl: URL.irsBonus,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "OBBBA PERMANENTLY restored 100% bonus depreciation (the additional first-year depreciation deduction under IRC §168(k)) for qualified property acquired — and specified plants planted or grafted — after January 19, 2025. Businesses may instead elect 40% (60% for certain longer-production-period property or certain aircraft) for qualified property placed in service during the first tax year ending after January 19, 2025. This supersedes the pre-OBBBA phase-down under which bonus was 80% (2023), 60% (2024), and 40% (2025), declining to 0%. See IRS Notice 2026-11.",
    keywords: ["bonus depreciation", "168", "100 percent", "first-year depreciation", "obbba", "section 168k", "phase-down", "notice 2026-11"],
  },
  {
    chunkId: "irc-168k-bonus-pre-obbba-superseded",
    authorityType: "statute",
    citation: STALE.bonusPhasedown,
    jurisdiction: "federal",
    taxYear: [2023, 2024],
    effectiveDate: "2023-01-01",
    // Pure NEGATIVE stale probe (the 80/60/40 phase-down myth) — must NEVER surface. supersededFrom
    // at/below the start of its taxYear list ⇒ always dropped (preserves the prior absolute-drop
    // behavior under the new year-aware filter).
    supersededFrom: 2023,
    supersededBy: "OBBBA (P.L. 119-21) amending IRC §168(k) — 100% additional first-year depreciation",
    sourceUrl: URL.irc168,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "Pre-OBBBA stale-law probe: under TCJA's phase-down, the §168(k) bonus-depreciation percentage was 80% for property placed in service in 2023, 60% in 2024, and 40% in 2025, declining to 20% in 2026 and 0% after. OBBBA superseded this schedule, restoring 100% for property acquired after January 19, 2025. NEVER cite the 80/60/40 phase-down for property acquired after January 19, 2025.",
    keywords: ["bonus depreciation", "168", "80 percent", "60 percent", "40 percent", "phase-down", "stale", "superseded"],
  },

  // ── QBI §199A made permanent (OBBBA §70105) ──
  {
    chunkId: "obbba-70105-qbi-permanent",
    authorityType: "statute",
    citation: "OBBBA §70105 (P.L. 119-21) amending IRC §199A — QBI deduction made permanent",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2026-01-01", // enhancements apply to tax years beginning after Dec 31, 2025
    supersededBy: undefined,
    sourceUrl: URL.irsQbi,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "OBBBA made the IRC §199A qualified-business-income deduction PERMANENT — it is NOT repealed and does NOT sunset after 2025. The core 20%-of-QBI deduction (plus 20% of qualified REIT dividends and PTP income) continues. For tax years beginning after December 31, 2025, OBBBA also widened the taxable-income phase-in range of the W-2-wage / SSTB limitations from $50,000 to $75,000 (single) and from $100,000 to $150,000 (joint), and added a minimum $400 deduction for a taxpayer with at least $1,000 of QBI from an active qualified trade or business (both amounts inflation-indexed after 2026). §199A is also exempted from the new §68 itemized-deduction limitation.",
    keywords: ["qbi", "199a", "qualified business income", "permanent", "20 percent", "obbba", "sstb", "400 minimum", "75000"],
  },
  {
    chunkId: "irc-199A-sunset-pre-obbba-superseded",
    authorityType: "statute",
    citation: STALE.qbiSunset,
    jurisdiction: "federal",
    taxYear: [2024, 2025],
    effectiveDate: "2018-01-01",
    // Pure NEGATIVE stale probe (the "§199A sunsets/repealed after 2025" myth) — must NEVER surface.
    // supersededFrom at/below the start of its taxYear list ⇒ always dropped.
    supersededFrom: 2024,
    supersededBy: "OBBBA §70105 (P.L. 119-21) amending IRC §199A — QBI deduction made permanent",
    sourceUrl: URL.irc199A,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "Pre-OBBBA stale-law probe: under TCJA the §199A QBI deduction was scheduled to SUNSET for tax years beginning after December 31, 2025. OBBBA §70105 superseded that sunset, making the deduction permanent and enhancing the phase-in thresholds. NEVER state that §199A expires or is repealed after 2025.",
    keywords: ["qbi", "199a", "sunset", "expire", "repealed", "2025", "stale", "superseded"],
  },

  // ── Itemized-deduction limitation, 2026 (OBBBA §70111 §68, §70425 0.5% floor, §70424 non-itemizer) ──
  {
    chunkId: "obbba-70111-itemized-limitation",
    authorityType: "statute",
    citation: "OBBBA §70111 (P.L. 119-21) rewriting IRC §68 — limitation on tax benefit of itemized deductions",
    jurisdiction: "federal",
    taxYear: [2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2026-01-01", // taxable years beginning after Dec 31, 2025
    supersededBy: undefined,
    sourceUrl: URL.pl119_21,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "For tax years beginning after December 31, 2025, OBBBA replaced the old Pease limitation with a new IRC §68: total itemized deductions otherwise allowable are reduced by 2/37 of the lesser of (a) the amount of itemized deductions, or (b) so much of taxable income (computed with the itemized deductions added back) as exceeds the dollar amount at which the 37% bracket begins. Because 2/37 of a 37% bracket equals a 2-percentage-point haircut, the limitation caps the tax benefit of itemized deductions at an effective 35 cents per dollar for the highest-bracket taxpayers. It applies AFTER any other limitation, and the §199A QBI deduction is computed without regard to §68.",
    keywords: ["itemized deductions", "limitation", "68", "35 percent", "2/37", "37 percent bracket", "pease", "obbba", "cap"],
  },
  {
    chunkId: "obbba-70425-charitable-floor",
    authorityType: "statute",
    citation: "OBBBA §70425 (P.L. 119-21) adding IRC §170(b)(1)(I) — 0.5% AGI charitable floor (itemizers)",
    jurisdiction: "federal",
    taxYear: [2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2026-01-01", // taxable years beginning after Dec 31, 2025
    supersededBy: undefined,
    sourceUrl: URL.pl119_21,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "For tax years beginning after December 31, 2025, OBBBA added a 0.5%-of-contribution-base FLOOR on the itemized charitable-contribution deduction (IRC §170(b)(1)(I)): an itemizer's otherwise-allowable charitable contributions are deductible only to the extent their aggregate exceeds 0.5% of the taxpayer's contribution base (generally AGI) for the year, with ordering and carryforward rules. The first half-percent of charitable giving therefore yields no itemized deduction.",
    keywords: ["charitable", "0.5 percent floor", "170", "contribution base", "itemized", "obbba", "charity floor", "agi"],
  },
  {
    chunkId: "obbba-70424-nonitemizer-charitable",
    authorityType: "statute",
    citation: "OBBBA §70424 (P.L. 119-21) amending IRC §170(p) — permanent non-itemizer charitable deduction",
    jurisdiction: "federal",
    taxYear: [2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2026-01-01", // taxable years beginning after Dec 31, 2025
    supersededBy: undefined,
    sourceUrl: URL.pl119_21,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "For tax years beginning after December 31, 2025, OBBBA permanently reinstated and expanded the ABOVE-THE-LINE charitable deduction for taxpayers who do NOT itemize (IRC §170(p)): up to $1,000 ($2,000 on a joint return) of cash contributions to qualifying organizations, with no expiration year. This restores (at a higher amount than the 2021 $300/$600) a deduction for the standard-deduction-claiming majority.",
    keywords: ["charitable", "non-itemizer", "nonitemizer", "above-the-line", "170p", "1000", "2000", "obbba", "standard deduction"],
  },

  // ── Governing-IRC anchor chunks (so a cite to the base section resolves) ──
  {
    chunkId: "irc-164-salt-anchor",
    authorityType: "statute",
    citation: "IRC §164 — deduction for taxes (SALT base section)",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028, 2029, 2030],
    effectiveDate: "1954-08-16",
    supersededBy: undefined,
    sourceUrl: URL.irc164,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "IRC §164 allows an itemized deduction for certain taxes paid — state and local income (or general sales) taxes, real property taxes, and personal property taxes. §164(b)(6) limits the aggregate of these state-and-local taxes; OBBBA §70120 sets that limit (the 'applicable limitation amount') for 2025 onward.",
    keywords: ["164", "salt", "deduction for taxes", "state and local", "property tax", "income tax deduction"],
  },
  {
    chunkId: "irc-2010-estate-anchor",
    authorityType: "statute",
    citation: "IRC §2010 — unified credit against estate tax (base section)",
    jurisdiction: "federal",
    taxYear: [2026, 2027, 2028, 2029, 2030],
    effectiveDate: "1976-10-04",
    supersededBy: undefined,
    sourceUrl: URL.irc2010,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "IRC §2010 provides a unified credit against the estate tax equal to the tax on the 'basic exclusion amount' under §2010(c)(3). OBBBA §70106 sets that basic exclusion amount at $15,000,000 (inflation-indexed off 2025) for decedents dying and gifts made after December 31, 2025.",
    keywords: ["2010", "estate tax", "unified credit", "basic exclusion amount", "applicable exclusion"],
  },
  {
    chunkId: "irc-165-losses-anchor",
    authorityType: "statute",
    citation: "IRC §165 — losses (wagering-loss base section)",
    jurisdiction: "federal",
    taxYear: [2026, 2027, 2028, 2029, 2030],
    effectiveDate: "1954-08-16",
    supersededBy: undefined,
    sourceUrl: URL.irc165,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "IRC §165 allows a deduction for losses sustained during the taxable year and not compensated by insurance. §165(d) governs losses from wagering transactions; OBBBA §70114 limits the wagering-loss deduction to 90% of losses, only to the extent of wagering gains, for tax years beginning after December 31, 2025.",
    keywords: ["165", "losses", "wagering losses", "gambling losses", "deduction for losses"],
  },
  {
    chunkId: "irc-168-depreciation-anchor",
    authorityType: "statute",
    citation: "IRC §168 — accelerated cost recovery system (bonus-depreciation base section)",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028, 2029, 2030],
    effectiveDate: "1986-10-22",
    supersededBy: undefined,
    sourceUrl: URL.irc168,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "IRC §168 is the Modified Accelerated Cost Recovery System (MACRS) for depreciating tangible business property. §168(k) provides the additional first-year ('bonus') depreciation deduction; OBBBA permanently restored that allowance to 100% for qualified property acquired after January 19, 2025.",
    keywords: ["168", "depreciation", "macrs", "cost recovery", "bonus depreciation", "first-year depreciation"],
  },
  {
    chunkId: "irc-68-itemized-anchor",
    authorityType: "statute",
    citation: "IRC §68 — overall limitation on itemized deductions (base section)",
    jurisdiction: "federal",
    taxYear: [2026, 2027, 2028, 2029, 2030],
    effectiveDate: "1990-11-05",
    supersededBy: undefined,
    sourceUrl: URL.irc68,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "IRC §68 limits itemized deductions for higher-income individuals. The pre-2018 'Pease' version was suspended 2018-2025; OBBBA §70111 rewrote §68 for tax years after 2025 to reduce itemized deductions by 2/37 of the lesser of the deductions or taxable income above the 37% bracket threshold — capping their benefit at an effective 35%.",
    keywords: ["68", "itemized deductions", "overall limitation", "pease", "limitation on itemized"],
  },
  {
    chunkId: "irc-68-pease-pre-obbba-superseded",
    authorityType: "statute",
    citation: STALE.pease,
    jurisdiction: "federal",
    taxYear: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    effectiveDate: "2018-01-01",
    // Pure NEGATIVE stale probe (the "§68 suspended / itemized deductions unlimited" myth) — must
    // NEVER surface. supersededFrom at/below the start of its taxYear list ⇒ always dropped.
    supersededFrom: 2018,
    supersededBy: "OBBBA §70111 (P.L. 119-21) rewriting IRC §68 — limitation on tax benefit of itemized deductions",
    sourceUrl: URL.irc68,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "Pre-OBBBA stale-law probe: TCJA SUSPENDED the §68 Pease overall limitation on itemized deductions for tax years 2018 through 2025 (so high earners faced NO §68 haircut). OBBBA §70111 superseded that suspension with a new 2/37 limitation effective for tax years beginning after December 31, 2025. NEVER state that itemized deductions are unlimited by §68 for tax year 2026 or later.",
    keywords: ["68", "pease", "suspended", "no limitation", "stale", "superseded", "itemized"],
  },

  // ── Circular 230 §10.34(d) — reliance on information furnished by the client ──
  // Practice-standard authority (a REGULATION, not OBBBA). Closes the corpus gap the
  // circ230-reliance-on-others case exposed: the engine had no Circular 230 at all. The right
  // cite for relying on client-furnished information is §10.34(d); §10.22(c)(1) is the off-point
  // mis-cite. Tied to the cash-charitable-contribution substantiation context (a practitioner may
  // rely in good faith on a client's stated cash gift, but must make reasonable inquiries if it
  // looks unsubstantiated/inconsistent). Broad current taxYear range — a practice standard is not
  // year-keyed — and no supersession.
  {
    chunkId: "circ-230-10-34-d-reliance",
    authorityType: "regulation",
    citation: "31 C.F.R. §10.34(d) (Circular 230) — reliance on information furnished by the client",
    jurisdiction: "federal",
    taxYear: [2023, 2024, 2025, 2026, 2027],
    effectiveDate: "2014-06-12", // current Circular 230 (Rev. 6-2014) text of §10.34(d)
    supersededBy: undefined,
    sourceUrl: URL.circ230SubpartB,
    ingestedAt: INGESTED,
    verified: true, // §10.34(d) text confirmed against eCFR 31 CFR Part 10 Subpart B + IRS Circular 230 (Rev. 6-2014)
    text:
      "Circular 230 §10.34(d) (31 C.F.R. §10.34(d)): a practitioner advising a client to take a position on, or preparing or signing, a tax return, document, affidavit, or other paper submitted to the IRS GENERALLY MAY RELY IN GOOD FAITH WITHOUT VERIFICATION upon information furnished by the client. The practitioner may NOT, however, ignore the implications of information furnished to or actually known by the practitioner, and MUST MAKE REASONABLE INQUIRIES if the information as furnished appears to be incorrect, inconsistent with an important fact or another factual assumption, or incomplete. Applied to substantiation (e.g. a claimed cash charitable contribution): the preparer may rely on the client's representation of the gift, but must make reasonable inquiries where the amount or documentation appears incorrect, inconsistent, or incomplete rather than accept it blindly.",
    keywords: ["circular 230", "10.34", "10.34(d)", "reliance", "rely in good faith", "client representations", "reasonable inquiries", "information furnished by the client", "substantiation", "charitable contribution", "practitioner", "due diligence"],
  },

  // ── Blue J-tier corpus gaps closed (web-verified 2026-06-25; see docs/RESEARCH_BENCHMARK.md). These six
  // provisions were missing and produced the only outright error (Trump Account) and the "couldn't ground
  // the figure" punts ($512K EBL, $15M QSBS cap, §4475 funding test) in the hardest test run. ──
  {
    chunkId: "obbba-70204-trump-account-530a",
    authorityType: "statute",
    citation: "OBBBA §70204 (P.L. 119-21) — IRC §530A 'Trump account'; IRS Notice 2025-68",
    jurisdiction: "federal",
    taxYear: [2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2026-01-01", // §530A applies to tax years beginning after Dec 31, 2025
    supersededBy: undefined,
    sourceUrl: "https://www.irs.gov/pub/irs-drop/n-25-68.pdf",
    ingestedAt: INGESTED,
    verified: true,
    text:
      "A 'Trump account' (IRC §530A, enacted by OBBBA) is treated as a TRADITIONAL IRA under §408(a) (§530A(a); IRS Notice 2025-68 Q&A A-2). It is NOT a capital-gains vehicle. On distribution (first allowed January 1 of the year the beneficiary turns 18), the portion exceeding the account's basis is included in gross income under §408(d)(1) in the manner provided by §72 and is taxed as ORDINARY INCOME at the beneficiary's marginal rate — there is NO long-term-capital-gain rate and NO basis step-up. A distribution before age 59½ is subject to the §72(t) 10% additional tax unless an exception applies. BASIS: only after-tax contributions from the taxpayer/family create basis and come out tax-free (capped, with §128 contributions, at $5,000/year aggregate, indexed). The $1,000 federal pilot/seed contribution (children born 2025-2028), qualified general (state/charity) contributions, and §128 employer contributions ($2,500/year, excluded from the employee's income) do NOT create basis and are FULLY TAXABLE as ordinary income on withdrawal, along with all earnings. Kiddie-tax (§1(g)) exposure can apply to a large taxable distribution. The detailed distribution mechanics are reserved in the March 2026 proposed regulations, but the ordinary-income CHARACTER is fixed by §530A(a) → §408(d)(1) → §72.",
    keywords: ["trump account", "530a", "child savings", "newborn", "distribution", "408", "traditional ira", "ordinary income", "128", "turns 18"],
  },
  {
    chunkId: "obbba-461l-ebl-threshold",
    authorityType: "statute",
    citation: "IRC §461(l)(3)(A)(ii)(II) — excess business loss threshold; Rev. Proc. 2025-32 §.31",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2025-01-01",
    supersededBy: undefined,
    sourceUrl: "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf",
    ingestedAt: INGESTED,
    verified: true,
    text:
      "The IRC §461(l) excess-business-loss (EBL) limitation for noncorporate taxpayers is PERMANENT after OBBBA (the TCJA sunset was struck) and applies for 2025 and 2026. The inflation-adjusted threshold under §461(l)(3)(A)(ii)(II): for tax years beginning in 2026 it is $256,000 ($512,000 for a joint return) per Rev. Proc. 2025-32 §.31 — a DECREASE from the 2025 amounts of $313,000 ($626,000 joint) (Rev. Proc. 2024-40). A disallowed excess business loss is NOT lost: it carries forward as a regular §172 net operating loss and is NOT retested under §461(l) in the carryforward year (the House per-year-retest proposal did not become law). The carryforward NOL is subject to the 80%-of-taxable-income §172 limitation. Computed on Form 461; only business income/loss counts — W-2 wages and capital gains are not business items for this limitation, and the EBL is applied LAST, after the basis, §465 at-risk, and §469 passive limitations.",
    keywords: ["461", "excess business loss", "ebl", "512,000", "256,000", "rev. proc. 2025-32", "carryforward", "no retest", "461(l)"],
  },
  {
    chunkId: "obbba-70431-qsbs-1202",
    authorityType: "statute",
    citation: "OBBBA §70431 (P.L. 119-21) amending IRC §1202 — QSBS tiered exclusion + $15M cap",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2025-07-05", // QSBS acquired after July 4, 2025
    supersededBy: undefined,
    sourceUrl: "https://www.law.cornell.edu/uscode/text/26/1202",
    ingestedAt: INGESTED,
    verified: true,
    text:
      "For qualified small business stock (QSBS) ACQUIRED AFTER JULY 4, 2025, OBBBA amended IRC §1202 to provide a TIERED gain exclusion: 50% if held at least 3 years, 75% if held at least 4 years, 100% if held at least 5 years (prior law gave 100% only at a 5-year hold). The per-issuer gain limitation under §1202(b) is the GREATER OF (A) $15,000,000 (raised from $10,000,000), reduced by eligible gain excluded for that issuer in prior years, or (B) 10 times the taxpayer's aggregate adjusted basis in the issuer's QSBS disposed of during the year (the 10x-basis prong is unchanged; only the dollar figure rose from $10M to $15M). The $15,000,000 is indexed under §1(f)(3) for years after 2026. The corporation's aggregate-gross-assets ceiling rose from $50,000,000 to $75,000,000. ELIGIBILITY TURNS ON THE STOCK'S ACQUISITION DATE: stock issued on or before July 4, 2025 stays under the OLD regime (100% only at 5 years, $10M/10x cap, $50M asset test). For 100%-exclusion stock acquired after Sept 27, 2010 there is NO AMT preference on the excluded gain. NOTE: many states (e.g. California) do not conform to §1202, taxing the gain in full.",
    keywords: ["qsbs", "1202", "qualified small business stock", "15,000,000", "10x basis", "tiered", "founder", "75,000,000", "acquired after july", "qualified trade or business"],
  },
  {
    chunkId: "obbba-70604-remittance-4475",
    authorityType: "statute",
    citation: "OBBBA §70604 (P.L. 119-21) — IRC §4475 remittance-transfer excise tax (1%)",
    jurisdiction: "federal",
    taxYear: [2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2026-01-01", // transfers made after Dec 31, 2025
    supersededBy: undefined,
    sourceUrl: URL.pl119_21,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "IRC §4475 (added by OBBBA) imposes a 1% excise tax on the amount of a remittance transfer. CRITICAL SCOPE — the FUNDING TEST in §4475(c): the tax applies ONLY to a remittance transfer for which the SENDER PROVIDES CASH, A MONEY ORDER, A CASHIER'S CHECK, OR ANY OTHER SIMILAR PHYSICAL INSTRUMENT (as determined by the Secretary; the proposed regs add traveler's checks) to the remittance transfer provider. Transfers funded from an account or by a U.S.-issued debit or credit card are OUT of scope. The flat 1% rate applies (an earlier 5%/sender-citizenship version did NOT become law). The sender bears the tax; the provider collects and remits quarterly on Form 720. Effective for transfers made after December 31, 2025. A digital-asset / stablecoin transfer (e.g. USDC) is not funded with a physical instrument, which is the strongest argument it falls OUTSIDE §4475 — though the provision is new and untested and Treasury could read 'similar instrument' more broadly.",
    keywords: ["remittance", "4475", "physical instrument", "money order", "cashier's check", "stablecoin", "usdc", "send", "abroad", "1 percent"],
  },
  {
    chunkId: "obbba-70307-168n-qpp",
    authorityType: "statute",
    citation: "OBBBA §70307 (P.L. 119-21) — IRC §168(n) qualified production property; IRS Notice 2026-16",
    jurisdiction: "federal",
    taxYear: [2025, 2026, 2027, 2028, 2029, 2030],
    effectiveDate: "2025-01-20", // construction begun after Jan 19, 2025
    supersededBy: undefined,
    sourceUrl: "https://www.irs.gov/pub/irs-drop/n-26-16.pdf",
    ingestedAt: INGESTED,
    verified: true,
    text:
      "IRC §168(n) (added by OBBBA) lets a taxpayer ELECT 100% expensing for 'qualified production property' — the portion of nonresidential real property used as an integral part of a qualified production activity (manufacturing, production, or refining of tangible personal property), where construction began after January 19, 2025 and the property is placed in service before January 1, 2031. 'Production' requires the activity to result in a SUBSTANTIAL TRANSFORMATION of the property comprising the qualified product. That term is DEFINED — NOT reserved — by IRS Notice 2026-16 §5.02(9): a substantial transformation produces a final, complete, and distinct item fundamentally different in form, function, or character from the inputs (with examples, and a packaging/repackaging counter-example that does NOT qualify). Office, administrative, R&D, lodging, and parking space is excluded; a mixed-use facility (e.g. a semiconductor fab) is allocated, with clean-room/production areas the strong candidates, requiring documentation of space use and placed-in-service dating.",
    keywords: ["168", "qualified production property", "qpp", "substantial transformation", "100% expensing", "manufacturing", "fab", "notice 2026-16", "production"],
  },
];

// ── CALIFORNIA CONFORMITY CHUNK ───────────────────────────────────────────────────────────
// CA does NOT automatically conform to OBBBA. SB 711 (enacted Oct 1, 2025) advanced California's
// IRC conformity date only to January 1, 2025 — BEFORE OBBBA's July 4, 2025 enactment. So the
// OBBBA federal deductions above do NOT flow to a California return. This chunk exists so a CA-
// jurisdiction query is met with the conformity rule, not a federal OBBBA figure.

export const OBBBA_CALIFORNIA_CHUNKS: ObbbaAuthorityChunk[] = [
  {
    chunkId: "ca-sb711-obbba-nonconformity",
    authorityType: "statute",
    citation: "CA SB 711 (2025) — IRC conformity date Jan 1, 2025 (does not include OBBBA / P.L. 119-21)",
    jurisdiction: "CA",
    taxYear: [2025, 2026, 2027, 2028],
    effectiveDate: "2025-01-01",
    supersededBy: undefined,
    sourceUrl: URL.ftbConformity,
    ingestedAt: INGESTED,
    verified: true,
    text:
      "California does NOT conform to the One Big Beautiful Bill Act. SB 711 (enacted October 1, 2025) advanced California's specified Internal Revenue Code conformity date from January 1, 2015 to January 1, 2025 — but OBBBA (Public Law 119-21) was enacted July 4, 2025, AFTER that date, so California has not adopted it. Consequently, the OBBBA federal deductions (no-tax-on-tips §224, no-tax-on-overtime §225, the $6,000 senior deduction, the $40,000 SALT cap, 100% bonus depreciation, etc.) do NOT apply for California income-tax purposes; CA taxpayers add these federal deductions back on Schedule CA (540/540NR). Always compute the California return on pre-OBBBA conformity unless a later CA conformity bill changes this.",
    keywords: ["california", "ca", "conformity", "sb 711", "obbba", "nonconformity", "schedule ca", "tips", "overtime", "does not conform"],
  },
];

// The full OBBBA corpus, ready to register with the store's retrieve().
export const CORPUS_OBBBA: ObbbaAuthorityChunk[] = [
  ...OBBBA_FEDERAL_CHUNKS,
  ...OBBBA_CALIFORNIA_CHUNKS,
];

// Figures NOT confirmed against a primary source this run (verified:false would list them).
// Empty: every chunk above was read off Public Law 119-21 (congress.gov) or official
// irs.gov / ftb.ca.gov guidance in this session.
export const OBBBA_UNVERIFIED: string[] = [];
