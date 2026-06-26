// Fetch-source registry: routes a coverage-gap question to the right primary-source API(s), in
// authority order, and returns hits with a uniform shape plus a getText() that pulls the PRIMARY
// text to ground in. Every outbound query passes the §7216 guard first. HONEST DEGRADATION: a
// source whose getText isn't wired yet (or fails) throws → the engine abstains, never guesses.

import { assertPublicLawQuery } from "./guard";
import { searchGovInfo, fetchGovInfoText, stripHtml, statuteQuery, type GovInfoResult } from "./govinfo";
import { searchTaxCourt, taxCourtDownloadUrl, fetchTaxCourtText } from "./tax-court";
import { searchIrb } from "./irs-irb";
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
  matches: (q) => /\b(section|§|irc|u\.?\s?s\.?\s?c|public law|pub\.?\s?l|statute|enacted|act of|obbba|one big beautiful)\b/i.test(q),
  search: async (q, opts) => {
    const safe = assertPublicLawQuery(q);
    // Reduce the question to targeted statute terms — GovInfo's keyword search returns nothing for a full
    // natural-language question but the right granule for "section 1031 like-kind exchange".
    const results = await searchGovInfo(statuteQuery(safe), { collections: ["USCODE", "PLAW"], pageSize: 5, signal: opts?.signal });
    return results
      .filter((r): r is GovInfoResult & { textUrl: string } => !!r.textUrl)
      .map((r) => ({
        source: "govinfo",
        title: r.title,
        citation: r.title,
        sourceUrl: r.granuleUrl ?? r.textUrl,
        authorityTier: 1, // statute is the top axis
        getText: () => fetchGovInfoText(r.textUrl, { signal: opts?.signal }),
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
    const docs = await searchFederalRegister(safe, { perPage: 5, signal: opts?.signal });
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

const SOURCES: FetchSource[] = [govinfoStatute, federalRegister, taxCourt, irsIrb];

const TIER_ORDER: Record<string, number> = { govinfo: 0, "federal-register": 1, "tax-court": 2, "irs-irb": 3 };

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
  /\b(tax|deduct\w*|credit|exempt\w*|income|depreciat\w*|expens\w*|amortiz\w*|irs|irc|§|section\s*\d|return|filing|withhold\w*|capital gain|basis|qbi|salt|estate|gift|premium|mortgage|insurance|child|dependent|standard deduction|bracket|threshold|phase[-\s]?out|deadline|penalt\w*)\b/i;

// Post-2025 / OBBBA-era questions: demote the stale 2024-edition statute (GovInfo USCODE) below the
// current OBBBA-era sources (IRB, Federal Register) so a superseded figure is never tried first.
function currentLawFirst(sources: FetchSource[], question: string): FetchSource[] {
  const post2025 = /\b(202[6-9]|20[3-9]\d|obbba|one big beautiful)\b/i.test(question);
  const rank = (id: string) => (TIER_ORDER[id] ?? 9) + (post2025 && id === "govinfo" ? 10 : 0);
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
