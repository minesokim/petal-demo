import { describe, it, expect } from "vitest";
import { redactObject, redactText } from "../../lib/ai/redact";

describe("redact — data minimization before the model", () => {
  it("masks SSN-shaped strings anywhere in text", () => {
    expect(redactText("client ssn 123-45-6789 on file")).toBe("client ssn [REDACTED-SSN] on file");
    expect(redactText("123456789")).toBe("[REDACTED-SSN]");
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
