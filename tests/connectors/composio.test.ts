import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  initiateConnection,
  getConnectionStatus,
  executeTool,
} from "../../lib/connectors/composio";

// ⑤ Composio client — verified at the fetch boundary (no real COMPOSIO_API_KEY, no
// network). We stub global fetch and assert: the happy path maps the v3 envelope to
// our shape, the firm-scoped user_id is propagated, and a non-2xx / transport failure
// surfaces a clean error that NEVER leaks the api key.

const API_KEY = "ck_super_secret_should_never_leak";

// A fetch stub that returns a queued response per call, recording every request so we
// can assert on headers/body. Throws if a call is made with no queued response left.
type StubResponse = { ok: boolean; status: number; body: unknown; text?: string };
let calls: { url: string; init: RequestInit }[] = [];
let queue: StubResponse[] = [];

function makeFetch() {
  return vi.fn(async (url: string, init: RequestInit = {}) => {
    calls.push({ url, init });
    const next = queue.shift();
    if (!next) throw new Error(`unexpected fetch to ${url}`);
    return {
      ok: next.ok,
      status: next.status,
      json: async () => next.body,
      text: async () => next.text ?? JSON.stringify(next.body),
    } as unknown as Response;
  });
}

function lastBody(): Record<string, unknown> {
  const c = calls[calls.length - 1];
  return JSON.parse((c.init.body as string) ?? "{}");
}

beforeEach(() => {
  calls = [];
  queue = [];
  process.env.COMPOSIO_API_KEY = API_KEY;
  vi.stubGlobal("fetch", makeFetch());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("⑤ composio client (mocked at the fetch boundary)", () => {
  it("initiateConnection returns redirect + id on 200 and namespaces by firm user_id", async () => {
    // ensureAuthConfig list call → returns an existing auth_config (1 fetch),
    // then connected_accounts/link → returns the redirect + id (2nd fetch).
    queue = [
      { ok: true, status: 200, body: { items: [{ id: "ac_123" }] } },
      { ok: true, status: 200, body: { redirect_url: "https://auth.example/login", connected_account_id: "conn_abc" } },
    ];

    const out = await initiateConnection("gmail", "firm_F1");

    expect(out).toEqual({ redirectUrl: "https://auth.example/login", connectedAccountId: "conn_abc" });
    // the link POST carried the resolved auth_config_id + the firm-scoped user id
    const body = lastBody();
    expect(body.auth_config_id).toBe("ac_123");
    expect(body.user_id).toBe("firm_F1");
    // api key is sent as the x-api-key header (and not, e.g., in the URL/body)
    const linkCall = calls[1];
    expect((linkCall.init.headers as Record<string, string>)["x-api-key"]).toBe(API_KEY);
    expect(linkCall.url).not.toContain(API_KEY);
  });

  it("initiateConnection creates an auth_config when none exists, then links", async () => {
    queue = [
      { ok: true, status: 200, body: { items: [] } }, // no existing config
      { ok: true, status: 200, body: { auth_config: { id: "ac_new" } } }, // created
      { ok: true, status: 200, body: { redirect_url: "https://auth.example/x", connected_account_id: "conn_xyz" } },
    ];

    const out = await initiateConnection("quickbooks", "firm_F9");

    expect(out.connectedAccountId).toBe("conn_xyz");
    expect(lastBody().auth_config_id).toBe("ac_new");
  });

  it("surfaces a clean error on a non-2xx and does NOT leak the api key", async () => {
    queue = [{ ok: false, status: 401, body: {}, text: "unauthorized: bad key" }];

    let caught: Error | undefined;
    try {
      await initiateConnection("gmail", "firm_F1");
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught!.message).toContain("401");
    // the error message (which can bubble to logs/UI) must never carry the secret
    expect(caught!.message).not.toContain(API_KEY);
    expect(JSON.stringify(caught)).not.toContain(API_KEY);
  });

  it("surfaces a clean error on a transport failure without leaking the api key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNRESET");
      }),
    );

    let caught: Error | undefined;
    try {
      await getConnectionStatus("conn_abc");
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught!.message).not.toContain(API_KEY);
  });

  it("getConnectionStatus maps ACTIVE / FAILED / EXPIRED through unchanged", async () => {
    for (const status of ["ACTIVE", "FAILED", "EXPIRED"]) {
      calls = [];
      queue = [{ ok: true, status: 200, body: { status, toolkit: { slug: "gmail" } } }];
      const out = await getConnectionStatus("conn_abc");
      expect(out.status).toBe(status);
      expect(out.toolkit).toBe("gmail");
      // GET on the specific connected account
      expect(calls[0].url).toContain("/connected_accounts/conn_abc");
    }
  });

  it("executeTool passes the firm-scoped user id + arguments to the tool endpoint", async () => {
    queue = [{ ok: true, status: 200, body: { data: { events: [] }, successful: true, error: null } }];

    const res = await executeTool("GOOGLECALENDAR_EVENTS_LIST", "firm_F1", { calendarId: "primary" });

    expect(res.successful).toBe(true);
    expect(calls[0].url).toContain("/tools/execute/GOOGLECALENDAR_EVENTS_LIST");
    const body = lastBody();
    expect(body.user_id).toBe("firm_F1"); // firm-scoped namespacing
    expect(body.arguments).toEqual({ calendarId: "primary" });
  });

  it("executeTool returns a tool-level failure envelope (not a throw) on successful:false", async () => {
    queue = [{ ok: true, status: 200, body: { data: {}, successful: false, error: "scope missing" } }];
    const res = await executeTool("GMAIL_SEND", "firm_F1", {});
    expect(res.successful).toBe(false);
    expect(res.error).toBe("scope missing");
  });
});
