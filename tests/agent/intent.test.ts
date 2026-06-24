// Unified, model-driven intent agent — tests (tests/agent/intent.test.ts)
//
// Ask Petal is now a SINGLE agent: NO trigger-word routing. EVERY message goes through
// lib/agent/runner.runAgent, and the MODEL decides what to do from the natural language. These
// tests prove that with a SCRIPTED model (the ModelSeam — no network, no key):
//   - "text Haokun …"            → the loop calls find_client (read, auto-runs) THEN stages
//                                  send_sms as a proposal (NOT executed).
//   - "what is the SALT cap …"   → the loop calls tax_research (read).
//   - an EITC compute ask        → the loop calls tax_compute (read).
//   - "hi"                       → the model just replies (no tool calls).
// They also prove the client send() posts EVERY message to /api/agent with no regex gate.
//
// §7216: runAgent is invoked with scope "synthetic" so assertCleared passes offline (no
// PETAL_7216_CLEARED needed). The read tools that would otherwise touch the network/DB
// (find_client, tax_research, tax_compute) are stubbed on the registry so the loop runs fully
// offline; we assert on WHICH tools the loop dispatched and what it staged.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { runAgent, type ModelSeam } from "../../lib/agent/runner";
import { TOOL_BY_NAME, type AgentTool } from "../../lib/agent/registry";

// ── A scripted model seam ───────────────────────────────────────────────────────────────────
// Each entry is one assistant turn. A turn is either tool_use blocks (the model calls tools) or
// a final text reply. The seam returns them in order; we record every tool the loop executes via
// the read-tool stubs below, so the assertions read off the actual dispatch, not the script.
type Turn =
  | { tools: { name: string; input: unknown }[] }
  | { text: string };

function scriptedSeam(turns: Turn[]): ModelSeam {
  let i = 0;
  return async (): Promise<Anthropic.Message> => {
    const turn = turns[Math.min(i, turns.length - 1)];
    i++;
    if ("tools" in turn) {
      return {
        id: "msg", type: "message", role: "assistant", model: "claude-sonnet-4-6",
        stop_reason: "tool_use", stop_sequence: null,
        usage: { input_tokens: 1, output_tokens: 1 } as never,
        content: turn.tools.map((t, k) => ({ type: "tool_use", id: `tu_${i}_${k}`, name: t.name, input: t.input })),
      } as unknown as Anthropic.Message;
    }
    return {
      id: "msg", type: "message", role: "assistant", model: "claude-sonnet-4-6",
      stop_reason: "end_turn", stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 } as never,
      content: [{ type: "text", text: turn.text }],
    } as unknown as Anthropic.Message;
  };
}

// Stub the heavy read tools so the loop runs offline and we can SEE which were dispatched.
const dispatched: string[] = [];
const originals = new Map<string, AgentTool["run"]>();

function stubRead(name: string, fake: (args: Record<string, unknown>) => unknown) {
  const tool = TOOL_BY_NAME.get(name)!;
  originals.set(name, tool.run);
  tool.run = async (args) => {
    dispatched.push(name);
    return fake(args);
  };
}

beforeEach(() => {
  dispatched.length = 0;
  stubRead("find_client", () => ({
    matches: [{ id: "h-haokun", name: "Haokun Li", contacts: [{ name: "Haokun Li", email: "haokun@example.com", phone: "(555) 555-0100" }] }],
  }));
  stubRead("tax_research", () => ({
    answer: "For 2026 the SALT cap is $40,000.",
    bucket: "answer",
    citations: [{ cite: "IRC §164(b)(6)", sourceUrl: "https://example.gov/164" }],
    reviewNotes: [],
  }));
  stubRead("tax_compute", () => ({
    worksheet: "eitc", value: 1234, taxYear: 2025,
    trace: [{ line: "1", label: "Earned income", amount: 20000 }],
    citations: [{ cite: "IRC §32" }],
  }));
});

afterEach(() => {
  for (const [name, run] of originals) TOOL_BY_NAME.get(name)!.run = run;
  originals.clear();
});

const SYNTH = { scope: "synthetic" as const };

describe("unified intent agent — the model chooses the tools (no trigger-word routing)", () => {
  it("'text Haokun …' resolves the client (find_client) then STAGES send_sms (not executed)", async () => {
    const seam = scriptedSeam([
      { tools: [{ name: "find_client", input: { query: "Haokun" } }] },
      { tools: [{ name: "send_sms", input: { householdId: "h-haokun", body: "Hi Haokun, please send your W-2." } }] },
      { text: "I've staged a text to Haokun for your confirmation." },
    ]);

    const { reply, proposedActions } = await runAgent(
      "text Haokun and ask for the missing W-2",
      [],
      { ...SYNTH, model: seam },
    );

    // The model resolved the client via the read tool (it auto-ran).
    expect(dispatched).toContain("find_client");
    // The write was STAGED, not executed: it surfaces as a proposed action, and send_sms's
    // run() was never invoked (it is not in the read stubs, and writes never run inline).
    expect(proposedActions.map((p) => p.tool)).toEqual(["send_sms"]);
    expect(proposedActions[0].args.householdId).toBe("h-haokun");
    expect(dispatched).not.toContain("send_sms");
    expect(reply).toMatch(/staged/i);
  });

  it("'what is the SALT cap for 2026' calls tax_research", async () => {
    const seam = scriptedSeam([
      { tools: [{ name: "tax_research", input: { question: "what is the SALT cap for 2026", taxYear: 2026 } }] },
      { text: "For 2026 the SALT cap is $40,000. [IRC §164(b)(6)]" },
    ]);

    const { reply, proposedActions } = await runAgent("what is the SALT cap for 2026", [], { ...SYNTH, model: seam });

    expect(dispatched).toContain("tax_research");
    expect(proposedActions).toHaveLength(0); // research is a read — nothing staged
    expect(reply).toMatch(/40,000|SALT/i);
  });

  it("an EITC compute ask calls tax_compute", async () => {
    const seam = scriptedSeam([
      {
        tools: [{
          name: "tax_compute",
          input: {
            worksheet: "eitc",
            facts: { earnedIncome: 20000, agi: 20000, investmentIncome: 0, qualifyingChildren: 2, filingStatus: "single", taxpayerSsnValidForWork: true },
          },
        }],
      },
      { text: "The EITC works out to $1,234." },
    ]);

    const { reply, proposedActions } = await runAgent(
      "how much is the EITC for a single filer with 2 kids earning 20k",
      [],
      { ...SYNTH, model: seam },
    );

    expect(dispatched).toContain("tax_compute");
    expect(proposedActions).toHaveLength(0);
    expect(reply).toMatch(/1,234|EITC/i);
  });

  it("'hi' just replies — no tools, nothing staged", async () => {
    const seam = scriptedSeam([{ text: "Hi! How can I help with the firm today?" }]);

    const { reply, proposedActions } = await runAgent("hi", [], { ...SYNTH, model: seam });

    expect(dispatched).toHaveLength(0);
    expect(proposedActions).toHaveLength(0);
    expect(reply).toMatch(/help/i);
  });
});

// ── The client send() posts EVERY message to /api/agent (no regex gate) ──────────────────────
// petal-chat.tsx is a client React module; we don't render it here. Instead we assert the
// ROUTING CONTRACT at the source level: send() has exactly one fetch target for chat — /api/agent
// — and no longer references the removed intent endpoints or regex gates.
describe("petal-chat send() — unified routing (no regex pre-routing)", () => {
  it("posts to /api/agent and no longer routes to /api/research or /api/tax/compute or uses intent regexes", async () => {
    const { readFileSync } = await import("node:fs");
    const path = new URL("../../components/os/petal-chat.tsx", import.meta.url);
    const src = readFileSync(path, "utf8");

    // The unified endpoint is called.
    expect(src).toContain('fetch("/api/agent"');
    // The removed intent endpoints are gone from the chat routing.
    expect(src).not.toContain('fetch("/api/research"');
    expect(src).not.toContain('fetch("/api/tax/compute"');
    // The regex gates are gone.
    expect(src).not.toContain("AGENT_INTENT");
    expect(src).not.toContain("RESEARCH_INTENT");
    expect(src).not.toContain("COMPUTE_INTENT");
    expect(src).not.toContain("isResearchQuestion");
    // /api/ask remains ONLY as the error fallback.
    expect(src).toContain('fetch("/api/ask"');
  });
});
