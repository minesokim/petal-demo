// Run SPECIFIC golden cases (by id) through the live engine — to isolate why a case fails and whether
// the Opus judge rescues it. Claude path by default (no codex proxy). Usage:
//   node --env-file=.env.local --import tsx scripts/bench-cases.mts <id> <id> ...  [--no-judge]
import { getProvider } from "../lib/ai/provider-factory";
import { researchAnswer } from "../lib/research/engine";
import { GOLDEN_CASES } from "../tests/research/golden/cases";

const ids = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const withJudge = !process.argv.includes("--no-judge");
const proposer = getProvider("claude-sonnet-4-6");
const judge = withJudge ? getProvider("claude-opus-4-8") : undefined;
const cases = ids.length ? GOLDEN_CASES.filter((c) => ids.includes(c.id)) : GOLDEN_CASES;
console.log(`judge: ${withJudge ? "ON (Opus)" : "OFF"} | running ${cases.length} case(s)\n`);

for (const c of cases) {
  try {
    const r = await researchAnswer(proposer, judge, c.question, { taxYear: c.taxYear, jurisdiction: c.jurisdiction });
    const cites = r.citations.map((x) => x.cite);
    const wantBucket = c.expectedBucket === "coverage_gap" ? "abstain" : c.expectedBucket;
    const hitAuth = c.mustCiteAuthorityLike ? cites.some((x) => x.includes(c.mustCiteAuthorityLike!)) : true;
    const pass = r.bucket === wantBucket && hitAuth;
    console.log(`${pass ? "PASS" : "FAIL"} ${c.id}: got bucket=${r.bucket} cal=${(r as { calibration?: string }).calibration ?? "?"} | expect ${c.expectedBucket} citing ~"${c.mustCiteAuthorityLike ?? "-"}"`);
    console.log(`     cites: ${cites.join(" | ") || "(none)"}`);
  } catch (e) {
    console.log(`ERR  ${c.id}: ${e instanceof Error ? e.message : e}`);
  }
}
