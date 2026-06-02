"use client";

/**
 * Client → assignee override store (session-only).
 *
 * Pattern mirrors `pipeline-stage-store`: a small subscribe-able cache of
 * runtime overrides on top of immutable mock data. The clients list reads
 * `client.assignedTo` from `lib/mock-data.ts` first, then layers any
 * runtime override from this store on top.
 *
 * Why session-only: this is a demo. We don't want a tester's reassignments
 * to leak between sessions. Convex will own the real persistence layer.
 */

import * as React from "react";

const overrides: Record<string, string | null> = {};
const listeners = new Set<() => void>();

// Cached snapshot — useSyncExternalStore needs a stable reference between
// renders to avoid the "getSnapshot should be cached" infinite-loop guard.
// We bump the cached object only on mutation.
let cachedOverrides: Record<string, string | null> = { ...overrides };

/** Update or clear an assignment. Passing `null` records "explicitly
 *  unassigned" so the seed value doesn't reappear. */
export function setAssigneeOverride(clientId: string, memberId: string | null): void {
  overrides[clientId] = memberId;
  cachedOverrides = { ...overrides };
  listeners.forEach((fn) => fn());
}

/** Snapshot — used by hooks via useSyncExternalStore. */
function getSnapshot(): Record<string, string | null> {
  return cachedOverrides;
}

/** Subscribe to override changes. Exported so other surfaces can react to
 *  reassignments made elsewhere (e.g., the clients-list page re-renders
 *  when the popup dialog reassigns a client). */
export function subscribeAssignmentOverrides(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const subscribe = subscribeAssignmentOverrides;

/** React hook: returns the current effective assignee for a client.
 *  Re-renders when the override changes. */
export function useEffectiveAssignee(
  clientId: string,
  seed: string | undefined
): string | undefined {
  const ovs = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  if (clientId in ovs) {
    const v = ovs[clientId];
    return v ?? undefined;
  }
  return seed;
}

/** Non-reactive lookup — useful in filters/memoized derivations where you
 *  already depend on the override-map snapshot. Returns the cached reference
 *  so consumers using useSyncExternalStore get a stable identity. */
export function getAllAssignmentOverrides(): Record<string, string | null> {
  return cachedOverrides;
}

/** Apply all overrides to a list of clients in-place (read-only — returns a
 *  new array). Mirrors `applyStageOverrides`. */
export function applyAssignmentOverrides<T extends { id: string; assignedTo?: string }>(
  list: T[]
): T[] {
  return list.map((c) => {
    if (!(c.id in overrides)) return c;
    const v = overrides[c.id];
    return { ...c, assignedTo: v ?? undefined };
  });
}
