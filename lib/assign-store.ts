"use client";

// Assignment store — lets you reassign a client (household) to a firm member during a
// demo. Tasks, the clients table, inbox scope, and every avatar read through assigneeOf,
// so a reassignment updates everywhere live. Household-keyed: a client's tasks inherit
// its assignee. Session-only — reloading restores the canonical preparerOf mapping.

import { useSyncExternalStore } from "react";
import { preparerOf } from "@/lib/fixtures/firm";

const overrides = new Map<string, string>();
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

export const assignStore = {
  assign(householdId: string, memberId: string) {
    if (overrides.get(householdId) !== memberId) { overrides.set(householdId, memberId); emit(); }
  },
  reset() { if (overrides.size) { overrides.clear(); emit(); } },
};

/** The live assignee for a household — a session override if set, else the canonical preparer. */
export function assigneeOf(householdId: string): string {
  return overrides.get(householdId) ?? preparerOf(householdId);
}

function subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

/** Re-render when an assignment changes; SSR snapshot is the untouched mapping. */
export function useAssignVersion(): number {
  return useSyncExternalStore(subscribe, () => version, () => 0);
}
