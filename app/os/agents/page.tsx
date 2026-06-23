// /os/agents — server entry. Real RLS-scoped firm data (else fixtures) → context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { AgentsView } from "./agents-view";

export default async function AgentsPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <AgentsView />
    </FirmDataProvider>
  );
}
