"use client";

// Demo-session store — lets approvals MOVE the numbers during a live demo.
// Resolving a task in Review mode (or anywhere) decrements the needs-you count
// across the sidebar badge, Today, and Tasks in real time. Session-only:
// reloading the page resets the world to the canonical fixtures.

import { useSyncExternalStore } from "react";
import { needsYouTasks } from "@/lib/fixtures/derive";
import type { Task } from "@/lib/fixtures/firm";

const resolved = new Set<string>();
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach(l => l());
}

export const demoStore = {
  resolve(id: string) {
    if (!resolved.has(id)) {
      resolved.add(id);
      emit();
    }
  },
  isResolved: (id: string) => resolved.has(id),
  resolvedCount: () => resolved.size,
  reset() {
    if (resolved.size) {
      resolved.clear();
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

/** the live "needs you" queue — canonical tasks minus what this session resolved */
export function useLiveNeedsYou(): Task[] {
  useDemoVersion();
  return needsYouTasks().filter(t => !demoStore.isResolved(t.id));
}
