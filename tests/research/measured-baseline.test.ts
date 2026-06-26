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

  it("records the HONEST settled-law number, not just the easy currency set", () => {
    const verified = latestRun("verified")!;
    // The point of this file: the settled-law correctness floor is recorded and is NOT the flattering 94%+.
    expect(verified.set).toBe("verified");
    expect(verified.pass / verified.total).toBeLessThan(0.9); // 62.5% — honestly below the currency set
  });
});
