import OpenAI from "openai";
import type Anthropic from "@anthropic-ai/sdk";
import type { ModelSeam } from "./runner";
import { recordUsage } from "@/lib/ai/usage-ledger";

// DEV-ONLY agent-loop seam: runs Petal's model-driven tool loop on an OpenAI-compatible endpoint
// (the local GPT-5.5 Codex proxy) instead of Anthropic, so localhost can evaluate "the codex
// version" of the product end-to-end — the brain, not just the research/draft tools.
//
// SAFETY: selected ONLY by the runner when usingDevCodexProvider() is true, which REQUIRES
// !isDeployed(). It can never run on the deployed server. It is a non-ZDR consumer endpoint, so it
// must only ever see SYNTHETIC/demo data — the same boundary the OpenAIProvider enforces (and which
// the provider factory + the OpenAI constructor's own deploy-throw back-stop). assertZdrModel is
// intentionally NOT asserted for this path (gpt-5.5 is not an Anthropic ZDR model; the boundary here
// is "dev + synthetic only", per lib/ai/openai.ts).
//
// The two runtimes speak different tool-calling dialects, so this adapter translates BOTH ways:
//   loop → proxy:  Anthropic MessageParam[] (text + tool_use blocks; tool_result blocks in a user
//                  turn) → OpenAI messages (assistant.tool_calls; separate role:"tool" messages).
//   proxy → loop:  OpenAI chat completion (content + tool_calls; finish_reason) → a minimal
//                  Anthropic.Message (content blocks + stop_reason) that the loop reads unchanged.

type OAMessage = OpenAI.Chat.ChatCompletionMessageParam;

// Anthropic message history → OpenAI chat messages. The system prompt is prepended (the loop keeps
// it inside the seam, exactly like anthropicSeam closes over AGENT_SYSTEM).
function toOpenAIMessages(system: string, messages: Anthropic.MessageParam[]): OAMessage[] {
  const out: OAMessage[] = [{ role: "system", content: system }];
  for (const m of messages) {
    if (typeof m.content === "string") {
      out.push({ role: m.role, content: m.content } as OAMessage);
      continue;
    }
    if (m.role === "assistant") {
      // An assistant turn is optional prose + one or more tool_use blocks.
      let text = "";
      const toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[] = [];
      for (const b of m.content) {
        if (b.type === "text") text += b.text;
        else if (b.type === "tool_use") {
          toolCalls.push({ id: b.id, type: "function", function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) } });
        }
      }
      const msg: OpenAI.Chat.ChatCompletionAssistantMessageParam = { role: "assistant", content: text || null };
      if (toolCalls.length) msg.tool_calls = toolCalls;
      out.push(msg);
    } else {
      // A user turn carries either text or tool_result blocks. OpenAI wants each tool result as its
      // own role:"tool" message keyed by the originating tool_call id.
      for (const b of m.content) {
        if (b.type === "tool_result") {
          const c = b.content;
          const content =
            typeof c === "string"
              ? c
              : Array.isArray(c)
                ? c.map((x) => (x.type === "text" ? x.text : "")).join("")
                : "";
          out.push({ role: "tool", tool_call_id: b.tool_use_id, content });
        } else if (b.type === "text") {
          out.push({ role: "user", content: b.text });
        }
      }
    }
  }
  return out;
}

function toOpenAITools(tools: Anthropic.Tool[]): OpenAI.Chat.ChatCompletionTool[] {
  return tools.map((t) => ({
    type: "function",
    function: { name: t.name, description: t.description ?? "", parameters: t.input_schema as Record<string, unknown> },
  }));
}

function parseArgs(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {}; // malformed args → empty; the tool's zod safeParse rejects it → model recovers
  }
}

export function codexSeam(system: string): ModelSeam {
  const client = new OpenAI({
    baseURL: process.env.PETAL_DEV_OPENAI_BASE_URL ?? "http://127.0.0.1:8317/v1",
    apiKey: process.env.PETAL_DEV_OPENAI_KEY ?? "codex-proxy",
  });
  const model = process.env.PETAL_DEV_OPENAI_MODEL ?? "gpt-5.5";
  const reasoning_effort = process.env.PETAL_DEV_OPENAI_REASONING ?? "high";

  return async (messages, tools, onTextDelta) => {
    const params = {
      model,
      messages: toOpenAIMessages(system, messages),
      tools: toOpenAITools(tools),
      max_completion_tokens: 3000,
      reasoning_effort,
    };

    let text = "";
    // tool_calls assembled by streaming index (deltas arrive fragmented: id, then name, then args).
    const calls = new Map<number, { id: string; name: string; args: string }>();
    // Real token usage for the cost meter (the agent-OS lane). prompt_tokens is cache-inclusive.
    let usageInput = 0, usageOutput = 0, usageCached = 0;
    const capture = (u?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } } | null) => {
      if (!u) return;
      usageCached = u.prompt_tokens_details?.cached_tokens ?? 0;
      usageInput = Math.max(0, (u.prompt_tokens ?? 0) - usageCached);
      usageOutput = u.completion_tokens ?? 0;
    };

    if (onTextDelta) {
      const stream = (await client.chat.completions.create({ ...params, stream: true, stream_options: { include_usage: true } } as never)) as unknown as AsyncIterable<{
        choices?: { delta?: { content?: string | null; tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[] } }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } } | null;
      }>;
      for await (const chunk of stream) {
        if (chunk.usage) capture(chunk.usage); // final chunk carries usage (include_usage)
        const d = chunk.choices?.[0]?.delta;
        if (!d) continue;
        if (typeof d.content === "string" && d.content) {
          text += d.content;
          try { onTextDelta(d.content); } catch { /* best-effort; never break the loop */ }
        }
        for (const tc of d.tool_calls ?? []) {
          const slot = calls.get(tc.index) ?? { id: "", name: "", args: "" };
          if (tc.id) slot.id = tc.id;
          if (tc.function?.name) slot.name = tc.function.name;
          if (tc.function?.arguments) slot.args += tc.function.arguments;
          calls.set(tc.index, slot);
        }
      }
    } else {
      const res = (await client.chat.completions.create(params as never)) as OpenAI.Chat.ChatCompletion;
      capture(res.usage as never);
      const msg = res.choices[0]?.message;
      text = msg?.content ?? "";
      (msg?.tool_calls ?? []).forEach((tc, i) => {
        if (tc.type === "function") calls.set(i, { id: tc.id, name: tc.function.name, args: tc.function.arguments });
      });
    }

    const content: Anthropic.ContentBlockParam[] = [];
    if (text.trim()) content.push({ type: "text", text });
    for (const c of calls.values()) {
      if (!c.name) continue;
      content.push({ type: "tool_use", id: c.id || `call_${c.name}`, name: c.name, input: parseArgs(c.args) });
    }
    const stop_reason = content.some((b) => b.type === "tool_use") ? "tool_use" : "end_turn";

    // Cost meter — the agent-OS lane on the codex dev path. Real token counts (no longer hardcoded 0),
    // so the lane shows up in the ledger and reprices to prod Opus like every other call.
    recordUsage({ operation: "agent:turn", model, usage: { inputTokens: usageInput, outputTokens: usageOutput, cacheReadTokens: usageCached } });

    // Minimal Anthropic.Message: the loop reads only `.content` and `.stop_reason`.
    return {
      id: "codex",
      type: "message",
      role: "assistant",
      model,
      content,
      stop_reason,
      stop_sequence: null,
      usage: { input_tokens: usageInput, output_tokens: usageOutput },
    } as unknown as Anthropic.Message;
  };
}
