"use client";

/**
 * Pipeline stage override store.
 *
 * The original `client.returnStage` lives in `lib/mock-data.ts` (static).
 * This store layers user-driven and AI-driven stage mutations on top —
 * drag-and-drop in the Kanban, AI auto-advance, and manual moves all write
 * here. Other surfaces (popup, overview page, etc.) can read the effective
 * stage with `getClientStage(id, fallback)`.
 *
 * Same persistence pattern as form-8867-store / petal-prompts-store —
 * localStorage so moves survive reload, stable cached snapshot for
 * useSyncExternalStore consumers.
 */

import type { ReturnStage } from "@/lib/mock-data";

export type StageChangeSource = "manual" | "ai";

export interface StageMoveLogEntry {
  clientId: string;
  from: ReturnStage;
  to: ReturnStage;
  by: StageChangeSource;
  at: string;
  /** Optional human-readable note — e.g. "All docs received + deposit paid" for AI moves. */
  reason?: string;
}

const STAGE_STORAGE_KEY = "petal:pipeline-stages";
const LOG_STORAGE_KEY = "petal:pipeline-stage-log";

const overrides = new Map<string, ReturnStage>();
const moveLog: StageMoveLogEntry[] = [];

type Listener = () => void;
const listeners = new Set<Listener>();

// Stable cached snapshot — same identity until something changes.
let cachedOverrides: Record<string, ReturnStage> = {};
let cachedLog: StageMoveLogEntry[] = [];

function rebuildCache() {
  cachedOverrides = Object.fromEntries(overrides.entries());
  cachedLog = [...moveLog];
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STAGE_STORAGE_KEY, JSON.stringify(Array.from(overrides.entries())));
    window.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(moveLog));
  } catch {
    // Ignore quota / serialization errors
  }
}

function hydrate() {
  if (typeof window === "undefined" || overrides.size > 0) return;
  try {
    const rawStages = window.localStorage.getItem(STAGE_STORAGE_KEY);
    if (rawStages) {
      const entries = JSON.parse(rawStages) as Array<[string, ReturnStage]>;
      for (const [k, v] of entries) overrides.set(k, v);
    }
    const rawLog = window.localStorage.getItem(LOG_STORAGE_KEY);
    if (rawLog) {
      const arr = JSON.parse(rawLog) as StageMoveLogEntry[];
      moveLog.push(...arr);
    }
    rebuildCache();
  } catch {
    // Corrupted JSON — start fresh
  }
}

hydrate();

function emit() {
  rebuildCache();
  persist();
  listeners.forEach((l) => l());
}

/**
 * Set a client's effective stage. Returns an `undo()` function that restores
 * the previous stage (used by the AI auto-advance Undo toast).
 */
export function setClientStage(
  clientId: string,
  to: ReturnStage,
  by: StageChangeSource,
  fromFallback: ReturnStage,
  reason?: string
): () => void {
  const from = overrides.get(clientId) ?? fromFallback;
  if (from === to) return () => {};
  overrides.set(clientId, to);
  moveLog.unshift({
    clientId,
    from,
    to,
    by,
    at: new Date().toISOString(),
    reason,
  });
  // Cap log to last 200 entries
  if (moveLog.length > 200) moveLog.length = 200;
  emit();
  return () => {
    // Undo — restore prior stage and prepend a counter-entry
    overrides.set(clientId, from);
    moveLog.unshift({
      clientId,
      from: to,
      to: from,
      by,
      at: new Date().toISOString(),
      reason: "undo",
    });
    if (moveLog.length > 200) moveLog.length = 200;
    emit();
  };
}

/** Look up the effective stage for a client. Falls back to the mock's stage. */
export function getClientStage(clientId: string, fallback: ReturnStage): ReturnStage {
  return overrides.get(clientId) ?? fallback;
}

/** Remove a stage override entirely (revert to the mock's original stage). */
export function clearClientStage(clientId: string): void {
  if (!overrides.has(clientId)) return;
  overrides.delete(clientId);
  emit();
}

/** Stable-reference snapshot of all overrides. Use as useSyncExternalStore getSnapshot. */
export function getAllStageOverrides(): Record<string, ReturnStage> {
  return cachedOverrides;
}

/** Stable-reference snapshot of the move log. Newest first. */
export function getStageMoveLog(): StageMoveLogEntry[] {
  return cachedLog;
}

export function subscribePipelineStages(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
