// Fetch-source registry: routes a coverage-gap question to the right primary-source API(s), in
// authority order, and returns hits with a uniform shape plus a getText() that pulls the PRIMARY
// text to ground in. Every outbound query passes the §7216 guard first. HONEST DEGRADATION: a
// source whose getText isn't wired yet (or fails) throws → the engine abstains, never guesses.

import { assertPublicLawQuery } from "./guard";
import { searchGovInfo, fetchGovInfoText, stripHtml, statuteQuery, type GovInfoResult } from "./govinfo";
import { searchEcfr, cfrRefsFromQuery, fetchEcfrSection } from "./ecfr";
import { isCaConformityQuestion, fetchRtcSection, fetchFtbPub1001, rtcUrl, ftbPub1001Url, RTC_CONFORMITY_SECTIONS } from "./ca-conformity";
import { courtListenerMatches, searchCourtListener, caseGroundText, caseQuery } from "./courtlistener";
import { searchTaxCourt, taxCourtDownloadUrl, fetchTaxCourtText } from "./tax-court";
import { searchIrb } from "./irs-irb";
import { congressGovMatches, searchCongressGov } from "./congress-gov";
import { matchesIrsDrop, searchIrsDrop } from "./irs-drop";
import { matchesIrsPub, searchIrsPub } from "./irs-pub";
import { matchesIrm, searchIrm } from "./irm";
import { matchesCapCaselaw, searchCapCaselaw } from "./cap-caselaw";
import { matchesSecEdgar, searchSecEdgar } from "./sec-edgar";
import { matchesIrsWd, uilQuery, searchIrsWd, fetchWrittenDeterminationText, writtenDeterminationCitation } from "./irs-wd";
import { matchesOpenStates, searchOpenStates } from "./openstates";
import { matchesTreaty, searchTreaty } from "./treaty";
import { searchFederalRegister } from "./federal-register";

export type FetchHit = {
  source: string; // "govinfo" | "tax-court" | ...
  title: string;
  citation: string;
  sourceUrl: string;
  authorityTier: number; // 1 statute, 2 reg, 3 case, 4 agency-guidance (rank for the 3-axis model)
  precedential?: boolean; // false ⇒ never cite as precedent (Summary Opinion / PLR / TAM)
  getText: () => Promise<string>; // pulls the PRIMARY text to ground in (throws ⇒ honest abstain)
};

export type FetchSource = {
  id: string;
  label: string;
  matches: (q: string) => boolean; // does this source fit the question shape?
  search: (q: string, opts?: { signal?: AbortSignal }) => Promise<FetchHit[]>;
};

// ── GovInfo: federal statute (USCODE) + enacted public laws (PLAW). Full primary text available. ──
const govinfoStatute: FetchSource = {
  id: "govinfo",
  label: "GovInfo (U.S. Code / Public Laws)",
  // `§\s*\d` lives OUTSIDE the \b group on purpose: a word boundary can't sit between a space and the
  // non-word "§", so "§1202" (the glyph form, no "section" word) would otherwise never match and the
  // question would route to NO source. This is the form taxpayers actually type.
  matches: (q) => /§\s*\d|\b(section|irc|u\.?\s?s\.?\s?c|public law|pub\.?\s?l|statute|enacted|act of|obbba|one big beautiful)\b/i.test(q),
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    const wantsPublicLaw = /\b(obbba|one big beautiful|public law|pub\.?\s?l|p\.l\.|enacted|act of)\b/i.test(safe);
    // The exact Code section(s) the question cites.
    const citedSecs = [...safe.matchAll(/(?:§+\s*|\bsection\s+|\birc\s+|\b26\s+u\.?\s?s\.?\s?c\.?\s*)(\d+[A-Za-z]?)/gi)].map((m) => m[1].toLowerCase());
    // For a §-cite question, search GovInfo by the SECTION (plus minimal disambiguation), NOT the full
    // question's content nouns — those distract GovInfo's relevance so badly the real statute drops out
    // entirely (a "§1031 ... TCJA property" query returned §1 / Public Laws and never §1031). The bare
    // "section N" reliably returns the right granule (verified for §1031/§163/§7703); a topic question
    // (no cited section) still uses statuteQuery.
    const govQuery = citedSecs.length && !wantsPublicLaw ? citedSecs.map((s) => `section ${s}`).join(" ") : statuteQuery(safe);
    const results = await searchGovInfo(govQuery, { collections: ["USCODE", "PLAW"], pageSize: 10, signal: opts?.signal });
    return results
      .filter((r): r is GovInfoResult & { textUrl: string } => !!r.textUrl)
      // The IRC is Title 26. GovInfo's "section N" search collides across ALL USC titles and often ranks
      // a wrong-title section first (a bare "section 121" returns 35 U.S.C. 121 patents above 26 U.S.C.
      // 121; "section 1031" returns Title 29/7 above Title 26). Drop non-Title-26 USCODE results so the
      // engine never grounds a tax answer on a patent/labor section. PLAW (public laws) carry no title.
      .filter((r) => r.collection !== "USCODE" || /title26/i.test(r.packageId))
      // Rank: the EXACT cited section first, then any codified Title-26 statute, then the rest. Fixes the
      // settled-law over-abstention where a tangential Public Law (welfare reform) or a content-relevant
      // wrong section (§1) crowded the real §121 statute out of the chunks the engine distills.
      .sort((a, b) => {
        if (wantsPublicLaw) return 0;
        const secHit = (x: GovInfoResult) => (citedSecs.some((s) => new RegExp(`[-/]sec${s}(?:[-/]|$)`, "i").test(x.granuleUrl ?? "")) ? 0 : 1);
        const uscode = (x: GovInfoResult) => (x.collection === "USCODE" ? 0 : 1);
        return secHit(a) - secHit(b) || uscode(a) - uscode(b);
      })
      .map((r) => {
        // CITE WITH THE SECTION NUMBER. GovInfo's `title` is the section HEADING ("Gross income defined"),
        // not the cite — so an answer carried "Gross income defined" instead of "26 U.S.C. §61", which is
        // unverifiable and fails a §-number check. Recover the section from the granule id (".../sec61/").
        const secM = (r.granuleUrl ?? r.packageId).match(/[-/]sec([0-9]+[A-Za-z]?(?:-[0-9]+)?)/i);
        const titleM = r.packageId.match(/title(\d+)/i);
        const citation = secM ? `${titleM ? titleM[1] : "26"} U.S.C. §${secM[1]}${r.title ? ` — ${r.title}` : ""}` : r.title;
        return {
          source: "govinfo",
          title: r.title,
          citation,
          sourceUrl: r.granuleUrl ?? r.textUrl,
          authorityTier: 1, // statute is the top axis
          getText: () => fetchGovInfoText(r.textUrl, { signal: opts?.signal }),
        };
      });
  },
};

// ── California conformity: the state-authority source for "does CA conform to federal §X" (the
// highest-dollar gap — the §1202 QSBS / §199A nonconformity the capstone faulted). Grounds in the two
// R&TC conformity statutes (§17024.5 PIT + §23051.5 CT, the fixed-date conformity mechanism) plus FTB
// Pub. 1001 windowed to the question's topic (the enumerated item-level nonconformity). State research
// → §7216-clean. Pub 1001 is a finding-aid (precedential=false); the R&TC sections are binding. ──
function pub1001Year(question: string): number {
  const m = question.match(/\b(20\d{2})\b/);
  const y = m ? Number(m[1]) : 2025;
  return Math.min(Math.max(y, 2020), 2025); // FTB Pub 1001 confirmed published through 2025
}
const caConformity: FetchSource = {
  id: "ca-conformity",
  label: "California conformity (R&TC + FTB Pub. 1001)",
  matches: (q) => isCaConformityQuestion(q),
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    const hits: FetchHit[] = RTC_CONFORMITY_SECTIONS.map((sec) => ({
      source: "ca-conformity",
      title: `Cal. R&TC §${sec}`,
      citation: `Cal. R&TC §${sec}`,
      sourceUrl: rtcUrl(sec),
      authorityTier: 1, // binding state statute (the conformity mechanism + date)
      precedential: true,
      getText: async () => (await fetchRtcSection(sec, { signal: opts?.signal })).text,
    }));
    const year = pub1001Year(safe);
    hits.push({
      source: "ca-conformity",
      title: `FTB Pub. 1001 (${year})`,
      citation: `FTB Pub. 1001 (${year})`,
      sourceUrl: ftbPub1001Url(year),
      authorityTier: 4, // state sub-regulatory finding-aid (enumerates the adjustments)
      precedential: false,
      getText: async () => (await fetchFtbPub1001(safe, year, { signal: opts?.signal })).text,
    });
    return hits;
  },
};

// ── eCFR: the CURRENT codified regulation TEXT (Treasury Title 26 + any CFR title). Two paths: a
// SPECIFIC cite (§1.199A-5) is pulled in FULL via the Versioner API — this is cite-VERIFICATION, so a
// model reg citation grounds in the real section text and stops reading "not grounded"; a topic
// question full-text-searches the CFR. A RESERVED section ⇒ precedential=false (open placeholder, not
// binding rule). Tier-2 authority (a final reg). ──
const ecfr: FetchSource = {
  id: "ecfr",
  label: "eCFR (Code of Federal Regulations, current)",
  // Fires on a reg cite, a reg keyword, OR any statute §-cite — because the operative detail for many
  // statutes lives in the implementing reg (an SSTB question's three categories are in §1.199A-5, not
  // §199A). currentLawFirst keeps eCFR as a FALLBACK after the statute for a bare §-cite, so this never
  // mis-ranks the reg ahead of the statute.
  matches: (q) => cfrRefsFromQuery(q).length > 0 || /§\s*\d|\bsection\s+\d|\b(treas\.?\s*reg|c\.?\s?f\.?\s?r|regulation|final reg|proposed reg|reg\.?\s*§)\b/i.test(q),
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    const refs = cfrRefsFromQuery(safe).slice(0, 4);
    if (refs.length) {
      // Specific cite(s): fetch the FULL section text via the Versioner (verifies + grounds the cite).
      return refs.map((ref) => ({
        source: "ecfr",
        title: `${ref.title} CFR §${ref.section}`,
        citation: `${ref.title} CFR §${ref.section}`,
        sourceUrl: `https://www.ecfr.gov/current/title-${ref.title}/section-${ref.section}`,
        authorityTier: 2,
        precedential: true,
        getText: async () => (await fetchEcfrSection(ref, { signal: opts?.signal })).text,
      }));
    }
    // No explicit cite: topic full-text search across the CFR; pull the full section when we can.
    const hits = await searchEcfr(statuteQuery(safe), { perPage: 5, signal: opts?.signal });
    return hits
      .filter((h) => h.section)
      .map((h) => ({
        source: "ecfr",
        title: h.heading || `§ ${h.section}`,
        citation: `26 CFR §${h.section}`,
        sourceUrl: h.sourceUrl,
        authorityTier: 2,
        precedential: !h.reserved, // a RESERVED section is an open placeholder, not binding rule text
        getText: async () => {
          try {
            return (await fetchEcfrSection({ title: 26, part: h.section.split(".")[0], section: h.section }, { signal: opts?.signal })).text;
          } catch {
            return h.excerpt; // fall back to the search snippet
          }
        },
      }));
  },
};

// ── US Tax Court (DAWSON): case law — the courts axis. Search + full-text PDF extraction are wired
// (fetchTaxCourtText: download-url → presigned PDF → unpdf text), so a holding can actually GROUND an
// answer; too-short/failed extraction still fails closed → honest abstain. precedential=false (Summary
// Opinions, IRC §7463(b)) is carried so the engine never cites one as precedent. ──
const taxCourt: FetchSource = {
  id: "tax-court",
  label: "U.S. Tax Court (DAWSON)",
  matches: (q) => /\b(tax court|t\.?\s?c\.?|opinion|held|holding|case law|memo\.?|petitioner)\b/i.test(q),
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    const ops = await searchTaxCourt(safe, { signal: opts?.signal });
    return ops.map((o) => ({
      source: "tax-court",
      title: o.caseCaption,
      citation: o.citation,
      sourceUrl: taxCourtDownloadUrl(o.docketNumber, o.docketEntryId),
      authorityTier: 3,
      precedential: o.precedential,
      getText: async () => {
        const text = await fetchTaxCourtText(taxCourtDownloadUrl(o.docketNumber, o.docketEntryId), { signal: opts?.signal });
        if (text.length < 200) throw new Error("tax-court opinion text too short to ground → abstain"); // honest
        return text;
      },
    }));
  },
};

// ── IRS Internal Revenue Bulletin: Rev. Ruls. / Rev. Procs. / Notices / Treasury Decisions. The home
// of OBBBA-2025 implementation guidance that GovInfo's 2024 USCODE can't have. searchIrb returns a
// focused excerpt around the topic (already fetched), so getText is a passthrough. ──
const irsIrb: FetchSource = {
  id: "irs-irb",
  label: "IRS Internal Revenue Bulletin",
  matches: (q) =>
    /\b(notice|rev\.?\s?(rul|proc)|revenue (ruling|procedure)|treasury decision|t\.?\s?d\.?\s?\d|irs guidance|bulletin|i\.?r\.?b|obbba|one big beautiful|remittance|trump account|no tax on tips|tip(s)? deduction)\b/i.test(q),
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    const hits = await searchIrb(safe, { signal: opts?.signal });
    return hits.map((h) => ({
      source: "irs-irb",
      title: `Internal Revenue Bulletin ${h.issue}`,
      citation: `I.R.B. ${h.issue}`,
      sourceUrl: h.url,
      authorityTier: 4, // IRS administrative guidance (ranks below statute/reg/case)
      getText: async () => h.text, // already a focused excerpt
    }));
  },
};

// ── Federal Register: Treasury/IRS regulations (Treasury Decisions = final regs; "Proposed Rule" =
// REG- NPRMs). The STRUCTURED tier-1 source — clean JSON, topic-tagged, ID-addressable — and where
// OBBBA implementation regs land (the remittance REG-, the tips T.D.). The `type` carries the
// final-vs-proposed signal: a final Rule is settled reg authority; a Proposed Rule is directional
// (flag it, don't treat as binding). getText prefers the clean abstract, falling back to page text. ──
const federalRegister: FetchSource = {
  id: "federal-register",
  label: "Federal Register (Treasury/IRS regulations)",
  matches: (q) =>
    /\b(regulation|regulations|t\.?\s?d\.?\s?\d|treasury decision|final rule|proposed rule|rulemaking|notice of proposed|reg[-\s]?\d|remittance|tip(s)? (deduction|regulation|rule)|trump account|no tax on tips|effective date)\b/i.test(q),
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    // Reduce the question to targeted statute/topic terms — same fix as GovInfo. Searching the raw
    // natural-language sentence returns NOISE (random agencies' rules matching "final"/"issued"), so a
    // real "§225 overtime final regs" question grounded on a Homeland Security rule. statuteQuery keeps
    // the section ref + content nouns and drops the framing.
    const docs = await searchFederalRegister(statuteQuery(safe), { perPage: 5, signal: opts?.signal });
    return docs.map((d) => {
      const isFinal = /^rule$/i.test(d.type.trim());
      return {
        source: "federal-register",
        title: d.title,
        citation: `${d.type || "Federal Register"} — ${d.agency || "Treasury/IRS"} (${d.publicationDate})`,
        sourceUrl: d.htmlUrl,
        authorityTier: isFinal ? 2 : 4, // final reg = tier 2; proposed/notice ranks lower
        precedential: isFinal, // a proposed rule is not binding authority
        getText: async () => {
          if (d.abstract && d.abstract.length > 120) return d.abstract; // clean structured summary
          try {
            const r = await fetch(d.htmlUrl, { signal: opts?.signal, headers: { "user-agent": "PetalResearch/1.0" } });
            if (r.ok) return stripHtml(await r.text()).slice(0, 8000);
          } catch {
            /* fall through to abstract/title */
          }
          return d.abstract ?? d.title;
        },
      };
    });
  },
};

// ── CourtListener: case law across ALL courts (the non-Tax-Court axis: District, Court of Federal
// Claims, Courts of Appeals by circuit, Supreme Court). Confirms a case cite is real and carries its
// court/precedential tags; grounds on the full opinion when the API has it, else the verified metadata +
// snippet. Tier-3 (case). Unpublished ⇒ precedential=false. DAWSON stays wired alongside for Tax Court. ──
const courtListener: FetchSource = {
  id: "courtlistener",
  label: "CourtListener (federal + state case law)",
  matches: (q) => courtListenerMatches(q),
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    const cases = await searchCourtListener(caseQuery(safe), { limit: 4, signal: opts?.signal });
    return cases.map((c) => ({
      source: "courtlistener",
      title: c.caseName,
      citation: c.citations.length ? `${c.caseName}, ${c.citations.find((x) => /\d/.test(x)) ?? c.citations[0]}` : c.caseName,
      sourceUrl: c.absoluteUrl,
      authorityTier: 3,
      precedential: c.precedential, // Unpublished ⇒ never cite as precedent
      getText: async () => caseGroundText(c, { signal: opts?.signal }),
    }));
  },
};

// ── Newly wired authority/guidance sources. Each ships its own live-verified module; the §7216 guard is
// applied HERE (assertPublicLawQuery) before any outbound query, exactly like the sources above. Wired
// only after a real grounding probe returned primary text (congress 60k, irs-drop 38k, irm 92k, cap 27k,
// pub 6k). Authority weight is carried by authorityTier in each module's hits + the §6662 weighting. ──
const congressSource: FetchSource = { id: "congress-gov", label: "Congress.gov (enacted bills + committee reports)", matches: congressGovMatches, search: async (q, o) => searchCongressGov(assertPublicLawQuery(q), o) };
const irsDropSource: FetchSource = { id: "irs-drop", label: "IRS guidance (Rev. Rul./Proc., Notices, Treasury Decisions)", matches: matchesIrsDrop, search: async (q, o) => searchIrsDrop(assertPublicLawQuery(q), o) };
const irsPubSource: FetchSource = { id: "irs-pub", label: "IRS Publications + Form Instructions", matches: matchesIrsPub, search: async (q, o) => searchIrsPub(assertPublicLawQuery(q), o) };
const irmSource: FetchSource = { id: "irm", label: "Internal Revenue Manual", matches: matchesIrm, search: async (q, o) => searchIrm(assertPublicLawQuery(q), o) };
const capCaselawSource: FetchSource = { id: "cap-caselaw", label: "Caselaw Access Project (historical case law)", matches: matchesCapCaselaw, search: async (q, o) => searchCapCaselaw(assertPublicLawQuery(q), o) };
// SEC EDGAR = company disclosure under GAAP/SEC rules — accounting-standard CONTEXT (ASC 740 / book-tax),
// NOT tax authority. Ranked last so it never outranks a real tax source; the model treats it as context.
const secEdgarSource: FetchSource = { id: "sec-edgar", label: "SEC EDGAR (company filings, accounting context)", matches: matchesSecEdgar, search: async (q, o) => searchSecEdgar(assertPublicLawQuery(q), o) };
// IRS Written Determinations (PLR/TAM/CCA/FSA). The open /pub/irs-wd/{docnum}.pdf is the reliable path
// (verified live), so a cited doc number fetches direct; a topic query falls back to the (best-effort)
// index. precedential=false ALWAYS — §6110(k)(3) bars citing these as precedent (a spec HARD invariant).
const irsWdSource: FetchSource = {
  id: "irs-wd",
  label: "IRS Written Determinations (PLR/TAM/CCA — not precedent)",
  matches: matchesIrsWd,
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    const keys = uilQuery(safe);
    const docNum = keys.find((k) => /^\d{9}$/.test(k));
    const dets = await searchIrsWd(docNum ?? keys[0] ?? safe, opts);
    return dets.map((wd) => ({
      source: "irs-wd",
      title: writtenDeterminationCitation(wd),
      citation: writtenDeterminationCitation(wd),
      sourceUrl: wd.pdfUrl,
      authorityTier: 4,
      precedential: false, // §6110(k)(3): NEVER cite a written determination as precedent
      getText: () => fetchWrittenDeterminationText(wd.docNumber, { signal: opts?.signal }),
    }));
  },
};

// OpenStates: state LEGISLATION tracking (50 states). KEY-GATED — matchesOpenStates returns false with
// no OPENSTATES_API_KEY, so it stays fully dormant until the key is added (then it activates live). An
// enacted bill is state session law; a pending bill is flagged context-only (never grounds a position).
const openStatesSource: FetchSource = { id: "openstates", label: "OpenStates (state bills + status)", matches: matchesOpenStates, search: async (q, o) => searchOpenStates(assertPublicLawQuery(q), o) };
// US bilateral income tax TREATIES (GovInfo CDOC). Tier-1 (treaty on par with statute, §7852(d)). The
// module's title-filter returns the RIGHT country's treaty or nothing — never a different country's.
const treatySource: FetchSource = { id: "treaty", label: "US bilateral tax treaties (GovInfo CDOC)", matches: matchesTreaty, search: async (q, o) => searchTreaty(assertPublicLawQuery(q), o) };

const SOURCES: FetchSource[] = [caConformity, treatySource, govinfoStatute, ecfr, congressSource, federalRegister, courtListener, capCaselawSource, taxCourt, irsIrb, irsDropSource, irsWdSource, irsPubSource, irmSource, openStatesSource, secEdgarSource];

// ca-conformity ranks FIRST for a California question (it is the only source with CA authority — a "does
// CA conform to §1202" question needs the R&TC, not federal §1202). eCFR ranks ahead of GovInfo for a
// REG cite ("§1.199A-5" must pull codified reg text, not be mis-reduced to "26 USC 1"). A bare statute
// cite ("§1202", no dot, no California) matches neither and still routes to GovInfo first.
const TIER_ORDER: Record<string, number> = {
  "ca-conformity": 0, treaty: 1, ecfr: 1, govinfo: 2, "congress-gov": 3, "federal-register": 4,
  courtlistener: 5, "cap-caselaw": 6, "tax-court": 7,
  "irs-irb": 8, "irs-drop": 9, "irs-wd": 10, "irs-pub": 11, irm: 12, openstates: 13, "sec-edgar": 14,
};

/**
 * Sources that fit the question, highest-authority first. LIVE-FETCH-ONLY policy (owner decision):
 * a coverage-gap question must reach SOME primary source, so when only tangential/no specialized
 * sources match we fall back to the universal pair — GovInfo (statute: any federal tax topic maps to
 * a Code section) and the IRS Bulletin (current guidance + the annual inflation Rev Procs, where the
 * post-OBBBA / indexed figures actually live). The per-source distill + figure-gate remain the
 * backstop against grounding an off-topic or stale figure.
 *
 * STALE-EDITION GUARD: GovInfo's USCODE is the 2024 edition (pre-OBBBA-2025), so for a post-2025
 * figure it can carry a superseded number. We therefore order the IRB and Federal Register (OBBBA-era,
 * current) AHEAD of GovInfo for any question that names a year ≥ 2026 or an OBBBA-touched topic, so the
 * current source is tried first and the stale statute is only a last resort.
 */
// Does the question name a tax/law concept at all? Gates the universal fallback so a NON-tax string
// (e.g. a UI question) still gets no fetch source — preserving the honest "no source ⇒ no fetch".
const TAX_SHAPE =
  /§\s*\d|\b(tax|deduct\w*|credit|exempt\w*|income|depreciat\w*|expens\w*|amortiz\w*|irs|irc|section\s*\d|return|filing|withhold\w*|capital gain|basis|qbi|salt|estate|gift|premium|mortgage|insurance|child|dependent|standard deduction|bracket|threshold|phase[-\s]?out|deadline|penalt\w*)\b/i;

// Post-2025 / OBBBA-era questions: demote the stale 2024-edition statute (GovInfo USCODE) below the
// current OBBBA-era sources (IRB, Federal Register) so a superseded figure is never tried first.
function currentLawFirst(sources: FetchSource[], question: string): FetchSource[] {
  const post2025 = /\b(202[6-9]|20[3-9]\d|obbba|one big beautiful)\b/i.test(question);
  // A bare STATUTE cite (no "part.section" reg cite) tries the statute (GovInfo) before the implementing
  // reg (eCFR), with eCFR as the FALLBACK when the statute alone does not ground. A reg cite keeps eCFR
  // first (its cite-verification path). A post-2025 question still demotes the stale 2024 USCODE statute.
  const noRegCite = cfrRefsFromQuery(question).length === 0;
  const rank = (id: string) =>
    (TIER_ORDER[id] ?? 9) + (post2025 && id === "govinfo" ? 10 : 0) + (noRegCite && id === "ecfr" ? 3 : 0);
  return [...sources].sort((a, b) => rank(a.id) - rank(b.id));
}

/**
 * Sources that fit the question, highest-authority first. LIVE-FETCH-ONLY policy (owner decision):
 * when a specialized source matches, use it. When NONE matches but the question is tax-shaped, fall
 * back to the universal pair — GovInfo (statute: any federal tax topic maps to a Code section) and the
 * IRS Bulletin (current guidance + the annual inflation Rev Procs) — so a coverage-gap question still
 * reaches primary authority. A non-tax question still gets nothing (honest: no fetch). The per-source
 * distill + figure-gate are the backstop against grounding an off-topic or stale figure.
 */
export function pickSources(question: string): FetchSource[] {
  const matched = SOURCES.filter((s) => s.matches(question));
  if (matched.length) return currentLawFirst(matched, question);
  if (!TAX_SHAPE.test(question)) return []; // not a tax question → no fetch
  return currentLawFirst([govinfoStatute, irsIrb], question);
}
