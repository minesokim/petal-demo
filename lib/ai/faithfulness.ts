import type { AIProvider } from "./provider";
import { FaithfulnessOutput, type FaithfulnessOutput as FO } from "./schema";
import { FAITHFULNESS_SYSTEM } from "./prompts";
import { assertCleared } from "./guard";
import type { AuthorityChunk } from "./authority";

// ④ Faithfulness §3 — a model-based grounding check that complements the deterministic
// structural verifier (§2). Decomposes the claim into atomic statements and labels each
// against the provided sources only. Returns the validated FaithfulnessOutput (0..1 score).
export async function checkFaithfulness(
  provider: AIProvider,
  claim: string,
  chunks: AuthorityChunk[],
): Promise<FO> {
  // Defense-in-depth §7216 gate: this grounding check runs over public authority chunks
  // only; assert its own scope rather than inheriting the caller's transitively.
  assertCleared("synthetic");
  const sources = chunks.map((c) => `[${c.chunkId}] ${c.citation}: ${c.text}`).join("\n");
  const prompt = `Claim:\n${claim}\n\nSources (label ONLY against these):\n${sources}`;
  const { object } = await provider.generateObject({
    system: FAITHFULNESS_SYSTEM,
    prompt,
    schema: FaithfulnessOutput,
    // Headroom so a dense source set (a long, detailed authority chunk) does not truncate the JSON before
    // the per-claim breakdown completes. faithfulnessScore is emitted first (see schema) so the score
    // itself is captured even under pressure, but 1000 was tight enough to drop the whole object.
    maxTokens: 1600,
  });
  return object;
}
