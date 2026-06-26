// Retrieve-on-demand source (keyless): the IRS guidance DROP — the public PDF directory at
// irs.gov/pub/irs-drop/ where Revenue Rulings, Revenue Procedures, Notices, Announcements, and
// Treasury Decisions are posted the moment they issue (well before the bound Internal Revenue
// Bulletin). This is the CITE-VERIFICATION + FULL-TEXT path for IRS sub-regulatory guidance: a model
// cite like "Rev. Rul. 2024-14" maps deterministically to rr-24-14.pdf, so the named document is
// fetched and grounded in DIRECTLY — no topic scan, no guessing. Complements ./irs-irb (which scans
// recent bulletins by TOPIC when there is no cite to anchor on).
//
// Authority tiering follows the document TYPE, not the source: Revenue Rulings and Revenue Procedures
// are "substantial authority" (Treas. Reg. §1.6662-4(d)(3)(iii)) and may be relied on as precedent;
// Notices/Announcements are guidance the IRS will follow; Treasury Decisions are the preamble +
// final-reg text (the reg itself is tier 2, but the TD document as published here is agency guidance).
// All are tier 4 agency guidance in the 3-axis model. precedential stays true (none of these are the
// non-citable PLR/TAM/CCA class, which are NOT published in irs-drop).
//
// Public US-government data only — the query is a citation/topic, never taxpayer PII → §7216-clean.
// No API key required. fetch + unpdf extraction are injectable for tests.

import { extractText, getDocumentProxy } from "unpdf";

const DROP_BASE = "https://www.irs.gov/pub/irs-drop";
const UA = { "user-agent": "PetalResearch/1.0 (tax-research)" };

// The five guidance series irs-drop carries, with their filename prefix and human label. The label
// doubles as the cite prefix when we reconstruct the citation.
type DropKind = "rr" | "rp" | "n" | "a" | "td";
const KIND_LABEL: Record<DropKind, string> = {
  rr: "Rev. Rul.",
  rp: "Rev. Proc.",
  n: "Notice",
  a: "Announcement",
  td: "Treasury Decision",
};

export type IrsDropRef = {
  kind: DropKind;
  citation: string; // canonical cite, e.g. "Rev. Rul. 2024-14" or "T.D. 9945"
  filename: string; // "rr-24-14.pdf"
  url: string; // full PDF URL
};

// Pull every IRS guidance citation out of a question. Two families:
//  • YEAR-NUMBER series (Rev. Rul. / Rev. Proc. / Notice / Announcement): "Rev. Rul. 2024-14",
//    "Rev Proc 2024-25", "Notice 2024-35", "Announcement 2024-19". The drop filename uses the
//    2-DIGIT year + the issue number, both as posted (NN-NN, the issue NOT zero-padded beyond its
//    own digits): 2024-14 → 24-14, 2024-1 → 24-1. Verified live (rr-24-14, n-24-01 both resolve;
//    irs-drop keeps whatever padding the issue was filed with, and a bare "14"/"1" resolves).
//  • TD series (Treasury Decision): "T.D. 9945", "TD 10001" → td-9945.pdf (the 4-digit TD number,
//    no year). Verified live (td-9915/9921/9925/9945 resolve).
// Reduces the QUESTION to the precise document key (mirrors statuteQuery/caseQuery) so the search hits
// the NAMED document rather than topic-similar ones.
export function irsDropRefsFromQuery(question: string): IrsDropRef[] {
  const refs: IrsDropRef[] = [];
  const seen = new Set<string>();
  const push = (ref: IrsDropRef) => {
    if (seen.has(ref.filename)) return;
    seen.add(ref.filename);
    refs.push(ref);
  };

  // Year-number series. The prefix word(s) → DropKind. Year is 4-digit; we keep the last 2 for the
  // filename. Issue number is kept verbatim (no re-padding) — irs-drop posts it as filed.
  const yearNum =
    /\b(rev(?:enue)?\.?\s*rul(?:ing)?\.?|rev(?:enue)?\.?\s*proc(?:edure)?\.?|notice|announcement|ann\.?)\s*(?:no\.?\s*)?(\d{4})[-–](\d{1,3})\b/gi;
  for (const m of question.matchAll(yearNum)) {
    const head = m[1].toLowerCase().replace(/[\s.]/g, "");
    const kind: DropKind = head.startsWith("revrul")
      ? "rr"
      : head.startsWith("revproc")
        ? "rp"
        : head.startsWith("notice")
          ? "n"
          : "a"; // announcement / ann
    const year = m[2];
    const num = m[3];
    const yy = year.slice(2);
    const filename = `${kind}-${yy}-${num}.pdf`;
    push({ kind, citation: `${KIND_LABEL[kind]} ${year}-${num}`, filename, url: `${DROP_BASE}/${filename}` });
  }

  // Treasury Decision series: "T.D. 9945" / "TD 10001". 4-digit (occasionally 5-digit) TD number.
  const td = /\bt\.?\s*d\.?\s*(?:no\.?\s*)?(\d{4,5})\b/gi;
  for (const m of question.matchAll(td)) {
    const num = m[1];
    const filename = `td-${num}.pdf`;
    push({ kind: "td", citation: `T.D. ${num}`, filename, url: `${DROP_BASE}/${filename}` });
  }

  return refs;
}

// Does this source fit the question? It fits when the question carries a concrete IRS guidance CITE
// that maps to an irs-drop PDF (a Rev. Rul./Proc./Notice/Announcement YYYY-NN or a T.D. number). We
// gate on a PARSEABLE cite (not just the words) because this module's whole value is the direct
// cite→file mapping — a cite-less "is there a notice on tips?" question belongs to the topic-scanning
// ./irs-irb source, not here.
export function matchesIrsDrop(q: string): boolean {
  return irsDropRefsFromQuery(q).length > 0;
}

// Fetch one irs-drop PDF and extract its full text via unpdf (real text layer — these are digitally
// generated, not scans). Throws on a non-PDF response (a 404 serves an HTML page, NOT a PDF, so we
// reject on content-type AND on too-short text) → honest abstain upstream, never a fabricated cite.
// `fetchImpl`/`extractImpl` injectable so tests round-trip a generated PDF with no network.
export async function fetchIrsDropText(
  ref: IrsDropRef,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; extractImpl?: (bytes: Uint8Array) => Promise<string> } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(ref.url, { signal: opts.signal, headers: { accept: "application/pdf", ...UA } });
  if (!res.ok) throw new Error(`IRS drop ${res.status} for ${ref.citation} (${ref.filename})`);
  const ct = res.headers.get("content-type") ?? "";
  // irs.gov serves a 200-ish HTML "not found" shell for some bad paths; only trust a real PDF body.
  if (ct && !/pdf/i.test(ct)) throw new Error(`IRS drop ${ref.citation}: not a PDF (content-type ${ct})`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  // A PDF starts with "%PDF"; an HTML error page does not — cheap guard before handing to pdfjs.
  if (bytes.length < 5 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
    throw new Error(`IRS drop ${ref.citation}: response is not a PDF`);
  }
  let text: string;
  if (opts.extractImpl) {
    text = (await opts.extractImpl(bytes)).trim();
  } else {
    const pdf = await getDocumentProxy(bytes);
    const { text: raw } = await extractText(pdf, { mergePages: true });
    text = (typeof raw === "string" ? raw : (raw as string[]).join("\n")).replace(/\s+/g, " ").trim();
  }
  if (text.length < 200) throw new Error(`IRS drop ${ref.citation}: extracted text too short to ground`);
  return text;
}

// Plain Hit shape (NOT registry's FetchHit — kept decoupled to avoid the import cycle). Mirrors the
// fields the registry's FetchHit carries so this drops straight into pickSources.
export type IrsDropHit = {
  source: string;
  title: string;
  citation: string;
  sourceUrl: string;
  authorityTier: number;
  precedential?: boolean;
  getText: () => Promise<string>;
};

// Search = parse the cite(s) from the question → one Hit per named guidance document, each with a
// getText that fetches + extracts the PDF on demand. No network at search time (the cite IS the
// result), so this is cheap and deterministic; the fetch/extract cost is deferred to getText, and it
// fails CLOSED (throws) when the document is missing or unreadable → the engine abstains honestly.
export async function searchIrsDrop(
  query: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<IrsDropHit[]> {
  const refs = irsDropRefsFromQuery(query);
  return refs.map((ref) => ({
    source: "irs-drop",
    title: ref.citation,
    citation: ref.citation,
    sourceUrl: ref.url,
    authorityTier: 4, // IRS sub-regulatory guidance (ranks below statute / final reg / case)
    // Rev. Rul. & Rev. Proc. are substantial authority (Treas. Reg. §1.6662-4(d)(3)(iii)); none of the
    // five irs-drop series are the non-citable PLR/TAM/CCA class. So all may be cited → precedential.
    precedential: true,
    getText: () => fetchIrsDropText(ref, { signal: opts.signal, fetchImpl: opts.fetchImpl }),
  }));
}
