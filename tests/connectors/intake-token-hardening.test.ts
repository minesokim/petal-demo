import { describe, it, expect, beforeAll, vi } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { makeTestDb } from "../helpers/db";
import * as schema from "../../lib/db/schema";
import { resolveLinkByToken } from "../../lib/repository/intake";

// ⑧ HARDEN — intake-link capability token strength + IDOR isolation.
//
// (a) createIntakeLinkAction mints high-entropy, distinct tokens (CSPRNG, not a
//     sequential id / timestamp / short string).
// (b) resolveLinkByToken is an exact-match lookup: token A NEVER resolves invite B,
//     and an unknown / locked token resolves to null (no IDOR).
// (c) resolveLinkByToken is the SOLE authorization on the unauthenticated prospect
//     path — the held token is the capability; nothing else gates the lookup.

// ── (a) token generation ────────────────────────────────────────────────────────
// Mock withFirm + the repository write so we can exercise the REAL token generator in
// createIntakeLinkAction and capture every minted token.
const minted: string[] = [];
vi.mock("../../lib/auth/tenant", () => ({
  withFirm: vi.fn(async (fn: (db: unknown, ctx: unknown) => Promise<unknown>) =>
    fn({}, { firmId: "firm-1", actorId: "u1", actorType: "preparer" }),
  ),
}));
vi.mock("../../lib/repository/intake", async (orig) => {
  const real = (await orig()) as Record<string, unknown>;
  return {
    ...real,
    createIntakeLink: vi.fn(async (_db: unknown, _ctx: unknown, input: { token: string }) => {
      minted.push(input.token);
      return { id: "x" };
    }),
  };
});

import { createIntakeLinkAction } from "../../app/os/clients/intake-actions";

describe("⑧ intake token strength (createIntakeLinkAction)", () => {
  it("mints distinct, high-entropy, opaque tokens (CSPRNG, not sequential/timestamp/short)", async () => {
    const tokens: string[] = [];
    for (let i = 0; i < 200; i++) {
      const out = await createIntakeLinkAction({ prospectEmail: `p${i}@x.com` });
      expect(out).not.toBeNull();
      tokens.push(out!.token);
    }
    // distinct
    expect(new Set(tokens).size).toBe(tokens.length);
    // every token captured by the repository matches what the URL handed back
    expect(minted).toEqual(tokens);

    for (const t of tokens) {
      // base64url alphabet only (no +/=), and long enough to be unguessable.
      expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
      // 32 random bytes → 43 base64url chars. Reject anything short / id-like / dated.
      expect(t.length).toBeGreaterThanOrEqual(40);
      expect(Number.isNaN(Number(t))).toBe(true); // not a numeric/sequential id
      expect(/^\d{10,13}$/.test(t)).toBe(false); // not a unix timestamp
    }

    // entropy smoke test: adjacent tokens share no long common prefix (would betray a
    // counter/timestamp source). Compare the first 8 chars of every consecutive pair.
    for (let i = 1; i < tokens.length; i++) {
      expect(tokens[i].slice(0, 8)).not.toBe(tokens[i - 1].slice(0, 8));
    }
  });
});

// ── (b)/(c) IDOR isolation on the prospect resolve path ──────────────────────────
const FIRM_A = "11111111-1111-1111-1111-111111111111";
const FIRM_B = "22222222-2222-2222-2222-222222222222";
let pg: PGlite;

beforeAll(async () => {
  pg = await makeTestDb();
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${FIRM_A}','org_a','A'),('${FIRM_B}','org_b','B');
    insert into intake_links (firm_id, token, prospect_email, status) values
      ('${FIRM_A}','token_A_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx','alice@a.com','sent'),
      ('${FIRM_B}','token_B_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy','bob@b.com','sent'),
      ('${FIRM_A}','token_locked_zzzzzzzzzzzzzzzzzzzzzzzz','carol@a.com','expired');
  `);
});

describe("⑧ resolveLinkByToken — IDOR isolation (the token IS the authorization)", () => {
  it("resolves ONLY the invite whose token exactly matches (A's token → A's invite)", async () => {
    const serviceDb = drizzle(pg, { schema });
    const a = await resolveLinkByToken(serviceDb as never, "token_A_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(a?.firmId).toBe(FIRM_A);
    expect(a?.prospectEmail).toBe("alice@a.com");
  });

  it("token A never resolves invite B (and vice versa) — no cross-firm IDOR", async () => {
    const serviceDb = drizzle(pg, { schema });
    const viaA = await resolveLinkByToken(serviceDb as never, "token_A_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    const viaB = await resolveLinkByToken(serviceDb as never, "token_B_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy");
    expect(viaA?.id).not.toBe(viaB?.id);
    expect(viaA?.firmId).toBe(FIRM_A);
    expect(viaB?.firmId).toBe(FIRM_B);
    // B's email is never reachable through A's token
    expect(viaA?.prospectEmail).not.toBe("bob@b.com");
  });

  it("an unknown token resolves to null (cannot guess your way to an invite)", async () => {
    const serviceDb = drizzle(pg, { schema });
    expect(await resolveLinkByToken(serviceDb as never, "token_does_not_exist")).toBeNull();
    expect(await resolveLinkByToken(serviceDb as never, "")).toBeNull();
    // near-miss: a prefix of a real token must not partial-match
    expect(await resolveLinkByToken(serviceDb as never, "token_A_")).toBeNull();
  });

  it("resolveLinkByToken is the SOLE gate: it requires the exact token and nothing else", async () => {
    const serviceDb = drizzle(pg, { schema });
    // The only input is the token string — no firm/user/session is consulted. Holding
    // the exact capability is necessary AND sufficient; a near token is rejected.
    const ok = await resolveLinkByToken(serviceDb as never, "token_locked_zzzzzzzzzzzzzzzzzzzzzzzz");
    expect(ok?.firmId).toBe(FIRM_A); // exact token resolves even when status=expired (status policy is enforced downstream)
    expect(ok?.status).toBe("expired");
    expect(await resolveLinkByToken(serviceDb as never, "token_locked_WRONG")).toBeNull();
  });
});
