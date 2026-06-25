import { describe, it, expect } from "vitest";
import { unestablishedNamedForm } from "@/lib/tax/authority/store";

const tipsStatute = [{ text: "OBBBA §70201 enacting IRC §224 — qualified-tips deduction. A deduction for qualified tips, up to a cap, available 2025-2028." }];

describe("fabrication guard — unestablishedNamedForm", () => {
  it("declines a DESCRIBE query for a fake form whose name no retrieved authority establishes", () => {
    // The §224 tips-deduction statute is semantically adjacent but does NOT name a 'Schedule TIP' form.
    expect(unestablishedNamedForm("What information goes on the new Schedule TIP attached to Form 1040 for 2025?", tipsStatute)).toBe("Schedule TIP");
    expect(unestablishedNamedForm("What information goes on the new Form 1099-OBBBA my clients are asking about?", tipsStatute)).toBe("Form 1099-OBBBA");
  });

  it("does NOT fire for a common real form (allowlisted) even if the statute text omits it", () => {
    expect(unestablishedNamedForm("What information goes on Form 1040 for the standard deduction?", tipsStatute)).toBeNull();
    expect(unestablishedNamedForm("How do I fill out Schedule C for my business?", tipsStatute)).toBeNull();
  });

  it("does NOT fire when the retrieved authority DOES name the form (it is established)", () => {
    const withForm = [{ text: "Schedule TIP is the new attachment for reporting the tips deduction; it has lines for total tips and the deduction." }];
    expect(unestablishedNamedForm("What information goes on the new Schedule TIP?", withForm)).toBeNull();
  });

  it("does NOT fire on a non-describe question that merely mentions a form", () => {
    expect(unestablishedNamedForm("Is the qualified business income deduction reported somewhere on Form 8995-Z?", tipsStatute)).toBeNull();
  });
});
