import { describe, it, expect, afterEach } from "vitest";
import { getProvider, usingDevCodexProvider } from "../../lib/ai/provider-factory";
import { OpenAIProvider } from "../../lib/ai/openai";
import { AnthropicProvider } from "../../lib/ai/anthropic";

// The factory is the single safety boundary: prod (and default dev) -> Anthropic (ZDR); the dev
// Codex-proxy provider is reachable ONLY under PETAL_DEV_INFERENCE=codex-sub in non-prod, and a
// hard guard throws if that flag is ever present in production.

const saved = {
  NODE_ENV: process.env.NODE_ENV,
  PETAL_DEV_INFERENCE: process.env.PETAL_DEV_INFERENCE,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};
afterEach(() => {
  process.env.NODE_ENV = saved.NODE_ENV;
  if (saved.PETAL_DEV_INFERENCE === undefined) delete process.env.PETAL_DEV_INFERENCE;
  else process.env.PETAL_DEV_INFERENCE = saved.PETAL_DEV_INFERENCE;
  if (saved.ANTHROPIC_API_KEY === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = saved.ANTHROPIC_API_KEY;
});

describe("getProvider — dev Codex routing + prod guard", () => {
  it("routes to the OpenAI dev provider when PETAL_DEV_INFERENCE=codex-sub in non-prod", () => {
    process.env.NODE_ENV = "development";
    process.env.PETAL_DEV_INFERENCE = "codex-sub";
    expect(usingDevCodexProvider()).toBe(true);
    expect(getProvider("claude-sonnet-4-6")).toBeInstanceOf(OpenAIProvider);
  });

  it("defaults to the Anthropic provider when the flag is unset", () => {
    process.env.NODE_ENV = "development";
    delete process.env.PETAL_DEV_INFERENCE;
    process.env.ANTHROPIC_API_KEY = "test-key";
    expect(usingDevCodexProvider()).toBe(false);
    expect(getProvider("claude-sonnet-4-6")).toBeInstanceOf(AnthropicProvider);
  });

  it("HARD GUARD: throws if the dev flag is ever set in production", () => {
    process.env.NODE_ENV = "production";
    process.env.PETAL_DEV_INFERENCE = "codex-sub";
    expect(() => getProvider()).toThrow(/DEV-ONLY flag and must never be set in production/);
  });

  it("production with the flag unset is plain Anthropic (no dev leak)", () => {
    process.env.NODE_ENV = "production";
    delete process.env.PETAL_DEV_INFERENCE;
    process.env.ANTHROPIC_API_KEY = "test-key";
    expect(usingDevCodexProvider()).toBe(false);
    expect(getProvider()).toBeInstanceOf(AnthropicProvider);
  });
});
