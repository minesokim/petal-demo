// Streamed thinking events — runAgent.onEvent (tests/agent/runner-events.test.ts)
//
// CHANGE 1 wired a best-effort onEvent({type:"step", label}) hook into the agent loop so the UI
// can render a live, Claude-style thinking trace. These tests prove, with a SCRIPTED model seam
// (no network, no key), that:
//   - a lookup → stage flow fires the steps IN ORDER: "Thinking" (the pre-model step), then the
//     find_client label ("Looking up …"), then the send_sms label ("Preparing a text to …").
//   - labelFor maps tool + args → the human, present-tense labels in the EVENT CONTRACT (never
//     raw tool names).
//   - the FINAL return value (reply + proposedActions) is UNCHANGED by the onEvent addition.
//
// §7216: runAgent is invoked with scope "synthetic" so assertCleared passes offline. The heavy
// read tool (find_client) is stubbed on the registry so the loop runs fully offline.

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { runAgent, labelFor, type ModelSeam, type AgentEvent } from "../../lib/agent/runner";
import { TOOL_BY_NAME, type AgentTool } from "../../lib/agent/registry";

function scriptedSeam(
  turns: ({ tools: { name: string; input: unknown }[] } | { text: string })[],
): ModelSeam {
  let i = 0;
  return async (): Promise<Anthropic.Message> => {
    const turn = turns[Math.min(i, turns.length - 1)];
    i++;
    if ("tools" in turn) {
      return {
        id: "msg", type: "message", role: "assistant", model: "claude-opus-4-8",
        stop_reason: "tool_use", stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 } as never,
        content: turn.tools.map((t, k) => ({ type: "tool_use", id: `tu_${i}_${k}`, name: t.name, input: t.input })),
      } as unknown as Anthropic.Message;
    }
    return {
      id: "msg", type: "message", role: "assistant", model: "claude-opus-4-8",
      stop_reason: "end_turn", stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 } as never,
      content: [{ type: "text", text: turn.text }],
    } as unknown as Anthropic.Message;
  };
}

const originals = new Map<string, AgentTool["run"]>();
function stubRead(name: string, fake: (args: Record<string, unknown>) => unknown) {
  const tool = TOOL_BY_NAME.get(name)!;
  originals.set(name, tool.run);
  tool.run = async (args) => fake(args);
}

beforeEach(() => {
  stubRead("find_client", () => ({
    matches: [{ id: "h-haokun", name: "Haokun Li", contacts: [{ name: "Haokun Li", email: "haokun@example.com" }] }],
  }));
});

afterEach(() => {
  for (const [name, run] of originals) TOOL_BY_NAME.get(name)!.run = run;
  originals.clear();
});

const SYNTH = { scope: "synthetic" as const };

describe("runAgent onEvent — the streamed thinking trace", () => {
  it("fires step labels IN ORDER for a lookup → stage flow, and the return is unchanged", async () => {
    const seam = scriptedSeam([
      { tools: [{ name: "find_client", input: { query: "Haokun" } }] },
      { tools: [{ name: "send_sms", input: { householdId: "h-haokun", body: "Hi Haokun, please send your W-2." } }] },
      { text: "I've staged a text to Haokun for your confirmation." },
    ]);

    const events: AgentEvent[] = [];
    const { reply, proposedActions } = await runAgent(
      "text Haokun and ask for the missing W-2",
      [],
      { ...SYNTH, model: seam, onEvent: (e) => events.push(e) },
    );

    const labels = events.map((e) => e.label);
    // First: the generic pre-model "Thinking" step. Then the human label for each tool as it
    // fires — find_client → "Looking up …", send_sms → "Preparing a text to …". Never tool names.
    expect(labels[0]).toBe("Thinking");
    expect(labels[1]).toBe("Looking up Haokun");
    expect(labels[2]).toMatch(/^Preparing a text to /);
    expect(labels).not.toContain("find_client");
    expect(labels).not.toContain("send_sms");

    // The FINAL return is exactly what it was before onEvent existed.
    expect(proposedActions.map((p) => p.tool)).toEqual(["send_sms"]);
    expect(proposedActions[0].args.householdId).toBe("h-haokun");
    expect(reply).toMatch(/staged/i);
  });

  it("onEvent is best-effort: a throwing listener never breaks the loop or the return", async () => {
    const seam = scriptedSeam([
      { tools: [{ name: "find_client", input: { query: "Haokun" } }] },
      { text: "Found Haokun Li." },
    ]);

    const { reply } = await runAgent("look up Haokun", [], {
      ...SYNTH,
      model: seam,
      onEvent: () => { throw new Error("listener blew up"); },
    });

    expect(reply).toMatch(/Haokun/);
  });
});

describe("labelFor — tool + args → human, present-tense labels (EVENT CONTRACT)", () => {
  const name = (hid: unknown) => (hid === "h-1" ? "Haokun Li" : undefined);

  it("maps each tool to its contract label", () => {
    expect(labelFor("find_client", { query: "Marcus" })).toBe("Looking up Marcus");
    expect(labelFor("get_client_detail", { householdId: "h-1" })).toBe("Reading the client record");
    expect(labelFor("tax_research", { question: "what is the SALT cap for 2026" })).toMatch(/^Researching /);
    expect(labelFor("tax_compute", {})).toBe("Computing the figure");
    expect(labelFor("draft_email", {})).toBe("Drafting the email");
    expect(labelFor("send_sms", { householdId: "h-1" }, name)).toBe("Preparing a text to Haokun Li");
    expect(labelFor("send_email", {})).toBe("Preparing the email");
    expect(labelFor("create_task", {})).toBe("Setting that up");
  });

  it("send_sms falls back to 'the client' when the name can't be resolved", () => {
    expect(labelFor("send_sms", { householdId: "h-unknown" }, name)).toBe("Preparing a text to the client");
  });

  it("an unmapped tool falls back to a safe generic label (never a raw tool name)", () => {
    expect(labelFor("some_new_tool", {})).toBe("Working on it");
  });
});
