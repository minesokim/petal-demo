// §7216 NO-LEAK PROOF (tests/security/no-leak-7216.test.ts)
//
// The spec requires §7216 to be PROVEN by a no-leak test: real taxpayer data can never reach a
// non-ZDR / uncleared path. This pins the boundary in code (the counsel decision is separate — it
// flips PETAL_7216_CLEARED; this proves the plumbing can't leak regardless). The boundary has three
// independent walls, and real taxpayer data can only exist behind all of them:
//   1. The non-ZDR consumer provider (OpenAI/Codex) cannot exist in production — where real data is.
//   2. Even on the Anthropic path, only ZDR-allowlisted models ever receive a prompt.
//   3. Real-scoped data is gated until counsel clears it (PETAL_7216_CLEARED).

import { describe, it, expect, afterEach } from "vitest";
import { getProvider, usingDevCodexProvider } from "../../lib/ai/provider-factory";
import { OpenAIProvider } from "../../lib/ai/openai";
import { AnthropicProvider } from "../../lib/ai/anthropic";
import { assertZdrModel, isZdrModel, ZDR_MODELS, assertCleared } from "../../lib/ai/guard";

// NODE_ENV is typed as a readonly literal union; assign through a mutable view so tsc stays clean.
const env = process.env as Record<string, string | undefined>;
const setNodeEnv = (v: string) => { env.NODE_ENV = v; };

const saved = { ...process.env };
afterEach(() => {
  for (const k of ["NODE_ENV", "VERCEL", "PETAL_DEPLOYED", "PETAL_DEV_INFERENCE", "PETAL_7216_CLEARED", "ANTHROPIC_API_KEY"]) {
    if (saved[k] === undefined) delete env[k];
    else env[k] = saved[k];
  }
});

describe("§7216 wall 1 — the non-ZDR consumer path cannot exist on the DEPLOYED server", () => {
  it("getProvider THROWS if the Codex flag is present on the deployed server (VERCEL set)", () => {
    env.VERCEL = "1";
    process.env.PETAL_DEV_INFERENCE = "codex-sub";
    expect(() => getProvider()).toThrow(/never run on the deployed/);
  });

  it("OpenAIProvider itself THROWS if constructed on the deployed server (defense in depth)", () => {
    env.VERCEL = "1";
    expect(() => new OpenAIProvider()).toThrow(/never be constructed on the deployed/);
  });

  it("deployed with the flag unset is the Anthropic (ZDR) provider — no leak", () => {
    env.VERCEL = "1";
    delete process.env.PETAL_DEV_INFERENCE;
    process.env.ANTHROPIC_API_KEY = "test-key";
    expect(usingDevCodexProvider()).toBe(false);
    expect(getProvider()).toBeInstanceOf(AnthropicProvider);
  });

  it("LOCAL (not deployed) with the flag → the Codex eval path is allowed, even in a prod build", () => {
    delete env.VERCEL;
    delete env.PETAL_DEPLOYED;
    setNodeEnv("production"); // a local `next build && next start` is production but NOT deployed
    process.env.PETAL_DEV_INFERENCE = "codex-sub";
    expect(usingDevCodexProvider()).toBe(true);
    expect(getProvider()).toBeInstanceOf(OpenAIProvider);
  });

  it("PETAL_DEPLOYED=1 forces the block even without VERCEL", () => {
    delete env.VERCEL;
    process.env.PETAL_DEPLOYED = "1";
    process.env.PETAL_DEV_INFERENCE = "codex-sub";
    expect(() => getProvider()).toThrow(/never run on the deployed/);
  });
});

describe("§7216 wall 2 — only ZDR-allowlisted models ever receive a prompt", () => {
  it("the ZDR allowlist is exactly the three Claude models", () => {
    expect([...ZDR_MODELS].sort()).toEqual(["claude-haiku-4-5", "claude-opus-4-8", "claude-sonnet-4-6"]);
  });

  it("assertZdrModel REJECTS a non-ZDR model (e.g. gpt-5.5) before any prompt is built", () => {
    expect(isZdrModel("gpt-5.5")).toBe(false);
    expect(() => assertZdrModel("gpt-5.5")).toThrow();
    expect(() => assertZdrModel("claude-fable-5")).toThrow();
  });

  it("the Anthropic provider hard-rejects a non-ZDR default at construction", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    expect(() => new AnthropicProvider(undefined, "gpt-5.5")).toThrow();
    expect(() => new AnthropicProvider(undefined, "claude-sonnet-4-6")).not.toThrow();
  });
});

describe("§7216 wall 3 — real taxpayer data is gated until counsel clears it", () => {
  it("synthetic/public scope always clears", () => {
    delete process.env.PETAL_7216_CLEARED;
    expect(() => assertCleared("synthetic")).not.toThrow();
  });

  it("real scope THROWS until PETAL_7216_CLEARED is set (the counsel gate)", () => {
    delete process.env.PETAL_7216_CLEARED;
    expect(() => assertCleared("real")).toThrow(/§7216 gate/);
  });

  it("real scope clears ONLY when explicitly cleared", () => {
    process.env.PETAL_7216_CLEARED = "true";
    expect(() => assertCleared("real")).not.toThrow();
  });
});
