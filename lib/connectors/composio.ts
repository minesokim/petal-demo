// ⑤ Composio client — thin wrapper over the verified v3 REST API. OAuth tokens
// live in Composio (never our DB); we only ever hold the connection id + status.
// Flow: ensureAuthConfig → connected_accounts/link → user authorizes → poll status.

const BASE = "https://backend.composio.dev/api/v3";

function apiKey(): string {
  const k = process.env.COMPOSIO_API_KEY;
  if (!k) throw new Error("COMPOSIO_API_KEY is not set");
  return k;
}

async function composio<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "x-api-key": apiKey(), "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Composio ${path} -> ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// Get-or-create a Composio-managed OAuth auth_config for a toolkit (gmail, quickbooks, …).
export async function ensureAuthConfig(toolkit: string): Promise<string> {
  const list = await composio<{ items: { id: string }[] }>(`/auth_configs?toolkit_slug=${toolkit}&limit=1`);
  if (list.items[0]) return list.items[0].id;
  const created = await composio<{ auth_config: { id: string } }>(`/auth_configs`, {
    method: "POST",
    body: JSON.stringify({ toolkit: { slug: toolkit }, auth_config: { type: "use_composio_managed_auth" } }),
  });
  return created.auth_config.id;
}

export type ConnectLink = { redirectUrl: string; connectedAccountId: string };

// Start an OAuth connection for (firm, toolkit). Returns the hosted authorize URL the
// preparer is redirected to. user_id namespaces the connection to the firm.
export async function initiateConnection(toolkit: string, userId: string): Promise<ConnectLink> {
  const authConfigId = await ensureAuthConfig(toolkit);
  const r = await composio<{ redirect_url: string; connected_account_id: string }>(`/connected_accounts/link`, {
    method: "POST",
    body: JSON.stringify({ auth_config_id: authConfigId, user_id: userId }),
  });
  return { redirectUrl: r.redirect_url, connectedAccountId: r.connected_account_id };
}

// Poll a connection (status flips to ACTIVE once the user authorizes).
export async function getConnectionStatus(connectedAccountId: string): Promise<{ status: string; toolkit?: string }> {
  const r = await composio<{ status: string; toolkit?: { slug: string } }>(`/connected_accounts/${connectedAccountId}`);
  return { status: r.status, toolkit: r.toolkit?.slug };
}

// Composio's tool-execute envelope: the tool's payload lives under `data`, with a
// `successful` flag and a nullable `error` (verified from @composio/client's
// ToolExecuteResponse type).
export type ToolExecuteResult = {
  data: Record<string, unknown>;
  successful: boolean;
  error: string | null;
};

// Run a Composio tool (e.g. GOOGLECALENDAR_EVENTS_LIST) for a firm. user_id namespaces
// the call to the firm's connected account (same `firm_${firmId}` id used at connect).
// POST /api/v3/tools/execute/{tool_slug} with { user_id, arguments }. Throws on a
// transport error (non-2xx); a tool-level failure surfaces as { successful:false, error }
// for the caller to inspect.
export async function executeTool(
  toolSlug: string,
  userId: string,
  args: Record<string, unknown>,
): Promise<ToolExecuteResult> {
  return composio<ToolExecuteResult>(`/tools/execute/${toolSlug}`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, arguments: args }),
  });
}
