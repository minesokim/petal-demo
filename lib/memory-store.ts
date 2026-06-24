"use client";

// Client Memory — the durable, per-client facts Petal accumulates and reuses to
// ground answers and briefs. Distinct from Notes (human team threads) and from
// returns/QBO (hard data): this is the soft, cross-conversation context about a
// person. Every memory is sourced + editable; Petal *proposes* new ones and you
// approve them (suggestions → memories).
//
// This is a thin CLIENT CACHE over the real, RLS-scoped, envelope-encrypted
// client_memory table (lib/repository/memory.ts via app/os/clients/memory-actions.ts).
// The cache self-hydrates from listMemoriesAction() on first mount and every
// mutation persists through a server action then re-reads the firm's truth, so the
// three surfaces (client Memory tab, /os/memory, clients detail) keep their exact
// memoryStore.X() / useMemory() calls but render real data. Suggestions are rows
// with status "suggested"; confirming flips them to "confirmed".

import { useSyncExternalStore, useEffect } from "react";
import { householdById } from "@/lib/fixtures/firm";
import {
  listMemoriesAction,
  addMemoryAction,
  removeMemoryAction,
  togglePinMemoryAction,
  confirmMemoryAction,
  type MemoryRow,
} from "@/app/os/clients/memory-actions";

export type MemoryKind = "preference" | "fact" | "history" | "flag";

export const MEMORY_KIND_LABEL: Record<MemoryKind, string> = {
  preference: "Preference",
  fact: "Fact",
  history: "History",
  flag: "Watch",
};

export interface Memory {
  id: string;
  householdId: string;
  text: string;
  /** where Petal learned this — its provenance */
  source: string;
  kind: MemoryKind;
  pinned: boolean;
  at: string;
}

/** a fact Petal noticed but hasn't been confirmed into memory yet */
export interface MemorySuggestion {
  id: string;
  householdId: string;
  text: string;
  source: string;
  kind: MemoryKind;
}

// ── cache ─────────────────────────────────────────────────────────────────────
let rows: MemoryRow[] = [];
let version = 0;
let hydrated = false;
let hydrating = false;
let tempSeq = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

const byPin = (a: { pinned: boolean }, b: { pinned: boolean }) => Number(b.pinned) - Number(a.pinned);
const confirmedRows = () => rows.filter(r => r.status === "confirmed");
const suggestedRows = () => rows.filter(r => r.status === "suggested");
const toMemory = (r: MemoryRow): Memory => ({ id: r.id, householdId: r.householdId, text: r.text, source: r.source, kind: r.kind, pinned: r.pinned, at: r.at });
const toSuggestion = (r: MemoryRow): MemorySuggestion => ({ id: r.id, householdId: r.householdId, text: r.text, source: r.source, kind: r.kind });

// Re-read the firm's real memories. On failure we keep the prior cache rather than
// blanking the surface (honest degradation; the server action logs the error).
async function refresh() {
  try {
    rows = await listMemoriesAction();
    hydrated = true;
    emit();
  } catch {
    /* keep prior cache */
  }
}

function ensureHydrated() {
  if (hydrated || hydrating) return;
  hydrating = true;
  void refresh().finally(() => { hydrating = false; });
}

export const memoryStore = {
  all: (): Memory[] => confirmedRows().map(toMemory).sort(byPin),
  ofHousehold: (hid: string): Memory[] =>
    confirmedRows().filter(r => r.householdId === hid).map(toMemory).sort(byPin),
  suggestionsOf: (hid: string): MemorySuggestion[] =>
    suggestedRows().filter(r => r.householdId === hid).map(toSuggestion),
  allSuggestions: (): MemorySuggestion[] => suggestedRows().map(toSuggestion),
  countOf: (hid: string) => confirmedRows().filter(r => r.householdId === hid).length,
  /** households that have any memory, with counts — for the firm-wide view */
  byHousehold: () => {
    const map = new Map<string, Memory[]>();
    confirmedRows().forEach(r => { if (!map.has(r.householdId)) map.set(r.householdId, []); map.get(r.householdId)!.push(toMemory(r)); });
    return [...map.entries()]
      .map(([hid, list]) => ({ householdId: hid, name: householdById(hid)?.name ?? "—", memories: list.sort(byPin) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  add(householdId: string, text: string, kind: MemoryKind = "fact", source = "Added by you · just now") {
    const t = text.trim();
    if (!t) return;
    // optimistic insert so the surface responds instantly; refresh() reconciles to the
    // real (encrypted, server-issued) row when the action returns.
    const tempId = `mem-temp-${++tempSeq}`;
    rows = [{ id: tempId, householdId, text: t, source, kind, status: "confirmed", pinned: false, at: new Date().toISOString() }, ...rows];
    emit();
    void addMemoryAction({ householdId, text: t, kind, source }).then(refresh);
  },
  remove(id: string) {
    rows = rows.filter(r => r.id !== id);
    emit();
    void removeMemoryAction(id).then(refresh);
  },
  togglePin(id: string) {
    rows = rows.map(r => r.id === id ? { ...r, pinned: !r.pinned } : r);
    emit();
    void togglePinMemoryAction(id).then(refresh);
  },
  /** approve a Petal suggestion → it becomes a memory */
  confirm(suggestionId: string) {
    rows = rows.map(r => r.id === suggestionId ? { ...r, status: "confirmed" } : r);
    emit();
    void confirmMemoryAction(suggestionId).then(refresh);
  },
  dismissSuggestion(suggestionId: string) {
    rows = rows.filter(r => r.id !== suggestionId);
    emit();
    void removeMemoryAction(suggestionId).then(refresh);
  },
};

export function useMemory(): number {
  // Hydrate from the real table on first client mount (no-op on the server snapshot).
  useEffect(() => { ensureHydrated(); }, []);
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
}
