"use server";

import { withFirm } from "@/lib/auth/tenant";
import * as repo from "@/lib/repository/practice";
import { makeDerive } from "@/lib/fixtures/derive";
import { createInvoiceCheckout } from "@/lib/payments/stripe";
import { writeAudit } from "@/lib/repository/audit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://petal-prod.vercel.app";

// Start a hosted Stripe Checkout for a household's invoice balance. The amount is
// computed SERVER-SIDE from the authoritative invoice (never trust the client), and
// the whole thing is audited + RLS-scoped via withFirm.
export async function payInvoiceAction(householdId: string): Promise<{ url: string | null } | null> {
  return withFirm(async (db, ctx) => {
    const [households, engagements, expectedDocs, tasks, people] = await Promise.all([
      repo.listHouseholds(db),
      repo.activeEngagements(db),
      repo.listExpectedDocs(db),
      repo.listTasks(db),
      repo.peopleOf(db, householdId),
    ]);
    // invoiceOf only reads households/engagements/expectedDocs/tasks; rest can be empty.
    const d = makeDerive({
      households, engagements, expectedDocs, tasks,
      people: [], entities: [], notices: [], positions: [], skillRuns: [], skills: [], activity: [], threads: [],
    } as never);
    const inv = d.invoiceOf(householdId);
    if (!inv || inv.balance <= 0) return { url: null };

    try {
      const session = await createInvoiceCheckout({
        amount: inv.balance,
        description: `${inv.clientName} — invoice ${inv.number}`,
        clientEmail: people[0]?.email ?? undefined,
        successUrl: `${APP_URL}/os/billing?paid=1`,
        cancelUrl: `${APP_URL}/os/billing`,
        metadata: { firmId: ctx.firmId, householdId, invoice: inv.number },
      });
      await writeAudit(db, ctx, {
        action: "invoice.checkout",
        resourceType: "invoice",
        resourceId: inv.id,
        metadata: { householdId, amount: inv.balance },
      });
      return { url: session.url };
    } catch (err) {
      // A Stripe outage must not 500 the billing page. Log the error name only.
      console.error("payInvoiceAction: checkout failed", (err as Error)?.name);
      return { url: null };
    }
  });
}
