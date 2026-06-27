// MEASURED ERROR RATE harness — the research AI's release gate (the spec's named moat).
// Runs the LIVE engine over the frozen golden set and grades each answer, producing a pass rate
// + the specific failures. Re-run to gate releases; the number is the moat, not any single answer.
//
// Public authority only (no taxpayer data → §7216-clean). Run:
//   node --env-file=.env.local --import tsx scripts/research-benchmark.mts [--no-judge]
import { getProvider } from "../lib/ai/provider-factory";
import { researchAnswer } from "../lib/research/engine";
import { GOLDEN_CASES } from "../tests/research/golden/cases";
import { BLUEJ_HARD_CASES } from "../tests/research/golden/bluej-hard";
import { VERIFIED_CASES } from "../tests/research/golden/verified";
import { ENTITY_CASES } from "../tests/research/golden/entity";
import { gradeAll, type GradableAnswer } from "../tests/research/golden/grade";

// --shard k/N → grade only the cases whose index (in id-sorted order) ≡ k (mod N). Lets the A/B fan
// out across parallel workers so no single run is long enough to time out or be killed mid-flight.
function parseShard(): { k: number; n: number } | null {
  const i = process.argv.indexOf("--shard");
  if (i < 0) return null;
  const [k, n] = (process.argv[i + 1] ?? "").split("/").map(Number);
  if (![k, n].every(Number.isInteger) || n < 1 || k < 0 || k >= n) {
    throw new Error(`bad --shard "${process.argv[i + 1]}" (want k/N, 0<=k<N)`);
  }
  return { k, n };
}

async function main() {
  const noJudge = process.argv.includes("--no-judge");
  const asJson = process.argv.includes("--json"); // machine-readable, for the parallel A/B aggregator
  const shard = parseShard();
  // Provider-aware: with PETAL_DEV_INFERENCE=codex-sub the whole eval runs on GPT-5.5 (via the local
  // proxy); otherwise it's the Anthropic baseline (Sonnet proposer, Opus judge). Same golden set,
  // same grader → an apples-to-apples Claude vs GPT-5.5 measured error rate.
  const proposer = getProvider("claude-sonnet-4-6");
  const judge = noJudge ? undefined : getProvider("claude-opus-4-8");

  // `--set bluej` runs the held-out Blue J-tier HARD set (15 brutal multi-section / unsettled-edge
  // questions) instead of the currency/plumbing golden set. Tier-E cases expect a HEDGE (a confident
  // answer there is graded a fail), so run with --judge for a meaningful read.
  const setIdx = process.argv.indexOf("--set");
  const setName = setIdx >= 0 ? process.argv[setIdx + 1] : "golden";
  // `--set verified` runs the SOURCE-VERIFIED set (every answer key confirmed literally in the cited
  // primary source) — settled bright-line law, an unambiguous gate that complements the unsettled Blue J set.
  // `--set entity` runs the SOURCE-VERIFIED entity + capital-gains set (Subch S/K/C, §1061, the capital-gains
  // spine) — measures whether the 2026-06 business-law ingest is actually grounded, not just present.
  const CASE_SET = setName === "bluej" ? BLUEJ_HARD_CASES : setName === "verified" ? VERIFIED_CASES : setName === "entity" ? ENTITY_CASES : GOLDEN_CASES;
  const sorted = [...CASE_SET].sort((a, b) => a.id.localeCompare(b.id));
  const cases = shard ? sorted.filter((_, i) => i % shard.n === shard.k) : sorted;

  // --fetch measures the REAL product config (live primary-authority fetch on a corpus miss + the §6662
  // contra search), as the live /api/research runs. Off by default so the golden-set gate stays offline +
  // deterministic; ON for a representative hard-set baseline.
  const liveConfig = process.argv.includes("--fetch");

  const answers: Record<string, GradableAnswer> = {};
  for (const c of cases) {
    try {
      const r = await researchAnswer(proposer, judge, c.question, { taxYear: c.taxYear, jurisdiction: c.jurisdiction, fetch: liveConfig, contraSearch: liveConfig });
      // Map SourcedAnswer -> GradableAnswer. Pass the RAW bucket (the grader handles "abstain" for
      // coverage_gap probes directly); the engine already strips fabricated cites, so none survive.
      answers[c.id] = { bucket: r.bucket, text: r.answer, citations: r.citations.map((x) => x.cite), fabricatedCitations: [] };
      if (!asJson) process.stdout.write(`  ${r.bucket === "answer" ? "·" : "~"} ${c.id} → ${r.bucket}\n`);
    } catch (e) {
      answers[c.id] = { bucket: "abstain", text: `ERROR: ${e instanceof Error ? e.message : e}`, citations: [] };
      if (!asJson) process.stdout.write(`  ! ${c.id} → ERROR\n`);
    }
  }

  const results = gradeAll(answers, cases);
  const ids = Object.keys(results);
  const passed = ids.filter((id) => results[id].pass);
  const failed = ids.filter((id) => !results[id].pass);

  if (asJson) {
    // One self-describing line the aggregator greps for. Per-case bucket+pass+reasons so the final
    // report can show the exact failures without re-running anything.
    const out = {
      mode: process.env.PETAL_GRAPH_RETRIEVAL === "1" ? "graph" : "memory",
      shard: shard ? `${shard.k}/${shard.n}` : "all",
      total: ids.length,
      pass: passed.length,
      results: Object.fromEntries(ids.map((id) => [id, { bucket: answers[id].bucket, pass: results[id].pass, reasons: results[id].reasons }])),
    };
    process.stdout.write(`BENCH_JSON ${JSON.stringify(out)}\n`);
    return;
  }

  console.log(`\n=== MEASURED RESEARCH-AI ERROR RATE (golden set, n=${ids.length}) ===`);
  console.log(`PASS: ${passed.length}/${ids.length}  (${((passed.length / ids.length) * 100).toFixed(1)}%)`);
  console.log(`ERROR RATE: ${((failed.length / ids.length) * 100).toFixed(1)}%`);
  if (failed.length) {
    console.log(`\nFailures (the release-gate signal — fix these, never patch the eval):`);
    for (const id of failed) console.log(`  ✗ ${id}: ${results[id].reasons.join(" | ")}`);
  }

  // RELEASE GATE: `--gate <minPass>` makes this the moat's enforcing step — a run that scores below the
  // committed floor EXITS NON-ZERO so CI (or a release) fails instead of shipping a silent regression.
  // Use on a FULL run only (not --shard, whose pass count is partial). The floor lives in the CI workflow
  // + docs/RESEARCH_BENCHMARK.md; never lower it to make a release pass.
  const gateIdx = process.argv.indexOf("--gate");
  if (gateIdx >= 0) {
    const floor = Number(process.argv[gateIdx + 1]);
    if (!Number.isInteger(floor)) throw new Error(`--gate needs an integer min-pass count (got "${process.argv[gateIdx + 1]}")`);
    if (passed.length < floor) {
      console.error(`\nRELEASE GATE FAILED: ${passed.length}/${ids.length} passed, below the committed floor of ${floor}. Blocking.`);
      process.exit(1);
    }
    console.log(`\nRELEASE GATE PASSED: ${passed.length}/${ids.length} ≥ floor ${floor}.`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
