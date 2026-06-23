// /os/settings — server entry. Loads the firm's real (RLS-scoped) data when
// authed, else fixtures, and provides it to the unchanged view via context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { SettingsView } from "./settings-view";

export default async function SettingsPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <SettingsView />
    </FirmDataProvider>
  );
}
