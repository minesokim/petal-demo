import { describe, it, expect } from "vitest";
import { MEASURED_BASELINE, RELEASE_GATE, latestRun } from "@/lib/research/measured-baseline";

describe("measured research-AI baseline (the recorded moat)", () => {
  it("every recorded run's errorRatePct matches pass/total (no fudged numbers)", () => {
    for (const r of MEASURED_BASELINE) {
      const expected = Number((((r.total - r.pass) / r.total) * 100).toFixed(1));
      expect(Math.abs(r.errorRatePct - expected)).toBeLessThanOrEqual(0.1);
      expect(r.pass).toBeLessThanOrEqual(r.total);
    }
  });

  it("each release-gate floor is <= the latest recorded pass for that set (never gate above what we measured)", () => {
    for (const set of ["verified", "golden", "bluej"] as const) {
      const run = latestRun(set);
      expect(run, `no recorded run for ${set}`).toBeDefined();
      expect(RELEASE_GATE[set].of).toBe(run!.total);
      expect(RELEASE_GATE[set].floor).toBeLessThanOrEqual(run!.pass);
    }
  });

  it("records the settled-law set as the gate floor of record (a real measurement, not hidden behind currency)", () => {
    const verified = latestRun("verified")!;
    // The settled-law set is recorded as its OWN gated tier, distinct from the easy currency golden set —
    // so the moat number can never again be the flattering currency-only figure. (It is now 8/8 on the prod
    // model; this asserts it is recorded + gated, not a specific pass rate, so a real future regression shows.)
    expect(verified.set).toBe("verified");
    expect(verified.total).toBe(8);
    expect(RELEASE_GATE.verified.of).toBe(verified.total);
  });
});
