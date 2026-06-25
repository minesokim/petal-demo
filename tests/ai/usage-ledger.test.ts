import { describe, it, expect, beforeEach } from "vitest";
import { recordUsage, resetLedger, ledgerTotals, repriceAt, runWithUsageScope } from "@/lib/ai/usage-ledger";

describe("usage ledger", () => {
  beforeEach(() => resetLedger());

  it("accumulates cost by operation and model", () => {
    recordUsage({ operation: "research:reason", model: "claude-opus-4-8", usage: { inputTokens: 1_000_000, outputTokens: 0 } });
    recordUsage({ operation: "extraction", model: "claude-sonnet-4-6", usage: { inputTokens: 1_000_000, outputTokens: 0 } });
    const t = ledgerTotals();
    expect(t.byOperation["research:reason"]).toBeCloseTo(15, 6); // Opus input
    expect(t.byOperation["extraction"]).toBeCloseTo(3, 6); // Sonnet input
    expect(t.total).toBeCloseTo(18, 6);
    expect(t.calls).toBe(2);
  });

  it("reprices dev (codex) token counts at production (Opus) rates — the prod projection", () => {
    // Measured on codex: 1M input. gpt-5.5 bills $1.25; the same tokens on Opus bill $15.
    recordUsage({ operation: "research:reason", model: "gpt-5.5", usage: { inputTokens: 1_000_000, outputTokens: 0 } });
    expect(ledgerTotals().total).toBeCloseTo(1.25, 6);
    expect(repriceAt("claude-opus-4-8")).toBeCloseTo(15, 6);
  });

  it("isolates usage per async scope — concurrent requests never cross-contaminate (multi-tenant safety)", async () => {
    // Two scopes whose recordUsage calls INTERLEAVE in wall-clock (the setTimeouts force it). Each must
    // see ONLY its own entries — otherwise firm A's research cost lands on firm B's bill.
    const [a, b] = await Promise.all([
      runWithUsageScope(async () => {
        recordUsage({ operation: "research:reason", model: "claude-opus-4-8", usage: { inputTokens: 1000, outputTokens: 0 } });
        await new Promise((r) => setTimeout(r, 8));
        recordUsage({ operation: "research:verify", model: "claude-opus-4-8", usage: { inputTokens: 500, outputTokens: 0 } });
        return "A";
      }),
      runWithUsageScope(async () => {
        await new Promise((r) => setTimeout(r, 3));
        recordUsage({ operation: "agent:turn", model: "claude-sonnet-4-6", usage: { inputTokens: 2000, outputTokens: 0 } });
        return "B";
      }),
    ]);
    expect(a.result).toBe("A");
    expect(b.result).toBe("B");
    expect(a.entries.map((e) => e.operation)).toEqual(["research:reason", "research:verify"]);
    expect(b.entries.map((e) => e.operation)).toEqual(["agent:turn"]);
  });
});
