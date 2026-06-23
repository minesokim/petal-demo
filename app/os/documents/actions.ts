"use server";

import { withFirm } from "@/lib/auth/tenant";
import { setDocStatus } from "@/lib/repository/practice-writes";

// Document write-path. requestDocumentsAction records a real, audited request for
// each selected expected-doc: setDocStatus(id, "requested") runs RLS-scoped and
// appends one audit row per doc (doc.status) via the repository writer. The manual
// "Request documents" UI calls this from its existing Send handler, then
// router.refresh() re-reads the firm's docs from loadFirmData.

// Marks the given expected-docs as requested (idempotent for docs already in that
// state — the point is the audited request event). Returns how many rows changed.
export async function requestDocumentsAction(
  docIds: string[],
): Promise<{ requested: number }> {
  const ids = docIds.filter(Boolean);
  if (ids.length === 0) return { requested: 0 };
  const count = await withFirm(async (db, ctx) => {
    let n = 0;
    for (const id of ids) {
      if (await setDocStatus(db, ctx, id, "requested")) n++;
    }
    return n;
  });
  return { requested: count ?? 0 };
}
