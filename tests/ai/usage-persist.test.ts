import { describe, it, expect, beforeEach } from "vitest";
import { recordUsage, resetLedger } from "@/lib/ai/usage-ledger";
import { flushUsage, entriesToRows, type PersistRow } from "@/lib/ai/usage-persist";

describe("usage persist", () => {
  beforeEach(() => resetLedger());

  it("shapes ledger entries into firm-tagged rows", () => {
    recordUsage({ operation: "research:reason", model: "claude-opus-4-8", usage: { inputTokens: 1000, outputTokens: 200, cacheReadTokens: 50 } });
    const rows = entriesToRows([{ operation: "research:reason", model: "claude-opus-4-8", usage: { inputTokens: 1000, outputTokens: 200, cacheReadTokens: 50 }, costUsd: 0.03 }], "firm-1", "run-9");
    expect(rows[0]).toMatchObject({ firmId: "firm-1", runId: "run-9", operation: "research:reason", inputTokens: 1000, cacheReadTokens: 50, costUsd: 0.03 });
  });

  it("flushes the ledger via the writer and then resets it", async () => {
    recordUsage({ operation: "agent:turn", model: "claude-opus-4-8", usage: { inputTokens: 500, outputTokens: 100 } });
    recordUsage({ operation: "research:reason", model: "claude-sonnet-4-6", usage: { inputTokens: 800, outputTokens: 150 } });
    const written: PersistRow[] = [];
    const n = await flushUsage(async (rows) => { written.push(...rows); }, "firm-1");
    expect(n).toBe(2);
    expect(written.map((r) => r.operation)).toEqual(["agent:turn", "research:reason"]);
    // ledger was reset → a second flush writes nothing
    const again = await flushUsage(async () => { throw new Error("should not be called"); }, "firm-1");
    expect(again).toBe(0);
  });
});
