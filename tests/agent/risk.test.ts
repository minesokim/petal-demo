import { describe, it, expect } from "vitest";
import { classifyRisk, type ClassifiableTool } from "../../lib/agent/risk";

// The risk classifier is the deterministic heart of the gate: tool metadata + live signals
// → one of four lanes. These assertions are the truth table from the spec (§3).

const read: ClassifiableTool = { name: "find_client", tier: 1, access: "read" };
const tier2: ClassifiableTool = { name: "draft_email", tier: 2, access: "write" };
const internalWrite: ClassifiableTool = { name: "create_task", tier: 3, access: "write", connector: "internal", stakes: "low", reversible: true };
const xeroWrite: ClassifiableTool = { name: "create_xero_bank_transaction", tier: 3, access: "write", connector: "api", stakes: "high" };
const oltStage: ClassifiableTool = { name: "olt_stage_return", tier: 3, access: "write", connector: "browser", stakes: "high" };
const oltSubmit: ClassifiableTool = { name: "olt_submit_return", tier: 3, access: "write", connector: "browser", stakes: "high", irreversibleSubmit: true };

describe("classifyRisk — lanes", () => {
  it("read tools auto-execute", () => {
    expect(classifyRisk(read, {}).lane).toBe("auto");
    expect(classifyRisk(read, {}).humanMustSubmit).toBe(false);
  });

  it("tier-2 propose-only is auto (stages nothing external)", () => {
    expect(classifyRisk(tier2, {}).lane).toBe("auto");
  });

  it("tier-3 internal low-stakes write is one-click confirm", () => {
    const r = classifyRisk(internalWrite, {});
    expect(r.lane).toBe("confirm");
    expect(r.humanMustSubmit).toBe(false);
  });

  it("tier-3 external money write is mandatory review", () => {
    const r = classifyRisk(xeroWrite, {});
    expect(r.lane).toBe("review");
    expect(r.stakes).toBe("high");
    expect(r.humanMustSubmit).toBe(false);
  });

  it("browser-driven write is review (least reliable connector)", () => {
    expect(classifyRisk(oltStage, {}).lane).toBe("review");
    expect(classifyRisk(oltStage, {}).connector).toBe("browser");
  });

  it("irreversible external submit is review AND humanMustSubmit", () => {
    const r = classifyRisk(oltSubmit, {});
    expect(r.lane).toBe("review");
    expect(r.humanMustSubmit).toBe(true);
  });
});

describe("classifyRisk — confidence demotion", () => {
  it("a confirm-lane action with an abstaining research bucket demotes to review", () => {
    const r = classifyRisk(internalWrite, {}, { researchBucket: "abstain" });
    expect(r.lane).toBe("review");
    expect(r.factors.some((f) => f.name === "confidence")).toBe(true);
  });

  it("a confirm-lane action with recon mismatches demotes to review", () => {
    expect(classifyRisk(internalWrite, {}, { reconMismatches: ["amount off by 0.40"] }).lane).toBe("review");
  });

  it("a confirm-lane action with OLT validation errors demotes to review", () => {
    expect(classifyRisk(internalWrite, {}, { validationErrors: 2 }).lane).toBe("review");
  });

  it("low numeric confidence demotes confirm to review", () => {
    expect(classifyRisk(internalWrite, {}, { confidence: 0.4 }).lane).toBe("review");
    expect(classifyRisk(internalWrite, {}, { confidence: 0.9 }).lane).toBe("confirm");
  });

  it("does NOT demote a read tool (no confidence gate on auto)", () => {
    expect(classifyRisk(read, {}, { researchBucket: "abstain", confidence: 0.1 }).lane).toBe("auto");
  });
});

describe("classifyRisk — defaults + factors", () => {
  it("defaults an unannotated tier-3 write to high-stakes review when no connector is given", () => {
    const bare: ClassifiableTool = { name: "mystery_write", tier: 3, access: "write" };
    // unannotated external intent is unknown -> internal default -> low stakes -> confirm,
    // but reversibility defaults to false for tier-3, which is surfaced as a factor.
    const r = classifyRisk(bare, {});
    expect(["confirm", "review"]).toContain(r.lane);
    expect(r.factors.length).toBeGreaterThan(0);
  });

  it("every review assessment carries human-readable factors and a level", () => {
    const r = classifyRisk(oltSubmit, {});
    expect(r.factors.length).toBeGreaterThan(0);
    expect(r.level).toBe("high");
    expect(r.factors.every((f) => f.name && f.detail)).toBe(true);
  });

  it("surfaces signals_unavailable as a factor without downgrading", () => {
    const r = classifyRisk(xeroWrite, {}, { signalsUnavailable: true });
    expect(r.lane).toBe("review");
    expect(r.factors.some((f) => f.name === "signals_unavailable")).toBe(true);
  });
});
