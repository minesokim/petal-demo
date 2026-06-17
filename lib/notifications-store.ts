"use client";

// Notification center — the current user's (Antonio's) inbox: @mentions from
// teammates, approvals ready, assignments, and sync alerts. Seeded; reading marks
// items read and moves the unread badge. Session-only.

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

const seed: Notif[] = [
  { id: "nf-1", kind: "mention", title: "Elena Reyes mentioned you", body: "Park Family Dental · the Q2 books look off — can you confirm the payroll JE before we file?", actorId: "u-elena", href: "/os/clients/h-park?panel=Notes", at: "12m", read: false },
  { id: "nf-2", kind: "approval", title: "3 returns ready for your sign-off", body: "Petal finished its pass — review and approve in Review mode.", href: "/os/review", at: "1h", read: false },
  { id: "nf-3", kind: "assignment", title: "Raj Patel assigned you a task", body: "Chen Household · 1040 second review before transmit.", actorId: "u-raj", href: "/os/clients/h-chen", at: "2h", read: false },
  { id: "nf-4", kind: "sync", title: "QuickBooks synced 14 invoices", body: "Reconciled against billing — nothing needs you.", href: "/os/connections", at: "3h", read: true },
  { id: "nf-5", kind: "mention", title: "Daniel Okonkwo mentioned you", body: "Sandoval Plumbing · flagged the payroll filing, waiting on you.", actorId: "u-daniel", href: "/os/clients/h-sandoval?panel=Notes", at: "Yesterday", read: true },
];

const items: Notif[] = [...seed];
let seq = 0;
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

export const notificationsStore = {
  all: (): Notif[] => [...items],
  unreadCount: () => items.filter(n => !n.read).length,
  markRead(id: string) { const n = items.find(x => x.id === id); if (n && !n.read) { n.read = true; emit(); } },
  markAllRead() { let changed = false; items.forEach(n => { if (!n.read) { n.read = true; changed = true; } }); if (changed) emit(); },
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
