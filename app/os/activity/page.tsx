// /os/activity — server entry. Real RLS-scoped firm data (else fixtures) → context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { ActivityView } from "./activity-view";

export default async function ActivityPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <ActivityView />
    </FirmDataProvider>
  );
}
