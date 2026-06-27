// MOAT GATE INTEGRITY (tests/research/moat-gate.test.ts)
//
// The research moat is a MEASURED error rate that must GATE releases — "recorded, not enforced" is exactly
// the failure mode the librarian re-audit flagged (the verified settled-law set had NO CI job, so a
// regression on the 8/8 floor could ship green). These are MODEL-FREE assertions — no API key, no network —
// that run on EVERY PR via the normal vitest suite (backend-ci), so the moat's wiring and its recorded floor
// cannot silently regress even before the live ANTHROPIC_API_KEY gate in research-eval.yml is activated:
//   1. the recorded settled-law baseline stays solved and its numbers are internally honest;
//   2. research-eval.yml actually gates the settled-law (verified) set, at the SAME floor the baseline
//      records, and reaches pull_request — so a settled-law regression cannot ship green on a PR.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MEASURED_BASELINE, RELEASE_GATE, latestRun } from "../../lib/research/measured-baseline";

const EVAL_YML = readFileSync(resolve(__dirname, "../../.github/workflows/research-eval.yml"), "utf8");

const latestClaudeVerified = [...MEASURED_BASELINE]
  .filter((r) => r.set === "verified" && /claude/i.test(r.model))
  .sort((a, b) => b.date.localeCompare(a.date))[0];

describe("moat — recorded baseline integrity (model-free)", () => {
  it("every recorded run's errorRatePct matches its pass/total (no fudging the number)", () => {
    for (const r of MEASURED_BASELINE) {
      const expected = Math.round(((r.total - r.pass) / r.total) * 1000) / 10;
      expect(r.errorRatePct, `${r.set} / ${r.model}`).toBeCloseTo(expected, 1);
      expect(r.pass).toBeLessThanOrEqual(r.total);
    }
  });

  it("the PROD-model settled-law floor stays solved (Claude 8/8) — protected from a silent downgrade", () => {
    // The production provider (Claude, PETAL_DEV_INFERENCE="") is what CI gates on. Its settled-law run is
    // the floor the §1202 / §163(j) fixes lifted to 8/8. A re-measure that drops it must fail loudly here,
    // forcing a fix or a conscious decision — never a quiet downgrade in the record.
    expect(latestClaudeVerified, "a Claude verified run must stay recorded").toBeTruthy();
    expect(latestClaudeVerified.pass).toBe(latestClaudeVerified.total);
    expect(latestRun("verified")!.pass).toBeGreaterThanOrEqual(RELEASE_GATE.verified.floor);
  });

  it("the settled-law release-gate floor is never lowered below 7 of 8", () => {
    expect(RELEASE_GATE.verified.floor).toBeGreaterThanOrEqual(7);
    expect(RELEASE_GATE.verified.of).toBe(8);
  });
});

describe("moat — CI is ENFORCED, not just recorded (research-eval.yml)", () => {
  it("gates the settled-law VERIFIED set (the set the audit found had no CI job)", () => {
    expect(EVAL_YML).toMatch(/--set verified[^\n]*--gate \d/);
  });

  it("gates verified at the SAME floor the baseline records (the gate can't drift from the config)", () => {
    const m = EVAL_YML.match(/--set verified[^\n]*--gate (\d+)/);
    expect(m, "the verified gate must be present in research-eval.yml").toBeTruthy();
    expect(Number(m![1])).toBe(RELEASE_GATE.verified.floor);
  });

  it("the live gate reaches pull_request (a settled-law regression can't ship green on a PR)", () => {
    expect(EVAL_YML).toMatch(/^\s*pull_request:/m);
  });
});
