import { describe, it, expect, afterEach } from "vitest";
import { resolveModel } from "../../lib/ai/anthropic-client";

// Locks the LOCAL dev cost-saver: PETAL_DEV_MODEL overrides every requested model with one cheap
// ZDR model (so local testing runs on Haiku, ~12x cheaper than Opus), and is a pure pass-through
// when unset (so prod/CI keep their real per-call models). resolveModel reads the env at call time.

const prev = process.env.PETAL_DEV_MODEL;
afterEach(() => {
  if (prev === undefined) delete process.env.PETAL_DEV_MODEL;
  else process.env.PETAL_DEV_MODEL = prev;
});

describe("resolveModel — dev cost-saver", () => {
  it("passes the requested model through untouched when PETAL_DEV_MODEL is unset (prod/CI)", () => {
    delete process.env.PETAL_DEV_MODEL;
    expect(resolveModel("claude-opus-4-8")).toBe("claude-opus-4-8");
    expect(resolveModel("claude-sonnet-4-6")).toBe("claude-sonnet-4-6");
  });

  it("forces every requested model to the dev model when PETAL_DEV_MODEL is set", () => {
    process.env.PETAL_DEV_MODEL = "claude-haiku-4-5";
    expect(resolveModel("claude-opus-4-8")).toBe("claude-haiku-4-5");
    expect(resolveModel("claude-sonnet-4-6")).toBe("claude-haiku-4-5");
  });

  it("treats a blank/whitespace override as unset (no accidental empty-string model)", () => {
    process.env.PETAL_DEV_MODEL = "   ";
    expect(resolveModel("claude-opus-4-8")).toBe("claude-opus-4-8");
  });
});
