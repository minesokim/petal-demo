"use client";

// Record comments — internal team threads scoped to a client (household id) or a
// return (engagement id), shown in the record's Notes rail. Posting a comment that
// @mentions Petal gets a Petal reply in-thread (the agentic layer, in collaboration).
// Session-only; seeded with a couple of teammate threads.

import { useSyncExternalStore } from "react";

export interface Comment {
  id: string;
  scopeId: string;
  /** firm member id, or "petal" */
  authorId: string;
  body: string;
  at: string;
}

const seed: Comment[] = [
  { id: "cm-park-1", scopeId: "h-park", authorId: "u-elena", body: "@Antonio the Q2 books look off — can you confirm the payroll JE before we file?", at: "12m" },
  { id: "cm-sandoval-1", scopeId: "h-sandoval", authorId: "u-daniel", body: "@Antonio flagged the payroll filing for Sandoval, waiting on you before I e-file.", at: "Yesterday" },
  { id: "cm-chen-1", scopeId: "h-chen", authorId: "u-raj", body: "Second review done — K-1s tie out. Good to transmit once the 8879 is back.", at: "2h" },
];

const items: Comment[] = [...seed];
let seq = 0;
let version = 0;
const listeners = new Set<() => void>();
const petalTimers = new Set<ReturnType<typeof setTimeout>>();
function emit() { version++; listeners.forEach(l => l()); }

export const commentsStore = {
  of: (scopeId: string): Comment[] => items.filter(c => c.scopeId === scopeId),
  countOf: (scopeId: string) => items.filter(c => c.scopeId === scopeId).length,
  add(scopeId: string, authorId: string, body: string) {
    const text = body.trim();
    if (!text) return;
    items.push({ id: `cm-new-${++seq}`, scopeId, authorId, body: text, at: "Just now" });
    emit();
    // @Petal → Petal replies in-thread after a beat
    if (/@petal\b/i.test(text)) {
      const t = setTimeout(() => {
        items.push({
          id: `cm-petal-${++seq}`,
          scopeId,
          authorId: "petal",
          body: "On it — I pulled the latest figures and drafted a reply. It's in your approval queue when you're ready.",
          at: "Just now",
        });
        petalTimers.delete(t);
        emit();
      }, 1300);
      petalTimers.add(t);
    }
  },
};

export function useComments(scopeId: string): Comment[] {
  useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
  return commentsStore.of(scopeId);
}
