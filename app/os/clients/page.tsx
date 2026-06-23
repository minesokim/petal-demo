// /os/clients — server entry. Loads the firm's real (RLS-scoped) data when
// authed, else fixtures, and provides it to the unchanged view via context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { ClientsView } from "./clients-view";

export default async function ClientsPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <ClientsView />
    </FirmDataProvider>
  );
}
