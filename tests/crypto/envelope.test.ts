import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "node:crypto";
import { encryptPII, decryptPII, isEncrypted } from "../../lib/crypto/envelope";

beforeAll(() => {
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("envelope encryption (AES-256-GCM, KEK-wrapped DEK)", () => {
  it("round-trips and the token is opaque (no plaintext)", () => {
    const token = encryptPII("123-45-6789");
    expect(isEncrypted(token)).toBe(true);
    expect(token).not.toContain("123-45-6789");
    expect(decryptPII(token)).toBe("123-45-6789");
  });

  it("is non-deterministic (fresh DEK + IV per call)", () => {
    expect(encryptPII("123-45-6789")).not.toBe(encryptPII("123-45-6789"));
  });

  it("rejects tampering (GCM auth tag)", () => {
    const token = encryptPII("secret");
    const body = JSON.parse(Buffer.from(token.slice("enc:v1:".length), "base64").toString());
    body.ct = Buffer.from(randomBytes(body.ct.length)).toString("base64"); // flip ciphertext
    const tampered = "enc:v1:" + Buffer.from(JSON.stringify(body)).toString("base64");
    expect(() => decryptPII(tampered)).toThrow();
  });

  it("cannot decrypt with the wrong master key", () => {
    const token = encryptPII("secret");
    const wrong = randomBytes(32);
    expect(() => decryptPII(token, wrong)).toThrow();
  });
});
