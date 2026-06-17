"use client";

// Connections — session connect/disconnect over the integrations catalog. Connecting
// flips status live (with a freshly-stamped account + sync), so the Connections page,
// counts, and any "is X connected?" checks move in the demo. Resets on reload.

import { useSyncExternalStore } from "react";
import { integrations, type Integration } from "@/lib/os-integrations";

type Status = "connected" | "available";
const overrides = new Map<string, Status>();
const accountOverride = new Map<string, string>();
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

function statusOf(i: Integration): Status {
  return overrides.get(i.id) ?? i.status;
}

export const connectionStore = {
  statusOf,
  isConnected: (id: string) => {
    const i = integrations.find(x => x.id === id);
    return i ? statusOf(i) === "connected" : false;
  },
  /** the catalog with live status / account applied */
  all: (): Integration[] =>
    integrations.map(i => {
      const status = statusOf(i);
      if (status === i.status && !accountOverride.has(i.id)) return i;
      return {
        ...i,
        status,
        account: accountOverride.get(i.id) ?? (status === "connected" ? i.account ?? "antonio@vazant.tax" : undefined),
        lastSync: status === "connected" ? i.lastSync ?? "Just now" : undefined,
      };
    }),
  connect(id: string) {
    overrides.set(id, "connected");
    const i = integrations.find(x => x.id === id);
    if (i && !i.account) accountOverride.set(id, "Just now");
    emit();
  },
  disconnect(id: string) { overrides.set(id, "available"); accountOverride.delete(id); emit(); },
  connectedCount: () => integrations.filter(i => statusOf(i) === "connected").length,
};

export function useConnections(): Integration[] {
  useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
  return connectionStore.all();
}
