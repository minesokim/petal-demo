import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ⑤ Server actions over the Composio connector. Composio is exercised through the REAL
// client module, mocked only at the fetch boundary (no COMPOSIO_API_KEY, no network).
// withFirm is mocked to run its callback against an in-memory connection store + ctx
// (the RLS/audit behavior of the repository is covered by tests/repository/connections.test.ts);
// here we assert the action contract: connect upserts a pending row + returns redirectUrl,
// and sync flips a pending row to connected on an ACTIVE poll.

const FIRM = "firm-1";

// ── in-memory connection store the mocked repository reads/writes ───────────────
type Row = { toolkit: string; status: string; composioConnectionId?: string; accountLabel?: string };
let store: Row[] = [];

vi.mock("../../lib/repository/connections", () => ({
  upsertConnection: vi.fn(async (_db: unknown, _ctx: unknown, input: Row) => {
    const existing = store.find((r) => r.toolkit === input.toolkit);
    if (existing) Object.assign(existing, input);
    else store.push({ ...input });
    return { id: "row-id" };
  }),
  pendingConnections: vi.fn(async () =>
    store.filter((r) => r.status === "pending").map((r) => ({ id: "x", toolkit: r.toolkit, composioConnectionId: r.composioConnectionId })),
  ),
  listConnections: vi.fn(async () => store),
}));

// withFirm just runs the callback with a fake db + a firm-scoped ctx.
vi.mock("../../lib/auth/tenant", () => ({
  withFirm: vi.fn(async (fn: (db: unknown, ctx: unknown) => Promise<unknown>) =>
    fn({}, { firmId: FIRM, actorId: "u1", actorType: "preparer" }),
  ),
}));

import { connectAppAction, syncConnectionsAction } from "../../app/os/connections/actions";

const API_KEY = "ck_secret";
let queue: { ok: boolean; status: number; body: unknown; text?: string }[] = [];

beforeEach(() => {
  store = [];
  queue = [];
  process.env.COMPOSIO_API_KEY = API_KEY;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const next = queue.shift();
      if (!next) throw new Error("unexpected fetch");
      return {
        ok: next.ok,
        status: next.status,
        json: async () => next.body,
        text: async () => next.text ?? JSON.stringify(next.body),
      } as unknown as Response;
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("⑤ connect/sync server actions", () => {
  it("connectAppAction upserts a pending row and returns the hosted redirectUrl", async () => {
    queue = [
      { ok: true, status: 200, body: { items: [{ id: "ac_1" }] } }, // ensureAuthConfig
      { ok: true, status: 200, body: { redirect_url: "https://auth.example/go", connected_account_id: "conn_1" } },
    ];

    const out = await connectAppAction("gmail");

    expect(out).toEqual({ redirectUrl: "https://auth.example/go" });
    expect(store).toHaveLength(1);
    expect(store[0]).toMatchObject({ toolkit: "gmail", status: "pending", composioConnectionId: "conn_1" });
  });

  it("connectAppAction rejects a non-OAuth (browser) integration without touching Composio", async () => {
    const out = await connectAppAction("olt"); // not in the TOOLKIT map
    expect(out).toEqual({ error: "This app isn't an OAuth connector." });
    expect(store).toHaveLength(0);
    expect((globalThis.fetch as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });

  it("syncConnectionsAction flips a pending row to connected on an ACTIVE poll", async () => {
    // seed a pending row (as if connectAppAction had run earlier)
    store = [{ toolkit: "gmail", status: "pending", composioConnectionId: "conn_1" }];
    queue = [{ ok: true, status: 200, body: { status: "ACTIVE", toolkit: { slug: "gmail" } } }];

    await syncConnectionsAction();

    expect(store[0].status).toBe("connected");
  });

  it("syncConnectionsAction leaves a still-pending poll untouched", async () => {
    store = [{ toolkit: "gmail", status: "pending", composioConnectionId: "conn_1" }];
    queue = [{ ok: true, status: 200, body: { status: "INITIATED" } }];

    await syncConnectionsAction();

    expect(store[0].status).toBe("pending");
  });

  it("syncConnectionsAction maps a FAILED poll to error", async () => {
    store = [{ toolkit: "gmail", status: "pending", composioConnectionId: "conn_1" }];
    queue = [{ ok: true, status: 200, body: { status: "FAILED" } }];

    await syncConnectionsAction();

    expect(store[0].status).toBe("error");
  });
});
