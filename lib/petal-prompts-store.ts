"use client";

/**
 * User-saved prompt library — small process-local store backed by
 * localStorage so saved prompts survive navigation + reload.
 *
 * Mirrors the pattern used in `form-8867-store.ts`: stable cached snapshot,
 * useSyncExternalStore-friendly subscribe API, JSON in localStorage.
 *
 * In production this would live in Convex (keyed by preparer user_id).
 */

export interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
}

const STORAGE_KEY = "petal:saved-prompts";

const prompts: SavedPrompt[] = [];
type Listener = () => void;
const listeners = new Set<Listener>();

// Stable cached snapshot — same array identity until something changes.
let cached: SavedPrompt[] = [];

function rebuildCache() {
  cached = [...prompts];
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
  } catch {
    // Ignore quota / serialization errors
  }
}

function hydrate() {
  if (typeof window === "undefined" || prompts.length > 0) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw) as SavedPrompt[];
    prompts.push(...arr);
    rebuildCache();
  } catch {
    // Corrupted JSON — start fresh
  }
}

// Hydrate on first browser-side import.
hydrate();

function emit() {
  rebuildCache();
  persist();
  listeners.forEach((l) => l());
}

export function addPetalPrompt(input: { title: string; prompt: string }): void {
  const entry: SavedPrompt = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    prompt: input.prompt.trim(),
    createdAt: new Date().toISOString(),
  };
  // Newest first
  prompts.unshift(entry);
  emit();
}

export function deletePetalPrompt(id: string): void {
  const idx = prompts.findIndex((p) => p.id === id);
  if (idx >= 0) {
    prompts.splice(idx, 1);
    emit();
  }
}

/** Stable-reference snapshot suitable for `useSyncExternalStore`. */
export function getPetalPrompts(): SavedPrompt[] {
  return cached;
}

export function subscribePetalPrompts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
