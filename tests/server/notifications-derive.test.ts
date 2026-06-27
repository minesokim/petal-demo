import { describe, it, expect } from "vitest";
import { deriveNotifications, relativeTime } from "../../lib/server/notifications-derive";
import type { FirmData } from "../../lib/server/fixture-data";

const NOW = Date.parse("2026-06-27T12:00:00Z");
// deriveNotifications only reads firm.proposals, so a minimal partial firm is enough for the unit.
const firmWith = (proposals: unknown[]) => ({ proposals } as unknown as FirmData);

describe("deriveNotifications — real notifications from action_proposals (no fabricated seed)", () => {
  it("no pending proposals (the demo fixture) → ZERO notifications: honestly empty, not fake", () => {
    expect(deriveNotifications(firmWith([]), NOW)).toEqual([]);
  });

  it("a pending proposal becomes an approval notification grounded in the real proposal", () => {
    const out = deriveNotifications(
      firmWith([
        { id: "p1", toolName: "send_sms", rationale: "Text the Chen Household their docs are ready", humanMustSubmit: true, createdAt: "2026-06-27T11:48:00Z", riskLane: "confirm", riskLevel: "low", riskFactors: [], reviewArtifact: null, confidence: "high" },
      ]),
      NOW,
    );
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: "prop-p1", kind: "approval", body: "Text the Chen Household their docs are ready", href: "/os/review", at: "12m", read: false });
    expect(out[0].title).toMatch(/submit/i); // humanMustSubmit → "needs your final submit"
  });

  it("relativeTime formats compactly", () => {
    expect(relativeTime("2026-06-27T11:59:30Z", NOW)).toBe("Just now");
    expect(relativeTime("2026-06-27T11:30:00Z", NOW)).toBe("30m");
    expect(relativeTime("2026-06-27T09:00:00Z", NOW)).toBe("3h");
    expect(relativeTime("2026-06-26T12:00:00Z", NOW)).toBe("Yesterday");
  });
});
