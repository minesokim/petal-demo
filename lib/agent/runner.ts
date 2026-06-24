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
import { loadFirmData } from "@/lib/server/firm-data";

const AGENT_MODEL = "claude-opus-4-8"; // ZDR-eligible (Opus approved for the agent loop)
// Raised to 8 so a lookup → act chain (find_client → get_client_detail → stage a write) has
// room to complete in a single turn without truncation.
const MAX_TURNS = 8;

const AGENT_SYSTEM = `You are Petal, an AI-native assistant for a tax firm. From the user's natural language, decide what to do — look up a client, draft/send a message, create a client or task, request documents, research a tax question (always cited), or compute a figure — and do it. NEVER require specific keywords.
- READ tools (find_client, get_client_detail, list_clients, list_tasks, tax_research, tax_compute, draft_email) run immediately — use them to resolve a person to a client, ground a reply in real state, cite a rule, or compute a figure. To act on a client named in natural language, call find_client FIRST to resolve the householdId — NEVER invent an id.
- Weave the tool results into a direct answer: when you research, state the rule and keep its citations; when you compute, state the figure; when you found a client, name them.
- TAX-LAW QUESTIONS (what a rule, cap, threshold, deduction, rate, or deadline IS for a given year, or how something is treated): ground EVERY figure — never from memory.
  • For a SETTLED published figure (the SALT cap, the tips/overtime cap, the senior deduction, the QBI threshold, the standard deduction, the child tax credit, and their phase-outs): call tax_param FIRST — it is a deterministic keyed lookup that returns the exact value with its source cite. State the number exactly as tax_param returns it. tax_param is the SOURCE OF TRUTH for these figures; do NOT hedge on a number it grounds.
  • For everything else (a rule's meaning, conformity, treatment, an effective-date question, or a figure tax_param doesn't cover): call tax_research — grounded in cited authority and freshness-checked. Lead with its rule + citations.
  • Use tax_compute ONLY when the user gave specific numeric INPUTS for a named worksheet (eitc, ctc, aotc, qbi, standardDeduction, saltCap, tipsDeduction, overtimeDeduction, seniorDeduction) — it does arithmetic on known inputs, it is NOT for looking up what a rule is. If tax_compute rejects your inputs, do NOT retry — state the grounded rule and the inputs you'd need.
  NEVER state a tax figure, cap, threshold, rate, or "current law" from your own memory — your training may predate recent legislation (e.g. the 2025 OBBBA), so an ungrounded number could be confidently wrong. If a tool returns found:false or can't ground it, say so plainly rather than guessing.
- Stage any external WRITE (send_sms, draft-then-send, create_client, create_task, set_task_status, mark_task_done, approve_task, request_documents, resolve_notice) for one-click confirmation — it is STAGED pending the preparer's confirmation, NOT done. Never act without it. draft_email and tax_* are reads (no confirmation needed); only the actual SMS/create/request writes are staged.
- After staging the needed writes, give a short reply telling the preparer exactly what you've staged. If a request is ambiguous or you can't find the id, ask rather than guess.
- VOICE: write like a sharp colleague, in plain conversational prose. NO markdown headers (#, ##), NO bold (**text**), no decorative section labels or heavy bullet scaffolding — short paragraphs and, at most, a simple dash list when genuinely listing. Keep citations inline and minimal (e.g. "under OBBBA §70120"). No emojis, no greetings like "Great question". Just answer.`;

export type ProposedAction = { tool: string; args: Record<string, unknown>; title: string };
export type AgentTurn = { role: "user" | "assistant"; content: string };
// A surfaced source for the answer — the legal cite + a link to the official primary source.
// Public authority only (no PII), captured from tax_research / tax_compute so the UI can render
// clickable sources beside the answer (cheap verification: the preparer checks the cite itself).
export type AgentCitation = { cite: string; sourceUrl: string; authority?: string };

// A streamed reasoning event. The runner emits one of these before the first model call
// ("Thinking") and as each tool_use is dispatched, so the UI can show a live, Claude-style
// thinking trace. `label` is a short, present-tense, HUMAN action — never a raw tool name.
export type AgentEvent = { type: "step"; label: string };

// labelFor — map a tool + its args to the human, present-tense step label in the EVENT CONTRACT.
// `nameFor` resolves a householdId in args to the client's NAME when firm data is loaded (so the
// label reads "Preparing a text to Haokun Li" rather than an opaque id). Pure + total: any
// unmapped tool falls back to "Working on it" so a new tool never crashes the trace.
function shortQuestion(q: unknown): string {
  const s = typeof q === "string" ? q.trim() : "";
  if (!s) return "the question";
  return s.length > 48 ? `${s.slice(0, 48).trimEnd()}…` : s;
}

export function labelFor(
  tool: string,
  args: Record<string, unknown>,
  nameFor?: (householdId: unknown) => string | undefined,
): string {
  const who = (key: "householdId" | "query" | "to") => nameFor?.(args[key]);
  switch (tool) {
    case "find_client":
      return `Looking up ${typeof args.query === "string" && args.query.trim() ? args.query.trim() : "the client"}`;
    case "get_client_detail":
      return "Reading the client record";
    case "list_clients":
    case "list_tasks":
      return "Reading the firm's records";
    case "tax_research":
      return `Researching ${shortQuestion(args.question)}`;
    case "tax_compute":
      return "Computing the figure";
    case "draft_email":
      return "Drafting the email";
    case "send_sms": {
      const name = who("householdId");
      return `Preparing a text to ${name ?? "the client"}`;
    }
    case "send_email":
      return "Preparing the email";
    default:
      if (tool.startsWith("create_")) return "Setting that up";
      if (tool.startsWith("request_")) return "Setting that up";
      return "Working on it";
  }
}

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
  opts: { scope?: DataScope; model?: ModelSeam; onEvent?: (e: AgentEvent) => void } = {},
): Promise<{ reply: string; proposedActions: ProposedAction[]; citations: AgentCitation[] }> {
  assertZdrModel(AGENT_MODEL);
  assertCleared(opts.scope ?? "real"); // operating over real firm data; gated by PETAL_7216_CLEARED

  // onEvent is BEST-EFFORT: a throwing listener must never break the agent loop or the
  // safety contract. Wrap every emit so a UI-side error stays UI-side.
  const emit = (e: AgentEvent) => {
    if (!opts.onEvent) return;
    try { opts.onEvent(e); } catch { /* best-effort: never throw out of the loop */ }
  };

  // Resolve a householdId → client NAME for human step labels (e.g. "Preparing a text to Haokun
  // Li"). Loaded once, best-effort: if firm data isn't available (a scripted test, an offline
  // seam), labels fall back to "the client". This mirrors the proposedActions name resolution.
  let nameById: Map<string, string> | undefined;
  try {
    const { households } = await loadFirmData();
    nameById = new Map(households.map((h) => [h.id, h.name] as const));
  } catch {
    nameById = undefined;
  }
  const nameFor = (hid: unknown): string | undefined =>
    typeof hid === "string" ? nameById?.get(hid) : undefined;

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
  const citations: AgentCitation[] = []; // accumulated from tax_research / tax_compute (deduped)
  let reply = "";

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    // A generic first step before the first model call: the model is reasoning about the request.
    if (turn === 0) emit({ type: "step", label: "Thinking" });
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
      // Emit the human, present-tense step as this tool fires (best-effort; never throws).
      emit({ type: "step", label: labelFor(tu.name, (tu.input ?? {}) as Record<string, unknown>, nameFor) });
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
          // Capture the structured citations from research/compute so the UI can render clickable
          // sources. These are PUBLIC authority (legal cite + official source URL) — no PII — so we
          // read them from the RAW result before redaction.
          if ((tu.name === "tax_research" || tu.name === "tax_compute" || tu.name === "tax_param") && out && typeof out === "object") {
            const cs = (out as { citations?: unknown }).citations;
            if (Array.isArray(cs)) {
              for (const c of cs) {
                if (!c || typeof c !== "object") continue;
                const cite = String((c as { cite?: unknown }).cite ?? "").trim();
                const sourceUrl = String((c as { sourceUrl?: unknown }).sourceUrl ?? "").trim();
                const authority = (c as { authority?: unknown }).authority;
                if (cite && !citations.some((x) => x.cite === cite)) {
                  citations.push({ cite, sourceUrl, authority: typeof authority === "string" ? authority : undefined });
                }
              }
            }
          }
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

  // Friendly titles: a staged write's title comes from tool.describe(args), which only has the
  // raw householdId (e.g. "Text client h_b5e2…"). Resolve it to the client's NAME for display
  // using the map we already loaded above. Best-effort: if firm data wasn't available (e.g. a
  // scripted test), nameById is undefined and we keep the id.
  if (proposedActions.length && nameById) {
    for (const pa of proposedActions) {
      const hid = pa.args.householdId;
      if (typeof hid === "string" && nameById.has(hid)) {
        pa.title = pa.title.split(hid).join(nameById.get(hid)!);
      }
    }
  }

  return { reply: reply || (proposedActions.length ? "I've staged those for your confirmation." : "Done."), proposedActions, citations };
}
