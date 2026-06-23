// /os/calendar — server entry for the firm scheduling calendar. Loads the events
// (real Google Calendar pull when signed in, the fixture world in the demo) and hands
// them to the client view via CalendarProvider. The presentational markup lives in
// calendar-view.tsx and is unchanged — only the data SOURCE moves here.

import { loadCalendarEvents } from "@/lib/server/calendar";
import { CalendarProvider } from "@/lib/client/calendar-context";
import CalendarView from "./calendar-view";

export default async function CalendarPage() {
  const events = await loadCalendarEvents();
  return (
    <CalendarProvider events={events}>
      <CalendarView />
    </CalendarProvider>
  );
}
