import type { ReasoningOutput, VerifierOutput } from "./schema";
import type { AuthorityChunk } from "./authority";

// ④ Structural verifier (§2, deterministic half). Independent of the model: re-checks
// that every position is grounded in resolvable authority. A second, model-based
// faithfulness pass (§3) layers on top; this one is code, so it can never be argued with.
export function verifyStructural(output: ReasoningOutput, chunks: AuthorityChunk[]): VerifierOutput {
  const allowed = new Set(chunks.map((c) => c.chunkId));
  const checks: VerifierOutput["checks"] = [];
  const blockingFailures: string[] = [];

  for (const p of output.positions) {
    const tag = p.claim.slice(0, 48);
    const hasCite = p.citations.length > 0;
    checks.push({ name: `cited: ${tag}`, verdict: hasCite ? "PASS" : "FAIL", reason: hasCite ? "has authority" : "no citation" });
    if (!hasCite) blockingFailures.push(`uncited claim: ${tag}`);

    const resolves = p.citations.every((c) => allowed.has(c.chunkId));
    checks.push({ name: `resolvable: ${tag}`, verdict: resolves ? "PASS" : "FAIL", reason: resolves ? "all citations resolve" : "dangling citation" });
    if (!resolves) blockingFailures.push(`dangling citation: ${tag}`);
  }

  return { overall: blockingFailures.length === 0 ? "PASS" : "FAIL", checks, blockingFailures };
}
