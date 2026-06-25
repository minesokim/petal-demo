// MEASURED ERROR RATE harness — the research AI's release gate (the spec's named moat).
// Runs the LIVE engine over the frozen golden set and grades each answer, producing a pass rate
// + the specific failures. Re-run to gate releases; the number is the moat, not any single answer.
//
// Public authority only (no taxpayer data → §7216-clean). Run:
//   node --env-file=.env.local --import tsx scripts/research-benchmark.mts [--no-judge]
import { AnthropicProvider } from "../lib/ai/anthropic";
import { researchAnswer } from "../lib/research/engine";
import { GOLDEN_CASES } from "../tests/research/golden/cases";
import { gradeAll, type GradableAnswer } from "../tests/research/golden/grade";

async function main() {
  const noJudge = process.argv.includes("--no-judge");
  const proposer = new AnthropicProvider(process.env.ANTHROPIC_API_KEY, "claude-sonnet-4-6");
  const judge = noJudge ? undefined : new AnthropicProvider(process.env.ANTHROPIC_API_KEY, "claude-opus-4-8");

  const answers: Record<string, GradableAnswer> = {};
  for (const c of GOLDEN_CASES) {
    try {
      const r = await researchAnswer(proposer, judge, c.question, { taxYear: c.taxYear, jurisdiction: c.jurisdiction });
      // Map SourcedAnswer -> GradableAnswer. Pass the RAW bucket (the grader handles "abstain" for
      // coverage_gap probes directly); the engine already strips fabricated cites, so none survive.
      answers[c.id] = { bucket: r.bucket, text: r.answer, citations: r.citations.map((x) => x.cite), fabricatedCitations: [] };
      process.stdout.write(`  ${r.bucket === "answer" ? "·" : "~"} ${c.id} → ${r.bucket}\n`);
    } catch (e) {
      answers[c.id] = { bucket: "abstain", text: `ERROR: ${e instanceof Error ? e.message : e}`, citations: [] };
      process.stdout.write(`  ! ${c.id} → ERROR\n`);
    }
  }

  const results = gradeAll(answers, GOLDEN_CASES);
  const ids = Object.keys(results);
  const passed = ids.filter((id) => results[id].pass);
  const failed = ids.filter((id) => !results[id].pass);

  console.log(`\n=== MEASURED RESEARCH-AI ERROR RATE (golden set, n=${ids.length}) ===`);
  console.log(`PASS: ${passed.length}/${ids.length}  (${((passed.length / ids.length) * 100).toFixed(1)}%)`);
  console.log(`ERROR RATE: ${((failed.length / ids.length) * 100).toFixed(1)}%`);
  if (failed.length) {
    console.log(`\nFailures (the release-gate signal — fix these, never patch the eval):`);
    for (const id of failed) console.log(`  ✗ ${id}: ${results[id].reasons.join(" | ")}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
