// /os/practice — server entry. Real RLS-scoped firm data (else fixtures) → context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { PracticeView } from "./practice-view";

export default async function PracticePage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <PracticeView />
    </FirmDataProvider>
  );
}
