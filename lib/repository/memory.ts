import { eq, and, desc } from "drizzle-orm";
import { clientMemory } from "../db/schema";
import { encryptPII, decryptPII } from "../crypto/envelope";
import { writeAudit } from "./audit";
import type { Db, Ctx } from "./types";

// Client Memory persistence — RLS-scoped readers/writers. The memory TEXT is client PII, so it is
// envelope-encrypted at rest (text_enc) and decrypted only here on read; the audit trail records
// the household/kind/action but NEVER the text. Mirrors the lib/repository/sms.ts shape.

export type MemoryKind = "preference" | "fact" | "history" | "flag";
export type MemoryStatus = "confirmed" | "suggested";

export type MemoryRow = {
  id: string;
  householdId: string;
  text: string;
  source: string;
  kind: MemoryKind;
  status: MemoryStatus;
  pinned: boolean;
  at: string; // ISO created-at, for display
};

export type AddMemoryInput = {
  householdId: string;
  text: string;
  source: string;
  kind?: MemoryKind;
  status?: MemoryStatus;
};

// Every memory for the firm (RLS-scoped), pinned first then newest. Decrypts text_enc.
export async function listFirmMemories(db: Db): Promise<MemoryRow[]> {
  const rows = await db
    .select({
      id: clientMemory.id,
      householdId: clientMemory.householdId,
      textEnc: clientMemory.textEnc,
      source: clientMemory.source,
      kind: clientMemory.kind,
      status: clientMemory.status,
      pinned: clientMemory.pinned,
      createdAt: clientMemory.createdAt,
    })
    .from(clientMemory)
    .orderBy(desc(clientMemory.pinned), desc(clientMemory.createdAt));
  return rows.map((r) => ({
    id: r.id,
    householdId: r.householdId,
    text: decryptPII(r.textEnc),
    source: r.source,
    kind: r.kind as MemoryKind,
    status: r.status as MemoryStatus,
    pinned: r.pinned,
    at: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString(),
  }));
}

// Record a memory (firm-scoped; text encrypted). Audit carries household/kind/status — never text.
export async function addMemory(db: Db, ctx: Ctx, input: AddMemoryInput): Promise<string> {
  const text = input.text.trim();
  const id = globalThis.crypto.randomUUID();
  await db.insert(clientMemory).values({
    id,
    firmId: ctx.firmId,
    householdId: input.householdId,
    textEnc: encryptPII(text),
    source: input.source,
    kind: input.kind ?? "fact",
    status: input.status ?? "confirmed",
    createdByUserId: ctx.actorId,
  });
  await writeAudit(db, ctx, {
    action: "memory.add",
    resourceType: "household",
    resourceId: input.householdId,
    metadata: { kind: input.kind ?? "fact", status: input.status ?? "confirmed" }, // never the text
  });
  return id;
}

export async function removeMemory(db: Db, ctx: Ctx, id: string): Promise<void> {
  await db.delete(clientMemory).where(eq(clientMemory.id, id));
  await writeAudit(db, ctx, { action: "memory.remove", resourceType: "client_memory", resourceId: id });
}

export async function togglePinMemory(db: Db, ctx: Ctx, id: string): Promise<void> {
  const [row] = await db.select({ pinned: clientMemory.pinned }).from(clientMemory).where(eq(clientMemory.id, id));
  if (!row) return;
  await db.update(clientMemory).set({ pinned: !row.pinned }).where(eq(clientMemory.id, id));
  await writeAudit(db, ctx, { action: "memory.pin", resourceType: "client_memory", resourceId: id, metadata: { pinned: !row.pinned } });
}

// Confirm an AI-suggested memory into an active one.
export async function confirmMemory(db: Db, ctx: Ctx, id: string): Promise<void> {
  await db.update(clientMemory).set({ status: "confirmed" }).where(and(eq(clientMemory.id, id), eq(clientMemory.status, "suggested")));
  await writeAudit(db, ctx, { action: "memory.confirm", resourceType: "client_memory", resourceId: id });
}
