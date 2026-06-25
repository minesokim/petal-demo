import { describe, it, expect } from "vitest";
import { ungroundedReplyFigures } from "@/lib/agent/ground-gate";

// The diagnostic's trust-killer: the gate flagged the client's OWN $200,000 and the $180k/$20k
// arithmetic as "could not ground — do not rely on them." A gate that disclaims a preparer's own
// figures reads as broken. It must flag ONLY an invented legal parameter — never a user input,
// never arithmetic derived from inputs + grounded rates.
describe("agent ground-gate — number classification", () => {
  // The grounded authority for the 2026 gambling answer: the 90% wagering-loss rate (cited).
  const grounded = ["OBBBA §70114 amends IRC §165(d): wagering losses are deductible only up to 90% of losses, and only to the extent of winnings."];
  const userText = "My client won $200,000 and lost $200,000 gambling in 2026. What is their taxable gambling income?";

  it("does NOT flag the user's own input figures", () => {
    const reply = "The $200,000 of winnings is fully includible; the $200,000 of losses is limited.";
    expect(ungroundedReplyFigures(reply, grounded, userText)).toEqual([]);
  });

  it("does NOT flag arithmetic derived from the inputs and the grounded 90% rate", () => {
    const reply = "Deductible loss = 90% × $200,000 = $180,000, so taxable gambling income is $20,000.";
    expect(ungroundedReplyFigures(reply, grounded, userText)).toEqual([]);
  });

  it("does NOT flag a grounded legal parameter (the 90% rate is in the authority)", () => {
    expect(ungroundedReplyFigures("Only 90% of losses are deductible.", grounded, userText)).toEqual([]);
  });

  it("DOES flag an invented legal parameter — a stale figure from memory", () => {
    // The estate exemption stated from training weights, not grounded and not derivable.
    const reply = "The estate and gift exemption is $13,610,000 for the year.";
    expect(ungroundedReplyFigures(reply, grounded, userText)).toEqual(["$13,610,000"]);
  });

  it("flags the invented parameter but NOT the co-stated user input / arithmetic", () => {
    const reply = "On $200,000 of winnings, $180,000 is deductible; separately the cap is $99,999,999.";
    expect(ungroundedReplyFigures(reply, grounded, userText)).toEqual(["$99,999,999"]);
  });

  it("flags nothing when the reply states no figures", () => {
    expect(ungroundedReplyFigures("The losses are limited to a percentage of the amount lost.", grounded, userText)).toEqual([]);
  });
});
