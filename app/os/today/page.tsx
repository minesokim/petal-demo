// /os/today — server entry. Real RLS-scoped firm data (else fixtures) → context.
import { loadFirmData } from "@/lib/server/firm-data";
import { buildTodaysBrief } from "@/lib/server/todays-brief";
import { FirmDataProvider } from "@/lib/client/firm-context";
import { BriefProvider } from "@/lib/client/brief-context";
import { TodayView } from "./today-view";

export default async function TodayPage() {
  const data = await loadFirmData();
  const brief = await buildTodaysBrief(data); // IRS/practice desks AI-generated (cached daily); firm/season derived
  return (
    <FirmDataProvider data={data}>
      <BriefProvider brief={brief}>
        <TodayView />
      </BriefProvider>
    </FirmDataProvider>
  );
}
