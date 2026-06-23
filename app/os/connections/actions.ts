"use server";

import { withFirm } from "@/lib/auth/tenant";
import { initiateConnection, getConnectionStatus } from "@/lib/connectors/composio";
import { upsertConnection, pendingConnections, listConnections } from "@/lib/repository/connections";

// Composio toolkit slug → os-integrations catalog id (reverse of TOOLKIT below).
const TOOLKIT_TO_ID: Record<string, string> = {
  gmail: "gmail", quickbooks: "qbo", googlecalendar: "gcal", outlook: "outlook", xero: "xero", dropbox: "dropbox", one_drive: "onedrive",
};
// Real connection status for the signed-in firm, as catalog ids. Returns null when not
// signed in, so the connections page falls back to the mockup's catalog defaults (1:1).
export async function getConnectedToolkitsAction(): Promise<string[] | null> {
  return withFirm(async (db) => {
    const conns = await listConnections(db);
    return conns.filter((c) => c.status === "connected").map((c) => TOOLKIT_TO_ID[c.toolkit]).filter(Boolean);
  });
}

// os-integrations id → Composio toolkit slug. Only API connectors map here; browser
// connectors (OLT etc., kind === "browser") use the extension flow, not Composio.
const TOOLKIT: Record<string, string> = {
  gmail: "gmail",
  qbo: "quickbooks",
  gcal: "googlecalendar",
  outlook: "outlook",
  xero: "xero",
  dropbox: "dropbox",
  onedrive: "one_drive",
};

// Start an OAuth connect: get the hosted authorize URL + persist a pending row.
// The client redirects the preparer to redirectUrl; status flips on sync after authorize.
export async function connectAppAction(integrationId: string): Promise<{ redirectUrl: string } | { error: string }> {
  const toolkit = TOOLKIT[integrationId];
  if (!toolkit) return { error: "This app isn't an OAuth connector." };
  const result = await withFirm(async (db, ctx) => {
    const { redirectUrl, connectedAccountId } = await initiateConnection(toolkit, `firm_${ctx.firmId}`);
    await upsertConnection(db, ctx, { toolkit, status: "pending", composioConnectionId: connectedAccountId });
    return { redirectUrl };
  });
  return result ?? { error: "Not signed in." };
}

// Poll Composio for each pending connection and persist the resolved status. Safe to
// call on the connections page load / after the authorize round-trip.
export async function syncConnectionsAction(): Promise<void> {
  await withFirm(async (db, ctx) => {
    const pending = await pendingConnections(db);
    for (const c of pending) {
      if (!c.composioConnectionId) continue;
      const { status } = await getConnectionStatus(c.composioConnectionId);
      const mapped = status === "ACTIVE" ? "connected" : status === "FAILED" || status === "EXPIRED" ? "error" : "pending";
      if (mapped !== "pending") await upsertConnection(db, ctx, { toolkit: c.toolkit, status: mapped, composioConnectionId: c.composioConnectionId });
    }
  });
}
