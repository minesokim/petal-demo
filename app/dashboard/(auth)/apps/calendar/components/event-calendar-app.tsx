"use client";

import { useState } from "react";
import { addDays, setHours, setMinutes, subDays, format, isToday, isTomorrow, isAfter, differenceInMinutes } from "date-fns";

import { EventCalendar, type CalendarEvent } from "./";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, Phone, PhoneCall, Clock, MapPin, FileText, ChevronRight, X, Calendar, ExternalLink, User } from "lucide-react";
import { clients } from "@/lib/mock-data";
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

function getClientName(title: string): string {
  // Extract client name (everything before the dash/topic)
  const dashIdx = title.indexOf(" - ");
  return dashIdx > 0 ? title.substring(0, dashIdx) : title;
}

function getEventTopic(title: string): string {
  const dashIdx = title.indexOf(" - ");
  return dashIdx > 0 ? title.substring(dashIdx + 3) : "";
}

const eventColorMap: Record<string, string> = {
  sky: "bg-sky-500",
  amber: "bg-amber-500",
  violet: "bg-violet-500",
  rose: "bg-rose-500",
  emerald: "bg-emerald-500",
  orange: "bg-orange-500",
};

const eventColorTextMap: Record<string, string> = {
  sky: "text-sky-600",
  amber: "text-amber-600",
  violet: "text-violet-600",
  rose: "text-rose-600",
  emerald: "text-emerald-600",
  orange: "text-orange-600",
};

function UpcomingEventCard({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  const duration = differenceInMinutes(new Date(event.end), new Date(event.start));
  const colorDot = eventColorMap[event.color || "sky"] || "bg-sky-500";
  const isVideo = event.location?.includes("Meet");

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-lg px-3 py-2.5 text-left transition-all duration-200 hover:bg-muted/60 hover:shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <div className={`mt-1.5 size-1.5 shrink-0 rounded-full ${colorDot}`} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold tracking-tight truncate">
            {getClientName(event.title)}
          </div>
          {getEventTopic(event.title) && (
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {getEventTopic(event.title)}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {format(new Date(event.start), "h:mm a")}
            </span>
            <span className="text-[10px] text-muted-foreground/40">·</span>
            <span className="text-[10px] text-muted-foreground">
              {duration}m
            </span>
            {event.location && (
              <>
                <span className="text-[10px] text-muted-foreground/40">·</span>
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  {isVideo ? <Video className="size-2.5" /> : <Phone className="size-2.5" />}
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="size-3.5 text-muted-foreground/30 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function EventDetailPanel({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const clientId = getClientId(event.title);
  const client = clientId ? clients.find(c => c.id === clientId) : null;
  const clientName = getClientName(event.title);
  const topic = getEventTopic(event.title);
  const isVideo = event.location?.includes("Meet");
  const isPhone = event.location?.includes("Phone") || event.location?.includes("call");
  const duration = differenceInMinutes(new Date(event.end), new Date(event.start));
  const colorAccent = eventColorTextMap[event.color || "sky"] || "text-sky-600";

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex-1 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Event details</span>
        <button
          onClick={onClose}
          className="flex items-center justify-center size-6 rounded-md hover:bg-muted/50 transition-colors"
        >
          <X className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Client name + topic */}
        <div>
          <h3 className="text-base font-bold tracking-tight">{clientName}</h3>
          {topic && (
            <p className={`text-xs mt-0.5 ${colorAccent}`}>{topic}</p>
          )}
        </div>

        {/* Time block */}
        <div className="rounded-lg bg-muted/30 px-3 py-2.5 space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="size-3.5 text-muted-foreground" />
            <span>{format(new Date(event.start), "EEEE, MMMM d")}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span className="tabular-nums">
              {format(new Date(event.start), "h:mm a")} - {format(new Date(event.end), "h:mm a")}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span>{duration}m</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {isVideo ? <Video className="size-3.5" /> : <Phone className="size-3.5" />}
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Notes</div>
            <p className="text-[13px] leading-relaxed text-foreground/70">{event.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {isVideo && (
            <Button size="sm" className="w-full text-xs h-8">
              <Video className="size-3.5" />
              Join Google Meet
            </Button>
          )}

          {isPhone && client?.phone && (
            <Button size="sm" className="w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
              <PhoneCall className="size-3.5" />
              Call {client.phone}
            </Button>
          )}

          {clientId && (
            <Link
              href={`/dashboard/clients/${clientId}/overview`}
              className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-colors hover:bg-muted/30"
            >
              <User className="size-3.5 text-muted-foreground" />
              <span className="flex-1">View client profile</span>
              <ExternalLink className="size-3 text-muted-foreground/50" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
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

  // Count upcoming by date group
  const todayCount = upcoming.filter(e => isToday(new Date(e.start))).length;

  return (
    <div className="flex rounded-xl overflow-hidden">
      {/* Calendar */}
      <div className="flex-1 min-w-0">
        <EventCalendar
          events={events}
          onEventAdd={handleEventAdd}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          initialView="week"
        />
      </div>

      {/* Right sidebar */}
      <div className="w-[280px] shrink-0 border-l bg-white flex flex-col self-stretch overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedSidebarEvent ? (
            <EventDetailPanel
              event={selectedSidebarEvent}
              onClose={() => setSelectedSidebarEvent(null)}
            />
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto"
            >
              {/* Sidebar header */}
              <div className="px-5 pt-5 pb-3">
                <h3 className="font-display text-base tracking-tight">Upcoming</h3>
                {todayCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {todayCount} event{todayCount !== 1 ? "s" : ""} today
                  </p>
                )}
              </div>

              {/* Grouped event list */}
              <div className="px-2 pb-4">
                {Object.entries(grouped).map(([dateLabel, evts], idx) => (
                  <div key={dateLabel}>
                    {idx > 0 && <div className="mx-3 my-2 border-t border-border/50" />}
                    <div className="mb-1 px-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {dateLabel}
                    </div>
                    <div className="space-y-0.5">
                      {evts.map(event => (
                        <UpcomingEventCard
                          key={event.id}
                          event={event}
                          onClick={() => setSelectedSidebarEvent(event)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && (
                  <div className="py-12 text-center">
                    <Calendar className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No upcoming events</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
