// Core agent tools — the in-app practice operations. Each wraps an EXISTING server
// action (so RLS + audit + revalidation already hold) or a read over loadFirmData.
// Moved here from lib/agent/tools.ts and re-typed to the SHARED CONTRACT AgentTool
// (tier + access + requiredScopes). Behavior is unchanged: reads auto-execute in the
// loop; writes are tier-3 governed writes — STAGED as proposals, executed only after a
// recorded human approval (the approval gate).

import { z } from "zod";
import type { AgentTool } from "../registry";
import { createClientAction } from "@/app/os/clients/actions";
import { createTaskAction, setTaskStatusAction, markTaskDoneAction, approveTaskAction } from "@/app/os/tasks/actions";
import { requestDocumentsAction } from "@/app/os/documents/actions";
import { resolveNoticeAction } from "@/app/os/notices/actions";
import { sendClientSmsAction } from "@/app/os/clients/sms-actions";
import { loadFirmData } from "@/lib/server/firm-data";

// Helper: a read over the firm's loaded data (RLS-scoped inside loadFirmData).
async function firm() {
  return loadFirmData();
}

const CORE_TOOLS: AgentTool[] = [
  {
    name: "list_clients",
    description: "List the firm's clients (households): id, name, kind, service tier. Use to find a householdId.",
    tier: 1,
    access: "read",
    requiredScopes: [],
    schema: z.object({}),
    run: async () => (await firm()).households.map((h) => ({ id: h.id, name: h.name, kind: h.kind, serviceTier: h.serviceTier })),
    describe: () => "List clients",
  },
  {
    name: "list_tasks",
    description: "List the firm's tasks: id, title, status, householdId. Use to find a taskId.",
    tier: 1,
    access: "read",
    requiredScopes: [],
    schema: z.object({}),
    run: async () => (await firm()).tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, householdId: t.householdId })),
    describe: () => "List tasks",
  },
  {
    name: "create_client",
    description: "Create a new client (household). kind: individual|business|mixed. serviceTier: Basic|Standard|Premium.",
    tier: 3,
    access: "write",
    requiredScopes: ["clients:write"],
    schema: z.object({
      name: z.string(),
      kind: z.enum(["individual", "business", "mixed"]),
      serviceTier: z.enum(["Basic", "Standard", "Premium"]).default("Standard"),
      contactName: z.string().optional(),
      contactEmail: z.string().optional(),
    }),
    run: async (a) => createClientAction(a as never),
    describe: (a) => `Create client “${a.name}” (${a.kind}, ${a.serviceTier ?? "Standard"})`,
  },
  {
    name: "create_task",
    description: "Create a task for a client. householdId is required (find it with list_clients).",
    tier: 3,
    access: "write",
    requiredScopes: ["tasks:write"],
    schema: z.object({
      householdId: z.string(),
      title: z.string(),
      why: z.string().optional(),
      engagementId: z.string().optional(),
    }),
    run: async (a) => createTaskAction({ ...(a as Record<string, unknown>), origin: "human" } as never),
    describe: (a) => `Create task “${a.title}” for client ${a.householdId}`,
  },
  {
    name: "set_task_status",
    description: "Set a task's status: in_progress | blocked | needs_review | needs_decision | done.",
    tier: 3,
    access: "write",
    requiredScopes: ["tasks:write"],
    schema: z.object({ taskId: z.string(), status: z.string() }),
    run: async (a) => setTaskStatusAction(a.taskId as string, a.status as string),
    describe: (a) => `Set task ${a.taskId} → ${a.status}`,
  },
  {
    name: "mark_task_done",
    description: "Mark a task done.",
    tier: 3,
    access: "write",
    requiredScopes: ["tasks:write"],
    schema: z.object({ taskId: z.string() }),
    run: async (a) => markTaskDoneAction(a.taskId as string),
    describe: (a) => `Mark task ${a.taskId} done`,
  },
  {
    name: "approve_task",
    description: "Approve a Petal-proposed task (the preparer signs off).",
    tier: 3,
    access: "write",
    requiredScopes: ["tasks:write"],
    schema: z.object({ taskId: z.string() }),
    run: async (a) => approveTaskAction(a.taskId as string),
    describe: (a) => `Approve task ${a.taskId}`,
  },
  {
    name: "request_documents",
    description: "Mark expected documents as requested (chase them). docIds come from a client's expected docs.",
    tier: 3,
    access: "write",
    requiredScopes: ["documents:write"],
    schema: z.object({ docIds: z.array(z.string()).min(1) }),
    run: async (a) => requestDocumentsAction(a.docIds as string[]),
    describe: (a) => `Request ${(a.docIds as string[]).length} document(s)`,
  },
  {
    name: "resolve_notice",
    description: "Resolve a notice, optionally with a note.",
    tier: 3,
    access: "write",
    requiredScopes: ["notices:write"],
    schema: z.object({ noticeId: z.string(), note: z.string().optional() }),
    run: async (a) => resolveNoticeAction(a.noticeId as string, a.note ? { note: a.note as string } : undefined),
    describe: (a) => `Resolve notice ${a.noticeId}`,
  },
  {
    name: "send_sms",
    description: "Send a text message (SMS) to a client via Twilio. householdId is required (find it with list_clients); body is the message. Drafting is fine to do unprompted; the SEND is staged for the preparer to confirm.",
    tier: 3,
    access: "write",
    requiredScopes: ["sms:send"],
    schema: z.object({ householdId: z.string(), body: z.string().min(1).max(1600) }),
    run: async (a) => sendClientSmsAction({ householdId: a.householdId as string, body: a.body as string }),
    describe: (a) => {
      const body = a.body as string;
      return `Text client ${a.householdId}: “${body.slice(0, 70)}${body.length > 70 ? "…" : ""}”`;
    },
  },
];

export default CORE_TOOLS;
