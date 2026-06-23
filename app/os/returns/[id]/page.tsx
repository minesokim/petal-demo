// /os/returns/[id] — server entry. Loads the firm's real (RLS-scoped) data when
// authed, else fixtures, and provides it to the unchanged view via context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { ReturnsDetailView } from "./returns-detail-view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <ReturnsDetailView id={id} />
    </FirmDataProvider>
  );
}
