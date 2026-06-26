// US bilateral income tax TREATIES via GovInfo CDOC (Senate Treaty Documents — the authoritative treaty
// text + technical explanation, free, keyless beyond the shared GovInfo key). A ratified treaty stands on
// par with statute (§7852(d) later-in-time). For a US preparer this is the cross-border layer: residency
// tie-breakers, permanent establishment, withholding, treaty benefits, the saving clause.
//
// SAFETY: GovInfo's CDOC full-text search is fuzzy (a "United Kingdom" search can rank a Belgium treaty
// first). So we ALWAYS filter results to titles that actually name the requested country — the source
// returns the RIGHT country's treaty or NOTHING, never a different country's treaty (a correctness
// hazard). Protocols (amendments) that name the country are kept too.

import { searchGovInfo, fetchGovInfoText, type GovInfoResult } from "./govinfo";

export type TreatyHit = {
  source: string;
  title: string;
  citation: string;
  sourceUrl: string;
  authorityTier: number;
  precedential?: boolean;
  getText: () => Promise<string>;
};

// US income-tax-treaty partners (by the name used in the treaty title).
const TREATY_COUNTRIES = [
  "Australia", "Austria", "Bangladesh", "Barbados", "Belgium", "Bulgaria", "Canada", "Chile", "China",
  "Cyprus", "Czech Republic", "Denmark", "Egypt", "Estonia", "Finland", "France", "Germany", "Greece",
  "Hungary", "Iceland", "India", "Indonesia", "Ireland", "Israel", "Italy", "Jamaica", "Japan",
  "Kazakhstan", "Korea", "Latvia", "Lithuania", "Luxembourg", "Malta", "Mexico", "Morocco", "Netherlands",
  "New Zealand", "Norway", "Pakistan", "Philippines", "Poland", "Portugal", "Romania", "Russia",
  "Slovak Republic", "Slovenia", "South Africa", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Thailand",
  "Trinidad", "Tunisia", "Turkey", "Ukraine", "United Kingdom", "Venezuela",
];

// Adjective / short forms → canonical country.
const ADJ: Record<string, string> = {
  british: "United Kingdom", uk: "United Kingdom", canadian: "Canada", german: "Germany", french: "France",
  chinese: "China", indian: "India", japanese: "Japan", mexican: "Mexico", swiss: "Switzerland",
  dutch: "Netherlands", irish: "Ireland", italian: "Italy", spanish: "Spain", korean: "Korea",
  australian: "Australia", russian: "Russia", swedish: "Sweden",
};

// Extra title aliases for the correctness filter (some treaties name the country differently).
const TITLE_ALIASES: Record<string, string[]> = {
  "United Kingdom": ["United Kingdom", "Great Britain"],
  Korea: ["Korea", "Republic of Korea"],
  Russia: ["Russia", "Russian Federation"],
};

function re(s: string): RegExp {
  return new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
}

// The treaty partner named in the question, or null. Longest names first so "United Kingdom" wins.
export function treatyCountry(q: string): string | null {
  for (const c of [...TREATY_COUNTRIES].sort((a, b) => b.length - a.length)) {
    if (re(c).test(q)) return c;
  }
  for (const [a, c] of Object.entries(ADJ)) if (re(a).test(q)) return c;
  return null;
}

// Fire only on a CROSS-BORDER / treaty question that names a partner (a bare "income in France" is not
// enough — we want a treaty/residency/PE/withholding question).
export function matchesTreaty(q: string): boolean {
  return (
    treatyCountry(q) !== null &&
    /\b(treaty|treaties|tax convention|totalization|withholding|permanent establishment|\bpe\b|residen\w+|tie[-\s]?breaker|cross[-\s]?border|saving clause|article \d|foreign tax credit|\bftc\b|double taxation|source country|technical explanation|expat\w*)\b/i.test(q)
  );
}

export async function searchTreaty(
  q: string,
  opts: { signal?: AbortSignal } = {},
): Promise<TreatyHit[]> {
  const country = treatyCountry(q);
  if (!country) return [];
  const aliases = TITLE_ALIASES[country] ?? [country];
  const results = await searchGovInfo(`tax convention with ${country}`, { collections: ["CDOC"], pageSize: 8, signal: opts.signal });
  // CORRECTNESS FILTER: keep ONLY docs whose title names the requested country (or an alias). This is
  // what prevents a fuzzy search from grounding a US-UK question on the US-Belgium treaty.
  const matched = (results as GovInfoResult[])
    .filter((r): r is GovInfoResult & { textUrl: string } => !!r.textUrl && aliases.some((a) => re(a).test(r.title)));
  return matched.slice(0, 3).map((r) => ({
    source: "treaty",
    title: r.title,
    citation: `${r.title} (US bilateral tax treaty — on par with statute, §7852(d))`,
    sourceUrl: r.granuleUrl ?? r.textUrl,
    authorityTier: 1, // a ratified treaty is on par with statute
    precedential: true,
    getText: async () => {
      const t = await fetchGovInfoText(r.textUrl, { signal: opts.signal });
      if (t.length < 200) throw new Error("treaty text too short to ground");
      return t;
    },
  }));
}
