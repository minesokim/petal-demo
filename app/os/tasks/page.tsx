// /os/tasks — server entry. Loads the firm's real (RLS-scoped) data when
// authed, else fixtures, and provides it to the unchanged view via context.
import { loadFirmData } from "@/lib/server/firm-data";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { TasksView } from "./tasks-view";

export default async function TasksPage() {
  const data = await loadFirmData();
  return (
    <FirmDataProvider data={data}>
      <TasksView />
    </FirmDataProvider>
  );
}
