import type { AIProvider } from "./provider";
import { ReasoningOutput, type ReasoningOutput as RO } from "./schema";
import { REASONING_SYSTEM } from "./prompts";
import { checkFaithfulness } from "./faithfulness";
import { verifyStructural } from "./verify";
import { deriveTier } from "./tier";
import { assertCleared } from "./guard";
import type { AuthorityChunk } from "../tax/authority/store";

// ④ Reasoning layer. Retrieve-then-reason: the agent may cite ONLY the chunks passed in.
// "No citation, no claim" is enforced HERE in code — any position that cites nothing, or
// cites a chunkId we didn't provide, is dropped before it can reach a human. The model is
// never trusted to police its own grounding.
// reason()/reasonAndScore() return the model output PLUS a serviceError flag: true when a model CALL
// failed (transport/parse/429), as distinct from a clean decline. HONEST DEGRADATION — a failed call must
// surface as a service error, never masquerade as an "I have no authority" abstention.
type Reasoned = RO & { serviceError?: boolean };

export async function reason(provider: AIProvider, question: string, chunks: AuthorityChunk[]): Promise<Reasoned> {
  // §7216 code-gate (enforcement point, not a comment): this pipeline reasons over
  // synthetic/public authority chunks only. If a caller ever routes real taxpayer
  // return data through here, switch this to assertCleared('real') — which throws
  // until counsel clears real-data AI via PETAL_7216_CLEARED.
  assertCleared("synthetic");
  if (chunks.length === 0) return { positions: [], abstained: true };

  const authorityBlock = chunks
    .map((c) => `[${c.chunkId}] ${c.citation} (${c.taxYear}): ${c.text}`)
    .join("\n");
  const prompt = `Question:\n${question}\n\nAuthority (cite ONLY these chunkIds):\n${authorityBlock}`;

  // RELIABILITY: generateObject THROWS (ZodError) when the model returns a non-conforming or
  // truncated shape. A thrown error here used to crash the whole request (a 500). Instead we
  // attempt the call, and on ANY parse/validation failure we retry ONCE (truncated JSON is a
  // common, transient cause — and we already raised maxTokens to 3000 to make it rarer), then
  // fall back to a SAFE DECLINE. A safe decline ({ positions: [], abstained: true }) is the
  // correct floor: an abstention is always a valid answer, a 500 never is.
  const attempt = async () =>
    (await provider.generateObject({
      system: REASONING_SYSTEM,
      prompt,
      schema: ReasoningOutput,
      maxTokens: 3000,
    })).object;

  let object: Awaited<ReturnType<typeof attempt>> | null = null;
  let callFailed = false;
  for (let i = 0; i < 2 && object === null; i++) {
    try {
      object = await attempt();
    } catch (e) {
      // parse/validation/transport/429 failure — retry once, then decline below. LOG it (never silent)
      // and flag it as a service error so a rate-limit/outage never looks like a calibrated abstention.
      callFailed = true;
      console.warn(`[research:reason] model call failed (attempt ${i + 1}/2): ${e instanceof Error ? e.message : e}`);
    }
  }

  // Missing/failed object (or a malformed object missing its positions array) ⇒ safe decline. If a CALL
  // threw (callFailed), mark serviceError so the engine surfaces a degraded state, not a false abstention.
  if (object === null || !Array.isArray(object.positions)) {
    return { positions: [], abstained: true, serviceError: callFailed };
  }

  // "No citation, no claim" enforcement stays intact: a position citing nothing, or citing a
  // chunkId we did not provide, is dropped before it can reach a human.
  const allowed = new Set(chunks.map((c) => c.chunkId));
  const grounded = object.positions.filter(
    (p) => p.citations.length > 0 && p.citations.every((cit) => allowed.has(cit.chunkId)),
  );
  return { positions: grounded, abstained: object.abstained || grounded.length === 0 };
}

// Full ④ pipeline: retrieve→reason→(per position: faithfulness §3 + structural §2 → DERIVED
// tier). Returns positions each stamped with a code-derived tier (never model-declared).
export async function reasonAndScore(provider: AIProvider, question: string, chunks: AuthorityChunk[]): Promise<Reasoned> {
  const out = await reason(provider, question, chunks);
  let scoringFailed = false;
  const scored = await Promise.all(
    out.positions.map(async (p) => {
      try {
        const f = await checkFaithfulness(provider, p.claim, chunks);
        const v = verifyStructural({ positions: [p], abstained: false }, chunks);
        const tier = deriveTier({ signals: p.confidenceSignals, faithfulnessScore: f.faithfulnessScore, verifierPass: v.overall === "PASS" });
        return { ...p, tier };
      } catch (e) {
        // A scoring sub-call (faithfulness model) failed: DROP this position (never crash) but LOG + flag
        // it as a service error so a model outage on the scorer doesn't masquerade as a clean abstention.
        scoringFailed = true;
        console.warn(`[research:score] faithfulness scoring failed: ${e instanceof Error ? e.message : e}`);
        return null;
      }
    }),
  );
  const kept = scored.filter((p): p is NonNullable<typeof p> => p !== null);
  // Scoring only flags a service error when it dropped EVERY position (kept none) — a partial drop with
  // survivors is a real grounding decision, not an outage.
  const serviceError = out.serviceError || (scoringFailed && kept.length === 0);
  return { positions: kept, abstained: out.abstained || kept.length === 0, serviceError };
}
