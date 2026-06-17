"use client";

// Session billing layer — augments the derived invoices() with draft invoices
// created this session (e.g. when WIP time is billed). Mirrors client-store's
// "prepend session items to the canonical list" pattern so the Billing table,
// counts, and KPIs all see new invoices without a backend.

import { useSyncExternalStore } from "react";
import { invoices, type Invoice } from "@/lib/fixtures/derive";
import { householdById } from "@/lib/fixtures/firm";

const drafts: Invoice[] = [];
const draftIds = new Set<string>();
let seq = 0;
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

export const billingStore = {
  isDraft: (id: string) => draftIds.has(id),
  /** a new outstanding invoice from billed work (WIP time, extra work, etc.) */
  addDraft(householdId: string, amount: number, minutes: number) {
    const h = householdById(householdId);
    if (!h || amount <= 0) return;
    const id = `inv-wip-${householdId}-${++seq}`;
    const hours = Math.round((minutes / 60) * 10) / 10;
    drafts.unshift({
      id,
      number: `INV-${(900 + seq).toString().padStart(4, "0")}`,
      householdId,
      clientName: h.name,
      serviceTier: h.serviceTier,
      invoiced: amount,
      collected: 0,
      balance: amount,
      status: "balance_due",
      due: "Just billed",
      issued: `${hours}h logged time`,
      blockedByDocs: false,
    });
    draftIds.add(id);
    emit();
  },
  all: (): Invoice[] => [...drafts, ...invoices()],
};

export function useBillingInvoices(): Invoice[] {
  useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
  return billingStore.all();
}
