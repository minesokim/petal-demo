import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { NoticesDetailView } from "./notices-detail-view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <NoticesDetailView id={id} />
    </FirmDataProvider>
  );
}
