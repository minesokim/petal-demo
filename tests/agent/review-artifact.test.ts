import { describe, it, expect } from "vitest";
import {
  artifactFromOltPlan,
  artifactFromReconMatch,
  artifactFromResearch,
  artifactGeneric,
  type ReviewArtifact,
} from "../../lib/agent/review-artifact";

// Every staged action ships an evidenced artifact: each output field -> its source, so a human
// verifies against evidence in seconds instead of redoing the work. These assert the four builders
// map REAL producer data (OLT plan, recon match, research answer) into that one shape.

const everyFieldHasSource = (a: ReviewArtifact) =>
  a.fields.length > 0 && a.fields.every((f) => f.source && f.source.kind && f.source.label && f.value !== undefined);

describe("artifactFromOltPlan", () => {
  it("maps each OLT field entry to an evidenced field with its provenance", () => {
    const a = artifactFromOltPlan({
      ref: { clientId: "h-chen", taxYear: 2024 },
      entries: [
        { screen: "1040 / Income / W-2", field: "wages_box1", value: "84000.00", source: "extracted:W-2 box 1" },
        { screen: "1040 / Income / Interest", field: "interest", value: "312.00", source: "extracted:1099-INT box 1" },
      ],
    });
    expect(a.fields).toHaveLength(2);
    expect(a.fields[0].value).toBe("84000.00");
    expect(a.fields[0].source.kind).toBe("extraction");
    expect(a.summary).toMatch(/2024/);
    expect(everyFieldHasSource(a)).toBe(true);
  });
});

describe("artifactFromReconMatch", () => {
  it("turns a bank<->ledger match into fields, confidence, and warnings", () => {
    const a = artifactFromReconMatch({
      matchType: "bank_to_ledger",
      bankTxnId: "btx_1",
      ledgerItemId: "gl_1",
      bankAmount: "1250.00",
      ledgerAmount: "1250.40",
      matchScore: 0.82,
      matchReasons: ["same date", "payee similarity"],
      mismatches: ["amount off by 0.40"],
    });
    expect(a.fields.some((f) => f.value === "1250.00")).toBe(true);
    expect(a.warnings).toContain("amount off by 0.40");
    expect(a.fields[0].confidence).toBe(0.82);
    expect(everyFieldHasSource(a)).toBe(true);
  });
});

describe("artifactFromResearch", () => {
  it("carries the bucket, citations, review notes, and currency note", () => {
    const a = artifactFromResearch({
      answer: "Reasonable compensation must be set before distributions.",
      citations: [
        { chunkId: "c1", authority: "IRC", cite: "IRC §162(a)", sourceUrl: "https://x/162", authorityTier: "statute" as never, taxYear: 2024 },
      ],
      bucket: "answer",
      calibration: "grounded",
      reviewNotes: ["Confirm the comp study is on file"],
      currencyNote: "post-OBBBA",
    });
    expect(a.research?.bucket).toBe("answer");
    expect(a.research?.citations[0].label).toBe("IRC §162(a)");
    expect(a.research?.reviewNotes).toContain("Confirm the comp study is on file");
    expect(a.research?.currencyNote).toBe("post-OBBBA");
  });

  it("flags a weak bucket as a warning", () => {
    const a = artifactFromResearch({ answer: "", citations: [], bucket: "abstain", calibration: "ungrounded", reviewNotes: [] });
    expect(a.warnings.length).toBeGreaterThan(0);
  });
});

describe("artifactGeneric", () => {
  it("always produces a non-empty artifact from the action's own args", () => {
    const a = artifactGeneric("create_task", "Create a follow-up task", { title: "Chase missing W-2", clientId: "h-chen" });
    expect(a.summary).toBe("Create a follow-up task");
    expect(everyFieldHasSource(a)).toBe(true);
    expect(a.fields.some((f) => f.label === "title")).toBe(true);
  });
});
