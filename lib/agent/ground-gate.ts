import { ungroundedFigures } from "@/lib/research/engine";

// THE AGENT GROUND-OR-REFUSE GATE (the sensor half).
//
// The diagnostic's dangerous failure is the AGENT narrating a verifiable figure from the model's
// training weights when the research engine hedged — "the research layer hedged, so I'll walk the
// framework... roughly $3,800". The engine itself is cite-disciplined; the leak is the agent's
// final prose. This gate checks that every money/percent figure the agent ASSERTS traces to a
// GROUNDED tool result (a deterministic computation or authority-verified answer). A figure that
// doesn't is a parametric leak.

// Collect the figure-bearing text from a tool output that is GROUNDED. Hedged / abstained research
// contributes NOTHING — its prose carries no grounded figure that could license one in the reply.
export function groundedFigureText(toolName: string, output: unknown): string {
  if (!output || typeof output !== "object") return "";
  const o = output as Record<string, unknown>;
  // tax_param: a keyed lookup of cited figures. Only when it actually found the figure.
  if (toolName === "tax_param" && o.found === true) {
    return `${JSON.stringify(o.facts ?? "")} ${String(o.summary ?? "")}`;
  }
  // tax_compute: deterministic engine output — value + line trace are grounded by construction.
  if (toolName === "tax_compute") {
    return `${String(o.value ?? "")} ${JSON.stringify(o.trace ?? "")}`;
  }
  // tax_research: ONLY when it produced a grounded answer (its figures already passed the engine's
  // numeric gate). A hedge / coverage_gap / abstain licenses no figure.
  if (toolName === "tax_research" && o.bucket === "answer") {
    return String(o.answer ?? "");
  }
  return "";
}

/**
 * Every money/percent figure the agent's reply asserts must trace to grounded tool output. Returns
 * the figures that do NOT — the parametric leaks. Empty ⇒ every figure in the reply is grounded
 * (or the reply states no figures at all, which is also fine).
 */
export function ungroundedReplyFigures(reply: string, groundedTexts: string[]): string[] {
  return ungroundedFigures(reply, groundedTexts.join("\n"));
}
