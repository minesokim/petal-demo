import { describe, it, expect, afterEach } from "vitest";
import { getProvider, usingDevCodexProvider } from "../../lib/ai/provider-factory";
import { codexDeployOverrideAllowed } from "../../lib/ai/guard";
import { OpenAIProvider } from "../../lib/ai/openai";
import { AnthropicProvider } from "../../lib/ai/anthropic";

// The factory is the single safety boundary: prod (and default dev) -> Anthropic (ZDR); the dev
// Codex-proxy provider is reachable ONLY under PETAL_DEV_INFERENCE=codex-sub in non-prod, and a
// hard guard throws if that flag is ever present in production.

// Env vars are typed loosely; assign through a mutable view so tsc stays clean.
const env = process.env as Record<string, string | undefined>;
const saved = { ...process.env };
afterEach(() => {
  for (const k of ["NODE_ENV", "VERCEL", "PETAL_DEPLOYED", "PETAL_DEV_INFERENCE", "ANTHROPIC_API_KEY", "PETAL_ALLOW_CODEX_ON_DEPLOY", "PETAL_7216_CLEARED"]) {
    if (saved[k] === undefined) delete env[k];
    else env[k] = saved[k];
  }
});
// Local eval = not deployed.
const local = () => { delete env.VERCEL; delete env.PETAL_DEPLOYED; };

describe("getProvider — Codex eval routing + deployed guard", () => {
  it("routes to the OpenAI provider when PETAL_DEV_INFERENCE=codex-sub and NOT deployed", () => {
    local();
    process.env.PETAL_DEV_INFERENCE = "codex-sub";
    expect(usingDevCodexProvider()).toBe(true);
    expect(getProvider("claude-sonnet-4-6")).toBeInstanceOf(OpenAIProvider);
  });

  it("defaults to the Anthropic provider when the flag is unset", () => {
    local();
    delete process.env.PETAL_DEV_INFERENCE;
    process.env.ANTHROPIC_API_KEY = "test-key";
    expect(usingDevCodexProvider()).toBe(false);
    expect(getProvider("claude-sonnet-4-6")).toBeInstanceOf(AnthropicProvider);
  });

  it("HARD GUARD: throws if the flag is present on the deployed server (VERCEL) without the override", () => {
    env.VERCEL = "1";
    process.env.PETAL_DEV_INFERENCE = "codex-sub";
    expect(() => getProvider()).toThrow(/must not run on the deployed server/);
  });

  it("deployed with the flag unset is plain Anthropic (no leak)", () => {
    env.VERCEL = "1";
    delete process.env.PETAL_DEV_INFERENCE;
    process.env.ANTHROPIC_API_KEY = "test-key";
    expect(usingDevCodexProvider()).toBe(false);
    expect(getProvider()).toBeInstanceOf(AnthropicProvider);
  });
});

describe("getProvider — codex-on-deploy DEV OVERRIDE (§7216-safe)", () => {
  it("override is allowed ONLY when opted in AND the deploy is not cleared for real data", () => {
    expect(codexDeployOverrideAllowed()).toBe(false); // nothing set
    env.PETAL_ALLOW_CODEX_ON_DEPLOY = "1";
    expect(codexDeployOverrideAllowed()).toBe(true);
    env.PETAL_7216_CLEARED = "true";
    expect(codexDeployOverrideAllowed()).toBe(false); // real-data clearance REVOKES the override
  });

  it("codex on a DEMO deploy WITH the override → the codex (OpenAI) provider", () => {
    env.VERCEL = "1";
    process.env.PETAL_DEV_INFERENCE = "codex-sub";
    env.PETAL_ALLOW_CODEX_ON_DEPLOY = "1";
    expect(usingDevCodexProvider()).toBe(true);
    expect(getProvider()).toBeInstanceOf(OpenAIProvider);
  });

  it("SAFETY: the override is refused the instant the deploy is cleared for real taxpayer data", () => {
    env.VERCEL = "1";
    process.env.PETAL_DEV_INFERENCE = "codex-sub";
    env.PETAL_ALLOW_CODEX_ON_DEPLOY = "1";
    env.PETAL_7216_CLEARED = "true"; // real-data deploy → codex (non-ZDR) must NOT run
    expect(usingDevCodexProvider()).toBe(false);
    expect(() => getProvider()).toThrow();
  });
});
