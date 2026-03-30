"use client";

import { useState } from "react";
import { addDays, setHours, setMinutes, subDays, format, isToday, isTomorrow, isAfter } from "date-fns";

import { EventCalendar, type CalendarEvent } from "./";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Phone, Clock } from "lucide-react";

// Antonio's real appointments
const taxEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "David Park - S-Corp Review",
    description: "Video call to review S-Corp return. 2 docs still missing.",
    start: setMinutes(setHours(new Date(), 15), 0),
    end: setMinutes(setHours(new Date(), 16), 0),
    color: "sky",
    location: "Google Meet"
  },
  {
    id: "2",
    title: "Miguel Sandoval - Incorporation",
    description: "Discuss incorporating Sandoval Plumbing.",
    start: setMinutes(setHours(new Date(), 16), 0),
    end: setMinutes(setHours(new Date(), 16), 30),
    color: "emerald",
    location: "Phone call"
  },
  {
    id: "3",
    title: "Vladimir Petrov - Extension",
    description: "0 of 16 docs. Discuss extension timeline.",
    start: setMinutes(setHours(addDays(new Date(), 1), 10), 0),
    end: setMinutes(setHours(addDays(new Date(), 1), 11), 0),
    color: "rose",
    location: "Google Meet"
  },
  {
    id: "4",
    title: "Marcus Chen - Restaurant Review",
    description: "Review 3-location Schedule C. 40% revenue drop.",
    start: setMinutes(setHours(addDays(new Date(), 2), 14), 0),
    end: setMinutes(setHours(addDays(new Date(), 2), 15), 0),
    color: "amber",
    location: "Google Meet"
  },
  {
    id: "5",
    title: "Carlos & Elena Mendez - Partnership",
    description: "Review 1065. Section 179 paint booth.",
    start: setMinutes(setHours(addDays(new Date(), 3), 10), 0),
    end: setMinutes(setHours(addDays(new Date(), 3), 11), 0),
    color: "sky",
    location: "Google Meet"
  },
  {
    id: "6",
    title: "Kevin & Lisa Park - New Client",
    description: "Pending. Dry cleaning business.",
    start: setMinutes(setHours(addDays(new Date(), 1), 14), 0),
    end: setMinutes(setHours(addDays(new Date(), 1), 15), 0),
    color: "violet",
    location: "Google Meet"
  },
  {
    id: "7",
    title: "Sarah Mitchell - New Client",
    description: "Pending. Freelance photographer.",
    start: setMinutes(setHours(addDays(new Date(), 2), 10), 0),
    end: setMinutes(setHours(addDays(new Date(), 2), 11), 0),
    color: "violet",
    location: "Phone call"
  },
  {
    id: "8",
    title: "Daniel Okafor - New Client",
    description: "Pending. College student, simple W-2.",
    start: setMinutes(setHours(addDays(new Date(), 3), 11), 0),
    end: setMinutes(setHours(addDays(new Date(), 3), 11), 30),
    color: "violet",
    location: "Phone call"
  },
  {
    id: "9",
    title: "Priya Sharma - Intake Call",
    description: "New TikTok creator client.",
    start: setMinutes(setHours(subDays(new Date(), 6), 11), 0),
    end: setMinutes(setHours(subDays(new Date(), 6), 11), 30),
    color: "emerald",
    location: "Phone call"
  },
  {
    id: "10",
    title: "Roberto Fuentes - 1120S Review",
    description: "Trucking company return.",
    start: setMinutes(setHours(subDays(new Date(), 2), 14), 0),
    end: setMinutes(setHours(subDays(new Date(), 2), 15), 30),
    color: "amber",
    location: "Google Meet"
  },
  {
    id: "11",
    title: "FILING DEADLINE",
    description: "IRS filing deadline for 2025 tax year",
    start: new Date(2026, 3, 15),
    end: new Date(2026, 3, 15),
    allDay: true,
    color: "rose",
    location: ""
  },
];

function UpcomingEventsSidebar({ events }: { events: CalendarEvent[] }) {
  const upcoming = events
    .filter(e => isAfter(new Date(e.start), new Date()) && !e.allDay)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 8);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  // Group by date
  const grouped: Record<string, CalendarEvent[]> = {};
  for (const event of upcoming) {
    const label = getDateLabel(new Date(event.start));
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(event);
  }

  return (
    <div className="w-[280px] shrink-0 space-y-4 overflow-y-auto border-l p-4">
      <div className="text-sm font-semibold">Upcoming</div>
      {Object.entries(grouped).map(([dateLabel, evts]) => (
        <div key={dateLabel}>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{dateLabel}</div>
          <div className="space-y-2">
            {evts.map(event => (
              <div key={event.id} className="rounded-xl border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="text-xs font-semibold">{event.title}</div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="size-3" />
                  {format(new Date(event.start), "h:mm a")} - {format(new Date(event.end), "h:mm a")}
                </div>
                {event.location && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                    {event.location.includes("Meet") ? <Video className="size-3" /> : <Phone className="size-3" />}
                    {event.location}
                  </div>
                )}
                {event.description && (
                  <p className="mt-1 text-[10px] text-muted-foreground">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EventCalendarApp() {
  const [events, setEvents] = useState<CalendarEvent[]>(taxEvents);

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  };

  const handleEventUpdate = (event: CalendarEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
  };

  const handleEventDelete = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)]">
      <div className="flex-1 overflow-hidden">
        <EventCalendar
          events={events}
          onEventAdd={handleEventAdd}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          initialView="week"
        />
      </div>
      <UpcomingEventsSidebar events={events} />
    </div>
  );
}
