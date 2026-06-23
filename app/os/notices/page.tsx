// /os/notices — server entry. Real RLS-scoped firm data (else fixtures) → context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { NoticesView } from "./notices-view";

export default async function NoticesPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <NoticesView />
    </FirmDataProvider>
  );
}
