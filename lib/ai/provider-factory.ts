import type { AIProvider } from "./provider";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";

const DEV_CODEX = "codex-sub";

// "Deployed" = the hosted server where real client data lives (Vercel sets VERCEL=1 in build +
// runtime). The §7216 boundary is DEPLOYMENT, not NODE_ENV: the non-ZDR GPT-5.5/Codex path is
// allowed for LOCAL evaluation on synthetic/demo data — including a local `next build && next start`
// production build — but is HARD-BLOCKED on the deployed server. PETAL_DEPLOYED=1 forces the block
// anywhere as a manual override.
export function isDeployed(): boolean {
  return !!process.env.VERCEL || process.env.PETAL_DEPLOYED === "1";
}

/** True when the GPT-5.5-via-Codex-proxy path is selected — only when NOT deployed (local eval). */
export function usingDevCodexProvider(): boolean {
  return !isDeployed() && process.env.PETAL_DEV_INFERENCE === DEV_CODEX;
}

/**
 * Pick the AIProvider for a call. The deployed server (and the default everywhere) → AnthropicProvider
 * (ZDR/BAA — the only surface real taxpayer data may touch). When PETAL_DEV_INFERENCE=codex-sub is set
 * and we are NOT deployed, returns the OpenAI provider pointed at a local Codex-subscription proxy
 * (GPT-5.5) — for SYNTHETIC/demo data only, as a Claude↔GPT eval switch.
 *
 * Two hard guards keep the consumer endpoint off the deployed server:
 *   1. usingDevCodexProvider() requires !isDeployed().
 *   2. an explicit throw if the flag is ever present on a deployed server.
 */
export function getProvider(model?: string): AIProvider {
  if (process.env.PETAL_DEV_INFERENCE === DEV_CODEX && isDeployed()) {
    throw new Error(
      "PETAL_DEV_INFERENCE=codex-sub is a local-eval-only flag and must never run on the deployed " +
        "server (non-ZDR consumer endpoint, no ZDR/BAA — §7216). Refusing to route deployed inference through it.",
    );
  }
  if (usingDevCodexProvider()) return new OpenAIProvider();
  return new AnthropicProvider(undefined, model ?? "claude-opus-4-8");
}
