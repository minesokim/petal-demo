// /os/today — server entry. Real RLS-scoped firm data (else fixtures) → context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { TodayView } from "./today-view";

export default async function TodayPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <TodayView />
    </FirmDataProvider>
  );
}
