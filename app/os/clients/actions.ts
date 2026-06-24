"use server";

import { revalidatePath } from "next/cache";
import { withFirm } from "@/lib/auth/tenant";
import { createHousehold, createPerson, updatePerson } from "@/lib/repository/practice-writes";

export type NewClientInput = {
  name: string;
  kind: string; // individual | business | mixed
  serviceTier: string; // Basic | Standard | Premium
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

// Persists a real client (household + optional primary contact) to the firm's DB,
// audited + RLS-scoped via withFirm. Returns the new id so the UI can navigate.
export async function createClientAction(input: NewClientInput): Promise<{ id: string } | null> {
  const result = await withFirm(async (db, ctx) => {
    const hid = await createHousehold(db, ctx, {
      name: input.name,
      kind: input.kind,
      serviceTier: input.serviceTier,
      since: 2026,
      catchUp: "New client — no returns started yet.",
    });
    if (input.contactName?.trim()) {
      await createPerson(db, ctx, {
        householdId: hid,
        name: input.contactName.trim(),
        email: input.contactEmail?.trim() || undefined,
        phone: input.contactPhone?.trim() || undefined,
        role: "Taxpayer",
      });
    }
    return { id: hid };
  });
  if (result) revalidatePath("/os/clients");
  return result;
}

// Edit an existing contact's reachable fields (used inline on the client record so a
// contact like Haokun can get a phone added and become textable). RLS + audit live in
// updatePerson; we revalidate the record so the People rail + SMS lookup see the change.
export type PersonContactInput = { phone?: string; email?: string; name?: string };
export async function updatePersonContactAction(
  personId: string,
  patch: PersonContactInput,
  householdId?: string,
): Promise<{ ok: boolean }> {
  if (!personId) return { ok: false };
  const ok = await withFirm((db, ctx) => updatePerson(db, ctx, personId, patch));
  if (ok && householdId) revalidatePath(`/os/clients/${householdId}`);
  return { ok: !!ok };
}
