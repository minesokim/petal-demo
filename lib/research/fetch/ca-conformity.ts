// California state-conformity source (keyless). Grounds "does California conform to federal §X" — the
// single highest-dollar gap in the hard set (the §1202 QSBS / §199A nonconformity the capstone faulted).
// Two authorities:
//   1. R&TC conformity statutes via leginfo (deterministic ?lawCode=RTC&sectionNum= URLs): §17024.5
//      (personal income tax) and §23051.5 (corporation tax) fix CA's STATIC IRC "specified date" and the
//      rule that CA does not automatically adopt later federal changes.
//   2. FTB Publication 1001 (annual PDF) — the official enumeration of CA adjustments to federal income,
//      windowed to the question's topic so the SPECIFIC nonconformity (e.g. QSBS) grounds.
// Public domain (Cal. Gov. Code §10248.5) + public FTB form. State-authority research → §7216-clean.

import { stripHtml } from "./govinfo";
import { extractText, getDocumentProxy } from "unpdf";

const LEGINFO = "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml";
// The two master conformity statutes: personal income tax + corporation tax.
export const RTC_CONFORMITY_SECTIONS = ["17024.5", "23051.5"] as const;

export function rtcUrl(section: string): string {
  return `${LEGINFO}?lawCode=RTC&sectionNum=${section}.`;
}

// Detect a California-conformity question: California named AND a conformity/federal-provision context.
export function isCaConformityQuestion(q: string): boolean {
  const ca = /\b(california|\bca\b|ftb|franchise tax board|r&tc|rtc)\b/i.test(q);
  if (!ca) return false;
  return /\b(conform|conformity|decoupl|nonconform|adjust|§\s*\d|section\s*\d|irc|federal|state tax|qsbs|qbi|bonus depreciation|opportunity zone)\b/i.test(q);
}

// Pull a single R&TC section's text from leginfo. The law text sits in the #manylawsections container;
// isolate it from the page chrome, then strip to readable text.
export async function fetchRtcSection(
  section: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<{ citation: string; text: string; sourceUrl: string }> {
  const f = opts.fetchImpl ?? fetch;
  const url = rtcUrl(section);
  const res = await f(url, {
    signal: opts.signal,
    headers: { "user-agent": "Mozilla/5.0 PetalResearch/1.0", accept: "text/html" },
  });
  if (!res.ok) throw new Error(`leginfo R&TC ${section} HTTP ${res.status}`);
  const html = await res.text();
  // The statute text sits in the inner #codeLawSectionNoHead container (the #displayCodeSection form
  // also holds a toolbar + a huge JSF ViewState blob). Start AFTER the inner container's opening tag so
  // that chrome does not leak in, then strip remaining inputs/scripts.
  const open = /id=["'](?:codeLawSectionNoHead|single_law_section)["'][^>]*>/i.exec(html);
  const slice = (open ? html.slice(open.index + open[0].length) : html)
    .replace(/<input[^>]*>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ");
  const text = stripHtml(slice.slice(0, 18000)).replace(/\s+/g, " ").trim().slice(0, 4500);
  if (text.length < 80) throw new Error(`leginfo R&TC ${section} text too short to ground`);
  return { citation: `Cal. R&TC §${section}`, text, sourceUrl: url };
}

export function ftbPub1001Url(year: number): string {
  return `https://www.ftb.ca.gov/forms/${year}/${year}-1001-publication.pdf`;
}

// Return a focused window of FTB Pub 1001 around the question's topic, so the SPECIFIC nonconformity line
// grounds rather than 60 pages of PDF. Falls back to the conformity-summary front matter.
function windowText(text: string, needles: string[], radius = 2400): string {
  const lc = text.toLowerCase();
  for (const n of needles) {
    if (n.length < 3) continue;
    const idx = lc.indexOf(n.toLowerCase());
    if (idx >= 0) return text.slice(Math.max(0, idx - 400), idx + radius).replace(/\s+/g, " ").trim();
  }
  return text.slice(0, 4000).replace(/\s+/g, " ").trim();
}

// Topic needles from the question: the federal section number(s) + a few high-signal conformity nouns.
function pub1001Needles(question: string): string[] {
  const secs = [...question.matchAll(/(?:§+\s*|\bsection\s+|\birc\s+)(\d+[A-Za-z]?)/gi)].map((m) => m[1]);
  const lc = question.toLowerCase();
  const nouns: string[] = [];
  if (/\bqsbs\b|small business stock|1202|1045/.test(lc)) nouns.push("qualified small business stock", "1202");
  if (/\bqbi\b|199a|qualified business income/.test(lc)) nouns.push("qualified business income", "199A");
  if (/bonus depreciation|168/.test(lc)) nouns.push("depreciation");
  if (/opportunity zone|1400z/.test(lc)) nouns.push("opportunity");
  return [...secs, ...nouns];
}

export async function fetchFtbPub1001(
  question: string,
  year: number,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch } = {},
): Promise<{ citation: string; text: string; sourceUrl: string }> {
  const f = opts.fetchImpl ?? fetch;
  const url = ftbPub1001Url(year);
  const res = await f(url, { signal: opts.signal, headers: { "user-agent": "PetalResearch/1.0", accept: "application/pdf" } });
  if (!res.ok) throw new Error(`FTB Pub 1001 (${year}) HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const pdf = await getDocumentProxy(buf);
  const { text } = await extractText(pdf, { mergePages: true });
  const windowed = windowText(text, pub1001Needles(question));
  if (windowed.length < 80) throw new Error(`FTB Pub 1001 (${year}) extraction too short to ground`);
  return { citation: `FTB Pub. 1001 (${year})`, text: windowed, sourceUrl: url };
}
