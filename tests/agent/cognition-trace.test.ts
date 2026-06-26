// The live cognition trace — structured step events (tests/agent/cognition-trace.test.ts)
//
// runAgent streams `step` events for the UI's thinking trace. After a tax_research call it now emits the
// STRUCTURED steps the design renders: "Researching" with authority-family chips (IRC / CFR / IRS / …) and
// "Reading" with the citations read — derived from the SAME public citations the answer surfaces as Sources.
// Proven with a scripted seam + a stubbed tax_research (offline, no key).

import { describe, it, expect, afterEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { runAgent, type ModelSeam, type AgentEvent } from "../../lib/agent/runner";
import { TOOL_BY_NAME, type AgentTool } from "../../lib/agent/registry";

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

const origResearch = TOOL_BY_NAME.get("tax_research")!.run as AgentTool["run"];
afterEach(() => { TOOL_BY_NAME.get("tax_research")!.run = origResearch; });

describe("cognition trace — structured research steps", () => {
  it("emits Researching (authority-family chips) + Reading (citation chips) from tax_research citations", async () => {
    TOOL_BY_NAME.get("tax_research")!.run = async () => ({
      bucket: "answer",
      answer: "The 2026 SALT cap is $40,000.",
      citations: [
        { cite: "IRC §164(b)(6)", sourceUrl: "https://x", authority: "statute" },
        { cite: "Treas. Reg. §1.164-1", sourceUrl: "https://x", authority: "regulation" },
        { cite: "Rev. Rul. 2020-1", sourceUrl: "https://x", authority: "ruling" },
      ],
    });

    const events: AgentEvent[] = [];
    await runAgent("what is the SALT cap for 2026", [], {
      scope: "synthetic",
      model: scriptedSeam([
        { tools: [{ name: "tax_research", input: { question: "SALT cap 2026" } }] },
        { text: "The 2026 SALT cap is $40,000." },
      ]),
      onEvent: (e) => events.push(e),
    });

    const steps = events.filter((e): e is Extract<AgentEvent, { type: "step" }> => e.type === "step");
    const researching = steps.find((s) => s.label === "Researching");
    const reading = steps.find((s) => s.label === "Reading");

    // Researching → distinct authority families, all in the "analyzing" phase.
    expect(researching?.phase).toBe("analyzing");
    expect(researching?.chipKind).toBe("authority");
    expect(researching?.chips).toEqual(expect.arrayContaining(["IRC", "CFR", "IRS"]));

    // Reading → the citations read, shortened to their section where possible.
    expect(reading?.chipKind).toBe("citation");
    expect(reading?.chips).toEqual(expect.arrayContaining(["§164(b)(6)", "§1.164-1"]));

    // the research pulse fired in the analyzing phase, and the trace is grouped (phase set on steps)
    expect(steps.some((s) => s.label === "Searching the tax code, regulations, and rulings" && s.phase === "analyzing")).toBe(true);
  });

  it("a non-research turn emits no chip steps (a plain lookup stays a plain step)", async () => {
    const events: AgentEvent[] = [];
    // find_client is stubbed offline by the shared registry default in other tests; here it is unstubbed,
    // so we only assert the SHAPE: no chip-bearing steps appear for a turn that never researched.
    await runAgent("hello", [], {
      scope: "synthetic",
      model: scriptedSeam([{ text: "Hi there." }]),
      onEvent: (e) => events.push(e),
    });
    const steps = events.filter((e): e is Extract<AgentEvent, { type: "step" }> => e.type === "step");
    expect(steps.every((s) => !s.chips)).toBe(true);
  });
});
