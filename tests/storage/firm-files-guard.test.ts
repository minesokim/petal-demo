// Tenant guard on signedUrlForFirmFile — the fix for the foundation security review's cross-firm
// document-read finding. signedUrlForFirmFile uses the service-role client (bypasses storage RLS),
// so it MUST refuse any object path outside the caller's firm prefix BEFORE minting a URL. The
// guard throws before any network/client call, so this is testable without Supabase configured.

import { describe, it, expect } from "vitest";
import { signedUrlForFirmFile } from "../../lib/storage/firm-files";

describe("signedUrlForFirmFile tenant guard", () => {
  it("refuses a path belonging to ANOTHER firm (cross-tenant read blocked)", async () => {
    // firm A asks to sign a key under firm B's prefix — exactly the extract_document exploit.
    await expect(signedUrlForFirmFile("firmB-uuid/abc-W2.pdf", "firmA-uuid")).rejects.toThrow(
      /cross-firm storage access denied/,
    );
  });

  it("refuses a bare/relative key with no firm prefix", async () => {
    await expect(signedUrlForFirmFile("abc-W2.pdf", "firmA-uuid")).rejects.toThrow(
      /cross-firm storage access denied/,
    );
  });

  it("refuses when firmId is empty (fail-closed)", async () => {
    await expect(signedUrlForFirmFile("firmA-uuid/abc.pdf", "")).rejects.toThrow(
      /cross-firm storage access denied/,
    );
  });

  it("a prefix-spoof (firmA-uuid-evil/...) does not satisfy the firmA-uuid/ guard", async () => {
    // startsWith(`${firmId}/`) requires the SLASH boundary, so a sibling-prefix attack fails.
    await expect(signedUrlForFirmFile("firmA-uuid-evil/x.pdf", "firmA-uuid")).rejects.toThrow(
      /cross-firm storage access denied/,
    );
  });
});
