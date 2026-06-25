// CALIBRATION REASON-CODES — the research honesty layer (tests/research/calibration.test.ts)
//
// Every SourcedAnswer now carries a `calibration` code naming WHY it has the confidence it does.
// The load-bearing new distinction: `unsettled` (the LAW conflicts -> §6662 / Form 8275 territory)
// vs `indeterminate` (the FACTS drive it -> apply the multi-factor test). Conflating those is the
// failure this fixes: a preparer must know whether to gather facts or to run a substantial-authority
// analysis. These drive the live engine with deterministic MockProviders + corpus control.

import { describe, it, expect } from "vitest";
import { MockProvider } from "../../lib/ai/provider";
import { researchAnswer } from "../../lib/research/engine";
import { retrieve } from "../../lib/tax/authority/store";

const abstaining = new MockProvider(() => ({ positions: [], abstained: true }));
// Empty corpus -> retrieval is empty -> the calibration classifier on the question decides the code.
const empty = { taxYear: 2025, jurisdiction: "federal" as const, corpus: [] };

// A proposer that grounds one claim on real retrieved chunkIds (mirrors engine.test's helper) so we
// can exercise the grounded -> "grounded" path against the real registered corpus.
function groundingProposer(claim: string, chunkIds: string[]) {
  return new MockProvider((args) => {
    if (/atomic statements/i.test(args.system) || /GROUNDED in the provided sources/i.test(args.system)) {
      return { claims: [{ claim, label: "SUPPORTED", chunkId: chunkIds[0] ?? null }], faithfulnessScore: 1 };
    }
    return {
      positions: [
        {
          claim,
          citations: chunkIds.map((id) => ({ chunkId: id, citation: id, taxYear: 2026 })),
          computedValueRefs: [],
          confidenceSignals: { retrieval: "on_point", computation: "na", agreement: "high", edgeCase: false },
          reviewNotes: { verify: ["Confirm the figure against the cited section."], factAssumptions: [], disclosureFlag: false },
        },
      ],
      abstained: false,
    };
  });
}

describe("calibration reason-codes", () => {
  it("UNSETTLED law (conflicting authority) -> bucket hedge, calibration 'unsettled', §6662/8275 guidance", async () => {
    const r = await researchAnswer(
      abstaining,
      undefined,
      "Is there a circuit split on whether daily-fantasy-sports entry fees are wagering losses under §165(d)?",
      empty,
    );
    expect(r.calibration).toBe("unsettled");
    expect(r.bucket).toBe("hedge");
    expect(r.reviewNotes.join(" ")).toMatch(/§6662|8275/);
    expect(r.answer).toMatch(/unsettled|conflict/i);
  });

  it("FACT-DRIVEN question -> calibration 'indeterminate' (NOT unsettled)", async () => {
    const r = await researchAnswer(abstaining, undefined, "Is my delivery driver an employee or an independent contractor?", empty);
    expect(r.calibration).toBe("indeterminate");
    expect(r.bucket).toBe("hedge");
  });

  it("settled-but-missing rule -> calibration 'coverage_gap'", async () => {
    const r = await researchAnswer(abstaining, undefined, "What is the foreign tax credit limitation formula for 2025?", empty);
    expect(r.calibration).toBe("coverage_gap");
    expect(r.bucket).toBe("coverage_gap");
  });

  it("UNSETTLED takes precedence over indeterminate when a question trips both markers", async () => {
    // "reasonable compensation" is a facts-doctrine marker; "courts disagree" is a conflict marker.
    // The higher-stakes signal (the law is contested) must win.
    const r = await researchAnswer(abstaining, undefined, "Courts disagree on the reasonable-compensation factors for an S-corp owner; what is the rule?", empty);
    expect(r.calibration).toBe("unsettled");
  });

  it("a grounded answer carries calibration 'grounded'", async () => {
    const hits = retrieve("salt cap", { taxYear: 2026, jurisdiction: "federal", k: 4 });
    expect(hits.length).toBeGreaterThan(0);
    const r = await researchAnswer(
      groundingProposer("The 2026 SALT cap is $40,400.", [hits[0].chunkId]),
      undefined,
      "what is the salt cap for 2026",
      { taxYear: 2026, jurisdiction: "federal" },
    );
    expect(r.bucket).toBe("answer");
    expect(r.calibration).toBe("grounded");
  });
});
