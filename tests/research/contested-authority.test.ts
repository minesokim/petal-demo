// Wiring guard for the "unsettled" calibration (the moat the regrade flagged as dead code). Model-free:
// it proves the contested signal flows chunk → assessAuthorityWeight, so the engine's CONTESTED-AUTHORITY
// GATE (engine.ts) can route a grounded contested answer to bucket "hedge" / calibration "unsettled".
import { describe, it, expect } from "vitest";
import { CORPUS_CASELAW } from "../../lib/research/corpus-caselaw";
import { assessAuthorityWeight } from "../../lib/research/authority-assess";

const byId = (id: string) => CORPUS_CASELAW.find((c) => c.chunkId === id)!;

describe("contested-authority wiring — the 'unsettled' hedge is live, not dead code", () => {
  it("the circuit-split cases are tagged contested", () => {
    expect(byId("case-frank-aragona-trust-v-commissioner").contested, "Aragona should be contested").toBe(true);
    expect(byId("case-chai-v-commissioner").contested, "Chai should be contested").toBe(true);
  });

  it("assessAuthorityWeight surfaces contested=true when a grounded authority is non-final", () => {
    const a = assessAuthorityWeight([byId("case-frank-aragona-trust-v-commissioner")]);
    expect(a.contested).toBe(true);
  });

  it("a settled authority is NOT contested (the gate stays off for final law)", () => {
    const a = assessAuthorityWeight([byId("case-commissioner-v-tufts")]);
    expect(a.contested).toBe(false);
  });

  it("contested is sticky: a mix of settled + contested support is contested (the answer rests on open law)", () => {
    const a = assessAuthorityWeight([byId("case-commissioner-v-tufts"), byId("case-chai-v-commissioner")]);
    expect(a.contested).toBe(true);
  });
});
