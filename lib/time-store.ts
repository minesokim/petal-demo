"use client";

// Time → billing. Preparers log time against a client; unbilled time is "work in
// progress" (WIP). Billing a client's WIP converts it into a draft invoice that
// shows up in the Billing table (via billing-store) and clears the WIP. Session-only.

import { useSyncExternalStore } from "react";
import { householdById } from "@/lib/fixtures/firm";
import { billingStore } from "@/lib/billing-store";

/** firm's default billing rate, $/hour */
export const HOURLY_RATE = 225;
const amountOf = (minutes: number) => Math.round((minutes / 60) * HOURLY_RATE);

export interface TimeEntry {
  id: string;
  householdId: string;
  minutes: number;
  note: string;
  billed: boolean;
}

// seeded unbilled WIP so Billing opens with a believable backlog
const entries: TimeEntry[] = [
  { id: "te-1", householdId: "h-fuentes", minutes: 95, note: "1120-S review + S-corp basis schedule", billed: false },
  { id: "te-2", householdId: "h-park", minutes: 140, note: "Bookkeeping cleanup, Q1–Q2", billed: false },
  { id: "te-3", householdId: "h-chen", minutes: 45, note: "K-1 reconciliation", billed: false },
  { id: "te-4", householdId: "h-sandoval", minutes: 60, note: "Quarterly payroll filing", billed: false },
];

let seq = 0;
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

export interface WipRow {
  householdId: string;
  clientName: string;
  minutes: number;
  amount: number;
  notes: string[];
}

function unbilled(): WipRow[] {
  const byHh = new Map<string, TimeEntry[]>();
  entries.filter(e => !e.billed).forEach(e => {
    if (!byHh.has(e.householdId)) byHh.set(e.householdId, []);
    byHh.get(e.householdId)!.push(e);
  });
  return [...byHh.entries()]
    .map(([hid, es]) => {
      const minutes = es.reduce((s, e) => s + e.minutes, 0);
      return { householdId: hid, clientName: householdById(hid)?.name ?? "—", minutes, amount: amountOf(minutes), notes: es.map(e => e.note) };
    })
    .sort((a, b) => b.amount - a.amount);
}

export const timeStore = {
  amountOf,
  unbilled,
  unbilledTotal: () => entries.filter(e => !e.billed).reduce((s, e) => s + amountOf(e.minutes), 0),
  unbilledMinutes: () => entries.filter(e => !e.billed).reduce((s, e) => s + e.minutes, 0),
  log(householdId: string, minutes: number, note: string) {
    if (!householdId || minutes <= 0) return;
    entries.unshift({ id: `te-new-${++seq}`, householdId, minutes, note: note.trim(), billed: false });
    emit();
  },
  /** convert a client's WIP into a draft invoice; returns the billed amount */
  bill(householdId: string): { minutes: number; amount: number } {
    const open = entries.filter(e => e.householdId === householdId && !e.billed);
    const minutes = open.reduce((s, e) => s + e.minutes, 0);
    const amount = amountOf(minutes);
    if (amount <= 0) return { minutes: 0, amount: 0 };
    open.forEach(e => { e.billed = true; });
    billingStore.addDraft(householdId, amount, minutes);
    emit();
    return { minutes, amount };
  },
};

export function useTime(): number {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
}
