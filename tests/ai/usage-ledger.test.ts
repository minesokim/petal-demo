import { describe, it, expect, beforeEach } from "vitest";
import { recordUsage, resetLedger, ledgerTotals, repriceAt } from "@/lib/ai/usage-ledger";

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
});
