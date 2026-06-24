// Agentic Petal — the tool registry. Each tool wraps an EXISTING server action (so RLS +
// audit + revalidation already hold) or a read over loadFirmData. Tools are classified
// read | write: reads auto-execute during the agent loop; writes are PROPOSED and never run
// until the preparer confirms them (the confirm-gate). This is how "Petal operates the app"
// stays safe — nothing mutates a record without an explicit click.

import { z } from "zod";
import { createClientAction } from "@/app/os/clients/actions";
import { createTaskAction, setTaskStatusAction, markTaskDoneAction, approveTaskAction } from "@/app/os/tasks/actions";
import { requestDocumentsAction } from "@/app/os/documents/actions";
import { resolveNoticeAction } from "@/app/os/notices/actions";
import { loadFirmData } from "@/lib/server/firm-data";

export type ToolKind = "read" | "write";

export type AgentTool = {
  name: string;
  description: string;
  schema: z.ZodTypeAny;
  kind: ToolKind;
  run: (args: Record<string, unknown>) => Promise<unknown>;
  /** one-line human description for the confirm card (write tools). */
  describe: (args: Record<string, unknown>) => string;
};

// Helper: a read over the firm's loaded data (RLS-scoped inside loadFirmData).
async function firm() {
  return loadFirmData();
}

export const TOOLS: AgentTool[] = [
  {
    name: "list_clients",
    description: "List the firm's clients (households): id, name, kind, service tier. Use to find a householdId.",
    schema: z.object({}),
    kind: "read",
    run: async () => (await firm()).households.map((h) => ({ id: h.id, name: h.name, kind: h.kind, serviceTier: h.serviceTier })),
    describe: () => "List clients",
  },
  {
    name: "list_tasks",
    description: "List the firm's tasks: id, title, status, householdId. Use to find a taskId.",
    schema: z.object({}),
    kind: "read",
    run: async () => (await firm()).tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, householdId: t.householdId })),
    describe: () => "List tasks",
  },
  {
    name: "create_client",
    description: "Create a new client (household). kind: individual|business|mixed. serviceTier: Basic|Standard|Premium.",
    schema: z.object({
      name: z.string(),
      kind: z.enum(["individual", "business", "mixed"]),
      serviceTier: z.enum(["Basic", "Standard", "Premium"]).default("Standard"),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
    }),
    kind: "write",
    run: async (a) => createClientAction(a as never),
    describe: (a) => `Create client “${a.name}” (${a.kind}, ${a.serviceTier ?? "Standard"})`,
  },
  {
    name: "create_task",
    description: "Create a task for a client. householdId is required (find it with list_clients).",
    schema: z.object({
      householdId: z.string(),
      title: z.string(),
      why: z.string().optional(),
      engagementId: z.string().optional(),
    }),
    kind: "write",
    run: async (a) => createTaskAction({ ...(a as Record<string, unknown>), origin: "human" } as never),
    describe: (a) => `Create task “${a.title}” for client ${a.householdId}`,
  },
  {
    name: "set_task_status",
    description: "Set a task's status: in_progress | blocked | needs_review | needs_decision | done.",
    schema: z.object({ taskId: z.string(), status: z.string() }),
    kind: "write",
    run: async (a) => setTaskStatusAction(a.taskId as string, a.status as string),
    describe: (a) => `Set task ${a.taskId} → ${a.status}`,
  },
  {
    name: "mark_task_done",
    description: "Mark a task done.",
    schema: z.object({ taskId: z.string() }),
    kind: "write",
    run: async (a) => markTaskDoneAction(a.taskId as string),
    describe: (a) => `Mark task ${a.taskId} done`,
  },
  {
    name: "approve_task",
    description: "Approve a Petal-proposed task (the preparer signs off).",
    schema: z.object({ taskId: z.string() }),
    kind: "write",
    run: async (a) => approveTaskAction(a.taskId as string),
    describe: (a) => `Approve task ${a.taskId}`,
  },
  {
    name: "request_documents",
    description: "Mark expected documents as requested (chase them). docIds come from a client's expected docs.",
    schema: z.object({ docIds: z.array(z.string()).min(1) }),
    kind: "write",
    run: async (a) => requestDocumentsAction(a.docIds as string[]),
    describe: (a) => `Request ${(a.docIds as string[]).length} document(s)`,
  },
  {
    name: "resolve_notice",
    description: "Resolve a notice, optionally with a note.",
    schema: z.object({ noticeId: z.string(), note: z.string().optional() }),
    kind: "write",
    run: async (a) => resolveNoticeAction(a.noticeId as string, a.note ? { note: a.note as string } : undefined),
    describe: (a) => `Resolve notice ${a.noticeId}`,
  },
];

export const TOOL_BY_NAME = new Map(TOOLS.map((t) => [t.name, t] as const));

// Validate + execute a single tool by name (used by the agent loop for reads and by the
// confirm endpoint for writes). Throws on an unknown tool or invalid args.
export async function runTool(name: string, rawArgs: unknown): Promise<unknown> {
  const tool = TOOL_BY_NAME.get(name);
  if (!tool) throw new Error(`unknown tool: ${name}`);
  const args = tool.schema.parse(rawArgs ?? {});
  return tool.run(args as Record<string, unknown>);
}
