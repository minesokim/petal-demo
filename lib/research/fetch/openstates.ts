// OpenStates (Plural) — STATE LEGISLATION across all 50 states + DC. This is BILLS and their status, NOT
// the codified state tax CODE (that lives on each state's official site, e.g. the CA R&TC already wired).
// It answers "is [state] proposing / did [state] enact a tax change" — the conformity-bill early-warning
// the code sources can't give. KEY-GATED (OPENSTATES_API_KEY): absent ⇒ no hits (honest no-source), never
// a fake. An ENACTED bill is the state's session law (authority); a PENDING bill is flagged context-only.
// Docs: https://docs.openstates.org/api-v3/ — GET /bills?jurisdiction=&q=&apikey=, header X-API-KEY also ok.

const OS_BASE = "https://v3.openstates.org";

export function openStatesKey(): string | undefined {
  const k = process.env.OPENSTATES_API_KEY?.trim();
  return k ? k : undefined;
}

// All 50 states + DC, lowercased name → canonical jurisdiction name OpenStates expects.
const STATES: Record<string, string> = Object.fromEntries(
  (
    "Alabama Alaska Arizona Arkansas California Colorado Connecticut Delaware Florida Georgia Hawaii Idaho " +
    "Illinois Indiana Iowa Kansas Kentucky Louisiana Maine Maryland Massachusetts Michigan Minnesota " +
    "Mississippi Missouri Montana Nebraska Nevada Ohio Oklahoma Oregon Pennsylvania Tennessee Texas Utah " +
    "Vermont Virginia Washington Wisconsin Wyoming"
  ).split(/\s+/).map((s) => [s.toLowerCase(), s]),
);
// Multi-word states + DC handled explicitly (the split above only covers single-token names).
const MULTI: [RegExp, string][] = [
  [/\bnew hampshire\b/i, "New Hampshire"],
  [/\bnew jersey\b/i, "New Jersey"],
  [/\bnew mexico\b/i, "New Mexico"],
  [/\bnew york\b/i, "New York"],
  [/\bnorth carolina\b/i, "North Carolina"],
  [/\bnorth dakota\b/i, "North Dakota"],
  [/\brhode island\b/i, "Rhode Island"],
  [/\bsouth carolina\b/i, "South Carolina"],
  [/\bsouth dakota\b/i, "South Dakota"],
  [/\bwest virginia\b/i, "West Virginia"],
  [/\bdistrict of columbia\b|\bwashington,?\s*d\.?c\.?\b/i, "District of Columbia"],
];

// The state named in the question, or null. Multi-word names win (checked first).
export function stateInQuestion(q: string): string | null {
  for (const [re, name] of MULTI) if (re.test(q)) return name;
  for (const m of q.matchAll(/\b([A-Za-z]+)\b/g)) {
    const hit = STATES[m[1].toLowerCase()];
    if (hit) return hit;
  }
  return null;
}

// Reduce a question to OpenStates search terms (drop the state name + framing, keep the tax topic).
export function openStatesQuery(question: string, state: string): string {
  const stop = new Set(
    (state.toLowerCase().split(/\s+/).join(" ") + " what whats is are the a an does do how bill bills legislation " +
      "legislative law laws state did has have any pending enacted about regarding for of to in on").split(/\s+/),
  );
  const terms = question.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 3 && !stop.has(w));
  return [...new Set(terms)].slice(0, 6).join(" ");
}

// Fire only when a key is present AND the question is about a state's LEGISLATION (a state name + a
// bill/legislation/conformity cue). Without the key the source is dormant (honest no-source).
export function matchesOpenStates(q: string): boolean {
  return (
    openStatesKey() !== undefined &&
    stateInQuestion(q) !== null &&
    /\b(bill|bills|legislation|legislativ\w*|enacted|pending|introduced|conformity|conform|session law|assembly|senate bill|house bill|\bsb\s?\d|\bab\s?\d|\bhb\s?\d|proposed|sponsor)\b/i.test(q)
  );
}

type OsBill = {
  identifier?: string;
  title?: string;
  jurisdiction?: { name?: string };
  session?: string;
  latest_action_description?: string;
  latest_action_date?: string;
  abstracts?: { abstract?: string }[];
  openstates_url?: string;
};

// An "enacted" signal from the latest action — chaptered / signed / enacted = state session LAW.
function isEnacted(b: OsBill): boolean {
  return /\b(chaptered|signed by governor|became law|enacted|approved by governor|act no)\b/i.test(b.latest_action_description ?? "");
}

export type OsHit = {
  source: string;
  title: string;
  citation: string;
  sourceUrl: string;
  authorityTier: number;
  precedential?: boolean;
  getText: () => Promise<string>;
};

export async function searchOpenStates(
  question: string,
  opts: { signal?: AbortSignal; fetchImpl?: typeof fetch; perPage?: number } = {},
): Promise<OsHit[]> {
  const key = openStatesKey();
  if (!key) return []; // dormant without a key — honest no-source
  const state = stateInQuestion(question);
  if (!state) return [];
  const f = opts.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    jurisdiction: state,
    q: openStatesQuery(question, state) || question,
    sort: "latest_action_desc",
    per_page: String(opts.perPage ?? 5),
    include: "abstracts",
    apikey: key,
  });
  const res = await f(`${OS_BASE}/bills?${params.toString()}`, {
    signal: opts.signal,
    headers: { accept: "application/json", "X-API-KEY": key },
  });
  if (!res.ok) throw new Error(`OpenStates API ${res.status}`);
  const data = (await res.json()) as { results?: OsBill[] };
  return (data.results ?? []).slice(0, opts.perPage ?? 5).map((b) => {
    const enacted = isEnacted(b);
    const ident = `${b.jurisdiction?.name ?? state} ${b.identifier ?? ""}`.trim();
    const status = enacted ? "enacted" : `status: ${b.latest_action_description ?? "pending"}`;
    return {
      source: "openstates",
      title: `${ident} — ${b.title ?? "(untitled bill)"}`.slice(0, 160),
      // Enacted = session law; pending = NOT authority, the citation says so.
      citation: enacted ? `${ident} (${b.session ?? ""}) — enacted state law` : `${ident} (${b.session ?? ""}) — PENDING bill, not yet law`,
      sourceUrl: b.openstates_url ?? `https://openstates.org/`,
      authorityTier: enacted ? 1 : 9, // enacted = state statute; pending = lowest (context only)
      precedential: enacted, // a pending bill is never authority
      getText: async () => {
        const abstract = b.abstracts?.find((a) => a.abstract)?.abstract ?? "";
        const text = [
          `${ident}: ${b.title ?? ""}`,
          abstract,
          `Latest action (${b.latest_action_date ?? "?"}): ${b.latest_action_description ?? "unknown"}.`,
          enacted ? "This bill is ENACTED — it is the state's session law." : "This bill is PENDING — it is NOT yet law; treat as directional, not authority.",
        ].filter(Boolean).join("\n");
        if (text.length < 40) throw new Error("OpenStates bill has no groundable summary");
        return text;
      },
    };
  });
}
