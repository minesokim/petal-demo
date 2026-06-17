"use client";

// Client-creation store — adds new clients (and their primary contact) during a
// session. It unshifts into the canonical `households` / `people` arrays so every
// derivation (householdById, invoiceOf, the record page, the list, counts) just
// sees the new client. Session-only: reloading resets to the canonical fixtures.

import { useSyncExternalStore } from "react";
import { households, people, type Household, type Person } from "@/lib/fixtures/firm";

const createdIds = new Set<string>();
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }
let seq = 0;

export const clientStore = {
  isCreated: (id: string) => createdIds.has(id),
  newHouseholdId: () => `h-new-${Date.now()}-${++seq}`,
  createClient(
    h: Household,
    contact?: { name: string; email?: string; phone?: string; role?: Person["role"] },
  ) {
    households.unshift(h);
    createdIds.add(h.id);
    if (contact?.name?.trim()) {
      people.unshift({
        id: `p-new-${Date.now()}-${++seq}`,
        name: contact.name.trim(),
        email: contact.email?.trim() || "",
        phone: contact.phone?.trim() || "",
        role: contact.role ?? "Taxpayer",
        householdId: h.id,
      });
    }
    emit();
  },
};

function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

/** re-render the clients surfaces when a client is created */
export function useClientsVersion(): number {
  return useSyncExternalStore(subscribe, () => version, () => 0);
}
