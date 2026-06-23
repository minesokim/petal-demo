// /os/billing — server entry. Real RLS-scoped firm data (else fixtures) → context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { BillingView } from "./billing-view";

export default async function BillingPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <BillingView />
    </FirmDataProvider>
  );
}
