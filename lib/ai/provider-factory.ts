import type { AIProvider } from "./provider";
import { AnthropicProvider } from "./anthropic";
import { OpenAIProvider } from "./openai";
import { codexDeployOverrideAllowed } from "./guard";

const DEV_CODEX = "codex-sub";

// "Deployed" = the hosted server where real client data lives (Vercel sets VERCEL=1 in build +
// runtime). The §7216 boundary is DEPLOYMENT, not NODE_ENV: the non-ZDR GPT-5.5/Codex path is
// allowed for LOCAL evaluation on synthetic/demo data — including a local `next build && next start`
// production build — but is HARD-BLOCKED on the deployed server. PETAL_DEPLOYED=1 forces the block
// anywhere as a manual override.
export function isDeployed(): boolean {
  return !!process.env.VERCEL || process.env.PETAL_DEPLOYED === "1";
}

/** True when the GPT-5.5-via-Codex-proxy path is selected — locally, OR on a DEMO deploy that has explicitly
 *  opted in via the §7216-safe override (PETAL_ALLOW_CODEX_ON_DEPLOY=1, and not cleared for real data). */
export function usingDevCodexProvider(): boolean {
  if (process.env.PETAL_DEV_INFERENCE !== DEV_CODEX) return false;
  return !isDeployed() || codexDeployOverrideAllowed();
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
  // Codex requested on a DEPLOY without the demo override → hard refuse with the exact fix. The override
  // (PETAL_ALLOW_CODEX_ON_DEPLOY=1, demo deploy only) lets a remote dev test the deployed app on codex.
  if (process.env.PETAL_DEV_INFERENCE === DEV_CODEX && isDeployed() && !codexDeployOverrideAllowed()) {
    throw new Error(
      "PETAL_DEV_INFERENCE=codex-sub must not run on the deployed server (non-ZDR consumer endpoint, no " +
        "ZDR/BAA — §7216). For a DEMO deploy with NO real taxpayer data, set PETAL_ALLOW_CODEX_ON_DEPLOY=1 " +
        "(auto-refused once PETAL_7216_CLEARED=true) and point PETAL_DEV_OPENAI_BASE_URL at a reachable " +
        "endpoint (a public tunnel to your codex proxy, or https://api.openai.com/v1 with PETAL_DEV_OPENAI_KEY).",
    );
  }
  if (usingDevCodexProvider()) {
    if (isDeployed()) {
      console.warn(
        "[provider] DEV OVERRIDE ACTIVE — codex/GPT-5.5 on a DEPLOYED server (PETAL_ALLOW_CODEX_ON_DEPLOY=1). " +
          "DEMO DATA ONLY; this is a non-ZDR endpoint. NEVER set PETAL_7216_CLEARED=true while this is on.",
      );
    }
    return new OpenAIProvider();
  }
  return new AnthropicProvider(undefined, model ?? "claude-opus-4-8");
}
