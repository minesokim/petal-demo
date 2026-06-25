// Quick single-question probe of the LIVE research engine (public authority only → §7216-clean).
// Verifies what the engine returns for one question: bucket, calibration, answer, citations.
//   PETAL_DEV_INFERENCE= node --env-file=.env.local --import tsx scripts/ask-once.mts --year 2026 "question..."
// (PETAL_DEV_INFERENCE= forces the Anthropic/Claude path even when .env.local sets the codex flag.)
import { getProvider } from "../lib/ai/provider-factory";
import { researchAnswer } from "../lib/research/engine";

async function main() {
  const args = process.argv.slice(2);
  const yearIdx = args.indexOf("--year");
  const taxYear = yearIdx >= 0 ? Number(args[yearIdx + 1]) : 2026;
  const question = args.filter((a, i) => !a.startsWith("--") && i !== yearIdx + 1).join(" ");
  if (!question) { console.error("usage: ask-once.mts [--year N] \"question\""); process.exit(1); }

  const proposer = getProvider("claude-sonnet-4-6");
  const useFetch = args.includes("--fetch"); // retrieve-on-demand: live-fetch primary authority on a gap
  const r = await researchAnswer(proposer, undefined, question, { taxYear, jurisdiction: "federal", fetch: useFetch });
  console.log(`Q (TY${taxYear}): ${question}\n`);
  console.log(`bucket:      ${r.bucket}`);
  console.log(`calibration: ${r.calibration}`);
  console.log(`\nANSWER:\n${r.answer}`);
  console.log(`\nCITATIONS: ${r.citations.map((c) => c.cite).join(" | ") || "(none)"}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
