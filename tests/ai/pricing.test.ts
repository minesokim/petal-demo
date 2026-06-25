import { describe, it, expect } from "vitest";
import { costUsd, priceKeyForModel } from "@/lib/ai/pricing";

describe("ai pricing", () => {
  it("prices Opus input + output at published per-million rates", () => {
    // 1M input + 1M output on Opus = $15 + $75 = $90
    expect(costUsd({ inputTokens: 1_000_000, outputTokens: 1_000_000 }, "claude-opus-4-8")).toBeCloseTo(90, 6);
  });

  it("applies the cache-read discount (10% of input)", () => {
    // 1M cache-read tokens on Opus = $1.50, not $15
    expect(costUsd({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 1_000_000 }, "claude-opus-4-8")).toBeCloseTo(1.5, 6);
  });

  it("prices Sonnet cheaper than Opus for the same tokens", () => {
    const u = { inputTokens: 500_000, outputTokens: 200_000 };
    expect(costUsd(u, "claude-sonnet-4-6")).toBeLessThan(costUsd(u, "claude-opus-4-8"));
  });

  it("maps model ids to price keys", () => {
    expect(priceKeyForModel("claude-opus-4-8")).toBe("opus");
    expect(priceKeyForModel("claude-sonnet-4-6")).toBe("sonnet");
    expect(priceKeyForModel("claude-haiku-4-5-20251001")).toBe("haiku");
    expect(priceKeyForModel("gpt-5.5")).toBe("gpt-5.5");
    expect(priceKeyForModel("mock")).toBeNull();
  });

  it("costs $0 for unknown/mock models (so tests never accrue spend)", () => {
    expect(costUsd({ inputTokens: 1000, outputTokens: 1000 }, "mock")).toBe(0);
  });
});
