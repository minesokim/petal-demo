// The risk gate — a pure, deterministic classifier that routes a proposed agent action into
// one of four lanes by (reversibility × stakes × connector-reliability × confidence). This is
// the §7216 substantive-determination expressed in code: it decides whether a human must look,
// how hard, and — for irreversible external commits — that Petal must NOT perform the final step.
//
// Pure and dependency-free on purpose (no DB, no model, no heavy imports) so it is cheap to test
// and safe to call inline in the agent loop. See docs/superpowers/specs/2026-06-24-risk-gate-*.

export type RiskLane = "auto" | "confirm" | "review" | "blocked";
export type RiskLevel = "low" | "medium" | "high";
export type Stakes = "none" | "low" | "high"; // high = money / IRS / a client's official record
export type ConnectorReliability = "internal" | "api" | "mcp" | "browser"; // browser = least reliable

export type RiskFactor = { name: string; level: RiskLevel; detail: string };

/** The subset of an AgentTool the classifier reads, plus the additive risk metadata. */
export type ClassifiableTool = {
  name: string;
  tier: 1 | 2 | 3 | 4;
  access: "read" | "write";
  stakes?: Stakes;
  reversible?: boolean;
  connector?: ConnectorReliability;
  /** olt_submit_return, xero post, … — Petal never performs these; a human submits. */
  irreversibleSubmit?: boolean;
};

/** Live signals from the run that can demote an action toward mandatory review. */
export type RiskSignals = {
  confidence?: number | null; // 0..1 (research/recon); < 0.6 demotes
  researchBucket?: "answer" | "hedge" | "coverage_gap" | "abstain";
  reconMismatches?: string[];
  validationErrors?: number; // e.g. OLT efileErrors
  /** signal-gathering failed; surface as a factor, never silently downgrade. */
  signalsUnavailable?: boolean;
};

export type RiskAssessment = {
  lane: RiskLane;
  level: RiskLevel;
  reversible: boolean;
  stakes: Stakes;
  connector: ConnectorReliability;
  confidence: number | null;
  humanMustSubmit: boolean;
  factors: RiskFactor[];
};

function lowConfidence(s?: RiskSignals): boolean {
  if (!s) return false;
  if (s.researchBucket === "abstain" || s.researchBucket === "coverage_gap") return true;
  if (s.reconMismatches && s.reconMismatches.length > 0) return true;
  if (typeof s.validationErrors === "number" && s.validationErrors > 0) return true;
  if (typeof s.confidence === "number" && s.confidence < 0.6) return true;
  return false;
}

function confidenceReason(s: RiskSignals): string {
  if (s.researchBucket === "abstain") return "research abstained — no groundable authority";
  if (s.researchBucket === "coverage_gap") return "research coverage gap — rule not retrieved";
  if (s.reconMismatches && s.reconMismatches.length > 0) return `reconciliation mismatch (${s.reconMismatches[0]})`;
  if (typeof s.validationErrors === "number" && s.validationErrors > 0) return `${s.validationErrors} validation error(s) on the return`;
  if (typeof s.confidence === "number" && s.confidence < 0.6) return `low confidence (${s.confidence.toFixed(2)})`;
  return "low confidence";
}

export function classifyRisk(
  tool: ClassifiableTool,
  _args: Record<string, unknown>,
  signals?: RiskSignals,
): RiskAssessment {
  const connector: ConnectorReliability = tool.connector ?? "internal";
  const reversible = tool.reversible ?? tool.tier <= 2;
  const stakes: Stakes = tool.stakes ?? (tool.tier <= 2 ? "none" : connector === "internal" ? "low" : "high");
  const humanMustSubmit = !!tool.irreversibleSubmit;
  const confidence = signals?.confidence ?? null;
  const factors: RiskFactor[] = [];

  // Reads and propose-only tiers never touch the world — auto, no confidence gate.
  if (tool.access === "read" || tool.tier <= 2) {
    return {
      lane: "auto",
      level: "low",
      reversible: true,
      stakes: "none",
      connector,
      confidence,
      humanMustSubmit: false,
      factors: [{ name: "scope", level: "low", detail: "read-only / no external effect" }],
    };
  }

  // tier-3 governed write: base lane from stakes × connector × irreversibility.
  let lane: RiskLane = stakes === "high" || connector === "browser" || humanMustSubmit ? "review" : "confirm";

  if (stakes === "high") factors.push({ name: "stakes", level: "high", detail: "touches money, the IRS, or an official record" });
  if (connector === "browser") factors.push({ name: "connector", level: "high", detail: "browser automation — least reliable connector" });
  else if (connector === "api" || connector === "mcp") factors.push({ name: "connector", level: "medium", detail: `external ${connector.toUpperCase()} write` });
  if (humanMustSubmit) factors.push({ name: "irreversible", level: "high", detail: "irreversible external submit — a human must perform it" });
  else if (!reversible) factors.push({ name: "reversibility", level: "medium", detail: "not easily reversible" });

  // Confidence demotion: a one-click confirm becomes a mandatory review when the upstream
  // signals are weak. Never the other way — low confidence only ever raises risk.
  if (lane === "confirm" && lowConfidence(signals)) {
    lane = "review";
    factors.push({ name: "confidence", level: "medium", detail: confidenceReason(signals!) });
  }

  // Signal-gathering failure is itself a risk factor; we classify on metadata and flag it.
  if (signals?.signalsUnavailable) {
    factors.push({ name: "signals_unavailable", level: "medium", detail: "confidence signals could not be gathered; not downgrading risk" });
  }

  if (factors.length === 0) factors.push({ name: "scope", level: "low", detail: "reversible, low-stakes internal write" });

  const level: RiskLevel = lane === "review"
    ? stakes === "high" || humanMustSubmit || connector === "browser" ? "high" : "medium"
    : "low";

  return { lane, level, reversible, stakes, connector, confidence, humanMustSubmit, factors };
}
