import Anthropic from "@anthropic-ai/sdk";

// THE single place an Anthropic client is constructed + the single place the model is resolved,
// so auth and the dev cost-saver live in one spot.
//
// AUTH: always the Console API key (x-api-key). The ZDR/BAA terms the §7216 posture depends on
// attach to the API account, so this is the only sanctioned path. (We evaluated routing dev through
// a Claude Code Max subscription token to save money — Anthropic BLOCKS that: a sk-ant-oat01 token
// used outside Claude Code returns 400 "This credential is only authorized for use with Claude
// Code", and their Consumer Terms forbid using Pro/Max OAuth in any other product/SDK. Dead end.)
//
// DEV COST-SAVER (the legit one): set PETAL_DEV_MODEL=claude-haiku-4-5 in .env.local to force every
// call to the cheapest ZDR model while testing locally — same API key, same ZDR posture, ~12x
// cheaper than Opus. Unset in prod/CI, so production keeps its real per-call models (Opus/Sonnet).

export function anthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

/**
 * Resolve the model to actually call. In local dev, PETAL_DEV_MODEL overrides every requested
 * model with a single cheap ZDR model (e.g. claude-haiku-4-5) to keep API spend low while testing.
 * In prod/CI (env unset) it is a pass-through, so each call keeps its intended model. The caller
 * still runs assertZdrModel on the result, so an override to a non-ZDR model is rejected. Read at
 * call time (not module init) so it is trivially testable and respects a late-set env.
 */
export function resolveModel(requested: string): string {
  const dev = process.env.PETAL_DEV_MODEL?.trim();
  return dev && dev.length > 0 ? dev : requested;
}
