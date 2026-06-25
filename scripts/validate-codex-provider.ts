// Validate a LIVE Codex-subscription proxy before trusting Petal's dev AI to it. Exercises the two
// things most likely to degrade through a chat<->Responses translation layer: forced-tool
// structured output (generateObject) and plain text (generateText). Fails LOUDLY if either breaks.
//
// Prereqs:
//   1. `codex login` (Sign in with ChatGPT) so ~/.codex/auth.json exists.
//   2. Run a proxy that serves an OpenAI-compatible endpoint off that auth, e.g.
//      router-for-me/CLIProxyAPI -> http://127.0.0.1:8317/v1 (or set PETAL_DEV_OPENAI_BASE_URL).
// Usage:
//   PETAL_DEV_INFERENCE=codex-sub npx tsx scripts/validate-codex-provider.ts
//
// NOTE: this is UNSANCTIONED (against OpenAI ToS) and ban-risky on your account; SYNTHETIC data only.

import { z } from "zod";
import { getProvider, usingDevCodexProvider } from "../lib/ai/provider-factory";

async function main() {
  if (!usingDevCodexProvider()) {
    console.error("PETAL_DEV_INFERENCE=codex-sub is not set (or NODE_ENV=production). Set the flag and retry.");
    process.exit(1);
  }
  const p = getProvider();
  console.log(
    `provider: ${p.constructor.name} | base: ${process.env.PETAL_DEV_OPENAI_BASE_URL ?? "http://127.0.0.1:8317/v1"} | ` +
      `model: ${process.env.PETAL_DEV_OPENAI_MODEL ?? "gpt-5.5"} | reasoning: ${process.env.PETAL_DEV_OPENAI_REASONING ?? "high"}`,
  );

  // 1. Forced-tool structured output — the part most likely to degrade through a proxy.
  const schema = z.object({ capital: z.string(), populationMillions: z.number() });
  const { object } = await p.generateObject({
    system: "You answer with structured data only.",
    prompt: "Return the capital of France and its metro-area population in millions.",
    schema,
    maxTokens: 300,
  });
  console.log("OK generateObject (forced tool):", JSON.stringify(object));

  // 2. Plain text.
  const { text } = await p.generateText({
    system: "You are concise.",
    prompt: "Reply with exactly: tool calling works",
    maxTokens: 50,
  });
  console.log("OK generateText:", text);

  console.log("\nPASS - GPT-5.5 via the proxy handles forced-tool structured output + text. Petal dev can use it.");
}

main().catch((e) => {
  console.error("\nFAIL -", e?.message ?? e);
  console.error("(A tool_call / JSON error here means the proxy's chat<->Responses translation is mangling structured output, so generateObject and the agent runner would be unreliable. A 401/403 means the proxy auth/Cloudflare is the issue.)");
  process.exit(1);
});
