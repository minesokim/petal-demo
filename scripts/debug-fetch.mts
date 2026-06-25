// Diagnostic: what does the live fetch path actually return for a question? (public authority only)
import { fetchPrimary } from "../lib/research/fetch/fetch-primary";
import { pickSources } from "../lib/research/fetch/registry";

const q = process.argv.slice(2).filter((a) => !a.startsWith("--")).join(" ") || "section 179 expensing dollar limitation";
console.log("Q:", q);
console.log("sources picked:", pickSources(q).map((s) => s.id).join(", ") || "(none)");
const chunks = await fetchPrimary(q, 2026, "federal");
console.log("chunks fetched:", chunks.length, "| ids:", chunks.map((c) => c.chunkId).join(", "));

const { reasonAndScore } = await import("../lib/ai/reasoning");
const { getProvider } = await import("../lib/ai/provider-factory");
const provider = getProvider("claude-sonnet-4-6");
const reasoned = await reasonAndScore(provider, q, chunks);
console.log("\nreasoned positions:", reasoned.positions.length, "| abstained:", reasoned.abstained);
for (const p of reasoned.positions) {
  console.log("  • claim:", p.claim.slice(0, 140));
  console.log("    cites:", p.citations.map((c: { chunkId: string }) => c.chunkId).join(", "));
}
