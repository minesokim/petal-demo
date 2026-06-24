import { describe, it, expect, beforeEach, vi } from "vitest";

// Regression for the /os/clients/[id] crash: "Cannot read properties of null (reading
// 'length')" in ClientRecordInner. withFirm() returns null when there is NO firm context
// (unauthenticated / the fixture-fallback the dev preview and any signed-out SSR hit use).
// listClientSmsAction used to cast that null straight through (`withFirm(...) as Promise<
// ClientSmsRow[]>`), so the record's effect ran setSmsRows(null); on the next render the
// component built smsThread from `smsRows[smsRows.length - 1]` + `smsRows.map(...)` and threw.
// Fix (commit 2c8f727): listClientSmsAction returns `rows ?? []`.
//
// The action's contract is therefore: it MUST return an array, never null — empty when there
// is no firm, the mapped thread when signed in. (The authenticated repository path is covered
// by tests/repository/sms.test.ts; here we pin the action's null-safety + shape adaptation.)

const FIRM = "firm-1";

// `authed` toggles what withFirm yields: null = no firm context (signed out), otherwise it
// runs the callback with a fake db + firm-scoped ctx exactly like the real signed-in path.
let authed = false;
vi.mock("@/lib/auth/tenant", () => ({
  withFirm: vi.fn(async (fn: (db: unknown, ctx: unknown) => Promise<unknown>) =>
    authed ? fn({}, { firmId: FIRM, actorId: "u1", actorType: "preparer", role: "owner" }) : null,
  ),
}));

// The repository read the action maps. Returns one inbound row so we can assert the shape
// adaptation (Date -> ISO string) the action performs on the signed-in path.
const sampleRows = [
  { id: "s1", direction: "inbound", body: "hi there", createdAt: new Date("2026-06-20T10:00:00Z"), attachments: [] },
];
vi.mock("@/lib/repository/sms", () => ({
  listSmsForHousehold: vi.fn(async () => sampleRows),
  recordSms: vi.fn(),
}));

import { listClientSmsAction } from "@/app/os/clients/sms-actions";

beforeEach(() => {
  authed = false;
});

describe("listClientSmsAction — never hands the client record a null thread", () => {
  it("returns [] when unauthenticated (withFirm yields null) — the crash regression", async () => {
    const rows = await listClientSmsAction("h-chen");
    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toEqual([]);
  });

  it("returns [] for a blank household id (no firm lookup at all)", async () => {
    authed = true; // even signed in, an empty id short-circuits to []
    const rows = await listClientSmsAction("");
    expect(rows).toEqual([]);
  });

  it("maps the household's real rows when signed in, serializing createdAt to ISO", async () => {
    authed = true;
    const rows = await listClientSmsAction("h-chen");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "s1", direction: "inbound", body: "hi there" });
    expect(rows[0].createdAt).toBe("2026-06-20T10:00:00.000Z");
  });
});
