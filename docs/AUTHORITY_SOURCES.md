# Petal authority-source map (fetch-path wiring plan)

Web-verified 2026-06-24. Petal already grounds in federal **statute** (GovInfo USCODE/PLAW) and
**regulations** (eCFR + Federal Register). The three real gaps: **case law**, **IRS administrative
guidance**, and **state** authority. The fetch path fetches PRIMARY text and grounds in it — never a
web search, never a secondary summary, never taxpayer PII in a query (queries are public-law-shaped:
a section number, a cite, a bill/ruling/docket number).

## Wire now (biggest authority gaps first)

| Source | Endpoint | Key? | Closes | Authority basis |
|---|---|---|---|---|
| **US Tax Court DAWSON** | `https://public-api.dawson.ustaxcourt.gov/public-api/opinion-search` | keyless | Case law (the #1 gap) — T.C., T.C. Memo, Summary opinions, the issuing court's own feed | Tier 1 tax. Tag Summary opinions non-precedential (IRC 7463(b)) |
| **CourtListener citation-lookup** | `https://www.courtlistener.com/api/rest/v4/citation-lookup/` | token | Cite resolver: a reporter cite → the exact opinion to fetch primary text from (verifies a cite exists) | Conduit to court opinions; core to cited/abstaining |
| **CourtListener search/courts** | `https://www.courtlistener.com/api/rest/v4/` | token | SCOTUS + all 13 circuits + district + CFC, and the `/courts/` taxonomy for the level+circuit axis | Lets Petal rank an in-circuit holding above a ruling / out-of-circuit case |
| **IRS Internal Revenue Bulletin** | `https://www.irs.gov/irb/{YYYY}-{NN}_IRB` | keyless | Rev. Ruls., Rev. Procs., Notices — the IRS guidance layer (GovInfo has NO IRB; this is the only authoritative home) | Tier 1 administrative (named in 1.6662-4(d)(3)(iii)) |
| **IRS Written Determinations** | `https://www.irs.gov/pub/irs-wd/{DOCNUMBER}.pdf` | keyless | PLRs/TAMs/CCA — IRS reasoning on edge cases | Substantial authority BUT **IRC 6110(k)(3): never cite as precedent** — caveat on every one |
| **Congress.gov API** | `https://api.congress.gov/v3` | free key (api.data.gov) | Bill status + public-law locator (cleaner than GovInfo BILLSTATUS) | `/law` → enacted (fetch text from GovInfo); `/bill` → proposed, NOT authority |
| **JCT Blue Books** | `https://api.govinfo.gov/collections/CPRT` (docClass JPRT) | existing GovInfo key | Legislative explanation / intent — on already-wired GovInfo infra | Named substantial authority (catch-all) |
| **California leginfo (RTC)** | `https://downloads.leginfo.legislature.ca.gov/` | keyless | First STATE primary authority — CA Revenue & Taxation Code incl. §17024.5 conformity statute | Tier 1 state statute; the conformity anchor |
| **California FTB** | `https://www.ftb.ca.gov/tax-pros/law/` | keyless (server-side UA; WebFetch is 403) | CA Legal Rulings + the official conformity statement (SB 711, Conformity Act of 2025) | FTB Legal Rulings = Rev.Rul. analog; do NOT treat FTB TAMs as authority (voided) |

## Wire later
NY Senate Open Legislation (2nd state / rolling-conformity template) · Regulations.gov v4 (docket/comment
context, not authority) · GovInfo CFR annual edition (dated official reg backstop vs eCFR's current-only) ·
GovInfo USCOURTS (GPO-authenticated PDFs, selective) · Open States v3 (50-state conformity-change detector) ·
NY DTF TSB-A/TSB-M · CA OAL 18 CCR (apportionment regs, brittle viewer) · Treasury Green Book (proposal color,
not authority) · IRS forms/pubs (explanatory, not authority).

## Skip (would violate primary-authority-only, or duplicates)
GovTrack (sunset, derived) · ProPublica Congress API (dead) · unitedstates/congress (ETL, not a runtime API) ·
Cornell LII (unofficial republisher, no API — GovInfo USCODE is the official source) · Google Scholar (no API,
ToS bars scraping) · TIGTA / GAO (oversight, zero return-position weight) · IRS Newsroom (FAQs/releases are not
legal authority) · NY Open Data (statistics, not law).

## Discipline (carries into every fetch)
- Fetch primary text and ground in it; never cite a mirror, aggregator, or web-search snippet as the authority.
- Weight by the three axes (statute / courts by level+circuit / agency) and Treas. Reg. 1.6662-4(d)(3)(iii);
  never let a ruling override a contrary controlling in-circuit holding; never cite a PLR/TAM/CCA as precedent.
- Queries are public-law-shaped (section / cite / bill / ruling / docket number) — never taxpayer PII.
