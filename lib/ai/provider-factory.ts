import type { AIProvider } from "./provider";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";

const DEV_CODEX = "codex-sub";

/** True when the dev GPT-5.5-via-Codex-proxy path is selected (local, non-production only). */
export function usingDevCodexProvider(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.PETAL_DEV_INFERENCE === DEV_CODEX;
}

/**
 * Pick the AIProvider for a call. Production (and default dev) → AnthropicProvider (ZDR/BAA — the
 * only surface real taxpayer data may touch). When PETAL_DEV_INFERENCE=codex-sub is set in a
 * NON-production env, returns the dev OpenAI provider pointed at a local Codex-subscription proxy
 * (GPT-5.5) — for SYNTHETIC/demo data only.
 *
 * Two hard guards make it impossible to leak production through the consumer endpoint:
 *   1. usingDevCodexProvider() requires NODE_ENV !== "production".
 *   2. an explicit throw if the flag is ever set while NODE_ENV === "production".
 *
 * `model` is the Anthropic model the caller intended (e.g. "claude-sonnet-4-6"). On the Anthropic
 * path it is honored; on the dev OpenAI path it is ignored in favor of the configured GPT-5.x model.
 */
export function getProvider(model?: string): AIProvider {
  if (process.env.PETAL_DEV_INFERENCE === DEV_CODEX && process.env.NODE_ENV === "production") {
    throw new Error(
      "PETAL_DEV_INFERENCE=codex-sub is a DEV-ONLY flag and must never be set in production " +
        "(consumer endpoint, no ZDR/BAA). Refusing to route production inference through it.",
    );
  }
  if (usingDevCodexProvider()) return new OpenAIProvider();
  return new AnthropicProvider(undefined, model ?? "claude-opus-4-8");
}
