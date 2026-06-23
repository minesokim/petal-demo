"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CalEvent } from "../fixtures/calendar";

// Carries the calendar's events (real gcal pull when signed in, fixtures in the demo)
// to the client view. The server page loads events via loadCalendarEvents() and wraps
// the view in <CalendarProvider>; the view reads useCalendarEvents() instead of importing
// the fixture array. Same CalEvent shape either way, so the JSX stays byte-identical.
const CalendarContext = createContext<CalEvent[] | null>(null);

export function CalendarProvider({ events, children }: { events: CalEvent[]; children: ReactNode }) {
  return <CalendarContext.Provider value={events}>{children}</CalendarContext.Provider>;
}

export function useCalendarEvents(): CalEvent[] {
  const e = useContext(CalendarContext);
  if (!e) throw new Error("useCalendarEvents must be used within a CalendarProvider");
  return e;
}

// Same logic as the fixture helpers in lib/fixtures/calendar.ts, bound to the provided
// array instead of the module-level `calendarEvents`.
export function eventsOn(events: CalEvent[], iso: string): CalEvent[] {
  return events
    .filter(e => e.date === iso)
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
}

/** Upcoming scheduled items from a given ISO date forward - drives the rail. */
export function upcomingEvents(events: CalEvent[], fromIso: string, limit = 8): CalEvent[] {
  return events
    .filter(e => e.date >= fromIso && !e.done)
    .sort((a, b) => (a.date === b.date ? (a.time ?? "").localeCompare(b.time ?? "") : a.date.localeCompare(b.date)))
    .slice(0, limit);
}
