// Petal OS - the firm scheduling calendar. This surface is for SCHEDULED things:
// client meetings and calls, intake appointments, internal focus blocks, and office
// closures. Deadlines and due dates are NOT here - those live in Today, Tasks, and
// Notices. Curated to match the canonical world (demo date: Thursday, June 25, 2026).

export type CalEventType = "meeting" | "block" | "office";

export interface CalEvent {
  id: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  type: CalEventType;
  time?: string; // start, "3:00 PM"
  endTime?: string;
  location?: string; // "Zoom" · "Phone" · "In office"
  with?: string; // attendee / contact
  householdId?: string;
  notes?: string;
  done?: boolean; // already happened
}

export const calEventMeta: Record<CalEventType, { label: string; dot: string }> = {
  meeting: { label: "Meeting", dot: "bg-yellow-500" },
  block: { label: "Focus block", dot: "bg-violet-500" },
  office: { label: "Office", dot: "bg-[var(--os-ink-subtle)]" },
};

export const calendarEvents: CalEvent[] = [
  // ── earlier in June (done) ──
  { id: "ce-plan1", date: "2026-06-01", title: "Monthly planning - with Elena", type: "block", time: "9:00 AM", endTime: "10:00 AM", location: "In office", with: "Elena Reyes", done: true },
  { id: "ce-chen-checkin", date: "2026-06-03", title: "Chen - mid-year check-in", type: "meeting", time: "2:00 PM", endTime: "2:30 PM", location: "Zoom", with: "Marcus Chen", householdId: "h-chen", done: true, notes: "Walked through the wage drop and the Riverside closure." },
  { id: "ce-intake", date: "2026-06-10", title: "New client intake - referral", type: "meeting", time: "11:00 AM", endTime: "11:45 AM", location: "Phone", with: "Prospective client", done: true },
  { id: "ce-sharma-onboard", date: "2026-06-12", title: "Sharma - onboarding call", type: "meeting", time: "1:00 PM", endTime: "1:30 PM", location: "Zoom", with: "Priya Sharma", householdId: "h-sharma", done: true, notes: "First-year creator client; set up the document checklist." },
  { id: "ce-review1", date: "2026-06-15", title: "Review block", type: "block", time: "9:00 AM", endTime: "12:00 PM", location: "In office", done: true, notes: "Heads-down prep and review." },
  { id: "ce-week-plan", date: "2026-06-22", title: "Week planning - with Elena", type: "block", time: "9:00 AM", endTime: "9:30 AM", location: "In office", with: "Elena Reyes", done: true },
  { id: "ce-obrien-sign", date: "2026-06-23", title: "O'Brien - signature walkthrough", type: "meeting", time: "3:00 PM", endTime: "3:15 PM", location: "Phone", with: "Karen O'Brien", householdId: "h-obrien", done: true },
  { id: "ce-park-call", date: "2026-06-24", title: "Park books review call", type: "meeting", time: "11:00 AM", endTime: "11:45 AM", location: "Zoom", with: "David Park", householdId: "h-park", done: true, notes: "Confirmed the three May categories; he's refinancing the house." },

  // ── today (Jun 25) ──
  { id: "ce-mendez", date: "2026-06-25", title: "Mendez - K-1 questions", type: "meeting", time: "10:00 AM", endTime: "10:30 AM", location: "Phone", with: "Carlos Mendez", householdId: "h-mendez", notes: "Partnership allocation questions before the 1065 is final." },
  { id: "ce-fuentes", date: "2026-06-25", title: "Fuentes 1120S review", type: "meeting", time: "3:00 PM", endTime: "3:45 PM", location: "Zoom", with: "Roberto Fuentes", householdId: "h-fuentes", notes: "Pre-call brief is generating. Cover the unsigned 8879 and the bonus-depreciation question on the two trucks." },

  // ── rest of June (upcoming) ──
  { id: "ce-deshawn", date: "2026-06-26", title: "DeShawn - W-2 chase call", type: "meeting", time: "10:00 AM", endTime: "10:15 AM", location: "Phone", with: "DeShawn Williams", householdId: "h-williams", notes: "Offer the 10-minute call instead of another reminder." },
  { id: "ce-sandoval", date: "2026-06-27", title: "Sandoval - planning call", type: "meeting", time: "2:00 PM", endTime: "2:30 PM", location: "Zoom", with: "Miguel Sandoval", householdId: "h-sandoval", notes: "Q3 estimates and the missed Q2 payment." },
  { id: "ce-review2", date: "2026-06-29", title: "Review block", type: "block", time: "9:00 AM", endTime: "12:00 PM", location: "In office" },

  // ── into July ──
  { id: "ce-russo", date: "2026-07-02", title: "Russo - basis follow-up", type: "meeting", time: "1:00 PM", endTime: "1:30 PM", location: "Phone", with: "Anthony Russo", householdId: "h-russo", notes: "Walk through the missing-basis options on the brokerage lots." },
  { id: "ce-july4", date: "2026-07-04", title: "Office closed - Independence Day", type: "office" },
  { id: "ce-midyear", date: "2026-07-06", title: "Mid-year planning - with Elena", type: "block", time: "9:00 AM", endTime: "10:30 AM", location: "In office", with: "Elena Reyes" },
];

export function eventsOn(iso: string): CalEvent[] {
  return calendarEvents
    .filter(e => e.date === iso)
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
}

/** Upcoming scheduled items from a given ISO date forward - drives the rail. */
export function upcomingEvents(fromIso: string, limit = 8): CalEvent[] {
  return calendarEvents
    .filter(e => e.date >= fromIso && !e.done)
    .sort((a, b) => (a.date === b.date ? (a.time ?? "").localeCompare(b.time ?? "") : a.date.localeCompare(b.date)))
    .slice(0, limit);
}
