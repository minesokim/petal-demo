// UPLOAD HARDENING (the MIME + magic-byte + size half of the spec's "upload hardening (MIME + AV)").
// Validate an uploaded file BEFORE it is stored: cap the size, require the declared MIME to be on an
// allowlist, and verify the MAGIC BYTES match the declared type so a disguised executable claiming
// application/pdf is rejected. Pure + dependency-free so it is cheap to unit-test and safe to call inline
// in the upload path. AV scanning (ClamAV / an external scanner) is a separate, credential-dependent
// integration tracked in docs/SOC2_WISP_MAPPING.md.

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB — generous for a scanned multi-page return

// Allowed types + the leading magic-byte signatures that prove the content IS that type. A type listed
// without a signature (plain text / csv — no reliable signature) is allowed by MIME but not magic-checked.
const SIGNATURES: { mime: string; magic: number[][] }[] = [
  { mime: "application/pdf", magic: [[0x25, 0x50, 0x44, 0x46]] }, // %PDF
  { mime: "image/png", magic: [[0x89, 0x50, 0x4e, 0x47]] },
  { mime: "image/jpeg", magic: [[0xff, 0xd8, 0xff]] },
  { mime: "image/tiff", magic: [[0x49, 0x49, 0x2a, 0x00], [0x4d, 0x4d, 0x00, 0x2a]] },
  // Office Open XML (docx/xlsx) are zip containers → start with "PK\x03\x04".
  { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", magic: [[0x50, 0x4b, 0x03, 0x04]] },
  { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", magic: [[0x50, 0x4b, 0x03, 0x04]] },
];

// Types allowed by MIME but whose signature is too variable to magic-check reliably (container formats).
const MIME_ONLY = new Set(["text/plain", "text/csv", "application/csv", "image/heic", "image/heif", "image/webp"]);

const ALLOWED_MIMES = new Set<string>([...SIGNATURES.map((s) => s.mime), ...MIME_ONLY]);

export type UploadValidation = { ok: true; mime: string } | { ok: false; reason: string };

/** Normalize a declared content-type ("image/jpeg; charset=..." → "image/jpeg"). */
function normMime(declared: string): string {
  return (declared || "").toLowerCase().split(";")[0].trim();
}

export function validateUpload(bytes: Uint8Array, declaredMime: string, opts: { maxBytes?: number } = {}): UploadValidation {
  const max = opts.maxBytes ?? MAX_UPLOAD_BYTES;
  if (bytes.byteLength === 0) return { ok: false, reason: "empty file" };
  if (bytes.byteLength > max) return { ok: false, reason: `file exceeds the ${Math.round(max / 1024 / 1024)} MB limit` };

  const mime = normMime(declaredMime);
  if (!ALLOWED_MIMES.has(mime)) return { ok: false, reason: `disallowed file type: ${mime || "unknown"}` };

  // Magic-byte check: for any type with a known signature, the content's leading bytes MUST match one of
  // them — this is what catches a renamed executable or script claiming to be a PDF/image/office doc.
  const sig = SIGNATURES.find((s) => s.mime === mime);
  if (sig) {
    const matches = sig.magic.some((m) => m.every((b, i) => bytes[i] === b));
    if (!matches) return { ok: false, reason: `file content does not match its declared type (${mime})` };
  }
  return { ok: true, mime };
}
