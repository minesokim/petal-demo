// /os/inbox — server entry. Real RLS-scoped firm data (else fixtures) → context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { InboxView } from "./inbox-view";

export default async function InboxPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <InboxView />
    </FirmDataProvider>
  );
}
