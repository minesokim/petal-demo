import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET } from "../../app/api/cron/schedules/route";

// The scheduler trigger stages work across EVERY firm, so the auth gate is the load-bearing security
// boundary on this route. These run before any DB access (getServiceDb is lazy), so no DB is needed.

describe("cron /api/cron/schedules — auth gate", () => {
  const prev = process.env.CRON_SECRET;
  beforeEach(() => { process.env.CRON_SECRET = "topsecret"; });
  afterEach(() => { if (prev === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = prev; });

  it("rejects a request with no Authorization header", async () => {
    const res = await GET(new Request("http://x/api/cron/schedules"));
    expect(res.status).toBe(401);
  });

  it("rejects a wrong bearer token", async () => {
    const res = await GET(new Request("http://x/api/cron/schedules", { headers: { authorization: "Bearer wrong" } }));
    expect(res.status).toBe(401);
  });

  it("rejects everything when CRON_SECRET is unset (never open by default)", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(new Request("http://x/api/cron/schedules", { headers: { authorization: "Bearer topsecret" } }));
    expect(res.status).toBe(401);
  });
});
