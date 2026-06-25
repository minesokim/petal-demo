// IRS Internal Revenue Bulletin (IRB) — the authoritative home of Revenue Rulings, Revenue
// Procedures, Notices, and Treasury Decisions. GovInfo has NO IRB collection, so irs.gov is the only
// primary source (keyless). This is the layer that covers OBBBA-2025 IMPLEMENTATION guidance, which
// GovInfo's 2024-edition USCODE cannot have.
//
// The IRB has no topic-search API, so we fetch the index and SCAN the most recent N bulletins for the
// topic terms — this covers current guidance (where new-law items live). Heavier than a search, so it
// is bounded (default 10 bulletins) and only fires on a coverage gap. §7216-clean: queries are topic
// terms / citations, never taxpayer PII.

import { stripHtml } from "./govinfo";

const IRB_INDEX = "https://www.irs.gov/irb";
const IRB_HOST = "https://www.irs.gov";

export type IrbBulletin = { issue: string; url: string; text: string };

// Parse the IRB index → recent bulletins {issue, url}, newest first. The index lists issues as text
// ("Internal Revenue Bulletin: 2026-26"); the bulletin URL is the predictable /irb/{issue}_IRB.
export function parseIrbIndex(indexText: string): { issue: string; url: string }[] {
  const issues = [...new Set([...indexText.matchAll(/Bulletin:?\s*(20\d{2}-\d{1,2})/gi)].map((m) => m[1]))];
  issues.sort((a, b) => {
    const [ay, ai] = a.split("-").map(Number);
    const [by, bi] = b.split("-").map(Number);
    return by - ay || bi - ai; // newest year, then highest issue number, first
  });
  return issues.map((issue) => ({ issue, url: `${IRB_HOST}/irb/${issue}_IRB` }));
}

/**
 * Find recent IRB bulletins whose text matches the topic. Fetches the index, then scans up to
 * `maxBulletins` recent issues and keeps the ones that contain enough of the query's terms. Returns
 * the bulletins' plain text (the engine distills the relevant rule out of it). `fetchImpl` injectable.
 */
export async function searchIrb(
  query: string,
  opts: { maxBulletins?: number; maxHits?: number; fetchImpl?: typeof fetch; signal?: AbortSignal } = {},
): Promise<IrbBulletin[]> {
  const f = opts.fetchImpl ?? fetch;
  const ua = { "user-agent": "PetalResearch/1.0 (tax-research)" };
  const idxRes = await f(IRB_INDEX, { headers: ua, signal: opts.signal });
  if (!idxRes.ok) throw new Error(`IRB index ${idxRes.status}`);
  const bulletins = parseIrbIndex(stripHtml(await idxRes.text())).slice(0, opts.maxBulletins ?? 10);

  const terms = [...new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3))];
  // The DISTINCTIVE terms (longest) carry the topic; common words (tax, rate, date) false-match every
  // bulletin. Require the most distinctive term, and window the excerpt around IT — that lands on the
  // actual item (e.g. "remittance"), not an unrelated section that happens to say "effective date".
  const distinctive = [...terms].sort((a, b) => b.length - a.length).slice(0, 2);
  const need = Math.max(2, Math.ceil(terms.length * 0.5));
  const hits: IrbBulletin[] = [];
  for (const b of bulletins) {
    if (hits.length >= (opts.maxHits ?? 2)) break;
    let text: string;
    try {
      const r = await f(b.url, { headers: ua, signal: opts.signal });
      if (!r.ok) continue;
      text = stripHtml(await r.text());
    } catch {
      continue; // a bulletin fetch failure → skip it honestly
    }
    const lower = text.toLowerCase();
    const key = distinctive.find((t) => lower.includes(t));
    if (!key) continue; // no distinctive term → not the right bulletin
    if (terms.filter((t) => lower.includes(t)).length < need) continue;
    const pos = lower.indexOf(key);
    const excerpt = text.slice(Math.max(0, pos - 600), pos + 4200).trim();
    if (excerpt.length >= 80) hits.push({ issue: b.issue, url: b.url, text: excerpt });
  }
  return hits;
}
