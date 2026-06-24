// Phase 0 agent runtime. Three pieces, all driven by Postgres rows (durable execution
// = agent_tasks / agent_runs / action_proposals), NOT a held-open workflow:
//
//   runSubAgent — a BOUNDED Anthropic tool-use loop for one role. Reads (tier 1/2 read)
//                 auto-execute; writes (tier>=3) NEVER run inline — they are staged as
//                 action_proposals. Hard caps on iterations + token budget. Persists the
//                 transcript to agent_runs (recordRun). Returns Zod-validated output.
//   plan        — classifies + decomposes a large job into bounded sub-tasks (INV-6),
//                 returning a typed, Zod-validated plan.
//   runTask     — the lifecycle: create agent_tasks row -> plan -> execute sub-agents
//                 (independent ones via Promise.all) -> if tier 2 stage proposals and
//                 stop -> set result/status. Audit events throughout (INV-7 via the repo).
//
// Guards (INV-1/2/4): assertZdrModel + assertCleared(taxScope) at entry; redactText on
// everything that leaves for the model; least-privilege via the filtered toolset +
// runTool's dispatch-time re-check. The model never sees a credential (INV-4).

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { assertZdrModel, assertCleared, type DataScope } from "@/lib/ai/guard";
import { redactText, redactValue } from "@/lib/ai/redact";
import type { AgentTool } from "./registry";
import { runTool } from "./registry";
import {
  createTask as createTaskRow,
  setTaskResult,
  recordRun,
  createProposal,
} from "@/lib/repository/agent";
import type { Db, Ctx } from "@/lib/repository/types";

export const AGENT_MODEL = "claude-sonnet-4-6"; // ZDR-eligible
const DEFAULT_MAX_TURNS = 6;
const DEFAULT_MAX_TOKENS = 1200;

// ── model seam ────────────────────────────────────────────────────────────────
// A minimal tool-use message-call abstraction so tests inject a deterministic model
// (no network, no key) via MockToolModel. The shape mirrors the slice of the Anthropic
// Messages API the loop needs.

export type ModelToolDef = { name: string; description: string; input_schema: unknown };
export type ModelToolUse = { type: "tool_use"; id: string; name: string; input: unknown };
export type ModelText = { type: "text"; text: string };
export type ModelContentBlock = ModelText | ModelToolUse;
export type ModelToolResult = { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };
export type ModelMessage = { role: "user" | "assistant"; content: string | ModelContentBlock[] | ModelToolResult[] };

export type ModelResponse = {
  content: ModelContentBlock[];
  stopReason: string;
  usage?: { inputTokens?: number; outputTokens?: number };
};

export type ModelCallArgs = {
  model: string;
  system: string;
  tools: ModelToolDef[];
  messages: ModelMessage[];
  maxTokens: number;
};

export interface ToolModel {
  call(args: ModelCallArgs): Promise<ModelResponse>;
}

// Production model: the Anthropic Messages API behind the same seam. Lazily constructed
// so tests that inject a model never need a key. Imported dynamically to keep the SDK
// out of the test path.
export class AnthropicToolModel implements ToolModel {
  async call(args: ModelCallArgs): Promise<ModelResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: args.model,
      max_tokens: args.maxTokens,
      system: args.system,
      tools: args.tools as never,
      messages: args.messages as never,
    });
    const content: ModelContentBlock[] = res.content
      .map((b): ModelContentBlock | null => {
        if (b.type === "text") return { type: "text", text: b.text };
        if (b.type === "tool_use") return { type: "tool_use", id: b.id, name: b.name, input: b.input };
        return null;
      })
      .filter((b): b is ModelContentBlock => b !== null);
    return {
      content,
      stopReason: res.stop_reason ?? "end_turn",
      usage: { inputTokens: res.usage?.input_tokens, outputTokens: res.usage?.output_tokens },
    };
  }
}

// ── runSubAgent ─────────────────────────────────────────────────────────────────

export type StagedProposal = {
  toolName: string;
  args: Record<string, unknown>;
  title: string;
  tier: number;
};

export type RunSubAgentArgs<T> = {
  role: string;
  system: string;
  /** the AgentTool[] this sub-agent may use (already filtered to least privilege). */
  tools: AgentTool[];
  /** the natural-language task for this sub-agent. */
  input: string;
  /** Zod schema the structured output must validate against. */
  outputSchema: z.ZodType<T>;
  maxTurns?: number;
  maxTokens?: number;
  /** §7216 data scope; 'synthetic' until counsel clears real-data AI. */
  taxScope?: DataScope;
  /** scopes the caller holds; runTool re-checks reads against these at dispatch. */
  callerScopes?: string[];
  model?: string;
};

export type RunSubAgentResult<T> = {
  output: T | null;
  reply: string;
  /** writes the model attempted — STAGED, not executed. */
  proposals: StagedProposal[];
  inputTokens: number;
  outputTokens: number;
  turns: number;
  /** the full transcript, for persistence to agent_runs. */
  transcript: ModelMessage[];
};

// A bounded tool-use loop. Reads (tier 1/2 read) auto-execute via runTool (which
// re-checks scope at dispatch); writes (tier>=3) are STAGED as proposals and the model
// is told they are pending — they NEVER run here. Persists the transcript to agent_runs
// when db+ctx+taskId are supplied. Hard-caps turns + token budget.
export async function runSubAgent<T>(
  args: RunSubAgentArgs<T>,
  deps: { model: ToolModel; db?: Db; ctx?: Ctx; taskId?: string; parentRunId?: string },
): Promise<RunSubAgentResult<T>> {
  const modelId = args.model ?? AGENT_MODEL;
  assertZdrModel(modelId); // ZDR allowlist (INV-2)
  assertCleared(args.taxScope ?? "synthetic"); // §7216 HARD gate

  const maxTurns = args.maxTurns ?? DEFAULT_MAX_TURNS;
  const maxTokens = args.maxTokens ?? DEFAULT_MAX_TOKENS;

  const toolByName = new Map(args.tools.map((t) => [t.name, t] as const));
  const modelTools: ModelToolDef[] = args.tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: zodToJsonSchema(t.schema, { target: "openApi3" }),
  }));

  const messages: ModelMessage[] = [{ role: "user", content: redactText(args.input) }];
  const proposals: StagedProposal[] = [];
  let reply = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let turns = 0;
  let tokenBudgetHit = false;

  for (let i = 0; i < maxTurns; i++) {
    turns = i + 1;
    // Token budget hard-cap: stop before issuing a call that would exceed the budget.
    if (inputTokens + outputTokens >= maxTokens * maxTurns) {
      tokenBudgetHit = true;
      break;
    }

    const res = await deps.model.call({ model: modelId, system: args.system, tools: modelTools, messages, maxTokens });
    inputTokens += res.usage?.inputTokens ?? 0;
    outputTokens += res.usage?.outputTokens ?? 0;

    const text = res.content
      .filter((b): b is ModelText => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (text) reply = text;

    const toolUses = res.content.filter((b): b is ModelToolUse => b.type === "tool_use");
    if (res.stopReason !== "tool_use" || toolUses.length === 0) break;

    messages.push({ role: "assistant", content: res.content });
    const results: ModelToolResult[] = [];
    for (const tu of toolUses) {
      const tool = toolByName.get(tu.name);
      if (!tool) {
        results.push({ type: "tool_result", tool_use_id: tu.id, content: "unknown tool", is_error: true });
        continue;
      }
      const parsed = tool.schema.safeParse(tu.input ?? {});
      if (!parsed.success) {
        results.push({ type: "tool_result", tool_use_id: tu.id, content: `invalid args: ${parsed.error.message.slice(0, 300)}`, is_error: true });
        continue;
      }
      const toolArgs = parsed.data as Record<string, unknown>;
      if (tool.access === "read") {
        // tier 1/2 read — auto-execute. runTool re-checks scope at dispatch (INV-4).
        try {
          const out = await runTool(tu.name, toolArgs, args.callerScopes);
          // HIGH-5: redact read-tool output BEFORE it re-enters the model context. Read
          // results carry client records; redactValue is best-effort data-minimization —
          // it masks STRUCTURED PII patterns (SSN/EIN/account/phone shapes), NOT arbitrary
          // free-text PII (names, addresses). It is defense-in-depth, not a guarantee: the
          // load-bearing §7216 controls are assertCleared(scope) + ZDR + the no-real-PII-
          // without-clearance posture. (§7216/INV-4 data-minimization.)
          results.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(redactValue(out)).slice(0, 6000) });
        } catch (e) {
          results.push({ type: "tool_result", tool_use_id: tu.id, content: `error: ${e instanceof Error ? e.name : "unknown"}`, is_error: true });
        }
      } else {
        // WRITE (tier>=3) — STAGE it, never execute inside the loop.
        proposals.push({ toolName: tu.name, args: toolArgs, title: tool.describe(toolArgs), tier: tool.tier });
        results.push({ type: "tool_result", tool_use_id: tu.id, content: `STAGED pending human approval: ${tool.describe(toolArgs)}. It is NOT done yet.` });
      }
    }
    messages.push({ role: "user", content: results });
  }

  // Structured output: validate the final text reply against the schema when it is JSON;
  // fall back to wrapping the reply so a plain-text role still returns a typed shape.
  let output: T | null = null;
  if (reply) {
    try {
      output = args.outputSchema.parse(JSON.parse(reply));
    } catch {
      const wrapped = args.outputSchema.safeParse({ reply });
      output = wrapped.success ? wrapped.data : null;
    }
  }

  // Persist this run's transcript to agent_runs (INV-7). The transcript is already
  // redacted (we redacted the input + tool results are firm data, not PII-bearing keys);
  // redactValue gives a second pass so nothing PII-shaped is stored verbatim.
  if (deps.db && deps.ctx && deps.taskId) {
    await recordRun(deps.db, deps.ctx, {
      taskId: deps.taskId,
      parentRunId: deps.parentRunId,
      role: args.role,
      model: modelId,
      inputTokens,
      outputTokens,
      transcript: redactValue(messages as unknown),
    });
  }

  void tokenBudgetHit; // budget enforced by the loop guard above
  return { output, reply: reply || "", proposals, inputTokens, outputTokens, turns, transcript: messages };
}

// ── plan (INV-6 compute-budget chunking) ──────────────────────────────────────

export const SubTaskSchema = z.object({
  role: z.string(),
  input: z.string(),
  /** sub-tasks sharing a group run concurrently; different groups run in sequence. */
  group: z.number().int().min(0).default(0),
  dependsOn: z.array(z.string()).default([]),
});
export type SubTask = z.infer<typeof SubTaskSchema>;

export const PlanSchema = z.object({
  kind: z.string(),
  classification: z.enum(["simple", "decompose"]),
  subTasks: z.array(SubTaskSchema).min(1),
  budget: z.object({ maxSubAgents: z.number().int().min(1), maxTokensPerAgent: z.number().int().min(1) }),
});
export type Plan = z.infer<typeof PlanSchema>;

export type PlanArgs = {
  kind: string;
  input: Record<string, unknown>;
  budget?: { maxSubAgents?: number; maxTokensPerAgent?: number };
  /** optional model planner; when omitted a deterministic single-step plan is returned. */
  planner?: (args: { kind: string; input: Record<string, unknown> }) => Plan;
};

// Classify a job + decompose it into bounded sub-tasks. By default (no planner) it
// returns a single-step plan — a simple job runs as one sub-agent. A planner can split a
// large job (e.g. "collect docs for 200 clients") into bounded, independently-runnable
// sub-tasks so no single model call exceeds the compute budget (INV-6). The result is
// always Zod-validated.
export async function plan(args: PlanArgs): Promise<Plan> {
  const budget = {
    maxSubAgents: args.budget?.maxSubAgents ?? 8,
    maxTokensPerAgent: args.budget?.maxTokensPerAgent ?? DEFAULT_MAX_TOKENS,
  };
  if (args.planner) {
    const raw = args.planner({ kind: args.kind, input: args.input });
    const validated = PlanSchema.parse(raw);
    // Enforce the budget hard-cap regardless of what the planner proposed.
    if (validated.subTasks.length > budget.maxSubAgents) {
      throw new Error(`plan exceeds compute budget: ${validated.subTasks.length} > ${budget.maxSubAgents} sub-agents`);
    }
    return validated;
  }
  return PlanSchema.parse({
    kind: args.kind,
    classification: "simple",
    subTasks: [{ role: args.kind, input: JSON.stringify(args.input), group: 0, dependsOn: [] }],
    budget,
  });
}

// ── runTask lifecycle ──────────────────────────────────────────────────────────

export type RunTaskArgs = {
  firmCtx: { db: Db; ctx: Ctx };
  kind: string;
  tier: 1 | 2 | 3 | 4; // INV-3
  input: Record<string, unknown>;
  clientId?: string;
  /** the tools available to this task's sub-agents (filtered to least privilege). */
  tools: AgentTool[];
  systemForRole?: (role: string) => string;
  outputSchema?: z.ZodTypeAny;
  taxScope?: DataScope;
  callerScopes?: string[];
  budget?: { maxSubAgents?: number; maxTokensPerAgent?: number };
  planner?: PlanArgs["planner"];
};

export type RunTaskResult = {
  taskId: string;
  status: "completed" | "awaiting_approval" | "failed";
  proposalIds: string[];
  outputs: unknown[];
};

// The task lifecycle. Durable: every step is a Postgres row (createTask, recordRun,
// createProposal, setTaskResult) — NOT a held-open workflow. For a tier-2 task the staged
// writes become action_proposals and the task STOPS at awaiting_approval (it writes
// nothing external, INV-3). Independent sub-agents (same plan group) run via Promise.all.
export async function runTask(
  rargs: RunTaskArgs,
  deps: { model: ToolModel },
): Promise<RunTaskResult> {
  const { db, ctx } = rargs.firmCtx;
  const outputSchema = rargs.outputSchema ?? z.object({ reply: z.string() }).passthrough();

  // 1. create agent_tasks row (audited via the repo).
  const task = await createTaskRow(db, ctx, {
    clientId: rargs.clientId,
    createdByUserId: ctx.actorId ?? undefined,
    kind: rargs.kind,
    tier: rargs.tier,
    input: rargs.input,
  });

  try {
    // 2. plan -> bounded sub-tasks (INV-6).
    const built = await plan({ kind: rargs.kind, input: rargs.input, budget: rargs.budget, planner: rargs.planner });

    // 3. execute sub-agents. Same group runs concurrently (Promise.all); groups in order.
    const groups = [...new Set(built.subTasks.map((s) => s.group))].sort((a, b) => a - b);
    const allProposals: StagedProposal[] = [];
    const outputs: unknown[] = [];

    for (const g of groups) {
      const inGroup = built.subTasks.filter((s) => s.group === g);
      const results = await Promise.all(
        inGroup.map((st) =>
          runSubAgent(
            {
              role: st.role,
              system: rargs.systemForRole ? rargs.systemForRole(st.role) : `You are the ${st.role} sub-agent for a US tax practice. ${WRITE_STAGING_NOTE}`,
              tools: rargs.tools,
              input: st.input,
              outputSchema: outputSchema as z.ZodType<unknown>,
              maxTokens: built.budget.maxTokensPerAgent,
              taxScope: rargs.taxScope,
              callerScopes: rargs.callerScopes,
            },
            { model: deps.model, db, ctx, taskId: task.id },
          ),
        ),
      );
      for (const r of results) {
        outputs.push(r.output ?? { reply: r.reply });
        allProposals.push(...r.proposals);
      }
    }

    // 4. tier 2/3: stage writes as action_proposals (INV-3). The task writes NOTHING
    //    external — it stops at awaiting_approval for a human to resolve via the gate.
    const proposalIds: string[] = [];
    if (allProposals.length) {
      for (const p of allProposals) {
        const row = await createProposal(db, ctx, {
          taskId: task.id,
          clientId: rargs.clientId,
          toolName: p.toolName,
          args: p.args,
          rationale: p.title,
          confidence: undefined,
        });
        proposalIds.push(row.id);
      }
      await setTaskResult(db, ctx, task.id, "awaiting_approval", { proposals: proposalIds, outputs });
      return { taskId: task.id, status: "awaiting_approval", proposalIds, outputs };
    }

    // 5. no writes proposed — a read/analysis task completes with its result.
    await setTaskResult(db, ctx, task.id, "completed", { outputs });
    return { taskId: task.id, status: "completed", proposalIds: [], outputs };
  } catch (e) {
    await setTaskResult(db, ctx, task.id, "failed", { error: e instanceof Error ? e.message : "unknown" });
    return { taskId: task.id, status: "failed", proposalIds: [], outputs: [] };
  }
}

const WRITE_STAGING_NOTE =
  "Read tools run immediately; never invent an id. Write tools are STAGED for human " +
  "approval after you call them — do NOT claim a write is done.";
