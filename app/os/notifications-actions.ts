"use server";

// Real notifications for the signed-in preparer, derived from RLS-scoped firm data (loadFirmData returns the
// real firm when the DB is configured + seeded, else the labeled demo fixture). Replaces the old client-side
// mock seed (RULE 1). The `demo` flag is returned so the UI can label demo data honestly.

import { loadFirmData } from "@/lib/server/firm-data";
import { deriveNotifications } from "@/lib/server/notifications-derive";
import type { Notif } from "@/lib/notifications-store";

export async function getNotificationsAction(): Promise<{ notifs: Notif[]; demo: boolean }> {
  try {
    const firm = await loadFirmData();
    return { notifs: deriveNotifications(firm), demo: firm.demo ?? false };
  } catch {
    // HONEST DEGRADATION: never fabricate — an unreachable data source yields no notifications, not fake ones.
    return { notifs: [], demo: false };
  }
}
