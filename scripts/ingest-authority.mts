// L1 authority ingestion pipeline (durable, re-runnable). For each target section it:
//   1. FETCHES the real primary-source text (keyless: LII for IRC, eCFR XML for 26 CFR),
//   2. has Claude write a CONCISE operative-rule AuthorityChunk *from that text* (not memory),
//   3. GROUNDING GATE: every $/%/year figure in the chunk must appear in the source — else reject,
//   4. writes the survivors to lib/research/corpus-ingested.ts (registered alongside the others).
// PUBLIC authority only (no taxpayer data → §7216-clean). Run:
//   node --env-file=.env.local --import tsx scripts/ingest-authority.mts [--write] [section...]
import { AnthropicProvider } from "../lib/ai/anthropic";
import { authorityChunkSchema, type AuthorityChunk } from "../lib/tax/authority/store";

// ── Targets: Phase-1 federal scope (1040 + the 4 due-diligence credits + gap-closers). Each entry
// is a real, resolvable primary source. taxYear lists the years the rule (as fetched) governs. ──
type Target = { cite: string; url: string; type: AuthorityChunk["authorityType"]; taxYear: number[]; note: string };
const lii = (n: string) => `https://www.law.cornell.edu/uscode/text/26/${n}`;
const TARGETS: Target[] = [
  { cite: "IRC §3121", url: lii("3121"), type: "statute", taxYear: [2024, 2025], note: "FICA definitions — tips are wages (so tips run through payroll FICA, not SE tax)" },
  { cite: "IRC §1402", url: lii("1402"), type: "statute", taxYear: [2024, 2025], note: "net earnings from self-employment — defines the SE-tax base (excludes W-2 wages/tips)" },
  { cite: "IRC §1401", url: lii("1401"), type: "statute", taxYear: [2024, 2025], note: "self-employment tax rate (OASDI + Medicare portions)" },
  { cite: "IRC §1411", url: lii("1411"), type: "statute", taxYear: [2024, 2025], note: "3.8% net investment income tax + MAGI thresholds" },
  { cite: "IRC §61", url: lii("61"), type: "statute", taxYear: [2024, 2025], note: "gross income defined — all income from whatever source derived" },
  { cite: "IRC §62", url: lii("62"), type: "statute", taxYear: [2024, 2025], note: "adjusted gross income — the above-the-line deductions" },
  { cite: "IRC §213", url: lii("213"), type: "statute", taxYear: [2024, 2025], note: "medical-expense deduction + the AGI floor" },
  { cite: "IRC §223", url: lii("223"), type: "statute", taxYear: [2024, 2025], note: "HSA deduction + contribution limits / HDHP definition" },
  { cite: "IRC §219", url: lii("219"), type: "statute", taxYear: [2024, 2025], note: "deductible IRA contributions" },
  { cite: "IRC §163", url: lii("163"), type: "statute", taxYear: [2024, 2025], note: "interest deduction incl. the qualified-residence/mortgage limits" },
  { cite: "IRC §6662", url: lii("6662"), type: "statute", taxYear: [2024, 2025], note: "accuracy-related penalty (20%) + substantial understatement" },
  { cite: "IRC §6651", url: lii("6651"), type: "statute", taxYear: [2024, 2025], note: "failure-to-file and failure-to-pay penalties" },
  { cite: "IRC §6694", url: lii("6694"), type: "statute", taxYear: [2024, 2025], note: "tax-return-preparer understatement penalty" },
  { cite: "IRC §7216", url: lii("7216"), type: "statute", taxYear: [2024, 2025], note: "criminal penalty for preparer disclosure/use of return information" },
  // Gap-closers from the round-3 held-out diagnostic (OBBBA-era). Each is fetched from the current
  // USC text and figure-grounded; DRY-RUN + verify the figures reflect post-OBBBA law before --write.
  { cite: "IRC §30D", url: lii("30D"), type: "statute", taxYear: [2025, 2026], note: "clean vehicle credit — OBBBA terminates it for vehicles acquired after Sept 30, 2025" },
  { cite: "IRC §25D", url: lii("25D"), type: "statute", taxYear: [2025, 2026], note: "residential clean energy credit — OBBBA ends it for expenditures after Dec 31, 2025 (installation-completion keyed)" },
  { cite: "IRC §6050W", url: lii("6050W"), type: "statute", taxYear: [2025, 2026], note: "1099-K / third-party settlement reporting — OBBBA restores the $20,000-and-200-transaction threshold" },
  { cite: "IRC §174A", url: lii("174A"), type: "statute", taxYear: [2025, 2026], note: "domestic R&D — OBBBA restores current expensing for tax years beginning after Dec 31, 2024" },
  // IRC §1202 (QSBS) — DISABLED pending a fix. The figure-grounded chunk is correct on the tiers
  // but the LII operative text refers to "the applicable date" WITHOUT pinning it to a calendar date,
  // and the "OBBBA enacted July 4, 2025" fact lives in a chunk a QSBS query doesn't co-retrieve. Result:
  // the model can't place a pre-July-2025 acquisition and CONFIDENTLY MISCLASSIFIES it (gave 75% where
  // the answer is $0 for a 4-yr hold on March-2025 stock). A confident wrong answer is worse than the
  // honest abstain, so this stays out until the applicable-date definition (= OBBBA enactment, 7/4/2025)
  // is grounded INTO this chunk and/or co-retrieved. See ask-once.mts to reproduce.
  // { cite: "IRC §1202", url: lii("1202"), type: "statute", taxYear: [2025, 2026], note: "QSBS gain exclusion — capture the applicable-date DEFINITION (= date of enactment of OBBBA / P.L. 119-21) explicitly, not just the term." },
];

// A figure's NUMERIC CORE (digits only) — so "3.8%", "3.8 percent", and "$3.8" all compare equal,
// and "$125,000" matches "125,000". The gate grounds the NUMBER, tolerant of unit formatting.
function figureCores(text: string): string[] {
  return [...text.matchAll(/\$?\d[\d,]*(?:\.\d+)?\s?%?|\b(?:19|20)\d{2}\b/g)]
    .map((m) => m[0].replace(/[^\d.]/g, ""))
    .filter((n) => n.length >= 2 && n !== "."); // ignore single digits / noise
}
function norm(s: string): string { return s.replace(/[^\d.]/g, ""); } // digits-and-dots stream of the source

async function fetchSource(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": "PetalAuthorityIngest/1.0 (tax-research corpus)" } });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const raw = await res.text();
  // Strip scripts/styles/tags to plain text; collapse whitespace; cap tokens.
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24000);
}

const SYS = `You ingest US tax PRIMARY AUTHORITY into a research corpus. From the provided source text of ONE provision, write a single concise "operative rule" paraphrase a tax preparer could rely on. RULES: use ONLY facts/figures present in the provided text — never add a number, threshold, rate, or year from your own knowledge; if the text doesn't state a figure, don't include it. Public-domain factual paraphrase (statute isn't copyrightable). Output STRICT JSON only: {"text": string (the operative-rule paraphrase, 2-5 sentences), "keywords": string[] (8-15 lowercase retrieval terms incl. the section number and key concepts), "effectiveDate": "YYYY-MM-DD" (when this rule took effect; use the provided text or a conservative Jan 1 of the earliest listed tax year)}.`;

async function buildChunk(t: Target, provider: AnthropicProvider): Promise<AuthorityChunk | null> {
  const source = await fetchSource(t.url);
  const { text: out } = await provider.generateText({
    system: SYS,
    prompt: `Citation: ${t.cite}\nHint: ${t.note}\nTax years this should serve: ${t.taxYear.join(", ")}\n\nSOURCE TEXT:\n${source}`,
    maxTokens: 700,
  });
  let parsed: { text: string; keywords: string[]; effectiveDate: string };
  try { parsed = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1)); }
  catch { console.log(`✗ ${t.cite}: non-JSON output`); return null; }

  // GROUNDING GATE: every figure's numeric core in the paraphrase must appear in the fetched source.
  const src = norm(source);
  const ungrounded = figureCores(parsed.text).filter((f) => !src.includes(f));
  if (ungrounded.length) { console.log(`✗ ${t.cite}: ungrounded figures ${ungrounded.join(", ")} (rejected)`); return null; }

  const chunk: AuthorityChunk = {
    chunkId: `ingested-${t.cite.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    authorityType: t.type,
    citation: t.cite,
    jurisdiction: "federal",
    taxYear: t.taxYear,
    effectiveDate: parsed.effectiveDate || `${Math.min(...t.taxYear)}-01-01`,
    sourceUrl: t.url,
    ingestedAt: new Date().toISOString(),
    text: parsed.text,
    keywords: [...new Set(parsed.keywords.map((k) => k.toLowerCase()))],
  };
  const v = authorityChunkSchema.safeParse(chunk);
  if (!v.success) { console.log(`✗ ${t.cite}: schema ${v.error.issues[0]?.message}`); return null; }
  console.log(`✓ ${t.cite}: ${chunk.text.slice(0, 90)}…`);
  return chunk;
}

async function main() {
  const write = process.argv.includes("--write");
  // Optional section filter: non-flag args restrict which TARGETS run (e.g. `... 30D 6050W`). With
  // --write + a filter, the new chunks are MERGED into the existing corpus (existing ones kept, not
  // re-paraphrased); with --write and no filter, the whole file is regenerated from all TARGETS.
  const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const targets = only.length ? TARGETS.filter((t) => only.some((o) => t.cite.toLowerCase().includes(o.toLowerCase()))) : TARGETS;
  const provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY, "claude-sonnet-4-6");
  const out: AuthorityChunk[] = [];
  for (const t of targets) {
    try { const c = await buildChunk(t, provider); if (c) out.push(c); }
    catch (e) { console.log(`✗ ${t.cite}: ${e instanceof Error ? e.message : e}`); }
  }
  console.log(`\n${out.length}/${targets.length} chunks passed the grounding gate.`);

  if (write) {
    // Merge into the existing corpus when a filter was used (keep the others); else full regenerate.
    let final = out;
    if (only.length) {
      const { CORPUS_INGESTED } = (await import("../lib/research/corpus-ingested.ts")) as { CORPUS_INGESTED: AuthorityChunk[] };
      const byId = new Map(CORPUS_INGESTED.map((c) => [c.chunkId, c]));
      for (const c of out) byId.set(c.chunkId, c);
      final = [...byId.values()];
    }
    const { writeFileSync } = await import("node:fs");
    const file =
      `// AUTO-GENERATED by scripts/ingest-authority.mts — re-run to refresh; do not hand-edit.\n` +
      `// Grounded primary-authority chunks: each is a concise operative-rule paraphrase produced\n` +
      `// FROM the fetched source text, and every $/%/year figure was verified to appear in that\n` +
      `// source before admission. Public domain (statute) — §7216-clean. Registered in authority/store.ts.\n` +
      `import type { AuthorityChunk } from "../tax/authority/store";\n\n` +
      `export const CORPUS_INGESTED: AuthorityChunk[] = ${JSON.stringify(final, null, 2)};\n`;
    writeFileSync("lib/research/corpus-ingested.ts", file);
    console.log(`wrote lib/research/corpus-ingested.ts (${final.length} chunks)`);
  } else {
    console.log("(dry run — pass --write to emit lib/research/corpus-ingested.ts)");
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
