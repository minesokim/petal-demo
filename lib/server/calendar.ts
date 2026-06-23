import "server-only";
import { withFirm } from "../auth/tenant";
import { listConnections } from "../repository/connections";
import { executeTool } from "../connectors/composio";
import { calendarEvents, type CalEvent } from "../fixtures/calendar";

// The calendar data seam (mirrors lib/server/firm-data.ts). Signed-out → the fixture
// world so the demo/preview renders 1:1. Signed-in → the firm's OWN Google Calendar
// (via Composio), or an empty calendar if gcal isn't connected. §7216: the firm's own
// calendar is not taxpayer data and no AI is involved — a plain live pull.

// Composio toolkit slugs that mean "Google Calendar". listConnections stores the
// toolkit as the Composio slug ("googlecalendar"); we accept "gcal" defensively too.
const GCAL_TOOLKITS = new Set(["googlecalendar", "gcal"]);

// Verified action slug + arg names from the Composio GOOGLECALENDAR_EVENTS_LIST tool
// schema (camelCase, passed through to the Google Calendar API). Response payload lives
// under data.items (each: id, summary, start/end {dateTime|date}, location, description).
const GCAL_LIST_EVENTS = "GOOGLECALENDAR_EVENTS_LIST";
const WINDOW_DAYS = 60;

type GcalDateTime = { dateTime?: string; date?: string; timeZone?: string };
type GcalEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: GcalDateTime;
  end?: GcalDateTime;
};

const yyyymmdd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// A Google start/end is either a timed event ({ dateTime }) or all-day ({ date }).
function gcalDate(slot?: GcalDateTime): string | undefined {
  if (slot?.date) return slot.date; // already yyyy-mm-dd
  if (slot?.dateTime) {
    const d = new Date(slot.dateTime);
    if (!Number.isNaN(d.getTime())) return yyyymmdd(d);
  }
  return undefined;
}

// "3:00 PM" from an RFC3339 dateTime; undefined for all-day events.
function gcalTime(slot?: GcalDateTime): string | undefined {
  if (!slot?.dateTime) return undefined;
  const d = new Date(slot.dateTime);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function toCalEvent(e: GcalEvent, i: number): CalEvent | null {
  const date = gcalDate(e.start) ?? gcalDate(e.end);
  if (!date) return null; // can't place an event with no resolvable date
  return {
    id: e.id ?? `gcal-${i}`,
    date,
    title: e.summary?.trim() || "(no title)",
    type: "meeting", // gcal events surface as meetings; blocks/office are firm-authored fixtures
    time: gcalTime(e.start),
    endTime: gcalTime(e.end),
    location: e.location?.trim() || undefined,
    with: undefined,
    notes: e.description?.trim() || undefined,
    // householdId intentionally absent — gcal events aren't linked to a firm household.
  };
}

export async function loadCalendarEvents(): Promise<CalEvent[]> {
  const real = await withFirm(async (db, ctx) => {
    const conns = await listConnections(db);
    const gcal = conns.find((c) => GCAL_TOOLKITS.has(c.toolkit) && c.status === "connected");
    // A real firm with no calendar connected sees an empty calendar — correct, not mock.
    if (!gcal) return [];

    const now = new Date();
    const until = new Date(now);
    until.setDate(until.getDate() + WINDOW_DAYS);

    try {
      const res = await executeTool(GCAL_LIST_EVENTS, `firm_${ctx.firmId}`, {
        calendarId: "primary",
        timeMin: now.toISOString(),
        timeMax: until.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 250,
      });
      if (!res.successful) return [];
      const items = (res.data?.items as GcalEvent[] | undefined) ?? [];
      return items
        .map(toCalEvent)
        .filter((e): e is CalEvent => e !== null);
    } catch {
      // gcal call failed → empty calendar (still a real firm, just no live data).
      return [];
    }
  });

  // Not signed in (no firm) → the fixture world, so the demo stays byte-identical.
  return real ?? calendarEvents;
}
