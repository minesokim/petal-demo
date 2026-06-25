// Diagnostic: what does the live fetch path actually return for a question? (public authority only)
import { fetchPrimary } from "../lib/research/fetch/fetch-primary";
import { pickSources } from "../lib/research/fetch/registry";

const q = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ") || "section 179 expensing dollar limitation";
console.log("Q:", q);
console.log("sources picked:", pickSources(q).map((s) => s.id).join(", ") || "(none)");
const { reasonAndScore } = await import("../lib/ai/reasoning");
const { getProvider } = await import("../lib/ai/provider-factory");
const provider = getProvider("claude-sonnet-4-6");

const raw = await fetchPrimary(q, 2026, "federal"); // no provider → raw, to inspect the distill call
console.log("raw chunks:", raw.length);
if (raw[0]) {
  const { text } = await provider.generateText({
    system: "You distill US tax PRIMARY AUTHORITY for a research engine. Given a QUESTION and the SOURCE TEXT of one authority, write a concise operative-rule paraphrase (2-4 sentences) that answers the question FROM THE SOURCE. RULES: use ONLY facts and figures present in the SOURCE TEXT — never add a number, threshold, rate, or year from your own knowledge. If the source does not actually address the question, set relevant:false. Output STRICT JSON only: {\"relevant\": boolean, \"text\": string}.",
    prompt: `QUESTION: ${q}\n\nSOURCE TEXT (${raw[0].citation}):\n${raw[0].text}`,
    maxTokens: 600,
  });
  console.log("\nRAW DISTILL MODEL OUTPUT:\n" + text.slice(0, 500));
}
const chunks = await fetchPrimary(q, 2026, "federal", { provider }); // distills
console.log("\ndistilled chunks:", chunks.length);
const reasoned = await reasonAndScore(provider, q, chunks);
console.log("\nreasoned positions:", reasoned.positions.length, "| abstained:", reasoned.abstained);
for (const p of reasoned.positions) {
  console.log("  • claim:", p.claim.slice(0, 140));
  console.log("    cites:", p.citations.map((c: { chunkId: string }) => c.chunkId).join(", "));
}
