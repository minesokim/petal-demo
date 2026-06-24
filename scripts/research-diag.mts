// Diagnostic: characterize the stubborn abstains using the EXACT golden questions.
import { GOLDEN_CASES } from "../tests/research/golden/cases";
import { researchAnswer } from "../lib/research/engine";
import { AnthropicProvider } from "../lib/ai/anthropic";
const proposer = new AnthropicProvider(process.env.ANTHROPIC_API_KEY, "claude-sonnet-4-6");
const judge = new AnthropicProvider(process.env.ANTHROPIC_API_KEY, "claude-opus-4-8");
const ids = [
  "salt-cap-phasedown-highincome-2026",
  "tips-deduction-exists-2025",
  "senior-6k-deduction-2025",
  "gambling-loss-limit-2025",
  "bonus-depreciation-2025",
];
for (const c of GOLDEN_CASES.filter((x) => ids.includes(x.id))) {
  const a = await researchAnswer(proposer, judge, c.question, { taxYear: c.taxYear, jurisdiction: c.jurisdiction, scope: "synthetic" });
  console.log("\n==== " + c.id + " ====");
  console.log("Q:", c.question);
  console.log("bucket:", a.bucket, "| cites:", a.citations.map((x) => x.cite).join(" | ") || "<none>");
  console.log("answer:", a.answer.slice(0, 220));
  console.log("notes:", JSON.stringify(a.reviewNotes).slice(0, 400));
}
