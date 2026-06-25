// CALIBRATION REASON-CODES — the research honesty layer (tests/research/calibration.test.ts)
//
// Corrected per the round-3 diagnostic: "unsettled" is NO LONGER inferred from the question's
// wording. With nothing retrieved, the honest state is a COVERAGE GAP ("I don't have this loaded"),
// not a claim that the law is open — and the manifest lets us NAME the missing provision. A
// fact-driven question still hedges as `indeterminate` (that's a property of the question).

import { describe, it, expect } from "vitest";
import { MockProvider } from "../../lib/ai/provider";
import { researchAnswer } from "../../lib/research/engine";
import { retrieve } from "../../lib/tax/authority/store";

const abstaining = new MockProvider(() => ({ positions: [], abstained: true }));
// Empty corpus -> retrieval is empty -> the calibration classifier on the question decides the code.
const empty = { taxYear: 2026, jurisdiction: "federal" as const, corpus: [] };

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
  it("a not-loaded provision -> coverage_gap that NAMES the missing section (the EV credit, §30D)", async () => {
    const r = await researchAnswer(abstaining, undefined, "Walk me through the $7,500 clean vehicle credit for a new EV bought in 2026.", empty);
    expect(r.bucket).toBe("coverage_gap");
    expect(r.calibration).toBe("coverage_gap");
    expect(`${r.answer} ${r.currencyNote} ${r.reviewNotes.join(" ")}`).toMatch(/30D/);
  });

  it("NO false 'unsettled' on empty retrieval — a 'circuit split' question is an honest coverage_gap", async () => {
    const r = await researchAnswer(abstaining, undefined, "Is there a circuit split on the treatment of crypto staking rewards?", empty);
    expect(r.calibration).toBe("coverage_gap"); // NOT "unsettled" — we retrieved nothing, so we can't claim the law is open
    expect(r.calibration).not.toBe("unsettled");
  });

  it("a fact-driven question still hedges as 'indeterminate'", async () => {
    const r = await researchAnswer(abstaining, undefined, "Is my delivery driver an employee or an independent contractor?", empty);
    expect(r.calibration).toBe("indeterminate");
    expect(r.bucket).toBe("hedge");
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
