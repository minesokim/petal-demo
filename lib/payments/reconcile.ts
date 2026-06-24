import { withTenant } from "@/lib/db/client";
import * as repo from "@/lib/repository/practice";
import { makeDerive } from "@/lib/fixtures/derive";
import type { Db } from "@/lib/repository/types";

// ⑦ Webhook-side invoice validation. Re-derive the EXPECTED balance (in cents) for a
// household's invoice from the authoritative data — never trust the amount the webhook
// payload (or its metadata) claims. Scoped to the firm via RLS (withTenant), so a
// household id that doesn't belong to this firm resolves to nothing → null (refuse).
//
// Returns the expected amount_total in cents, or null if the household/invoice can't be
// resolved or has no positive balance (in which case the webhook must NOT mark it paid).
export async function expectedInvoiceCents(firmId: string, householdId: string): Promise<number | null> {
  const claims = { firm_id: firmId, role: "system", user_type: "preparer" as const };
  return withTenant(claims, async (db: Db) => {
    const [households, engagements, expectedDocs, tasks] = await Promise.all([
      repo.listHouseholds(db),
      repo.activeEngagements(db),
      repo.listExpectedDocs(db),
      repo.listTasks(db),
    ]);
    // RLS already scoped the rows to firmId; if the household isn't ours it won't be present.
    if (!households.some((h) => h.id === householdId)) return null;

    const d = makeDerive({
      households, engagements, expectedDocs, tasks,
      people: [], entities: [], notices: [], positions: [], skillRuns: [], skills: [], activity: [], threads: [],
    } as never);
    const inv = d.invoiceOf(householdId);
    if (!inv || inv.balance <= 0) return null;
    return Math.round(inv.balance * 100); // cents, to compare against Stripe amount_total
  });
}
