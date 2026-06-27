// Derive the notification center from REAL firm data (RULE 1: no fabricated notifications). Today it maps the
// pending agent action_proposals — the human-commit gate — to "approval" notifications, the same proposals the
// Tasks/Review surfaces render. On the demo fixture (proposals: []) this is honestly EMPTY rather than fake.
//
// ROADMAP (see the real-data backbone slice): @mention comments, task assignments, and connector sync alerts
// as additional sources; a persisted per-user read-state table (so read survives reload); and realtime push
// via a Supabase subscription instead of a fetch-on-open.

import type { Notif } from "../notifications-store";
import type { FirmData } from "./fixture-data";

/** ISO timestamp → a compact relative label ("12m", "3h", "2d", "Just now"). */
export function relativeTime(iso: string, nowMs: number): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const s = Math.max(0, Math.floor((nowMs - then) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d}d`;
}

/**
 * Map real firm data to the current user's notifications. Pure + deterministic given `nowMs` (so it is unit-
 * testable). Source today = pending action_proposals; everything else is roadmapped.
 */
export function deriveNotifications(firm: FirmData, nowMs: number = Date.now()): Notif[] {
  const out: Notif[] = [];

  // Pending agent action_proposals → "approval" notifications (the human-commit gate).
  for (const p of firm.proposals ?? []) {
    out.push({
      id: `prop-${p.id}`,
      kind: "approval",
      title: p.humanMustSubmit ? "An action needs your final submit" : "Petal staged an action for review",
      body: p.rationale,
      href: "/os/review",
      at: relativeTime(p.createdAt, nowMs),
      read: false,
    });
  }

  return out;
}
