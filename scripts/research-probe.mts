import { REGISTERED_CORPUS } from "../lib/tax/authority/store";
import { researchAnswer } from "../lib/research/engine";
import { AnthropicProvider } from "../lib/ai/anthropic";

console.log("REGISTERED_CORPUS chunks:", REGISTERED_CORPUS.length);
const p = new AnthropicProvider(process.env.ANTHROPIC_API_KEY, "claude-sonnet-4-6");
const judge = new AnthropicProvider(process.env.ANTHROPIC_API_KEY, "claude-opus-4-8");

// Canary: SALT 2026 grounded cleanly BEFORE ingestion. The ingested chunks are 2024/2025-scoped,
// so a 2026 retrieval can't see them — this must still ground (proves no regression).
const a = await researchAnswer(p, judge, "What is the SALT deduction cap for 2026 including the high-income phase-down?", { taxYear: 2026, jurisdiction: "federal", scope: "synthetic" });
console.log("SALT-2026 → bucket:", a.bucket, "| cites:", a.citations.map((c) => c.cite).join(" | ") || "<none>");
console.log("answer:", a.answer.slice(0, 200));
