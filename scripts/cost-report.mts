// COST METER demo — runs real research questions on the codex dev path (prod Anthropic key untouched),
// captures the actual token counts, then RE-PRICES them at production Opus/Sonnet rates. Turns "what
// will tax season cost?" into a measured number.
//   node --env-file=.env.local --import tsx scripts/cost-report.mts
import { resetLedger, ledgerTotals, repriceAt } from "../lib/ai/usage-ledger";
import { researchAnswer } from "../lib/research/engine";
import { getProvider } from "../lib/ai/provider-factory";

const questions = [
  "Can my client deduct gambling losses against winnings in 2026?",
  "What is the standard deduction for a single filer in 2026?",
  "Is the qualified business income deduction available in 2026?",
  "What is the SALT deduction cap for 2026?",
];

const provider = getProvider(); // dev → codex (gpt-5.5)
console.log(`provider: ${provider.constructor.name}`);
resetLedger();
for (const q of questions) {
  await researchAnswer(provider, undefined, q, { taxYear: 2026, jurisdiction: "federal" });
}

const n = questions.length;
const dev = ledgerTotals();
const opus = repriceAt("claude-opus-4-8");
const sonnet = repriceAt("claude-sonnet-4-6");
const f = (x: number) => `$${x.toFixed(4)}`;

console.log(`\n=== COST METER: ${n} research questions (measured live on codex) ===`);
console.log(`model calls: ${dev.calls}   tokens in/out: ${dev.tokens.input.toLocaleString()} / ${dev.tokens.output.toLocaleString()}`);
console.log(`dev (codex)           total ${f(dev.total)}   per-question ${f(dev.total / n)}`);
console.log(`PROD repriced @ Opus  total ${f(opus)}   per-question ${f(opus / n)}`);
console.log(`PROD repriced @ Sonnet total ${f(sonnet)}   per-question ${f(sonnet / n)}`);

const perQOpus = opus / n;
console.log(`\n=== 300-client season projection (research questions only, Opus rates) ===`);
for (const [label, qPerClient] of [["routine — 2 Q/client", 2], ["typical — 5 Q/client", 5], ["complex — 12 Q/client", 12]] as const) {
  console.log(`  ${label}: ${f(perQOpus * qPerClient)}/client → ${f(perQOpus * qPerClient * 300).replace(".0000", "")} for 300 clients`);
}
console.log(`\nNote: research Q&A is ONE cost lane. Extraction (Sonnet-vision) + agent-OS turns are separate`);
console.log(`lanes; tag them with opts.operation and they'll show here too. Numbers MEASURED, not guessed.`);
process.exit(0);
