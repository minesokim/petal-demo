"use client";

// Demo-session task store — the single live source for the queue.
// Holds the canonical fixture tasks PLUS anything created this session, with
// per-task status overrides so approvals, "mark done", and "hand to Petal"
// MOVE the numbers in real time (sidebar badge, Today, Tasks, Review).
// Session-only: reloading resets the world to the canonical fixtures.

import { useSyncExternalStore } from "react";
import { tasks as canonicalTasks } from "@/lib/fixtures/firm";
import { NEEDS_YOU_STATUSES, type TaskStatus } from "@/lib/fixtures/vocab";
import type { Task } from "@/lib/fixtures/firm";

const resolved = new Set<string>();               // legacy: read as status "done"
const overrides = new Map<string, TaskStatus>();  // live status per task id
const created: Task[] = [];                        // human-created tasks this session
const handTimers = new Map<string, ReturnType<typeof setTimeout>>();
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach(l => l());
}

/** the live status of a task — override wins, then legacy-resolved, then canonical */
function statusOf(t: Task): TaskStatus {
  return overrides.get(t.id) ?? (resolved.has(t.id) ? "done" : t.status);
}

let seq = 0;

export const demoStore = {
  // ── reads ──
  isResolved: (id: string) => resolved.has(id) || overrides.get(id) === "done",
  resolvedCount: () => resolved.size + [...overrides.values()].filter(s => s === "done").length,
  statusOf,
  /** canonical + created, with live status applied */
  allTasks: (): Task[] => [...created, ...canonicalTasks].map(t => ({ ...t, status: statusOf(t) })),
  byId: (id: string): Task | null => {
    const t = created.find(x => x.id === id) ?? canonicalTasks.find(x => x.id === id);
    return t ? { ...t, status: statusOf(t) } : null;
  },

  // ── writes ──
  resolve(id: string) {
    if (!resolved.has(id)) { resolved.add(id); overrides.set(id, "done"); emit(); }
  },
  setStatus(id: string, status: TaskStatus) {
    overrides.set(id, status);
    if (status === "done") resolved.add(id);
    emit();
  },
  createTask(t: Omit<Task, "estimatedMin"> & { estimatedMin?: number }) {
    created.unshift({ estimatedMin: 0, ...t });
    emit();
  },
  /** delegate a human task to Petal: it runs, then comes back as an approval */
  handToPetal(id: string, draft?: string) {
    overrides.set(id, "running");
    if (draft) {
      const t = created.find(x => x.id === id);
      if (t) t.draftText = draft;
    }
    emit();
    if (handTimers.has(id)) clearTimeout(handTimers.get(id)!);
    handTimers.set(id, setTimeout(() => {
      overrides.set(id, "ready_to_approve");
      handTimers.delete(id);
      emit();
    }, 1500));
  },
  newId: () => `t-new-${Date.now()}-${++seq}`,

  reset() {
    if (resolved.size || overrides.size || created.length) {
      resolved.clear(); overrides.clear(); created.length = 0;
      handTimers.forEach(clearTimeout); handTimers.clear();
      emit();
    }
  },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** re-render when the demo session changes; SSR snapshot is the untouched world */
export function useDemoVersion(): number {
  return useSyncExternalStore(subscribe, () => version, () => 0);
}

/** the full live task list (canonical + created, statuses applied) */
export function useAllTasks(): Task[] {
  useDemoVersion();
  return demoStore.allTasks();
}

/** the live "needs you" queue — Petal approvals only (kept clean of human to-dos) */
export function useLiveNeedsYou(): Task[] {
  useDemoVersion();
  return demoStore.allTasks().filter(t => (NEEDS_YOU_STATUSES as TaskStatus[]).includes(t.status));
}
