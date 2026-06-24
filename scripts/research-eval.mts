// Live golden eval: run every GOLDEN_CASE through the REAL research engine (Sonnet proposes,
// Opus judges, against the registered corpus) and grade the result. Prints a per-case table and
// a final score. Run: node --env-file=.env.local --import tsx scripts/research-eval.mts
import { GOLDEN_CASES } from "../tests/research/golden/cases";
import { gradeAnswer, type GradableAnswer } from "../tests/research/golden/grade";
import { researchAnswer } from "../lib/research/engine";
import { AnthropicProvider } from "../lib/ai/anthropic";

const proposer = new AnthropicProvider(process.env.ANTHROPIC_API_KEY, "claude-sonnet-4-6");
const judge = new AnthropicProvider(process.env.ANTHROPIC_API_KEY, "claude-opus-4-8");

const CONCURRENCY = 4;

async function runCase(c: (typeof GOLDEN_CASES)[number]) {
  try {
    const a = await researchAnswer(proposer, judge, c.question, {
      taxYear: c.taxYear,
      jurisdiction: c.jurisdiction,
      scope: "synthetic", // public authority only — §7216 safe
    });
    const ga: GradableAnswer = {
      bucket: a.bucket === "abstain" ? "hedge" : a.bucket, // abstain renders as a hedge to the user
      text: a.answer,
      citations: a.citations.map((x) => x.cite),
      fabricatedCitations: [], // the engine strips fabricated cites before they ever surface
    };
    const g = gradeAnswer(ga, c);
    return { id: c.id, want: c.expectedBucket, got: a.bucket, pass: g.pass, reasons: g.reasons, cites: ga.citations };
  } catch (e) {
    return { id: c.id, want: c.expectedBucket, got: "ERROR", pass: false, reasons: [(e as Error).message], cites: [] };
  }
}

const results: Awaited<ReturnType<typeof runCase>>[] = [];
for (let i = 0; i < GOLDEN_CASES.length; i += CONCURRENCY) {
  const batch = GOLDEN_CASES.slice(i, i + CONCURRENCY);
  results.push(...(await Promise.all(batch.map(runCase))));
  process.stderr.write(`  ...${Math.min(i + CONCURRENCY, GOLDEN_CASES.length)}/${GOLDEN_CASES.length}\n`);
}

let pass = 0;
for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  console.log(`${mark}  ${r.id.padEnd(28)} want=${r.want.padEnd(12)} got=${String(r.got).padEnd(12)} ${r.pass ? r.cites.slice(0, 2).join(" | ") : r.reasons.join("; ")}`);
  if (r.pass) pass++;
}
console.log(`\nSCORE: ${pass}/${results.length} golden cases pass against the live engine.`);
