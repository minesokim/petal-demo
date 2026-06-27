import { ungroundedFigures, figureValue, figureValuesIn } from "@/lib/research/engine";

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
 * The figures the agent's reply asserts that are genuine PARAMETRIC LEAKS — an invented legal
 * parameter (a cap, threshold, rate, exemption) that is neither grounded nor derivable. A reply
 * figure is NOT a leak, and must never be flagged, if it is any of three other kinds of number:
 *   1. a USER INPUT — a figure the user supplied in their question (the client's $200,000 winnings),
 *   2. a GROUNDED figure — one that appears in grounded tool output (an authority-verified rate, a
 *      deterministic computation), or
 *   3. DERIVED ARITHMETIC — a figure obtained from the above by simple arithmetic (a percentage of,
 *      or a sum/difference/product of them): $180,000 = 90% × $200,000, $20,000 = $200,000 − $180,000.
 * Flagging a client's own number or the arithmetic built on it ("do not rely on $200,000") reads as
 * broken; the gate exists only to catch a number the model INVENTED from memory. `userText` is the
 * user's own message(s) so their inputs are anchors. Empty ⇒ nothing to flag.
 */
export function ungroundedReplyFigures(reply: string, groundedTexts: string[], userText = ""): string[] {
  const anchorsText = `${groundedTexts.join("\n")}\n${userText}`;
  // Figures in the reply not LITERALLY present in the anchors (user inputs + grounded output).
  const notLiteral = ungroundedFigures(reply, anchorsText);
  if (!notLiteral.length) return [];
  // Of those, keep only the ones that are also not ARITHMETICALLY DERIVABLE from the anchors. The anchor
  // set unions the $-prefixed figures (figureValuesIn) with BARE money the user typed WITHOUT a "$"
  // ("5 million", "2.65M", "5,000,000") — otherwise a question like "sold for 5 million, I own 53%" leaves
  // 5,000,000 unanchored and the gate falsely flags the user's own $5,000,000 and the $2,650,000 = 53%×5M
  // arithmetic built on it. (The leak we DO want is an invented legal parameter, never the client's numbers.)
  const anchors = [...figureValuesIn(anchorsText), ...bareMoneyValues(anchorsText)];
  return notLiteral.filter((f) => {
    const v = figureValue(f);
    return v != null && !isArithmeticallyDerivable(v, anchors);
  });
}

// Money-shaped numbers written WITHOUT a leading "$" — comma-grouped (5,000,000) or magnitude-suffixed
// (5 million / 2.65M / 5k). Deliberately NOT bare small integers ("3 years", "100 shareholders") so the
// anchor set gains the user's dollar figures without absorbing every count in the text.
function bareMoneyValues(text: string): number[] {
  const out: number[] = [];
  const re = /\$?\s?(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?\s?(?:k|m|b|million|billion))\b/gi;
  for (const m of text.matchAll(re)) {
    const mm = m[1].toLowerCase().replace(/[\s,]/g, "").match(/^(\d+(?:\.\d+)?)(k|m|b|million|billion)?$/);
    if (!mm) continue;
    let n = parseFloat(mm[1]);
    switch (mm[2]) {
      case "k": n *= 1e3; break;
      case "m": case "million": n *= 1e6; break;
      case "b": case "billion": n *= 1e9; break;
    }
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

// True if `v` equals an anchor, or a sum / difference / product / percentage of anchors (with one
// extra expansion pass for transitive derivations like $20,000 = $200,000 − ($200,000 × 90%)).
// Tolerant equality so rounding/formatting never causes a false flag. Bounded by the (small) anchor
// set: derived grows by ×(|anchors|·5) per pass, and anchors is a handful of numbers.
function isArithmeticallyDerivable(v: number, anchors: number[]): boolean {
  if (v === 0) return true; // $0 / 0% (e.g. "excludes none of the gain") is trivially supportable
  // Near-exact: arithmetic on the anchors is exact, so only absorb float error — never an off-by-one
  // (a derived 39 must NOT count as the asserted 40, or a stale percent would slip through).
  const eq = (a: number, b: number) => Math.abs(a - b) <= Math.abs(b) * 1e-9 + 1e-6;
  const base = [...new Set(anchors.filter((n) => Number.isFinite(n)))];
  if (base.some((a) => eq(a, v))) return true;
  const derived = new Set(base);
  for (let pass = 0; pass < 2; pass++) {
    for (const a of [...derived]) {
      for (const b of base) {
        derived.add(a + b);
        derived.add(Math.abs(a - b));
        derived.add(a * b);
        derived.add(a * (b / 100)); // b% of a
        derived.add(a * (1 - b / 100)); // a reduced by b%
      }
    }
    if ([...derived].some((a) => eq(a, v))) return true;
  }
  return false;
}
