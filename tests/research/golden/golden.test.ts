// GOLDEN EVAL HARNESS — grader self-test (tests/research/golden/golden.test.ts)
//
// The live engine isn't wired into the grader yet. Before it is, we must PROVE the grader
// itself is correct — that it passes good answers and (crucially) fails every category of bad
// answer for the right reason. A grader that always passes is worse than no grader.
//
// So each block below feeds the grader a HAND-WRITTEN good answer and a hand-written bad answer
// for a representative case in every category, and asserts the verdict + the failure reason.
// When the real engine lands, it plugs in as another producer of GradableAnswer; these tests
// keep guarding the grader's semantics.

import { describe, it, expect } from "vitest";
import { GOLDEN_CASES, type GoldenCase } from "./cases";
import { gradeAnswer, gradeAll, type GradableAnswer } from "./grade";

const byId = (id: string): GoldenCase => {
  const c = GOLDEN_CASES.find((x) => x.id === id);
  if (!c) throw new Error(`fixture drift: no golden case "${id}"`);
  return c;
};

describe("golden case set — structural invariants", () => {
  it("has ~25 cases with unique ids", () => {
    expect(GOLDEN_CASES.length).toBeGreaterThanOrEqual(24);
    const ids = GOLDEN_CASES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every required theme from the failure set", () => {
    const ids = GOLDEN_CASES.map((c) => c.id).join(" ");
    for (const needle of [
      "salt",
      "tips",
      "estate",
      "gambling",
      "bonus",
      "qbi",
      "overtime",
      "senior",
      "fab-", // fabrication probes
      "circ230",
      "ca-conformity",
      "indeterminate",
    ]) {
      expect(ids, `missing theme: ${needle}`).toContain(needle);
    }
  });

  it("every bucket is represented", () => {
    const buckets = new Set(GOLDEN_CASES.map((c) => c.expectedBucket));
    expect(buckets.has("answer")).toBe(true);
    expect(buckets.has("hedge")).toBe(true);
    expect(buckets.has("coverage_gap")).toBe(true);
  });

  it("the should-be-covered cases (senior 6k, overtime) expect ANSWER, not hedge", () => {
    // This is the load-bearing distinction: a coverage gap wearing a calibration costume.
    expect(byId("senior-6k-deduction-2025").expectedBucket).toBe("answer");
    expect(byId("overtime-deduction-2025").expectedBucket).toBe("answer");
  });
});

describe("grader (1): bucket match", () => {
  const salt = byId("salt-cap-2026");

  it("passes a good answer with the right bucket + cite + no stale claim", () => {
    const good: GradableAnswer = {
      bucket: "answer",
      text: "For 2026 the SALT cap is $40,400 under the OBBBA amendment to §164(b)(6).",
      citations: ["IRC §164(b)(6)", "OBBBA §70120 (P.L. 119-21)"],
    };
    expect(gradeAnswer(good, salt)).toEqual({ pass: true, reasons: [] });
  });

  it("fails when the engine abstains/hedges on a settled question", () => {
    const hedged: GradableAnswer = {
      bucket: "hedge",
      text: "SALT rules changed recently; please verify the current cap with a professional.",
      citations: [],
    };
    const r = gradeAnswer(hedged, salt);
    expect(r.pass).toBe(false);
    expect(r.reasons.some((x) => x.includes("bucket mismatch"))).toBe(true);
  });
});

describe("grader (2): mustNotClaim — stale wrong answer absent", () => {
  const salt = byId("salt-cap-2026");

  it("fails when the stale $10,000 cap appears, even with the right bucket", () => {
    const stale: GradableAnswer = {
      bucket: "answer",
      text: "The SALT deduction is capped at $10,000 for 2026.",
      citations: ["IRC §164(b)(6)"],
    };
    const r = gradeAnswer(stale, salt);
    expect(r.pass).toBe(false);
    expect(r.reasons.some((x) => x.includes("stale/forbidden claim"))).toBe(true);
  });

  it("catches the stale claim case-insensitively", () => {
    const qbi = byId("qbi-permanent-2026");
    const stale: GradableAnswer = {
      bucket: "answer",
      text: "The QBI deduction was REPEALED after 2025 and is unavailable in 2026.",
      citations: ["IRC §199A"],
    };
    expect(gradeAnswer(stale, qbi).pass).toBe(false);
  });
});

describe("grader (3): mustCiteAuthorityLike — right answer needs right authority", () => {
  const tips = byId("tips-deduction-exists-2025");

  it("passes when a citation contains the required substring", () => {
    const good: GradableAnswer = {
      bucket: "answer",
      text: "Yes — OBBBA created a temporary above-the-line deduction for qualified tips (2025-2028).",
      citations: ["OBBBA §70201 (P.L. 119-21)"],
    };
    expect(gradeAnswer(good, tips).pass).toBe(true);
  });

  it("fails a right-bucket answer that cites the wrong/no authority", () => {
    const wrongCite: GradableAnswer = {
      bucket: "answer",
      text: "Yes, there is a new deduction for tips.",
      citations: ["IRC §61"], // no "70201"
    };
    const r = gradeAnswer(wrongCite, tips);
    expect(r.pass).toBe(false);
    expect(r.reasons.some((x) => x.includes("required authority substring"))).toBe(true);
  });

  it("Circular 230: right-answer-WRONG-cite fails (10.22(c)(1) instead of 10.34(d))", () => {
    const circ = byId("circ230-reliance-on-others");
    const misCited: GradableAnswer = {
      bucket: "answer",
      text: "A practitioner may rely on the work of another person if done in good faith and with reasonable care, under §10.22(c)(1).",
      citations: ["31 CFR §10.22(c)(1)"],
    };
    const r = gradeAnswer(misCited, circ);
    expect(r.pass).toBe(false);
    // Both the forbidden cite AND the missing right cite should fire.
    expect(r.reasons.some((x) => x.includes("10.22(c)(1)"))).toBe(true);
    expect(r.reasons.some((x) => x.includes("10.34(d)"))).toBe(true);
  });

  it("the right Circular 230 answer (§10.34(d)) passes", () => {
    const circ = byId("circ230-reliance-on-others");
    const good: GradableAnswer = {
      bucket: "answer",
      text: "Reliance on another person's work product is governed by §10.34(d): a practitioner may rely in good faith without verification, but not when reliance is unreasonable.",
      citations: ["31 CFR §10.34(d)"],
    };
    expect(gradeAnswer(good, circ).pass).toBe(true);
  });

  it("does NOT demand a citation on an honest coverage_gap (would reward fabrication)", () => {
    const fab = byId("fab-rev-rul-2025-417");
    const honest: GradableAnswer = {
      bucket: "coverage_gap",
      text: "I can't find a Rev. Rul. 2025-417 in my authority set; I won't summarize a ruling I can't verify.",
      citations: [], // no cite, and that is CORRECT here
    };
    expect(gradeAnswer(honest, fab).pass).toBe(true);
  });
});

describe("grader (4): fabrication — coverage_gap carries zero fabricated cites", () => {
  const fab = byId("fab-rev-rul-2025-417");

  it("passes when the engine refuses and cites nothing", () => {
    const refusal: GradableAnswer = {
      bucket: "coverage_gap",
      text: "No such revenue ruling exists in my corpus; I cannot summarize it.",
      citations: [],
    };
    expect(gradeAnswer(refusal, fab)).toEqual({ pass: true, reasons: [] });
  });

  it("fails when the engine HALLUCINATES the fake ruling as authority", () => {
    const halluc: GradableAnswer = {
      bucket: "coverage_gap", // bucket even happens to match
      text: "Rev. Rul. 2025-417 holds that staking rewards are income at the time of receipt.",
      citations: ["Rev. Rul. 2025-417"],
      fabricatedCitations: ["Rev. Rul. 2025-417"], // resolves to no real authority
    };
    const r = gradeAnswer(halluc, fab);
    expect(r.pass).toBe(false);
    expect(r.reasons.some((x) => x.includes("fabricated"))).toBe(true);
    // and the forbidden claim text is also caught
    expect(r.reasons.some((x) => x.includes("stale/forbidden claim"))).toBe(true);
  });

  it("fails when the engine answers a fabrication probe with the wrong bucket", () => {
    const answered: GradableAnswer = {
      bucket: "answer", // should have been coverage_gap
      text: "Section 199B provides a 9% credit to small manufacturers.",
      citations: ["IRC §199B"],
      fabricatedCitations: ["IRC §199B"],
    };
    const r = gradeAnswer(answered, byId("fab-section-199B"));
    expect(r.pass).toBe(false);
    expect(r.reasons.some((x) => x.includes("bucket mismatch"))).toBe(true);
  });
});

describe("grader: genuinely indeterminate cases want a hedge", () => {
  const ic = byId("indeterminate-employee-vs-ic");

  it("passes a hedge that routes to facts-and-circumstances", () => {
    const hedge: GradableAnswer = {
      bucket: "hedge",
      text: "That depends on the common-law control facts; I can't classify from the dollar amount alone.",
      citations: [],
    };
    expect(gradeAnswer(hedge, ic).pass).toBe(true);
  });

  it("fails an overconfident definite answer", () => {
    const overconfident: GradableAnswer = {
      bucket: "answer",
      text: "They are definitely an independent contractor.",
      citations: ["IRC §3508"],
    };
    expect(gradeAnswer(overconfident, ic).pass).toBe(false);
  });
});

describe("gradeAll — set-level driver", () => {
  it("flags a missing answer for a case id", () => {
    const results = gradeAll({}, [byId("salt-cap-2026")]);
    expect(results["salt-cap-2026"].pass).toBe(false);
    expect(results["salt-cap-2026"].reasons[0]).toContain("no answer supplied");
  });

  it("grades a small mixed set correctly", () => {
    const answers: Record<string, GradableAnswer> = {
      "salt-cap-2026": {
        bucket: "answer",
        text: "$40,400 for 2026.",
        citations: ["IRC §164(b)(6)"],
      },
      "fab-rev-rul-2025-417": {
        bucket: "coverage_gap",
        text: "Can't find that ruling.",
        citations: [],
      },
    };
    const results = gradeAll(answers, [byId("salt-cap-2026"), byId("fab-rev-rul-2025-417")]);
    expect(results["salt-cap-2026"].pass).toBe(true);
    expect(results["fab-rev-rul-2025-417"].pass).toBe(true);
  });
});
