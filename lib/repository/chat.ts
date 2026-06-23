import { eq, desc, asc, sql } from "drizzle-orm";
import { chatThreads, chatMessages } from "../db/schema";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

// ⑨ Ask Petal chat history — RLS-scoped readers/writers for persisted assistant
// conversations (mirrors lib/repository/documents.ts). Every query runs under the
// caller's JWT so RLS narrows to the firm; firm_id is stamped from ctx on writes.
// The chat text is the firm's own data — nothing here leaves the process.

const SNIPPET_LEN = 80;

function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

export type CreateThreadInput = { title: string; userId?: string };

// Create a chat thread. RLS scopes the INSERT to the caller's firm (firm_id is
// stamped from ctx); one audit row records it.
export async function createThread(db: Db, ctx: Ctx, input: CreateThreadInput): Promise<string> {
  const id = globalThis.crypto.randomUUID();
  await db.insert(chatThreads).values({
    id,
    firmId: ctx.firmId,
    userId: input.userId ?? ctx.actorId,
    title: truncate(input.title, 200) || "New chat",
  });
  await writeAudit(db, ctx, { action: "chat_thread.create", resourceType: "chat_thread", resourceId: id });
  return id;
}

export type AppendMessageInput = { threadId: string; role: "user" | "assistant"; content: string };

// Append a message to a thread and bump the thread's updated_at so it sorts to the
// top of Recent. RLS-scoped (a firm can only write to its own threads). The thread
// touch is firm-scoped too; both run under the caller's JWT.
export async function appendMessage(db: Db, ctx: Ctx, input: AppendMessageInput): Promise<string> {
  // Verify the thread belongs to the caller's firm before writing. thread_id is
  // client-supplied and the FK alone accepts ANY firm's thread id; this RLS-scoped read
  // returns nothing for a foreign thread, so we refuse to append to it (cross-tenant write).
  const [owner] = await db.select({ id: chatThreads.id }).from(chatThreads).where(eq(chatThreads.id, input.threadId));
  if (!owner) throw new Error("thread not found in firm");
  const id = globalThis.crypto.randomUUID();
  await db.insert(chatMessages).values({
    id,
    threadId: input.threadId,
    firmId: ctx.firmId,
    role: input.role,
    content: input.content,
  });
  await db
    .update(chatThreads)
    .set({ updatedAt: sql`now()` })
    .where(eq(chatThreads.id, input.threadId));
  return id;
}

// Recent threads newest-first, each with a snippet (its last message, truncated).
// RLS scopes to the firm. The snippet is a correlated subquery so one round-trip
// returns the list the sidebar renders.
export async function listThreads(
  db: Db,
): Promise<{ id: string; title: string; updatedAt: Date; snippet: string }[]> {
  const lastContent = sql<string>`(
    select content from ${chatMessages}
    where ${chatMessages.threadId} = ${chatThreads.id}
    order by ${chatMessages.createdAt} desc
    limit 1
  )`;
  const rows = await db
    .select({
      id: chatThreads.id,
      title: chatThreads.title,
      updatedAt: chatThreads.updatedAt,
      last: lastContent,
    })
    .from(chatThreads)
    .orderBy(desc(chatThreads.updatedAt));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: r.updatedAt,
    snippet: r.last ? truncate(r.last, SNIPPET_LEN) : "",
  }));
}

// A thread's messages oldest-first — the transcript the chat surface re-renders
// when a recent item is reopened. RLS-scoped to the firm.
export async function getThreadMessages(
  db: Db,
  threadId: string,
): Promise<{ id: string; role: string; content: string; createdAt: Date }[]> {
  return db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.threadId, threadId))
    .orderBy(asc(chatMessages.createdAt));
}
