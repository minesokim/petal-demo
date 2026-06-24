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
import { extractCompute } from "../../lib/research/extract";
import { saltCap } from "../../lib/tax/worksheets/salt-cap";

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

  // BUG 2 (year-aware supersession). The pre-OBBBA flat $10k SALT rule was CORRECT for 2024 and
  // is only superseded FROM 2025 (supersededFrom: 2025). So it must be RETRIEVED for 2024 (the
  // salt-cap-2024-control answer) and DROPPED for 2026 — supersededBy alone (audit metadata) must
  // not gate it out of its own valid pre-supersession years.
  it("the pre-OBBBA $10k SALT chunk IS retrieved for 2024 and NOT for 2026", () => {
    const ids2024 = retrieve("what is the salt cap", { taxYear: 2024, jurisdiction: "federal", k: 4 }).map((c) => c.chunkId);
    expect(ids2024).toContain("irc-164-salt-pre-obbba-superseded");
    expect(ids2024).not.toContain("obbba-70120-salt-cap"); // OBBBA cap does not govern 2024

    const ids2026 = retrieve("what is the salt cap", { taxYear: 2026, jurisdiction: "federal", k: 4 }).map((c) => c.chunkId);
    expect(ids2026).not.toContain("irc-164-salt-pre-obbba-superseded");
  });

  // BUG 3 (specificity-weighted ranking). A "SALT cap 2026" query must rank the on-point §164
  // SALT chunk FIRST — a tangential "deduction limitation" chunk (§68 itemized / §70111) must not
  // tie or beat it on shared common-word hits.
  it("a 'SALT cap 2026' query ranks the §164 SALT chunk first, not §68/§70111 itemized", () => {
    const hits = retrieve("what is the SALT cap for 2026", { taxYear: 2026, jurisdiction: "federal", k: 4 });
    expect(hits[0].chunkId).toBe("obbba-70120-salt-cap");
  });
});

// ── RETRIEVAL/COVERAGE gaps the live eval exposed ─────────────────────────────────────────────
// GAP A: a "tip income" / "deduction for tips" phrasing must retrieve the OBBBA §224 tips chunk
// (the keywords used to miss those phrasings, so the tips question abstained with no groundable
// position). GAP A also re-confirms the senior §151(d)(5)(C) chunk for "is there a new senior
// deduction". GAP B: a 2025 gambling-loss question must answer the CLASSIC §165(d) rule (no 90%
// haircut), while a 2026 one answers the OBBBA 90% rule — year-aware supersession across the pair.
describe("retrieval gaps the live eval exposed (tips + 2025 gambling)", () => {
  // GAP A — tips. The eval question "Is there any federal deduction for tip income in 2025?"
  // returned no groundable position because the §224 keywords missed "tip income"/"deduction for
  // tips". After adding those keywords the tips chunk must be a TOP hit for that phrasing.
  it("'is there any federal deduction for tip income' retrieves the OBBBA §224 tips chunk as a top hit", () => {
    const hits = retrieve("is there any federal deduction for tip income", {
      taxYear: 2025,
      jurisdiction: "federal",
    });
    expect(hits.map((c) => c.chunkId)).toContain("obbba-70201-tips-deduction");
    // top hit (k defaults to 3) — the on-point tips chunk should lead, not be a tail straggler.
    expect(hits[0].chunkId).toBe("obbba-70201-tips-deduction");
  });

  it("the 'deduction for tips' phrasing also retrieves the §224 tips chunk", () => {
    const ids = retrieve("federal deduction for tips in 2025", { taxYear: 2025, jurisdiction: "federal" }).map(
      (c) => c.chunkId,
    );
    expect(ids).toContain("obbba-70201-tips-deduction");
  });

  // GAP A audit — senior §151(d)(5)(C). "is there a new senior deduction" must retrieve the
  // senior chunk (it already does via the "senior"/"senior deduction" keywords; locked here).
  it("'is there a new senior deduction' retrieves the §151(d)(5)(C) senior chunk as a top hit", () => {
    const hits = retrieve("is there a new senior deduction", { taxYear: 2025, jurisdiction: "federal" });
    expect(hits.map((c) => c.chunkId)).toContain("obbba-70103-senior-deduction");
    expect(hits[0].chunkId).toBe("obbba-70103-senior-deduction");
  });

  // GAP B — 2025 classic gambling. A 2025 gambling-loss question must retrieve the pre-OBBBA
  // §165(d) chunk (100%-of-winnings ceiling, NO haircut) and NEVER the OBBBA 90% chunk (which
  // first governs 2026). The OBBBA 90% chunk's taxYear list starts at 2026, so it is filtered out.
  it("a 2025 gambling-loss query retrieves the classic §165(d) chunk, never the OBBBA 90% chunk", () => {
    const ids = retrieve("can I deduct gambling losses", { taxYear: 2025, jurisdiction: "federal", k: 4 }).map(
      (c) => c.chunkId,
    );
    expect(ids).toContain("irc-165d-gambling-2025");
    expect(ids).not.toContain("obbba-70114-wagering-losses");
  });

  // GAP B — 2026 OBBBA gambling. The mirror: a 2026 gambling question answers the OBBBA 90% rule
  // and must NOT surface the pre-OBBBA 2025 chunk (supersededFrom: 2026 filters it out from 2026).
  it("a 2026 gambling-loss query retrieves the OBBBA 90% chunk, never the classic 2025 chunk", () => {
    const ids = retrieve("can I deduct gambling losses", { taxYear: 2026, jurisdiction: "federal", k: 4 }).map(
      (c) => c.chunkId,
    );
    expect(ids).toContain("obbba-70114-wagering-losses");
    expect(ids).not.toContain("irc-165d-gambling-2025");
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

// ── INV-1 COMPUTE-HANDOFF (the engine-derived figure, exempt from the numeric gate) ──────────
describe("extractCompute — deterministic input extractor + worksheet mapping", () => {
  it("maps a SALT question with a MAGI figure to the saltCap worksheet and builds the request", () => {
    const ex = extractCompute("My client has $700,000 of MAGI in 2026. What is their SALT cap?");
    expect(ex).not.toBeNull();
    expect(ex!.worksheet).toBe("saltCap");
    expect(ex!.taxYear).toBe(2026);
    expect(ex!.request).toEqual({
      worksheet: "saltCap",
      facts: { magi: 700000, filingStatus: "single", taxYear: 2026 },
    });
  });

  it("reads 'married' as mfj filing status", () => {
    const ex = extractCompute("A married couple filing jointly with $300,000 income — what is the SALT cap for 2025?");
    expect(ex!.request.facts).toMatchObject({ filingStatus: "mfj" });
  });

  it("returns null when the SALT question carries no extractable income (rule-only, no guessing)", () => {
    expect(extractCompute("What is the SALT cap for 2026?")).toBeNull();
  });

  it("returns null when the question maps to no covered worksheet", () => {
    expect(extractCompute("What is the bonus depreciation percentage for 2026?")).toBeNull();
  });

  it("tips question needs BOTH a tips amount and MAGI", () => {
    expect(extractCompute("I earned $8,000 in tips and have $90,000 of income in 2025")!.worksheet).toBe("tipsDeduction");
    expect(extractCompute("Are tips deductible in 2025?")).toBeNull();
  });
});

describe("researchAnswer attaches the engine-computed figure (INV-1 split)", () => {
  it("a compute-flavored SALT question yields a populated .computation equal to the deterministic worksheet output", async () => {
    // MAGI $510,000 in 2026 → cap phases down to $38,900 (40,400 − 0.30·(510,000−505,000)). That
    // $38,900 figure appears in NEITHER the cited authority text (which lists 40,000 / 40,400 /
    // 10,000 / 5,000 / 500,000 / 505,000) NOR the question — so it would be FLAGGED by the numeric
    // gate if it were model-authored, and its survival proves the engine figure is gate-exempt.
    const question = "My client has $510,000 of MAGI in 2026. What is their SALT cap?";
    const ans = await researchAnswer(
      proposerCiting("For 2026 the SALT cap is the OBBBA applicable limitation amount, phased down per §70120.", [
        "obbba-70120-salt-cap",
      ]),
      undefined,
      question,
      { taxYear: 2026, jurisdiction: "federal" },
    );

    // Still a grounded, cited answer.
    expect(ans.bucket).toBe("answer");
    expect(ans.citations[0]?.chunkId).toBe("obbba-70120-salt-cap");

    // The engine-derived figure is attached and equals the deterministic worksheet output.
    const expected = saltCap({ magi: 510000, filingStatus: "single", taxYear: 2026 });
    expect(expected.value).toBe(38900); // unique figure, absent from authority + question
    expect(ans.computation).toBeDefined();
    expect(ans.computation!.worksheet).toBe("saltCap");
    expect(ans.computation!.taxYear).toBe(2026);
    expect(ans.computation!.value).toBe(expected.value);
    expect(ans.computation!.trace).toEqual(expected.lines);
    expect(ans.computation!.citations).toEqual(expected.citations);

    // The engine-derived sentence is folded into the answer text and is NOT dropped by the
    // numeric gate — even though the worksheet value (a phased-down cap) appears in NEITHER the
    // cited authority text NOR the question, it survives because it is engine-derived, not model-
    // authored. ungroundedFigures would flag it; the gate never sees it.
    expect(ans.answer).toContain(`$${expected.value.toLocaleString()}`);
    expect(ans.answer).toMatch(/Computed by the deterministic engine/);
  });

  it("never attaches a computation to a non-answer bucket (no abstain → fabricated figure)", async () => {
    // The position is stripped (fabricated cite) → abstain. The handoff branch is unreachable, so
    // no engine figure is produced even though the question is compute-flavored.
    const ans = await researchAnswer(
      proposerCiting("The SALT cap is the OBBBA amount.", ["totally-fake-chunk"]),
      undefined,
      "My client has $700,000 of MAGI in 2026. What is their SALT cap?",
      { taxYear: 2026, jurisdiction: "federal" },
    );
    expect(ans.bucket).not.toBe("answer");
    expect(ans.computation).toBeUndefined();
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

  it("does NOT drop a client INPUT figure restated from the question (it's not a memory leak)", async () => {
    // The claim restates the $700,000 MAGI the USER supplied — grounded by the question, not a
    // figure invented from model memory. The gate must let it through and the engine must answer.
    const ans = await researchAnswer(
      proposerCiting(
        "For a taxpayer with $700,000 of MAGI in 2026, the §164 SALT limitation is phased down per OBBBA §70120.",
        ["obbba-70120-salt-cap"],
      ),
      undefined,
      "My client has $700,000 of MAGI in 2026. Is their SALT deduction still capped at $10,000?",
      { taxYear: 2026, jurisdiction: "federal" },
    );
    expect(ans.bucket).toBe("answer");
    expect(ans.citations[0]?.chunkId).toBe("obbba-70120-salt-cap");
  });
});
