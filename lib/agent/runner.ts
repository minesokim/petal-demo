// Agentic Petal — the tool-use loop. Runs a ZDR model with the tool registry: it can READ
// firm state freely (reads auto-execute), but every WRITE is STAGED, not run — staged
// actions come back as `proposedActions` for the preparer to confirm. This is the safety
// contract: Petal can look at everything and propose anything, but mutates nothing without
// an explicit confirmation. §7216: operates on real firm data, gated by the caller's scope.

import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { assertZdrModel, assertCleared, type DataScope } from "@/lib/ai/guard";
import { redactText } from "@/lib/ai/redact";
import { ALL_TOOLS as TOOLS, TOOL_BY_NAME } from "./registry";

const AGENT_MODEL = "claude-sonnet-4-6"; // ZDR-eligible
const MAX_TURNS = 6;

const AGENT_SYSTEM = `You are Petal, operating a US tax practice's app on the preparer's behalf.
Use the tools to read the firm's state and to PROPOSE changes.
- READ tools (list_clients, list_tasks) run immediately — use them to find the right id before acting. NEVER invent an id.
- WRITE tools (create_client, create_task, set_task_status, mark_task_done, approve_task, request_documents, resolve_notice) are STAGED, not executed: after you call one it is pending the preparer's confirmation. Do NOT claim it is done.
- After staging the needed writes, give a short reply telling the preparer exactly what you've staged for them to confirm. If a request is ambiguous or you can't find the id, ask rather than guess.`;

export type ProposedAction = { tool: string; args: Record<string, unknown>; title: string };
export type AgentTurn = { role: "user" | "assistant"; content: string };

export async function runAgent(
  message: string,
  history: AgentTurn[] = [],
  opts: { scope?: DataScope } = {},
): Promise<{ reply: string; proposedActions: ProposedAction[] }> {
  assertZdrModel(AGENT_MODEL);
  assertCleared(opts.scope ?? "real"); // operating over real firm data; gated by PETAL_7216_CLEARED
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const client = new Anthropic({ apiKey });

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
    const res = await client.messages.create({ model: AGENT_MODEL, max_tokens: 1200, system: AGENT_SYSTEM, tools, messages });
    const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("").trim();
    if (text) reply = text;

    const toolUses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || toolUses.length === 0) break;

    messages.push({ role: "assistant", content: res.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const tool = TOOL_BY_NAME.get(tu.name);
      if (!tool) { results.push({ type: "tool_result", tool_use_id: tu.id, content: "unknown tool", is_error: true }); continue; }
      const parsed = tool.schema.safeParse(tu.input ?? {});
      if (!parsed.success) { results.push({ type: "tool_result", tool_use_id: tu.id, content: `invalid args: ${parsed.error.message.slice(0, 300)}`, is_error: true }); continue; }
      const args = parsed.data as Record<string, unknown>;
      if (tool.access === "read") {
        try {
          const out = await tool.run(args);
          results.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(out).slice(0, 6000) });
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
