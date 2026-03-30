"use client";

import { useState } from "react";
import { addDays, setHours, setMinutes, subDays, format, isToday, isTomorrow, isAfter } from "date-fns";

import { EventCalendar, type CalendarEvent } from "./";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, Phone, Clock, MapPin, FileText, ChevronRight, X, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";

// Antonio's real appointments
const taxEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "David Park - S-Corp Review",
    description: "Video call to review S-Corp return. 2 docs still missing (payroll summary, equipment list).",
    start: setMinutes(setHours(new Date(), 15), 0),
    end: setMinutes(setHours(new Date(), 16), 0),
    color: "sky",
    location: "Google Meet"
  },
  {
    id: "2",
    title: "Miguel Sandoval - Incorporation",
    description: "Discuss incorporating Sandoval Plumbing. Schedule C to S-Corp conversion.",
    start: setMinutes(setHours(new Date(), 16), 0),
    end: setMinutes(setHours(new Date(), 16), 30),
    color: "emerald",
    location: "Phone call"
  },
  {
    id: "3",
    title: "Vladimir Petrov - Extension",
    description: "0 of 16 docs submitted. Discuss extension timeline and international complexity.",
    start: setMinutes(setHours(addDays(new Date(), 1), 10), 0),
    end: setMinutes(setHours(addDays(new Date(), 1), 11), 0),
    color: "rose",
    location: "Google Meet"
  },
  {
    id: "4",
    title: "Marcus Chen - Restaurant Review",
    description: "Review 3-location Schedule C. Discuss 40% revenue drop and possible location closure.",
    start: setMinutes(setHours(addDays(new Date(), 2), 14), 0),
    end: setMinutes(setHours(addDays(new Date(), 2), 15), 0),
    color: "amber",
    location: "Google Meet"
  },
  {
    id: "5",
    title: "Carlos & Elena Mendez - Partnership",
    description: "Review 1065 partnership return. Discuss Section 179 paint booth deduction ($32K).",
    start: setMinutes(setHours(addDays(new Date(), 3), 10), 0),
    end: setMinutes(setHours(addDays(new Date(), 3), 11), 0),
    color: "sky",
    location: "Google Meet"
  },
  {
    id: "6",
    title: "Kevin & Lisa Park - New Client",
    description: "Pending client. Dry cleaning business. Referred by David Park (brother).",
    start: setMinutes(setHours(subDays(new Date(), 1), 14), 0),
    end: setMinutes(setHours(subDays(new Date(), 1), 15), 0),
    color: "violet",
    location: "Google Meet"
  },
  {
    id: "7",
    title: "Sarah Mitchell - New Client",
    description: "Pending client. Freelance photographer. Found on Nextdoor.",
    start: setMinutes(setHours(new Date(), 10), 0),
    end: setMinutes(setHours(new Date(), 10), 30),
    color: "violet",
    location: "Phone call"
  },
  {
    id: "8",
    title: "Daniel Okafor - New Client",
    description: "Pending client. College student, simple W-2. Mentor network referral.",
    start: setMinutes(setHours(addDays(new Date(), 3), 11), 0),
    end: setMinutes(setHours(addDays(new Date(), 3), 11), 30),
    color: "violet",
    location: "Phone call"
  },
  {
    id: "9",
    title: "Priya Sharma - Intake Call",
    description: "New TikTok creator client. Discussed estimated payments.",
    start: setMinutes(setHours(subDays(new Date(), 6), 11), 0),
    end: setMinutes(setHours(subDays(new Date(), 6), 11), 30),
    color: "emerald",
    location: "Phone call"
  },
  {
    id: "10",
    title: "Roberto Fuentes - 1120S Review",
    description: "Reviewed trucking company return. Complex depreciation on 3 trucks.",
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

// Map event title to client ID for linking
const clientMap: Record<string, string> = {
  "David Park": "c11",
  "Miguel Sandoval": "c9",
  "Vladimir Petrov": "c13",
  "Marcus Chen": "c1",
  "Carlos": "c15",
  "Priya Sharma": "c2",
  "Roberto Fuentes": "c6",
  "Sarah Mitchell": "c21",
  "Kevin": "c22",
  "Daniel Okafor": "c23",
};

function getClientId(title: string): string | null {
  for (const [name, id] of Object.entries(clientMap)) {
    if (title.includes(name)) return id;
  }
  return null;
}

export default function EventCalendarApp() {
  const [events, setEvents] = useState<CalendarEvent[]>(taxEvents);
  const [selectedSidebarEvent, setSelectedSidebarEvent] = useState<CalendarEvent | null>(null);

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  };

  const handleEventUpdate = (event: CalendarEvent) => {
    setEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
  };

  const handleEventDelete = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  // Upcoming events for sidebar
  const upcoming = events
    .filter(e => isAfter(new Date(e.start), new Date()) && !e.allDay)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 8);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const grouped: Record<string, CalendarEvent[]> = {};
  for (const event of upcoming) {
    const label = getDateLabel(new Date(event.start));
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(event);
  }

  return (
    <div className="flex">
      {/* Calendar - original component untouched */}
      <div className="flex-1 min-w-0">
        <EventCalendar
          events={events}
          onEventAdd={handleEventAdd}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          initialView="week"
        />
      </div>

      {/* Right sidebar - upcoming events + detail panel */}
      <div className="w-[300px] shrink-0 border-l flex flex-col sticky top-0 h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedSidebarEvent ? (
            /* Event detail view */
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">Event Details</span>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => setSelectedSidebarEvent(null)}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold">{selectedSidebarEvent.title}</h3>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {format(new Date(selectedSidebarEvent.start), "EEEE, MMM d")}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {format(new Date(selectedSidebarEvent.start), "h:mm a")} - {format(new Date(selectedSidebarEvent.end), "h:mm a")}
                  </div>
                  {selectedSidebarEvent.location && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {selectedSidebarEvent.location.includes("Meet") ? <Video className="size-3.5" /> : <Phone className="size-3.5" />}
                      {selectedSidebarEvent.location}
                    </div>
                  )}
                </div>

                <Separator />

                {selectedSidebarEvent.description && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Notes</div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{selectedSidebarEvent.description}</p>
                  </div>
                )}

                {/* Link to client if applicable */}
                {getClientId(selectedSidebarEvent.title) && (
                  <>
                    <Separator />
                    <Link
                      href={`/dashboard/clients/${getClientId(selectedSidebarEvent.title)}/overview`}
                      className="flex items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors hover:bg-muted/50"
                    >
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="flex-1">View client profile</span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </>
                )}

                {selectedSidebarEvent.location?.includes("Meet") && (
                  <Button className="w-full" size="sm">
                    <Video className="size-3.5" /> Join Google Meet
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            /* Upcoming events list */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-4"
            >
              <div className="text-sm font-semibold mb-3">Upcoming</div>
              {Object.entries(grouped).map(([dateLabel, evts]) => (
                <div key={dateLabel} className="mb-4">
                  <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{dateLabel}</div>
                  <div className="space-y-2">
                    {evts.map(event => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedSidebarEvent(event)}
                        className="w-full rounded-xl border p-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <div className="text-xs font-semibold">{event.title}</div>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Clock className="size-3" />
                          {format(new Date(event.start), "h:mm a")} - {format(new Date(event.end), "h:mm a")}
                        </div>
                        {event.location && (
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                            {event.location.includes("Meet") ? <Video className="size-3" /> : <Phone className="size-3" />}
                            {event.location}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No upcoming events</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
