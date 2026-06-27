"use client";

// Notification center — the current user's inbox: approvals ready (pending agent action_proposals), and (on
// the roadmap) @mentions, assignments, and sync alerts. NO fabricated seed (RULE 1): the bell HYDRATES from
// the server (getNotificationsAction → real RLS-scoped firm data), so the demo shows real-but-empty rather
// than fake data. Reading marks items read in-session (persisted read-state is roadmapped).

import { useSyncExternalStore } from "react";

export type NotifKind = "mention" | "approval" | "sync" | "assignment";

export interface Notif {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  /** firm member who triggered it (for the avatar); absent for Petal/system */
  actorId?: string;
  href?: string;
  at: string;
  read: boolean;
}

// Starts EMPTY — populated by hydrate() from the server-derived real notifications. No mock seed.
const items: Notif[] = [];
const readIds = new Set<string>(); // in-session read marks, preserved across re-hydration
let seq = 0;
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

export const notificationsStore = {
  all: (): Notif[] => [...items],
  unreadCount: () => items.filter(n => !n.read).length,
  // Replace the list with the server-derived real notifications, preserving any in-session read marks.
  hydrate(next: Notif[]) {
    items.length = 0;
    for (const n of next) items.push({ ...n, read: n.read || readIds.has(n.id) });
    emit();
  },
  markRead(id: string) { readIds.add(id); const n = items.find(x => x.id === id); if (n && !n.read) { n.read = true; emit(); } },
  markAllRead() { let changed = false; items.forEach(n => { readIds.add(n.id); if (!n.read) { n.read = true; changed = true; } }); if (changed) emit(); },
  add(n: Omit<Notif, "id" | "read" | "at"> & { at?: string }) {
    items.unshift({ id: `nf-new-${++seq}`, read: false, at: n.at ?? "Just now", ...n });
    emit();
  },
};

export function useNotifications(): Notif[] {
  useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
  return notificationsStore.all();
}
