"use server";

// Client Memory server actions — RLS-scoped (withFirm), replacing the in-memory demo store. The
// memory text is envelope-encrypted in the repository before it touches the DB. These are the wire
// the UI calls; each returns the fresh firm-wide memory list so the client cache can re-render.

import { revalidatePath } from "next/cache";
import { withFirm } from "@/lib/auth/tenant";
import {
  listFirmMemories,
  addMemory,
  removeMemory,
  togglePinMemory,
  confirmMemory,
  type MemoryRow,
  type MemoryKind,
} from "@/lib/repository/memory";

export type { MemoryRow, MemoryKind } from "@/lib/repository/memory";

export async function listMemoriesAction(): Promise<MemoryRow[]> {
  return (await withFirm((db) => listFirmMemories(db))) ?? [];
}

export async function addMemoryAction(input: { householdId: string; text: string; kind?: MemoryKind; source?: string }): Promise<{ ok: boolean; error?: string }> {
  const text = (input.text ?? "").trim();
  if (!input.householdId || !text) return { ok: false, error: "empty memory" };
  const r = await withFirm(async (db, ctx) => {
    await addMemory(db, ctx, { householdId: input.householdId, text, kind: input.kind, source: input.source ?? "Added by you" });
    revalidatePath(`/os/clients/${input.householdId}`);
    revalidatePath("/os/memory");
    return { ok: true };
  });
  return r ?? { ok: false, error: "unauthorized" };
}

export async function removeMemoryAction(id: string): Promise<{ ok: boolean }> {
  const r = await withFirm(async (db, ctx) => { await removeMemory(db, ctx, id); revalidatePath("/os/memory"); return { ok: true }; });
  return r ?? { ok: false };
}

export async function togglePinMemoryAction(id: string): Promise<{ ok: boolean }> {
  const r = await withFirm(async (db, ctx) => { await togglePinMemory(db, ctx, id); revalidatePath("/os/memory"); return { ok: true }; });
  return r ?? { ok: false };
}

export async function confirmMemoryAction(id: string): Promise<{ ok: boolean }> {
  const r = await withFirm(async (db, ctx) => { await confirmMemory(db, ctx, id); revalidatePath("/os/memory"); return { ok: true }; });
  return r ?? { ok: false };
}
