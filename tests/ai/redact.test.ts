import { describe, it, expect } from "vitest";
import { redactObject, redactText } from "../../lib/ai/redact";

describe("redact — data minimization before the model", () => {
  it("masks SSN-shaped strings anywhere in text", () => {
    expect(redactText("client ssn 123-45-6789 on file")).toBe("client ssn [REDACTED-SSN] on file");
    expect(redactText("123456789")).toBe("[REDACTED-SSN]");
  });

  it("masks EIN, credit-card, and long account numbers in free text", () => {
    expect(redactText("EIN 12-3456789 filed")).toBe("EIN [REDACTED-NUM] filed");
    expect(redactText("card 4111-1111-1111-1111")).toBe("card [REDACTED-NUM]");
    expect(redactText("acct 4111111111111111 on file")).toBe("acct [REDACTED-NUM] on file");
    expect(redactText("amount 58,000 this year")).toBe("amount 58,000 this year"); // no false positive
  });

  it("redacts crown-jewel keys and recurses into nested objects/arrays", () => {
    const out = redactObject({
      name: "Mia",
      ssn: "123-45-6789",
      bankAccount: "0001",
      docs: [{ routingNumber: "y", note: "fine" }],
    });
    expect(out).toEqual({
      name: "Mia",
      ssn: "[REDACTED]",
      bankAccount: "[REDACTED]",
      docs: [{ routingNumber: "[REDACTED]", note: "fine" }],
    });
  });
});
