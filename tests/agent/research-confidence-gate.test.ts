import { describe, it, expect, afterAll } from "vitest";
import { z } from "zod";
import { runSubAgent, type ToolModel, type ModelResponse } from "../../lib/agent/runtime";
import { TOOL_BY_NAME, type AgentTool } from "../../lib/agent/registry";

// INTEGRATION: a low-confidence research/recon answer earlier in the agent loop must DEMOTE a later
// tier-3 confirm-lane write to mandatory review (the risk gate's confidence signal, threaded through
// runtime). Before the wire, classifyRisk was called without signals and a hedging answer never raised
// the lane — the single most dangerous built-not-wired gap the scorecard flagged.

let researchBucket = "coverage_gap"; // toggled per test
const researchTool: AgentTool = {
  name: "__test_research", description: "returns a calibrated research answer", tier: 1, access: "read",
  requiredScopes: [], schema: z.object({ q: z.string() }),
  run: async () => ({ bucket: researchBucket, answer: "…", citations: [] }), // a SourcedAnswer-shaped result
  describe: (a) => `research: ${a.q}`,
};
// A tier-3 INTERNAL write (low stakes, reversible) → base lane "confirm"; the only thing that can raise
// it to "review" is the upstream confidence signal.
const internalWrite: AgentTool = {
  name: "__test_internal_write", description: "a reversible internal tier-3 write", tier: 3, access: "write",
  reversible: true, connector: "internal", stakes: "low",
  requiredScopes: [], schema: z.object({ note: z.string() }),
  run: async () => { throw new Error("staged write must never run inline"); },
  describe: (a) => `internal write: ${a.note}`,
};
TOOL_BY_NAME.set(researchTool.name, researchTool);
TOOL_BY_NAME.set(internalWrite.name, internalWrite);
afterAll(() => { TOOL_BY_NAME.delete(researchTool.name); TOOL_BY_NAME.delete(internalWrite.name); });

// Scripted model: turn 0 → research read; turn 1 → internal write; turn 2 → final reply.
function researchThenWrite(): ToolModel {
  let turn = 0;
  return {
    async call(): Promise<ModelResponse> {
      const u = { inputTokens: 1, outputTokens: 1 };
      const t = turn++; // capture pre-increment so each turn maps to exactly one response
      if (t === 0) return { content: [{ type: "tool_use", id: "r1", name: "__test_research", input: { q: "is X deductible in 2026?" } }], stopReason: "tool_use", usage: u };
      if (t === 1) return { content: [{ type: "tool_use", id: "w1", name: "__test_internal_write", input: { note: "apply the position" } }], stopReason: "tool_use", usage: u };
      return { content: [{ type: "text", text: JSON.stringify({ reply: "staged for approval" }) }], stopReason: "end_turn", usage: u };
    },
  };
}

const runArgs = { role: "tester", system: "s", tools: [researchTool, internalWrite], input: "go", outputSchema: z.object({ reply: z.string() }), taxScope: "synthetic" as const };

describe("risk gate — research confidence threads into staged writes", () => {
  it("a COVERAGE_GAP research answer demotes the confirm-lane write to mandatory review", async () => {
    researchBucket = "coverage_gap";
    const res = await runSubAgent(runArgs, { model: researchThenWrite() });
    expect(res.proposals.length).toBe(1);
    expect(res.proposals[0].risk?.lane).toBe("review");
    expect(res.proposals[0].risk?.factors.some((f) => f.name === "confidence")).toBe(true);
  });

  it("an ANSWER (high-confidence) research result leaves the write at confirm", async () => {
    researchBucket = "answer";
    const res = await runSubAgent(runArgs, { model: researchThenWrite() });
    expect(res.proposals.length).toBe(1);
    expect(res.proposals[0].risk?.lane).toBe("confirm"); // not demoted
  });
});
