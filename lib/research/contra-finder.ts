import { z } from "zod";
import type { AIProvider } from "@/lib/ai/provider";
import { retrieve, type AuthorityChunk } from "@/lib/tax/authority/store";
import type { Jurisdiction } from "@/lib/tax/types";

// CONTRA-AUTHORITY FINDER. The §6662 weigher needs a real for-vs-AGAINST weighing, and assessAuthorityWeight
// honesty-caps the standard at "substantial-authority" until a genuine contrary-authority search has run
// (contraSearched). This is that search: retrieve a BROAD topical candidate set (beyond the supporting
// chunks the engine grounded on) and have the model classify each candidate's STANCE toward the position,
// returning only the ones that cut AGAINST it. It never fabricates authority — it classifies chunkIds that
// are already in the corpus. Classifying a REAL candidate pool (and finding none contrary) is what
// legitimately sets contraSearched=true, so the cap can lift to "more-likely-than-not" when support strongly
// outweighs and no controlling contrary holding exists. Two cases return searched=FALSE so the cap does NOT
// lift: a FAILED search (an outage must never be laundered into "we searched and found no contra"), and an
// EMPTY candidate pool (corpus too thin to surface anything to weigh — that is "we can't tell", not "clear").

const ContraOut = z.object({ contraChunkIds: z.array(z.string()) });

const CONTRA_SYSTEM =
  "You identify CONTRARY authority for a stated tax position. Given the position and a numbered list of " +
  "candidate authorities (each prefixed with its [chunkId]), return the chunkIds of ONLY those that " +
  "CONTRADICT or cut AGAINST the position — e.g. a superseded prior rule asserted as if current, a competing " +
  "limitation that would deny the result, or a holding reaching the opposite conclusion. Do NOT include " +
  "authority that SUPPORTS the position or is merely adjacent/irrelevant. Classify ONLY the chunkIds shown; " +
  'never invent authority. Return {"contraChunkIds": [...]} — an empty array if none are contrary.';

export async function findContraAuthorities(
  provider: AIProvider,
  question: string,
  positionClaim: string,
  support: AuthorityChunk[],
  opts: { taxYear: number; jurisdiction: Jurisdiction; corpus: AuthorityChunk[] },
): Promise<{ contra: AuthorityChunk[]; searched: boolean }> {
  const supportIds = new Set(support.map((c) => c.chunkId));
  // A broader topical pull than the engine's answering retrieval, minus the chunks already grounding the
  // position — these are the candidates that could be contrary.
  const candidates = retrieve(question, { taxYear: opts.taxYear, jurisdiction: opts.jurisdiction, k: 8 }, opts.corpus)
    .filter((c) => !supportIds.has(c.chunkId));
  // An EMPTY candidate pool is NOT a confident "no contrary authority exists." On a thin corpus it almost
  // always means we lack the BREADTH to weigh for-vs-against at all — so reporting searched=true would lift
  // the §6662 cap to "more-likely-than-not" on corpus-emptiness, a false penalty-protection confidence on
  // exactly the contested questions where it matters. A real weighing requires a real candidate pool to
  // classify; with none, report searched=FALSE so the cap honestly stays at substantial-authority.
  if (candidates.length === 0) return { contra: [], searched: false };

  const block = candidates.map((c) => `[${c.chunkId}] ${c.citation}: ${c.text.slice(0, 300)}`).join("\n");
  try {
    const { object } = await provider.generateObject({
      system: CONTRA_SYSTEM,
      prompt: `Position: ${positionClaim}\n\nCandidate authorities (classify each):\n${block}`,
      schema: ContraOut,
      operation: "research:contra",
    });
    const ids = new Set(object.contraChunkIds);
    return { contra: candidates.filter((c) => ids.has(c.chunkId)), searched: true };
  } catch {
    // The contra search FAILED — do NOT claim it ran (that would let the cap lift on no real search).
    return { contra: [], searched: false };
  }
}
