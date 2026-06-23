import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { withFirm } from "@/lib/auth/tenant";
import { firms } from "@/lib/db/schema";
import { OnboardingFlow } from "./onboarding-flow";

// Signed-in onboarding. withFirm provisions the user's empty firm on first hit.
export default async function OnboardingPage() {
  const firm = await withFirm(async (db, ctx) => {
    const [row] = await db
      .select({ name: firms.name, settings: firms.settings })
      .from(firms)
      .where(eq(firms.id, ctx.firmId));
    return row;
  });

  if (!firm) redirect("/sign-in");
  if (firm.settings && (firm.settings as { onboarded?: boolean }).onboarded) redirect("/os");

  return <OnboardingFlow defaultFirmName={firm.name ?? "My Firm"} />;
}
