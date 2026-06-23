"use server";

import { withFirm } from "@/lib/auth/tenant";
import {
  createThread,
  appendMessage,
  listThreads,
  getThreadMessages,
} from "@/lib/repository/chat";

// Ask Petal chat persistence — server actions over the RLS-scoped chat repository
// (mirrors app/os/clients/actions.ts: withFirm → repo). Every call runs under the
// signed-in firm's JWT so RLS isolates the data; createThread is audited. Returns
// null only when not authenticated (withFirm short-circuits), which the client
// treats as "stay in-memory" so the demo/offline path still works.

// Create a chat thread (title = first user message, already truncated). Audited
// via the repository. Returns the new thread id so subsequent turns append to it.
export async function createThreadAction(title: string): Promise<{ id: string } | null> {
  const trimmed = title.trim();
  if (!trimmed) return null;
  return withFirm(async (db, ctx) => {
    const id = await createThread(db, ctx, { title: trimmed });
    return { id };
  });
}

// Append one turn (user or assistant) to a thread and bump its updated_at.
// RLS-scoped. No-op (ok:false) when not authenticated or inputs are empty.
export async function appendMessageAction(
  threadId: string,
  role: "user" | "assistant",
  content: string,
): Promise<{ ok: boolean }> {
  if (!threadId || !content.trim()) return { ok: false };
  const res = await withFirm(async (db, ctx) => {
    await appendMessage(db, ctx, { threadId, role, content });
    return { ok: true };
  });
  return res ?? { ok: false };
}

// Recent threads newest-first for the sidebar / history overlay. RLS-scoped.
export async function listThreadsAction(): Promise<
  { id: string; title: string; updatedAt: string; snippet: string }[]
> {
  const rows = await withFirm((db) => listThreads(db));
  return (rows ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
    snippet: r.snippet,
  }));
}

// One thread's full transcript oldest-first, to reopen it in the chat surface.
export async function getThreadAction(
  threadId: string,
): Promise<{ id: string; role: string; content: string }[]> {
  if (!threadId) return [];
  const rows = await withFirm((db) => getThreadMessages(db, threadId));
  return (rows ?? []).map((r) => ({ id: r.id, role: r.role, content: r.content }));
}
