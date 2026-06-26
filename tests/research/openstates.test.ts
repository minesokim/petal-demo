import { describe, it, expect, afterEach } from "vitest";
import { stateInQuestion, matchesOpenStates, searchOpenStates } from "@/lib/research/fetch/openstates";

// OpenStates is the 50-state legislation source, KEY-GATED. It must stay fully dormant (honest no-source)
// until OPENSTATES_API_KEY is present, then route only a real state-legislation question.

describe("openstates — env-gated state legislation source", () => {
  afterEach(() => {
    delete process.env.OPENSTATES_API_KEY;
  });

  it("is DORMANT without the API key (no fake fallback)", async () => {
    delete process.env.OPENSTATES_API_KEY;
    expect(matchesOpenStates("Is there a California bill on the PTET?")).toBe(false);
    expect(await searchOpenStates("any California tax bill", {})).toEqual([]);
  });

  it("activates the matcher once the key is set — but still needs a state AND a legislation cue", () => {
    process.env.OPENSTATES_API_KEY = "k";
    expect(matchesOpenStates("Is there a New York bill on pass-through entity tax?")).toBe(true);
    expect(matchesOpenStates("what is the New York standard deduction")).toBe(false); // no legislation cue
    expect(matchesOpenStates("is there pending tax legislation")).toBe(false); // no state
  });

  it("detects single-word, multi-word states, and DC; null for a federal question", () => {
    expect(stateInQuestion("a Texas franchise tax bill")).toBe("Texas");
    expect(stateInQuestion("New Hampshire interest and dividends bill")).toBe("New Hampshire");
    expect(stateInQuestion("District of Columbia tax legislation")).toBe("District of Columbia");
    expect(stateInQuestion("a federal §1202 QSBS question")).toBeNull();
  });
});
