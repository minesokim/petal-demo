import { z } from "zod";

// The structured-output contract for Petal's tax-AI pipeline (slice ④). Per the
// master prompt spec §9, this typed object is THE blocker: the reasoning agent
// must emit something mechanically checkable before the verifier (§2), faithfulness
// decomposer (§3), and confidence/tier layer can do anything. No client data here
// — pure shape. Building/running over real client data stays §7216-gated.

/** A resolvable pointer into the versioned authority store. "No citation, no claim." */
export const CitationRef = z.object({
  chunkId: z.string(), // must resolve to a chunk in the store (enforced in code, not the prompt)
  citation: z.string(), // human-readable, e.g. "IRC §199A(b)(2)"
  taxYear: z.number().int(),
});
export type CitationRef = z.infer<typeof CitationRef>;

/** Signals the confidence tier is DERIVED from (never the model's self-report). */
export const ConfidenceSignals = z.object({
  retrieval: z.enum(["on_point", "weak", "none"]),
  computation: z.enum(["validated", "disagreed", "na"]),
  agreement: z.enum(["high", "low", "na"]),
  edgeCase: z.boolean(),
});
export type ConfidenceSignals = z.infer<typeof ConfidenceSignals>;

/** One proposed position the preparer reviews and adopts (or not). Never "final". */
export const Position = z.object({
  claim: z.string(),
  citations: z.array(CitationRef),
  computedValueRefs: z.array(z.string()), // tool-result ids for any filed figure
  confidenceSignals: ConfidenceSignals,
  reviewNotes: z.object({
    verify: z.array(z.string()), // what the preparer must check before adopting
    factAssumptions: z.array(z.string()),
    disclosureFlag: z.boolean(), // Form 8275 candidate (flag, don't decide)
  }),
  // Set by the conformal-calibration code, then narrated by the model. Never model-chosen.
  tier: z.enum(["high", "medium", "low", "abstain"]).optional(),
});
export type Position = z.infer<typeof Position>;

export const ReasoningOutput = z.object({
  positions: z.array(Position),
  abstained: z.boolean().default(false), // true => "no sufficient on-point authority"
});
export type ReasoningOutput = z.infer<typeof ReasoningOutput>;

/** Verifier (§2) verdict — strict binary, no "partially". */
export const VerifierOutput = z.object({
  overall: z.enum(["PASS", "FAIL"]),
  checks: z.array(z.object({
    name: z.string(),
    verdict: z.enum(["PASS", "FAIL"]),
    reason: z.string(),
  })),
  blockingFailures: z.array(z.string()),
});
export type VerifierOutput = z.infer<typeof VerifierOutput>;

/** Faithfulness decomposer (§3) — grounding only; faithfulness != correctness. */
export const FaithfulnessOutput = z.object({
  claims: z.array(z.object({
    claim: z.string(),
    label: z.enum(["SUPPORTED", "UNSUPPORTED", "CONTRADICTED"]),
    chunkId: z.string().nullable(),
  })),
  faithfulnessScore: z.number().min(0).max(1),
});
export type FaithfulnessOutput = z.infer<typeof FaithfulnessOutput>;

export const DOC_TYPES = [
  "W-2", "1099-NEC", "1099-INT", "1099-DIV", "1099-MISC", "1099-B", "1099-R", "1099-K",
  "K-1", "1098", "1098-T", "1095-A", "SSA-1099", "prior-year-return", "organizer", "ID", "other",
] as const;

/** Document classifier (§4) — Haiku worker, verbatim transcription only. */
export const DocClassification = z.object({
  docType: z.enum(DOC_TYPES),
  taxYear: z.number().int().nullable(),
  taxpayerName: z.string().nullable(),
  fields: z.record(z.string(), z.string()),
  confidence: z.enum(["low", "medium", "high"]),
  unreadableFields: z.array(z.string()),
});
export type DocClassification = z.infer<typeof DocClassification>;
