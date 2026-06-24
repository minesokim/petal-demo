// /os/inbox — server entry. Real RLS-scoped firm data (else fixtures) → context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { AutoRefresh } from "@/components/os/auto-refresh";
import { InboxView } from "./inbox-view";

export default async function InboxPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      {/* Poll so an inbound text (written by /api/sms/inbound) appears in an open inbox
          within ~10s without a manual reload; selected thread + draft are preserved. */}
      <AutoRefresh intervalMs={10_000} />
      <InboxView />
    </FirmDataProvider>
  );
}
