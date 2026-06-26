// The risk gate on the LIVE agent path (runAgent) — tests/agent/live-risk-gate.test.ts
//
// runAgent (the /api/agent entry point) stages tier-3 writes as proposedActions. It used to stage
// them RAW — no risk classification — so the spec's core safety rule ("classify each action by
// reversibility × stakes × connector × confidence; low-confidence → mandatory line-by-line review")
// never ran on the live path; it lived only in runSubAgent. These tests prove, with a scripted seam
// + a stubbed tax_research calibration (fully offline, no key), that the gate is now on the live path:
//   - a coverage_gap research result DEMOTES a staged create_task from one-click "confirm" to "review";
//   - a grounded research result leaves the same write at "confirm";
//   - every staged write carries a risk assessment (lane + factors) the UI/review artifact can render.

import { describe, it, expect, afterEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { runAgent, type ModelSeam } from "../../lib/agent/runner";
import { TOOL_BY_NAME } from "../../lib/agent/registry";

function scriptedSeam(turns: ({ tools: { name: string; input: unknown }[] } | { text: string })[]): ModelSeam {
  let i = 0;
  return async (): Promise<Anthropic.Message> => {
    const turn = turns[Math.min(i, turns.length - 1)];
    i++;
    if ("tools" in turn) {
      return {
        id: "msg", type: "message", role: "assistant", model: "claude-opus-4-8",
        stop_reason: "tool_use", stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } as never,
        content: turn.tools.map((t, k) => ({ type: "tool_use", id: `tu_${i}_${k}`, name: t.name, input: t.input })),
      } as unknown as Anthropic.Message;
    }
    return {
      id: "msg", type: "message", role: "assistant", model: "claude-opus-4-8",
      stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } as never,
      content: [{ type: "text", text: turn.text }],
    } as unknown as Anthropic.Message;
  };
}

const origResearch = TOOL_BY_NAME.get("tax_research")!.run;
afterEach(() => { TOOL_BY_NAME.get("tax_research")!.run = origResearch; });
function stubResearch(calibration: string) {
  TOOL_BY_NAME.get("tax_research")!.run = async () => ({ calibration, answer: "see authority", citations: [] });
}

const SYNTH = { scope: "synthetic" as const };
// research → stage a tier-3 internal write (create_task: base lane "confirm", so a confidence
// demotion to "review" is observable).
const flow = () => scriptedSeam([
  { tools: [{ name: "tax_research", input: { question: "is the home-office deduction allowed for an employee in 2025?" } }] },
  { tools: [{ name: "create_task", input: { householdId: "h-1", title: "Follow up on home-office deduction" } }] },
  { text: "I've staged a task for your confirmation." },
]);

describe("risk gate on the LIVE agent path (runAgent)", () => {
  it("a coverage_gap research result demotes a staged write to mandatory line-by-line review", async () => {
    stubResearch("coverage_gap");
    const { proposedActions } = await runAgent("research the rule then make a follow-up task", [], { ...SYNTH, model: flow() });
    expect(proposedActions).toHaveLength(1);
    expect(proposedActions[0].tool).toBe("create_task");
    expect(proposedActions[0].risk?.lane).toBe("review");
    expect(proposedActions[0].risk?.factors.some((f) => f.name === "confidence")).toBe(true);
  });

  it("a grounded research result leaves the same write at one-click confirm", async () => {
    stubResearch("grounded");
    const { proposedActions } = await runAgent("research the rule then make a follow-up task", [], { ...SYNTH, model: flow() });
    expect(proposedActions[0].risk?.lane).toBe("confirm");
    expect(proposedActions[0].risk?.factors.some((f) => f.name === "confidence")).toBe(false);
  });

  it("every staged write carries a risk assessment for the evidenced review artifact", async () => {
    stubResearch("grounded");
    const { proposedActions } = await runAgent("make a follow-up task", [], { ...SYNTH, model: flow() });
    expect(proposedActions[0].risk).toBeDefined();
    expect(proposedActions[0].risk!.factors.length).toBeGreaterThan(0);
  });
});
