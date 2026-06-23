import type { AIProvider } from "./provider";
import { FaithfulnessOutput, type FaithfulnessOutput as FO } from "./schema";
import { FAITHFULNESS_SYSTEM } from "./prompts";
import type { AuthorityChunk } from "./authority";

// ④ Faithfulness §3 — a model-based grounding check that complements the deterministic
// structural verifier (§2). Decomposes the claim into atomic statements and labels each
// against the provided sources only. Returns the validated FaithfulnessOutput (0..1 score).
export async function checkFaithfulness(
  provider: AIProvider,
  claim: string,
  chunks: AuthorityChunk[],
): Promise<FO> {
  const sources = chunks.map((c) => `[${c.chunkId}] ${c.citation}: ${c.text}`).join("\n");
  const prompt = `Claim:\n${claim}\n\nSources (label ONLY against these):\n${sources}`;
  const { object } = await provider.generateObject({
    system: FAITHFULNESS_SYSTEM,
    prompt,
    schema: FaithfulnessOutput,
    maxTokens: 1000,
  });
  return object;
}
