"use server";

import { revalidatePath } from "next/cache";
import { withFirm } from "@/lib/auth/tenant";
import { createHousehold, createPerson } from "@/lib/repository/practice-writes";

export type NewClientInput = {
  name: string;
  kind: string; // individual | business | mixed
  serviceTier: string; // Basic | Standard | Premium
  contactName?: string;
  contactEmail?: string;
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
        role: "Taxpayer",
      });
    }
    return { id: hid };
  });
  if (result) revalidatePath("/os/clients");
  return result;
}
