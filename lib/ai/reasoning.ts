import type { AIProvider } from "./provider";
import { ReasoningOutput, type ReasoningOutput as RO } from "./schema";
import { REASONING_SYSTEM } from "./prompts";
import type { AuthorityChunk } from "./authority";

// ④ Reasoning layer. Retrieve-then-reason: the agent may cite ONLY the chunks passed in.
// "No citation, no claim" is enforced HERE in code — any position that cites nothing, or
// cites a chunkId we didn't provide, is dropped before it can reach a human. The model is
// never trusted to police its own grounding.
export async function reason(provider: AIProvider, question: string, chunks: AuthorityChunk[]): Promise<RO> {
  if (chunks.length === 0) return { positions: [], abstained: true };

  const authorityBlock = chunks
    .map((c) => `[${c.chunkId}] ${c.citation} (${c.taxYear}): ${c.text}`)
    .join("\n");
  const prompt = `Question:\n${question}\n\nAuthority (cite ONLY these chunkIds):\n${authorityBlock}`;

  const { object } = await provider.generateObject({
    system: REASONING_SYSTEM,
    prompt,
    schema: ReasoningOutput,
    maxTokens: 1500,
  });

  const allowed = new Set(chunks.map((c) => c.chunkId));
  const grounded = object.positions.filter(
    (p) => p.citations.length > 0 && p.citations.every((cit) => allowed.has(cit.chunkId)),
  );
  return { positions: grounded, abstained: object.abstained || grounded.length === 0 };
}
