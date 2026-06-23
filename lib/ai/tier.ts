import type { ConfidenceSignals } from "./schema";

// ④ "Confidence is DERIVED, not declared." The model never grades its own certainty;
// this deterministic function maps the structural verifier verdict + faithfulness score +
// retrieval/computation/agreement signals to a tier. Conservative by construction: any hard
// failure floors to abstain, and the ceiling only opens with on-point authority + strong
// grounding. (A future conformal-calibration layer can tune the thresholds against an eval
// set; the policy stays in code, never in the prompt.)
export function deriveTier(input: {
  signals: ConfidenceSignals;
  faithfulnessScore: number; // 0..1 from the §3 pass
  verifierPass: boolean; // structural §2 verdict
}): "high" | "medium" | "low" | "abstain" {
  const { signals, faithfulnessScore, verifierPass } = input;

  // Hard floors — refuse to assert.
  if (!verifierPass) return "abstain"; // failed structural grounding
  if (signals.retrieval === "none") return "abstain"; // no on-point authority
  if (faithfulnessScore < 0.5) return "abstain"; // claims not grounded in sources

  // Caps — assertable but low-confidence.
  if (signals.computation === "disagreed") return "low"; // tool disagreed with the figure
  if (signals.retrieval === "weak") return "low";

  // Mid — assertable with caveats.
  if (signals.edgeCase || signals.agreement === "low") return "medium";

  // Ceiling — on-point authority + strongly grounded.
  if (signals.retrieval === "on_point" && faithfulnessScore >= 0.8) return "high";
  return "medium";
}
