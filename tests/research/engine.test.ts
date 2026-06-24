// GROUNDED RESEARCH PIPELINE — engine integration tests (tests/research/engine.test.ts)
//
// Proves the five pipeline steps against the REAL registered corpus (corpus-2025 + corpus-obbba)
// using deterministic MockProviders. Each test pins one of the transcript failures the engine
// fixes: stale-figure suppression (retrieval drops superseded chunks), the 10.22(c)(1) citation-
// verification fix (fabricated + superseded cites are stripped), and the 3-bucket calibration fix
// (answer vs. hedge vs. coverage_gap, never a gap wearing a calibration costume).

import { describe, it, expect } from "vitest";
import { MockProvider } from "../../lib/ai/provider";
import { researchAnswer, ungroundedFigures } from "../../lib/research/engine";
import { retrieve } from "../../lib/tax/authority/store";

// A proposer that cites a given set of retrieved chunkIds for one claim. Mirrors the reasoning
// schema so reasonAndScore's downstream faithfulness/verifier path runs for real.
function proposerCiting(claim: string, chunkIds: string[]) {
  return new MockProvider((args) => {
    // faithfulness pass: label the claim SUPPORTED against the first source.
    if (/atomic statements/i.test(args.system) || /GROUNDED in the provided sources/i.test(args.system)) {
      return { claims: [{ claim, label: "SUPPORTED", chunkId: chunkIds[0] ?? null }], faithfulnessScore: 1 };
    }
    // reasoning pass: one position citing the requested chunkIds.
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

const abstainingProposer = new MockProvider(() => ({ positions: [], abstained: true }));

describe("retrieval drops superseded chunks (the stale-law fix)", () => {
  it("2026 SALT retrieves the OBBBA $40k chunk, never the superseded $10k probe", () => {
    const hits = retrieve("what is the salt cap", { taxYear: 2026, jurisdiction: "federal", k: 4 });
    const ids = hits.map((c) => c.chunkId);
    expect(ids).toContain("obbba-70120-salt-cap");
    expect(ids).not.toContain("irc-164-salt-pre-obbba-superseded");
  });
});

describe("step 3 — citation verification (the 10.22(c)(1) fix)", () => {
  it("answers when the position cites a retrieved, current chunk; sources carry tier+url", async () => {
    const ans = await researchAnswer(
      proposerCiting("For 2026 the SALT cap is the OBBBA applicable limitation amount.", ["obbba-70120-salt-cap"]),
      undefined,
      "What is the SALT cap for 2026?",
      { taxYear: 2026, jurisdiction: "federal" },
    );
    expect(ans.bucket).toBe("answer");
    expect(ans.citations).toHaveLength(1);
    expect(ans.citations[0].chunkId).toBe("obbba-70120-salt-cap");
    expect(ans.citations[0].authorityTier).toBe("primary");
    expect(ans.citations[0].sourceUrl).toMatch(/^https?:\/\//);
    expect(ans.citations[0].authority).toBe("Public Law");
  });

  it("strips a FABRICATED cite (chunkId not in the store) → position dropped → abstain", async () => {
    const ans = await researchAnswer(
      proposerCiting("Rev. Rul. 2025-417 governs staking rewards.", ["rev-rul-2025-417-FAKE"]),
      undefined,
      "Summarize Rev. Rul. 2025-417 on crypto staking.",
      { taxYear: 2025, jurisdiction: "federal" },
    );
    // Either coverage_gap (nothing retrieved) or abstain (retrieved but stripped) — never an
    // answer, and never a citation that resolves to nothing.
    expect(["coverage_gap", "abstain"]).toContain(ans.bucket);
    expect(ans.citations.every((c) => c.chunkId !== "rev-rul-2025-417-FAKE")).toBe(true);
  });

  it("a SUPERSEDED/out-of-year cite never backs an answer (defense in depth strips it)", async () => {
    // Force the model to cite the pre-OBBBA $10k probe for 2026 — it exists in the corpus but
    // the store filtered it from retrieval. reason() (allowed = retrieved chunkIds) drops the
    // position upstream, AND the engine's verifyCite would catch it as superseded if it slipped
    // through. Either way: no answer, no citation, and the stale $10k figure never surfaces.
    const ans = await researchAnswer(
      proposerCiting("The SALT cap is $10,000 for 2026.", ["irc-164-salt-pre-obbba-superseded"]),
      undefined,
      "What is the SALT cap for 2026?",
      { taxYear: 2026, jurisdiction: "federal" },
    );
    expect(ans.bucket).toBe("abstain"); // the only position was stripped
    expect(ans.citations).toHaveLength(0);
    expect(ans.answer).not.toMatch(/\$10,000/);
  });
});

describe("step 4 — the 3-bucket calibration fix", () => {
  it("indeterminate (employee vs IC) → HEDGE, not a coverage gap", async () => {
    const ans = await researchAnswer(
      abstainingProposer,
      undefined,
      "Should the worker my client paid $30,000 be classified as an employee or an independent contractor?",
      { taxYear: 2025, jurisdiction: "federal" },
    );
    expect(ans.bucket).toBe("hedge");
    expect(ans.citations).toHaveLength(0);
  });

  it("should-be-covered but retrieval EMPTY → COVERAGE_GAP (explicit decline, no fabrication)", async () => {
    // A question with zero keyword overlap retrieves nothing → the empty-retrieval coverage-gap
    // branch. This is the gap that must NOT masquerade as a calibrated hedge.
    const ans = await researchAnswer(
      abstainingProposer,
      undefined,
      "Explain the controlled-foreign-corporation Subpart F inclusion ordering rules.",
      { taxYear: 2025, jurisdiction: "federal" },
    );
    expect(ans.bucket).toBe("coverage_gap");
    expect(ans.citations).toHaveLength(0);
    expect(ans.answer).toMatch(/do not have current authority/i);
  });

  it("retrieved-but-ungroundable (tangential hit, model abstains) → ABSTAIN, not a false answer", async () => {
    // The FTC question keyword-overlaps a tangential standard-deduction chunk but yields no
    // on-point grounded position. That is an `abstain` (reasoning/on-point gap), distinct from a
    // clean coverage_gap — and crucially NEVER a fabricated answer.
    const ans = await researchAnswer(
      abstainingProposer,
      undefined,
      "What is the foreign tax credit carryback period for a 2025 corporate return?",
      { taxYear: 2025, jurisdiction: "federal" },
    );
    expect(ans.bucket).toBe("abstain");
    expect(ans.citations).toHaveLength(0);
  });
});

describe("step 5 — adversarial freshness judge", () => {
  it("a 'stale' verdict downgrades an otherwise-grounded answer to abstain", async () => {
    const staleJudge = new MockProvider(() => ({
      stale: true,
      currencyNote: "Cited authority does not cover the target year.",
      issues: ["Verify the year-effective figure."],
    }));
    const ans = await researchAnswer(
      proposerCiting("For 2026 the SALT cap is $40,400.", ["obbba-70120-salt-cap"]),
      staleJudge,
      "What is the SALT cap for 2026?",
      { taxYear: 2026, jurisdiction: "federal" },
    );
    expect(ans.bucket).toBe("abstain");
    expect(ans.currencyNote).toMatch(/does not cover/i);
  });

  it("a clean freshness verdict keeps the answer and applies the currency note", async () => {
    const freshJudge = new MockProvider(() => ({ stale: false, currencyNote: "Current per OBBBA for 2026.", issues: [] }));
    const ans = await researchAnswer(
      proposerCiting("For 2026 the SALT cap is $40,400.", ["obbba-70120-salt-cap"]),
      freshJudge,
      "What is the SALT cap for 2026?",
      { taxYear: 2026, jurisdiction: "federal" },
    );
    expect(ans.bucket).toBe("answer");
    expect(ans.currencyNote).toMatch(/current per obbba/i);
  });
});

describe("§7216 gate", () => {
  it("real-data scope throws until counsel clears it", async () => {
    await expect(
      researchAnswer(abstainingProposer, undefined, "any question", {
        taxYear: 2025,
        jurisdiction: "federal",
        scope: "real",
      }),
    ).rejects.toThrow(/§7216|7216/);
  });
});

// ── Value-level numeric grounding gate (the residual-leak fix) ───────────────────────────────
describe("ungroundedFigures — every stated figure must appear in the cited authority", () => {
  it("flags a memory number absent from the authority (the $10k-while-citing-$40k leak)", () => {
    expect(ungroundedFigures("The SALT cap is $10,000 for 2026.", "applicable limitation amount $40,000; never below $10,000"))
      .toEqual([]); // $10,000 DOES appear in this text (as the floor) — gate is presence-based
    expect(ungroundedFigures("The benefit is $37,000.", "the cap reduces the deduction to $35,000"))
      .toEqual(["$37,000"]); // a pure memory number, in no cited text → flagged
  });

  it("passes figures grounded in the authority, with unit expansion ($15M == $15,000,000)", () => {
    expect(ungroundedFigures("The exemption is $15M.", "basic exclusion amount is $15,000,000")).toEqual([]);
    expect(ungroundedFigures("Up to $40k.", "the limitation is $40,000")).toEqual([]);
    expect(ungroundedFigures("$15,000,000 per decedent.", "exclusion $15M")).toEqual([]);
  });

  it("keeps money and percent separate ($90 never satisfies 90%)", () => {
    expect(ungroundedFigures("90% of wagering losses.", "a $90 filing fee applies")).toEqual(["90%"]);
    expect(ungroundedFigures("Limited to 90% of losses.", "losses allowed up to 90 percent of gains")).toEqual([]);
  });

  it("ignores claims with no monetary/percentage figure (years, counts pass through)", () => {
    expect(ungroundedFigures("This turns on the facts and circumstances for 2026.", "")).toEqual([]);
  });
});

describe("step 3b — the numeric gate drops a verified-cite position that states a memory number", () => {
  it("a valid SALT cite but a fabricated dollar figure → position dropped → abstain, no answer", async () => {
    const ans = await researchAnswer(
      // Cites the REAL retrieved OBBBA SALT chunk (so citation-verification passes) but states a
      // figure that appears in NO cited authority — exactly the parametric leak the gate closes.
      proposerCiting("The SALT cap is $88,888 for 2026.", ["obbba-70120-salt-cap"]),
      undefined,
      "What is the SALT cap for 2026?",
      { taxYear: 2026, jurisdiction: "federal" },
    );
    expect(ans.bucket).toBe("abstain");
    expect(ans.answer).not.toMatch(/88,888/);
    expect(ans.reviewNotes.join(" ")).toMatch(/ungrounded figure|not supported by its cited authority/i);
  });
});
