// Agentic Petal — THE unified, model-driven intent loop. Every Ask Petal message lands here:
// there is NO trigger-word routing in the client. The model is the brain — from the user's
// natural language it decides what to do (look up a client, draft a message, create a client or
// task, request documents, research a tax question, compute a figure) and does it, weaving the
// tool results (the client it found, the citations, the computed figure) into a direct answer.
//
// Safety contract (unchanged): the model can READ everything (reads auto-execute — find_client,
// get_client_detail, tax_research, tax_compute, draft_email, list_*) but mutates NOTHING. Every
// external WRITE (send_sms, create_client, create_task, request_documents, …) is STAGED into
// proposedActions for the preparer to confirm — never executed inside the loop. §7216: operates
// on real firm data, gated by the caller's scope; read-tool output is redacted before it
// re-enters the model context (HIGH-5).

import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { assertZdrModel, assertCleared, type DataScope } from "@/lib/ai/guard";
import { redactText, redactValue } from "@/lib/ai/redact";
import { ALL_TOOLS as TOOLS, TOOL_BY_NAME } from "./registry";

const AGENT_MODEL = "claude-sonnet-4-6"; // ZDR-eligible
// Raised to 8 so a lookup → act chain (find_client → get_client_detail → stage a write) has
// room to complete in a single turn without truncation.
const MAX_TURNS = 8;

const AGENT_SYSTEM = `You are Petal, an AI-native assistant for a tax firm. From the user's natural language, decide what to do — look up a client, draft/send a message, create a client or task, request documents, research a tax question (always cited), or compute a figure — and do it. NEVER require specific keywords.
- READ tools (find_client, get_client_detail, list_clients, list_tasks, tax_research, tax_compute, draft_email) run immediately — use them to resolve a person to a client, ground a reply in real state, cite a rule, or compute a figure. To act on a client named in natural language, call find_client FIRST to resolve the householdId — NEVER invent an id.
- Weave the tool results into a direct answer: when you research, state the rule and keep its citations; when you compute, state the figure; when you found a client, name them.
- Stage any external WRITE (send_sms, draft-then-send, create_client, create_task, set_task_status, mark_task_done, approve_task, request_documents, resolve_notice) for one-click confirmation — it is STAGED pending the preparer's confirmation, NOT done. Never act without it. draft_email and tax_* are reads (no confirmation needed); only the actual SMS/create/request writes are staged.
- After staging the needed writes, give a short reply telling the preparer exactly what you've staged. If a request is ambiguous or you can't find the id, ask rather than guess.`;

export type ProposedAction = { tool: string; args: Record<string, unknown>; title: string };
export type AgentTurn = { role: "user" | "assistant"; content: string };

// ── The model seam ────────────────────────────────────────────────────────────────────────────
// The loop talks to the model through this one function so a test can script the turns (no
// network, no key) exactly as runtime.ts does with ToolModel. The default seam wraps the real
// ZDR Anthropic client. A scripted seam returns canned message responses turn-by-turn.
export type ModelSeam = (
  messages: Anthropic.MessageParam[],
  tools: Anthropic.Tool[],
) => Promise<Anthropic.Message>;

function anthropicSeam(apiKey: string): ModelSeam {
  const client = new Anthropic({ apiKey });
  return (messages, tools) =>
    client.messages.create({ model: AGENT_MODEL, max_tokens: 1200, system: AGENT_SYSTEM, tools, messages });
}

export async function runAgent(
  message: string,
  history: AgentTurn[] = [],
  opts: { scope?: DataScope; model?: ModelSeam } = {},
): Promise<{ reply: string; proposedActions: ProposedAction[] }> {
  assertZdrModel(AGENT_MODEL);
  assertCleared(opts.scope ?? "real"); // operating over real firm data; gated by PETAL_7216_CLEARED

  let seam = opts.model;
  if (!seam) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    seam = anthropicSeam(apiKey);
  }

  const tools: Anthropic.Tool[] = TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: zodToJsonSchema(t.schema, { target: "openApi3" }) as Anthropic.Tool.InputSchema,
  }));

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-8).map((h) => ({ role: h.role, content: redactText(h.content) })),
    { role: "user", content: redactText(message) },
  ];

  const proposedActions: ProposedAction[] = [];
  let reply = "";

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const res = await seam(messages, tools);
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (text) reply = text;

    const toolUses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || toolUses.length === 0) break;

    messages.push({ role: "assistant", content: res.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const tool = TOOL_BY_NAME.get(tu.name);
      if (!tool) {
        results.push({ type: "tool_result", tool_use_id: tu.id, content: "unknown tool", is_error: true });
        continue;
      }
      const parsed = tool.schema.safeParse(tu.input ?? {});
      if (!parsed.success) {
        results.push({ type: "tool_result", tool_use_id: tu.id, content: `invalid args: ${parsed.error.message.slice(0, 300)}`, is_error: true });
        continue;
      }
      const args = parsed.data as Record<string, unknown>;
      if (tool.access === "read") {
        try {
          const out = await tool.run(args);
          // HIGH-5: redact read-tool output BEFORE it re-enters the model context (client
          // records / SSN-shaped strings must not re-enter the live model — §7216/INV-4).
          results.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(redactValue(out)).slice(0, 6000) });
        } catch (e) {
          results.push({ type: "tool_result", tool_use_id: tu.id, content: `error: ${e instanceof Error ? e.name : "unknown"}`, is_error: true });
        }
      } else {
        // WRITE — stage it, do NOT execute.
        proposedActions.push({ tool: tu.name, args, title: tool.describe(args) });
        results.push({ type: "tool_result", tool_use_id: tu.id, content: `STAGED pending the preparer's confirmation: ${tool.describe(args)}. It is NOT done yet.` });
      }
    }
    messages.push({ role: "user", content: results });
  }

  return { reply: reply || (proposedActions.length ? "I've staged those for your confirmation." : "Done."), proposedActions };
}
