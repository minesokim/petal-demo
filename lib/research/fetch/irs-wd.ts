// Retrieve-on-demand source (keyless): IRS Written Determinations — PLRs (Private Letter Rulings),
// TAMs (Technical Advice Memoranda), CCAs (Chief Counsel Advice), and FSAs (Field Service Advice).
// The agency-guidance axis at its most granular: the IRS applying the Code to ONE taxpayer's facts.
//
// HARD AUTHORITY RULE — §6110(k)(3): a written determination "may not be used or cited as precedent."
// So every hit here is authorityTier 4 and precedential=FALSE, ALWAYS. Its value is persuasive /
// indicative ("here is how the Service has reasoned about §X facts"), never binding — the engine must
// surface that and never let a PLR stand in for a holding or a reg.
//
// Access is two-step, both PUBLIC:
//   1) the written-determinations index at irs.gov filters by UIL CODE (the Uniform Issue List number =
//      the IRC section, e.g. "263A", "1031", "9100") and returns rows of {docnum, UILC, subject, date};
//   2) each docnum resolves to a public PDF at /pub/irs-wd/{docnum}.pdf, text-extracted via unpdf.
// VERIFIED LIVE: the index's `find=` matches the UIL CODE, NOT free text — "263A"/"1031"/"9100" return
// rows, but "section 1031"/"like-kind"/"conservation easement" return an empty view. So we MUST reduce
// the question to the bare section/UIL identifier before querying (see uilQuery), exactly as
// statuteQuery/caseQuery reduce for their sources. PDF text is INCONSISTENT — some determinations are
// image-only scans that extract to nothing — so getText throws on too-short text → honest abstain.
//
// Public US-government data only — queries are section numbers / topic terms, never taxpayer PII, so
// this is §7216-clean (public scope). No API key required.

import { extractText, getDocumentProxy } from "unpdf";
import { stripHtml } from "./govinfo";

const WD_INDEX = "https://www.irs.gov/written-determinations";
const WD_PDF_BASE = "https://www.irs.gov/pub/irs-wd";

export type WrittenDetermination = {
  docNumber: string; // 9-digit YYYYWWNNN, e.g. "202402011"
  uilc: string; // Uniform Issue List code, e.g. "263A.04-00" (empty if the row omits it)
  subject: string; // the index's plain-language subject, e.g. "Allocation Methods"
  releaseDate: string; // MM/DD/YYYY as the index prints it
  kind: string; // "PLR" | "TAM" | "CCA" | "FSA" | "Written Determination" (inferred from the doc-text header when fetched, else generic)
  pdfUrl: string; // public PDF: /pub/irs-wd/{docNumber}.pdf
};

// Written-determination signals in a question: an explicit determination type/cite (PLR, TAM, CCA,
// FSA, "Priv. Ltr. Rul.", "letter ruling", a 9-digit determination number), OR a §9100 relief
// question (regulatory-election extensions live almost entirely in PLRs — the canonical use of this
// source). A bare statute section alone does NOT trip this (statute/reg/IRB own that); the caller asks
// for a written determination explicitly, or asks about 9100 relief.
export function matchesIrsWd(q: string): boolean {
  return (
    /\b(plr|priv\.?\s*ltr\.?\s*rul|private letter rulings?|letter rulings?|tam|technical advice memorand|cca|chief counsel advice|fsa|field service advice|written determinations?)\b/i.test(q) ||
    /\b(9100|§\s*301\.9100|9100 relief)\b/i.test(q) ||
    /\b20\d{2}(?:[0-5]\d)\d{3}\b/.test(q) // a 9-digit determination number (YYYYWWNNN)
  );
}

// Reduce a question to the index's actual search key: the UIL CODE = the bare IRC section number.
// VERIFIED LIVE that the `find=` filter matches the UIL code and NOT free text, so we extract the
// section the way statuteQuery does and search EACH candidate (most-specific first). A "§301.9100"
// cite reduces to "9100" (the index's UIL for regulatory-election extensions). A literal 9-digit
// determination number short-circuits everything — it IS the doc, fetch it directly. Falls back to the
// first content noun only if no section is present (rare; the matcher usually guarantees one).
export function uilQuery(question: string): string[] {
  // A literal determination number is the most precise key — return it verbatim (caller fetches direct).
  const num = question.match(/\b(20\d{2}(?:[0-5]\d)\d{3})\b/);
  if (num) return [num[1]];

  const codes: string[] = [];
  const seen = new Set<string>();
  const push = (c: string) => {
    if (c && !seen.has(c)) {
      seen.add(c);
      codes.push(c);
    }
  };

  // §301.9100 / 9100 relief → the index files these under UIL "9100".
  if (/\b(9100|§\s*301\.9100)\b/i.test(question)) push("9100");

  // IRC section refs: "§1031", "section 263A", "IRC 1031", "26 U.S.C. 1031". Keep the section token
  // (digits + optional trailing letter, e.g. "199A") — that is exactly the index's UIL prefix.
  for (const m of question.matchAll(/(?:§+\s*|\bsection\s+|\birc\s+|\b26\s+u\.?\s?s\.?\s?c\.?\s*)(\d{1,4}[A-Za-z]?)/gi)) {
    push(m[1].toUpperCase());
  }

  return codes;
}

// Parse the written-determinations index HTML into result rows. The Drupal view renders one <tr> per
// determination with four <td>s in order: number (an <a> to the PDF), UILC, subject, release date.
// We anchor on the PDF link, then read the sibling cells. Resilient to whitespace/markup noise.
export function parseWrittenDeterminations(html: string): WrittenDetermination[] {
  const out: WrittenDetermination[] = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  for (const rowM of html.matchAll(rowRe)) {
    const row = rowM[1];
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (!cells.length) continue;
    const docM = row.match(/\/pub\/irs-wd\/(\d{9})\.pdf/i);
    if (!docM) continue;
    const docNumber = docM[1];
    const text = (cell?: string) => (cell ? stripHtml(cell) : "");
    out.push({
      docNumber,
      uilc: text(cells[1]),
      subject: text(cells[2]),
      releaseDate: text(cells[3]),
      kind: classifyByNumber(docNumber),
      pdfUrl: `${WD_PDF_BASE}/${docNumber}.pdf`,
    });
  }
  return out;
}

// The index alone can't tell PLR from TAM from CCA (the column is just a number) — the real type lives
// in the PDF header. This is a best-effort placeholder used before the text is fetched; refineKind()
// upgrades it once we have the document text.
function classifyByNumber(_docNumber: string): string {
  return "Written Determination";
}

// Read the determination's actual type out of its document text header (the IRS prints it verbatim:
// "TECHNICAL ADVICE MEMORANDUM", "CHIEF COUNSEL ADVICE", "FIELD SERVICE ADVICE", else a PLR's
// "Number:/Index Number:" letter-ruling format). Drives the precise citation label.
export function refineKind(text: string): string {
  if (/TECHNICAL ADVICE MEMORANDUM/i.test(text)) return "TAM";
  if (/CHIEF COUNSEL ADVICE/i.test(text)) return "CCA";
  if (/FIELD SERVICE ADVICE/i.test(text)) return "FSA";
  if (/PRIVATE LETTER RULING/i.test(text)) return "PLR";
  return "PLR"; // the default written-determination form is a private letter ruling
}

/**
 * Search IRS Written Determinations by UIL code. `query` is the bare section/UIL key (use uilQuery to
 * derive it from a question) OR a literal 9-digit determination number (returns that one synthetic row
 * without hitting the index). The index filters by UIL code only, so passing free text returns nothing
 * — that is by design, not a bug. `fetchImpl` is injectable for tests.
 */
export async function searchIrsWd(
  query: string,
  opts: { limit?: number; signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<WrittenDetermination[]> {
  const f = opts.fetchImpl ?? fetch;

  // A literal determination number IS the document — short-circuit to a direct hit, no index needed.
  const direct = query.trim().match(/^(\d{9})$/);
  if (direct) {
    const docNumber = direct[1];
    return [{ docNumber, uilc: "", subject: "", releaseDate: "", kind: classifyByNumber(docNumber), pdfUrl: `${WD_PDF_BASE}/${docNumber}.pdf` }];
  }

  const params = new URLSearchParams({ find: query, items_per_page: "25" });
  const res = await f(`${WD_INDEX}?${params.toString()}`, {
    signal: opts.signal,
    headers: { accept: "text/html", "user-agent": "PetalResearch/1.0 (tax-research)" },
  });
  if (!res.ok) throw new Error(`IRS Written Determinations index HTTP ${res.status}`);
  const rows = parseWrittenDeterminations(await res.text());
  // Newest first — the index lists newest at the top; preserve that ordering and cap the count.
  return rows.slice(0, opts.limit ?? 4);
}

/**
 * Fetch + extract the FULL TEXT of a written determination so its reasoning can ground an answer.
 * Pulls the public PDF and extracts via unpdf/pdfjs (same path as tax-court.ts). PDF text is
 * INCONSISTENT — some determinations are image-only scans with no text layer — so this THROWS on
 * empty/too-short text → the engine abstains honestly rather than grounding on nothing.
 * `fetchImpl`/`extractImpl` are injectable so tests round-trip a generated PDF with no network.
 */
export async function fetchWrittenDeterminationText(
  docNumber: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; extractImpl?: (bytes: Uint8Array) => Promise<string> } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch;
  const url = `${WD_PDF_BASE}/${docNumber}.pdf`;
  const res = await f(url, { signal: opts.signal, headers: { "user-agent": "PetalResearch/1.0 (tax-research)" } });
  if (!res.ok) throw new Error(`IRS Written Determination ${docNumber} PDF HTTP ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let text: string;
  if (opts.extractImpl) {
    text = (await opts.extractImpl(bytes)).trim();
  } else {
    const pdf = await getDocumentProxy(bytes);
    const { text: raw } = await extractText(pdf, { mergePages: true });
    text = (typeof raw === "string" ? raw : (raw as string[]).join("\n")).trim();
  }
  // Image-only / scanned determinations extract to ~nothing → fail closed (honest abstain upstream).
  if (text.length < 200) throw new Error(`IRS Written Determination ${docNumber} text unavailable (scanned/empty) → abstain`);
  return text;
}

// Build the precise, citation-with-§6110-flag label for a determination. The number is the cite; the
// kind (PLR/TAM/CCA/FSA) and the never-precedent caveat are what the engine must show alongside it.
export function writtenDeterminationCitation(wd: WrittenDetermination): string {
  const kindLabel: Record<string, string> = {
    PLR: "PLR",
    TAM: "TAM",
    CCA: "CCA",
    FSA: "FSA",
    "Written Determination": "Written Determination",
  };
  const label = kindLabel[wd.kind] ?? "Written Determination";
  return `${label} ${wd.docNumber} (not precedent, IRC §6110(k)(3))`;
}
