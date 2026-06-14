// Petal OS — the firm calendar. A tax practice runs on dates: statutory and
// extended deadlines, estimated-payment due dates, client calls, IRS respond-by
// dates, and filings. Curated to stay consistent with the canonical world
// (demo date: Thursday, June 25, 2026).

export type CalEventType = "deadline" | "call" | "estimate" | "notice" | "filing" | "review" | "office";

export interface CalEvent {
  id: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  type: CalEventType;
  time?: string; // "3:00 PM"
  householdId?: string;
  done?: boolean; // already happened / completed
  href?: string;
}

export const calEventMeta: Record<CalEventType, { label: string; dot: string }> = {
  deadline: { label: "Deadline", dot: "bg-red-500" },
  call: { label: "Call", dot: "bg-yellow-500" },
  estimate: { label: "Estimate", dot: "bg-blue-500" },
  notice: { label: "IRS notice", dot: "bg-amber-500" },
  filing: { label: "Filing", dot: "bg-emerald-500" },
  review: { label: "Review", dot: "bg-violet-500" },
  office: { label: "Office", dot: "bg-[var(--os-ink-subtle)]" },
};

export const calendarEvents: CalEvent[] = [
  // ── earlier in June (done) ──
  { id: "ce-wisp", date: "2026-06-12", title: "WISP annual review", type: "review", done: true },
  { id: "ce-q2", date: "2026-06-15", title: "Q2 estimated payments due", type: "estimate", done: true },
  { id: "ce-cp2000", date: "2026-06-18", title: "CP2000 received — Rodriguez", type: "notice", done: true, householdId: "h-rodriguez", href: "/os/notices/n-cp2000" },
  { id: "ce-park-recon", date: "2026-06-20", title: "Park Dental — reconcile May books", type: "review", done: true, householdId: "h-park", href: "/os/books" },
  { id: "ce-efile", date: "2026-06-23", title: "E-filed: Nakamura + O'Brien", type: "filing", done: true, href: "/os/activity?run=run-efile-nak" },
  { id: "ce-park-call", date: "2026-06-24", title: "Park books review call", type: "call", time: "11:00 AM", done: true, householdId: "h-park" },

  // ── today (Jun 25) ──
  { id: "ce-fuentes", date: "2026-06-25", title: "Fuentes 1120S review", type: "call", time: "3:00 PM", householdId: "h-fuentes" },
  { id: "ce-mendez", date: "2026-06-25", title: "Mendez 1065 — K-1 allocation", type: "review", householdId: "h-mendez" },

  // ── rest of June (upcoming) ──
  { id: "ce-deshawn", date: "2026-06-26", title: "DeShawn — W-2 chase call", type: "call", time: "10:00 AM", householdId: "h-williams" },
  { id: "ce-sandoval", date: "2026-06-27", title: "Sandoval — planning call", type: "call", time: "2:00 PM", householdId: "h-sandoval" },
  { id: "ce-cp14", date: "2026-06-29", title: "Russo CP14 — respond by", type: "deadline", householdId: "h-russo", href: "/os/notices/n-cp14" },
  { id: "ce-q2-followup", date: "2026-06-30", title: "Q2 estimate follow-ups due", type: "estimate", href: "/os/tasks?task=t-est-q2" },

  // ── beyond June (the deadlines that matter) ──
  { id: "ce-july4", date: "2026-07-04", title: "Office closed — Independence Day", type: "office" },
  { id: "ce-cp2000-due", date: "2026-07-18", title: "Rodriguez CP2000 — respond by", type: "deadline", householdId: "h-rodriguez", href: "/os/notices/n-cp2000" },
  { id: "ce-q3", date: "2026-09-15", title: "Q3 estimates + business returns due", type: "deadline" },
  { id: "ce-oct15", date: "2026-10-15", title: "Individual returns due (extension)", type: "deadline" },
];

export function eventsOn(iso: string): CalEvent[] {
  return calendarEvents.filter(e => e.date === iso);
}

/** Events from a given ISO date forward, sorted — drives the "Upcoming" rail. */
export function upcomingEvents(fromIso: string, limit = 7): CalEvent[] {
  return calendarEvents
    .filter(e => e.date >= fromIso && !e.done)
    .sort((a, b) => (a.date === b.date ? (a.time ?? "").localeCompare(b.time ?? "") : a.date.localeCompare(b.date)))
    .slice(0, limit);
}
