"use client";

/**
 * Session-only flag store — holds runtime additions to `clientIssues` from
 * `issues-mock-data.ts`. Anything written here is treated as a "user-created"
 * flag (source: "manual" by default, can be "ai" for Petal-pushed flags).
 *
 * Pattern mirrors `pipeline-stage-store` and `client-assignment-store`:
 * subscribe / snapshot / immutable read.
 *
 * Why a separate store: the mock data file is module-scope and immutable
 * at runtime. We can't mutate the array directly because of HMR/server-side
 * import semantics. So this store layers on top — any consumer that wants
 * "all open flags for client X" merges the mock data + this store.
 */

import * as React from "react";
import type { ClientIssue } from "@/lib/issues-mock-data";

const newFlags: ClientIssue[] = [];
const resolvedIds = new Set<string>(); // for tracking session resolutions of mock items
const listeners = new Set<() => void>();

// Cached snapshot — useSyncExternalStore compares snapshots via Object.is,
// so we MUST return the same reference unless data actually changed.
// Returning a new object literal each call = infinite re-render loop.
let cachedSnapshot: {
  flags: readonly ClientIssue[];
  resolved: ReadonlySet<string>;
} = { flags: newFlags, resolved: resolvedIds };

function bumpSnapshot() {
  cachedSnapshot = { flags: [...newFlags], resolved: new Set(resolvedIds) };
}

function notify() {
  bumpSnapshot();
  listeners.forEach((fn) => fn());
}

export function subscribeClientIssues(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return cachedSnapshot;
}

// Stable server snapshot — same reference every call (empty state for SSR).
const stableServer = {
  flags: [] as readonly ClientIssue[],
  resolved: new Set<string>() as ReadonlySet<string>,
};
function getServerSnapshot() {
  return stableServer;
}

/** Append a new flag at runtime. Returns the created ClientIssue. */
export function addClientFlag(input: {
  clientId: string;
  title: string;
  description?: string;
  source?: "ai" | "manual";
  aiReason?: string;
  sourceDocumentId?: string;
}): ClientIssue {
  const flag: ClientIssue = {
    id: `iss-runtime-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    clientId: input.clientId,
    title: input.title,
    description: input.description ?? "",
    source: input.source ?? "manual",
    status: "open",
    createdAt: new Date().toISOString(),
    aiReason: input.aiReason,
    sourceDocumentId: input.sourceDocumentId,
  };
  newFlags.unshift(flag);
  notify();
  return flag;
}

/** Mark a flag (by id) as resolved in-session. Works for both runtime-added
 *  flags and mock data flags. */
export function resolveClientFlag(id: string): void {
  resolvedIds.add(id);
  notify();
}

/** Un-resolve (restore) a flag — used by undo affordances. */
export function unresolveClientFlag(id: string): void {
  resolvedIds.delete(id);
  notify();
}

/** React hook: returns the current snapshot. Re-renders on any write. */
export function useClientIssuesStore() {
  return React.useSyncExternalStore(subscribeClientIssues, getSnapshot, getServerSnapshot);
}

/** Non-reactive read for derivations / filtering / counts. */
export function getRuntimeFlags(): readonly ClientIssue[] {
  return newFlags;
}

export function getRuntimeResolved(): ReadonlySet<string> {
  return resolvedIds;
}
