// Focused smoke for the codex seam: proves the Anthropic-shape ↔ OpenAI-proxy adapter round-trips
// BOTH ways against the live GPT-5.5 proxy — turn 1 the model emits a tool_use (translated from
// OpenAI tool_calls), turn 2 it consumes a tool_result (translated to a role:"tool" message) and
// streams a final answer. No runner/server-only entanglement (the seam imports runner as a type only).
import { codexSeam } from "../lib/agent/codex-seam";
import type Anthropic from "@anthropic-ai/sdk";

const system =
  "You are a tax assistant. To answer what a tax figure IS, you MUST call the lookup_param tool first; never state a figure from memory. After the tool returns, give a one-sentence answer using its value.";
const tools: Anthropic.Tool[] = [
  {
    name: "lookup_param",
    description: "Look up a settled tax figure by key. Returns the value and its source cite.",
    input_schema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } as Anthropic.Tool.InputSchema,
  },
];

const seam = codexSeam(system);
const messages: Anthropic.MessageParam[] = [{ role: "user", content: "What is the SALT deduction cap for 2026?" }];

let d1 = "";
const r1 = await seam(messages, tools, (d) => { d1 += d; });
const toolUse = r1.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
console.log("turn1 stop_reason:", r1.stop_reason);
console.log("turn1 tool_use:", toolUse ? `${toolUse.name}(${JSON.stringify(toolUse.input)})` : "(none — model answered directly)");

if (toolUse) {
  messages.push({ role: "assistant", content: r1.content });
  messages.push({
    role: "user",
    content: [{ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify({ value: "$40,000", source: "OBBBA §70120 (2025)" }) }],
  });
  let d2 = "";
  const r2 = await seam(messages, tools, (d) => { d2 += d; });
  const txt = r2.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  console.log("\nturn2 stop_reason:", r2.stop_reason, "| streamed live:", d2.length, "chars");
  console.log("turn2 FINAL ANSWER:\n" + txt);
}
