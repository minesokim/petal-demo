"use client";

// 8879 e-sign loop — the signature lifecycle for a return's e-file authorization.
// not_sent → sent → viewed → signed (by the taxpayer) → completed (ERO countersigns
// and the return transmits). Sending auto-advances to "signed" (demo); the ERO then
// countersigns to transmit. When the client signs, a notification lands. Session-only.

import { useSyncExternalStore } from "react";
import { notificationsStore } from "@/lib/notifications-store";

export type EsignStatus = "not_sent" | "sent" | "viewed" | "signed" | "completed";

export const ESIGN_STEPS: { key: Exclude<EsignStatus, "not_sent">; label: string }[] = [
  { key: "sent", label: "Sent" },
  { key: "viewed", label: "Viewed" },
  { key: "signed", label: "Signed" },
  { key: "completed", label: "Filed" },
];
const RANK: Record<EsignStatus, number> = { not_sent: 0, sent: 1, viewed: 2, signed: 3, completed: 4 };
export const esignRank = (s: EsignStatus) => RANK[s];

interface Envelope {
  engagementId: string;
  status: EsignStatus;
  signerName: string;
  href?: string;
}

// seed: Fuentes 1120-S is already out for signature (matches the fixture blockedBy)
const envelopes = new Map<string, Envelope>([
  ["en-fuentes-s", { engagementId: "en-fuentes-s", status: "viewed", signerName: "Roberto Fuentes", href: "/os/returns/en-fuentes-s" }],
]);
const timers = new Map<string, ReturnType<typeof setTimeout>[]>();
let version = 0;
const listeners = new Set<() => void>();
function emit() { version++; listeners.forEach(l => l()); }

function clearTimers(id: string) {
  (timers.get(id) ?? []).forEach(clearTimeout);
  timers.delete(id);
}

export const esignStore = {
  /** the live envelope status, or null when none has been created */
  statusOf: (engagementId: string): EsignStatus | null => envelopes.get(engagementId)?.status ?? null,
  signerOf: (engagementId: string): string | undefined => envelopes.get(engagementId)?.signerName,

  /** send the 8879 for signature; auto-advances viewed → signed for the demo */
  send(engagementId: string, signerName: string, href?: string) {
    envelopes.set(engagementId, { engagementId, status: "sent", signerName, href });
    emit();
    clearTimers(engagementId);
    const t1 = setTimeout(() => { const e = envelopes.get(engagementId); if (e && e.status === "sent") { e.status = "viewed"; emit(); } }, 1100);
    const t2 = setTimeout(() => {
      const e = envelopes.get(engagementId);
      if (e && (e.status === "viewed" || e.status === "sent")) {
        e.status = "signed";
        emit();
        notificationsStore.add({ kind: "approval", title: `${signerName} signed the 8879`, body: "Countersign to transmit the return.", href });
      }
    }, 2600);
    timers.set(engagementId, [t1, t2]);
  },

  /** demo: a reminder prompts the client to sign shortly after */
  remind(engagementId: string) {
    const e = envelopes.get(engagementId);
    if (!e || (e.status !== "sent" && e.status !== "viewed")) return;
    clearTimers(engagementId);
    const t = setTimeout(() => {
      const env = envelopes.get(engagementId);
      if (env && (env.status === "sent" || env.status === "viewed")) {
        env.status = "signed";
        emit();
        notificationsStore.add({ kind: "approval", title: `${env.signerName} signed the 8879`, body: "Countersign to transmit the return.", href: env.href });
      }
    }, 1300);
    timers.set(engagementId, [t]);
  },

  /** ERO countersigns → return transmits */
  countersign(engagementId: string) {
    const e = envelopes.get(engagementId);
    if (!e) return;
    clearTimers(engagementId);
    e.status = "completed";
    emit();
  },
};

export function useEsign(): number {
  return useSyncExternalStore(
    cb => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
}
