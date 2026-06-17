"use client";

// Client Memory — the durable, per-client facts Petal accumulates and reuses to
// ground answers and briefs. Distinct from Notes (human team threads) and from
// returns/QBO (hard data): this is the soft, cross-conversation context about a
// person. Every memory is sourced + editable; Petal *proposes* new ones and you
// approve them (suggestions → memories). Session-only, like the rest of the demo.

import { useSyncExternalStore } from "react";
import { householdById } from "@/lib/fixtures/firm";

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

let seq = 0;

const memories: Memory[] = [
  m("h-chen", "Spouse Lin manages all document uploads and signatures", "From intake", "preference"),
  m("h-chen", "Holds K-1s from two partnerships — Golden Spoon LLC and Riverside", "From the 2024 return", "fact"),
  m("h-chen", "Prefers a year-end planning call in November before estimates are due", "From a call · Nov 2024", "preference"),
  m("h-fuentes", "Roberto prefers phone calls over email for anything time-sensitive", "From a call · Jun 23", "preference", true),
  m("h-fuentes", "Took an S-corp election in 2022; reasonable-comp set at $90k", "From the 2023 return", "history"),
  m("h-fuentes", "Reasonable-compensation question was flagged last year — revisit for 2025", "From a prior review", "flag", true),
  m("h-park", "Dental practice runs quarterly payroll through Gusto", "From QuickBooks + Gusto", "fact"),
  m("h-park", "Owner asked about a Solo 401(k) for the 2025 plan year", "From a message · May 2025", "flag"),
  m("h-williams", "First-year client — moved over from a national chain, wants more hand-holding", "From intake", "history"),
  m("h-williams", "W-2 from Hartline Logistics arrives late every year (mid-Feb)", "From the 2023 + 2024 returns", "fact"),
  m("h-rodriguez", "MFJ with a rental; 2024 accepted with a $2,840 refund", "From the 2024 return", "history"),
  m("h-sandoval", "Plumbing S-corp plus a personal 1040 — keep the two engagements linked", "From the engagement setup", "fact"),
];

const suggestions: MemorySuggestion[] = [
  s("h-chen", "Mentioned a new baby in a recent message — possible dependent change / Child Tax Credit", "From Ask Petal · today", "flag"),
  s("h-fuentes", "Said they may sell a box truck this year — possible §179 / depreciation planning", "From a call · Jun 23", "flag"),
  s("h-park", "Asked whether the hygienist should be W-2 or 1099 — worth a documented answer", "From a message", "flag"),
];

function m(householdId: string, text: string, source: string, kind: MemoryKind, pinned = false): Memory {
  return { id: `mem-${householdId}-${++seq}`, householdId, text, source, kind, pinned, at: "" };
}
function s(householdId: string, text: string, source: string, kind: MemoryKind): MemorySuggestion {
  return { id: `sug-${householdId}-${++seq}`, householdId, text, source, kind };
}

let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

export const memoryStore = {
  all: (): Memory[] => [...memories].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
  ofHousehold: (hid: string): Memory[] =>
    memories.filter(x => x.householdId === hid).sort((a, b) => Number(b.pinned) - Number(a.pinned)),
  suggestionsOf: (hid: string): MemorySuggestion[] => suggestions.filter(x => x.householdId === hid),
  allSuggestions: (): MemorySuggestion[] => [...suggestions],
  countOf: (hid: string) => memories.filter(x => x.householdId === hid).length,
  /** households that have any memory, with counts — for the firm-wide view */
  byHousehold: () => {
    const map = new Map<string, Memory[]>();
    memories.forEach(x => { if (!map.has(x.householdId)) map.set(x.householdId, []); map.get(x.householdId)!.push(x); });
    return [...map.entries()]
      .map(([hid, list]) => ({ householdId: hid, name: householdById(hid)?.name ?? "—", memories: list.sort((a, b) => Number(b.pinned) - Number(a.pinned)) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  add(householdId: string, text: string, kind: MemoryKind = "fact", source = "Added by you · just now") {
    const t = text.trim();
    if (!t) return;
    memories.unshift({ id: `mem-new-${++seq}`, householdId, text: t, source, kind, pinned: false, at: "" });
    emit();
  },
  remove(id: string) { const i = memories.findIndex(x => x.id === id); if (i >= 0) { memories.splice(i, 1); emit(); } },
  togglePin(id: string) { const x = memories.find(y => y.id === id); if (x) { x.pinned = !x.pinned; emit(); } },
  /** approve a Petal suggestion → it becomes a memory */
  confirm(suggestionId: string) {
    const i = suggestions.findIndex(x => x.id === suggestionId);
    if (i < 0) return;
    const sug = suggestions[i];
    suggestions.splice(i, 1);
    memories.unshift({ id: `mem-new-${++seq}`, householdId: sug.householdId, text: sug.text, source: `${sug.source} · confirmed`, kind: sug.kind, pinned: false, at: "" });
    emit();
  },
  dismissSuggestion(suggestionId: string) {
    const i = suggestions.findIndex(x => x.id === suggestionId);
    if (i >= 0) { suggestions.splice(i, 1); emit(); }
  },
};

export function useMemory(): number {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
}
