"use client";

// Recurring work templates — the practice's repeating jobs (quarterly estimates,
// monthly book closes, annual engagement renewals). A template targets a slice of
// clients and, when it runs, drops one task per matching client into the live queue
// (handed to Petal when assigned to Petal). Session-only, like the rest of the demo.

import { useSyncExternalStore } from "react";
import { households, CURRENT_USER_ID, type Household } from "@/lib/fixtures/firm";
import { demoStore } from "@/lib/demo-store";

export type Cadence = "monthly" | "quarterly" | "annually";
/** which clients a template fans out to */
export type ScopeKey = "all" | "books" | "premium" | string; // string = a single household id

export interface Template {
  id: string;
  name: string;
  cadence: Cadence;
  /** "petal" hands each generated task to Petal; otherwise a firm member id */
  assignee: string;
  scope: ScopeKey;
  /** friendly next-run label (demo doesn't tick a real clock) */
  nextRun: string;
  active: boolean;
  lastRun?: string;
  runCount: number;
}

export const CADENCE_LABEL: Record<Cadence, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annually: "Annually",
};

export const SCOPE_LABEL: Record<"all" | "books" | "premium", string> = {
  all: "All clients",
  books: "Bookkeeping clients",
  premium: "Premium tier",
};

/** households a scope fans out to (capped so a demo run doesn't flood the queue) */
const CAP = 6;
export function matchHouseholds(scope: ScopeKey): Household[] {
  let list: Household[];
  if (scope === "all") list = households;
  else if (scope === "books") list = households.filter(h => h.hasBooks);
  else if (scope === "premium") list = households.filter(h => h.serviceTier === "Premium");
  else list = households.filter(h => h.id === scope);
  return list.slice(0, CAP);
}

export function scopeLabel(scope: ScopeKey): string {
  if (scope in SCOPE_LABEL) return SCOPE_LABEL[scope as "all" | "books" | "premium"];
  return households.find(h => h.id === scope)?.name ?? "1 client";
}

const templates: Template[] = [
  { id: "rt-est", name: "Quarterly estimated payment reminder", cadence: "quarterly", assignee: "petal", scope: "all", nextRun: "Jun 15", active: true, runCount: 0 },
  { id: "rt-books", name: "Monthly bookkeeping close", cadence: "monthly", assignee: CURRENT_USER_ID, scope: "books", nextRun: "Jul 1", active: true, runCount: 0 },
  { id: "rt-engagement", name: "Engagement letter renewal", cadence: "annually", assignee: "petal", scope: "premium", nextRun: "Dec 1", active: false, runCount: 0 },
];

let seq = 0;
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

export const recurringStore = {
  all: (): Template[] => [...templates],
  /** generate one task per matching client; returns how many were created */
  run(id: string): number {
    const tpl = templates.find(t => t.id === id);
    if (!tpl) return 0;
    const matches = matchHouseholds(tpl.scope);
    const toPetal = tpl.assignee === "petal";
    matches.forEach(h => {
      const taskId = demoStore.newId();
      demoStore.createTask({
        id: taskId, householdId: h.id, status: "todo", kind: "Task",
        title: tpl.name, why: `Recurring · ${tpl.name}`, skillId: "",
        origin: "human", assigneeId: toPetal ? undefined : tpl.assignee,
      });
      if (toPetal) demoStore.handToPetal(taskId, `Recurring job "${tpl.name}" — drafted for ${h.name}. Review and approve.`);
    });
    tpl.lastRun = "Just now";
    tpl.runCount += matches.length;
    emit();
    return matches.length;
  },
  toggle(id: string) {
    const tpl = templates.find(t => t.id === id);
    if (tpl) { tpl.active = !tpl.active; emit(); }
  },
  remove(id: string) {
    const i = templates.findIndex(t => t.id === id);
    if (i >= 0) { templates.splice(i, 1); emit(); }
  },
  create(t: Omit<Template, "id" | "runCount">) {
    templates.unshift({ ...t, id: `rt-new-${++seq}`, runCount: 0 });
    emit();
  },
};

export function useRecurring(): Template[] {
  useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
  return recurringStore.all();
}
