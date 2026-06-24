import { describe, it, expect, beforeAll, vi } from "vitest";
import { drizzle } from "drizzle-orm/pglite";
import type { PGlite } from "@electric-sql/pglite";
import { createHmac } from "node:crypto";
import { makeTestDb } from "../helpers/db";
import * as schema from "../../lib/db/schema";

// ⑤ Inbound SMS webhook — functional, end-to-end through the REAL route handler. Proves the
// receiving path works WITHOUT a live Twilio (the only untestable hop is Twilio→Vercel, which
// is console config): a validly-signed Twilio callback is verified, the firm is resolved from
// the sender phone, and the text lands in sms_messages. Also pins the two hardening fixes:
// fail-closed on a number shared across firms, and idempotency on a replayed MessageSid.

const FIRM_A = "11111111-1111-1111-1111-111111111111";
const FIRM_B = "22222222-2222-2222-2222-222222222222";
const TOKEN = "test_twilio_auth_token";
const URL_OVERRIDE = "https://petal-prod.vercel.app/api/sms/inbound";

let pg: PGlite;
let db: ReturnType<typeof drizzle>;

// The route resolves + writes via getServiceDb() (RLS-exempt). Point it at the test db.
vi.mock("../../lib/db/client", () => ({ getServiceDb: () => db }));

let POST: (req: Request) => Promise<Response>;

// Twilio's signature: base64( HMAC-SHA1( url + concat(sortedKey+value) ) ), keyed by the token.
function sign(params: Record<string, string>): string {
  let data = URL_OVERRIDE;
  for (const k of Object.keys(params).sort()) data += k + params[k];
  return createHmac("sha1", TOKEN).update(data, "utf8").digest("base64");
}
function req(params: Record<string, string>, sig?: string): Request {
  return new Request(URL_OVERRIDE, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      ...(sig !== undefined ? { "x-twilio-signature": sig } : {}),
    },
    body: new URLSearchParams(params).toString(),
  });
}
function signed(params: Record<string, string>): Request {
  return req(params, sign(params));
}
async function rowCount(where: string, ...args: unknown[]): Promise<number> {
  const r = await pg.query<{ c: string }>(`select count(*)::text as c from sms_messages where ${where}`, args);
  return Number(r.rows[0].c);
}

beforeAll(async () => {
  process.env.TWILIO_AUTH_TOKEN = TOKEN;
  process.env.TWILIO_INBOUND_URL = URL_OVERRIDE; // pin the signed URL so the HMAC is deterministic
  pg = await makeTestDb();
  db = drizzle(pg, { schema });
  await pg.exec(`
    insert into firms (id, clerk_org_id, name) values ('${FIRM_A}','org_a','A'),('${FIRM_B}','org_b','B');
    insert into households (id, firm_id, name, kind, service_tier, since) values
      ('hA','${FIRM_A}','Marcus Chen','individual','Premium',2019),
      ('hB','${FIRM_B}','Shared Number Co','individual','Standard',2020);
    insert into people (id, firm_id, household_id, name, role, phone) values
      ('pA','${FIRM_A}','hA','Marcus Chen','Taxpayer','+19515550190'),
      ('pSharedA','${FIRM_A}','hA','Marcus Chen','Taxpayer','+19515550999'),
      ('pSharedB','${FIRM_B}','hB','Other Person','Taxpayer','+19515550999');
  `);
  POST = (await import("../../app/api/sms/inbound/route")).POST;
});

describe("inbound SMS webhook (real route handler)", () => {
  it("records a validly-signed inbound text under the resolved firm", async () => {
    const res = await POST(signed({ From: "+19515550190", Body: "Got the W-2, thanks", MessageSid: "SM_known_1" }));
    expect(res.status).toBe(200);
    expect(await rowCount("twilio_sid = $1", "SM_known_1")).toBe(1);
    const row = await pg.query<{ firm_id: string; direction: string; body: string; household_id: string }>(
      "select firm_id, direction, body, household_id from sms_messages where twilio_sid = $1", ["SM_known_1"]);
    expect(row.rows[0].firm_id).toBe(FIRM_A);
    expect(row.rows[0].direction).toBe("inbound");
    expect(row.rows[0].body).toBe("Got the W-2, thanks");
    expect(row.rows[0].household_id).toBe("hA");
  });

  it("rejects a missing signature with 403 and writes nothing", async () => {
    const res = await POST(req({ From: "+19515550190", Body: "no sig", MessageSid: "SM_nosig" }));
    expect(res.status).toBe(403);
    expect(await rowCount("twilio_sid = $1", "SM_nosig")).toBe(0);
  });

  it("rejects a forged signature with 403 and writes nothing", async () => {
    const res = await POST(req({ From: "+19515550190", Body: "forged", MessageSid: "SM_forged" }, "not-a-valid-signature"));
    expect(res.status).toBe(403);
    expect(await rowCount("twilio_sid = $1", "SM_forged")).toBe(0);
  });

  it("fails closed when the sender number maps to people in more than one firm", async () => {
    const res = await POST(signed({ From: "+19515550999", Body: "ambiguous", MessageSid: "SM_ambig" }));
    expect(res.status).toBe(200); // ack so Twilio stops retrying...
    expect(await rowCount("twilio_sid = $1", "SM_ambig")).toBe(0); // ...but NO write — no cross-tenant guess
  });

  it("is idempotent: a replayed MessageSid does not double-record", async () => {
    const p = { From: "+19515550190", Body: "replay me", MessageSid: "SM_replay" };
    await POST(signed(p));
    await POST(signed(p)); // same signed callback delivered again
    expect(await rowCount("twilio_sid = $1", "SM_replay")).toBe(1);
  });

  it("silently ignores an unknown sender (200, no write)", async () => {
    const res = await POST(signed({ From: "+13105550000", Body: "stranger", MessageSid: "SM_unknown" }));
    expect(res.status).toBe(200);
    expect(await rowCount("twilio_sid = $1", "SM_unknown")).toBe(0);
  });
});
