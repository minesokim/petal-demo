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
  // SELF-HEALING: the model occasionally emits reviewNotes as a bare array of strings (or drops a field).
  // Coerce to the object shape with defaults so one position's shape-drift never fails the whole reasoning
  // object (which previously forced a retry and, on the second miss, a spurious abstention).
  reviewNotes: z.preprocess(
    (v) => {
      if (Array.isArray(v)) return { verify: v.filter((x) => typeof x === "string"), factAssumptions: [], disclosureFlag: false };
      if (v && typeof v === "object") return v;
      return { verify: [], factAssumptions: [], disclosureFlag: false };
    },
    z.object({
      verify: z.array(z.string()).default([]), // what the preparer must check before adopting
      factAssumptions: z.array(z.string()).default([]),
      disclosureFlag: z.boolean().default(false), // Form 8275 candidate (flag, don't decide)
    }),
  ),
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
// faithfulnessScore is FIRST so the model emits it before the (potentially long) per-claim breakdown:
// otherwise a dense source set can truncate the JSON at maxTokens before the score is written, failing
// validation and forcing a spurious service-error abstention on a question the corpus actually answers.
export const FaithfulnessOutput = z.preprocess(
  (v) => {
    // SELF-HEALING: if the model returns the per-claim breakdown but omits the top-level score, DERIVE it
    // from the claim labels (supported / total) rather than failing validation — the score is a function
    // of the claims anyway. This turned a recoverable shape-drift into a spurious "service error" abstain.
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const o = v as Record<string, unknown>;
      if (typeof o.faithfulnessScore !== "number" && Array.isArray(o.claims)) {
        const claims = o.claims as { label?: unknown }[];
        const supported = claims.filter((c) => c?.label === "SUPPORTED").length;
        o.faithfulnessScore = claims.length ? supported / claims.length : 0;
      }
    }
    return v;
  },
  z.object({
    faithfulnessScore: z.number().min(0).max(1),
    claims: z.array(z.object({
      claim: z.string(),
      label: z.enum(["SUPPORTED", "UNSUPPORTED", "CONTRADICTED"]),
      chunkId: z.string().nullable(),
    })),
  }),
);
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
