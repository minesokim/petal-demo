import { describe, it, expect } from "vitest";
import { validateUpload, MAX_UPLOAD_BYTES } from "../../lib/storage/upload-guard";

// Upload hardening: an uploaded file must pass size + MIME-allowlist + magic-byte checks before it is
// stored, so an oversized file, a disallowed type, or a disguised executable is rejected at the door.

const bytesOf = (...b: number[]) => new Uint8Array([...b, ...new Array(64).fill(0)]);
const PDF = bytesOf(0x25, 0x50, 0x44, 0x46); // %PDF
const PNG = bytesOf(0x89, 0x50, 0x4e, 0x47);
const JPEG = bytesOf(0xff, 0xd8, 0xff, 0xe0);
const DOCX = bytesOf(0x50, 0x4b, 0x03, 0x04); // PK zip
const MZ = bytesOf(0x4d, 0x5a, 0x90, 0x00); // Windows PE executable ("MZ")

describe("validateUpload — MIME + magic-byte + size hardening", () => {
  it("accepts a real PDF / PNG / JPEG / DOCX whose magic bytes match the declared type", () => {
    expect(validateUpload(PDF, "application/pdf")).toEqual({ ok: true, mime: "application/pdf" });
    expect(validateUpload(PNG, "image/png").ok).toBe(true);
    expect(validateUpload(JPEG, "image/jpeg").ok).toBe(true);
    expect(validateUpload(DOCX, "application/vnd.openxmlformats-officedocument.wordprocessingml.document").ok).toBe(true);
  });

  it("normalizes a content-type with parameters", () => {
    expect(validateUpload(JPEG, "image/jpeg; charset=binary").ok).toBe(true);
  });

  it("REJECTS an executable disguised as a PDF (magic bytes don't match)", () => {
    const r = validateUpload(MZ, "application/pdf");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/does not match/i);
  });

  it("REJECTS a disallowed MIME type outright", () => {
    expect(validateUpload(MZ, "application/x-msdownload").ok).toBe(false);
    expect(validateUpload(PDF, "application/octet-stream").ok).toBe(false);
  });

  it("REJECTS an oversized file before it is stored", () => {
    const big = { byteLength: MAX_UPLOAD_BYTES + 1 } as unknown as Uint8Array;
    const r = validateUpload(big, "application/pdf");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/limit/i);
  });

  it("REJECTS an empty file", () => {
    expect(validateUpload(new Uint8Array(0), "application/pdf").ok).toBe(false);
  });

  it("allows text/csv by MIME (no reliable signature to magic-check)", () => {
    expect(validateUpload(bytesOf(0x61, 0x2c, 0x62), "text/csv").ok).toBe(true);
  });
});
