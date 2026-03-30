"use client";

import { useState } from "react";
import { addDays, setHours, setMinutes, subDays } from "date-fns";

import { EventCalendar, type CalendarEvent } from "./";

// Antonio's real appointments from mock data
const taxEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "David Park - S-Corp Review",
    description: "Video call to review S-Corp return. 2 docs still missing (payroll summary, equipment list).",
    start: setMinutes(setHours(new Date(), 15), 0), // 3:00 PM today (rescheduled from 2pm)
    end: setMinutes(setHours(new Date(), 16), 0),
    color: "sky",
    location: "Google Meet"
  },
  {
    id: "2",
    title: "Miguel Sandoval - Incorporation",
    description: "Discuss incorporating Sandoval Plumbing. Schedule C to S-Corp conversion.",
    start: setMinutes(setHours(new Date(), 16), 0), // 4:00 PM today
    end: setMinutes(setHours(new Date(), 16), 30),
    color: "emerald",
    location: "Phone call"
  },
  {
    id: "3",
    title: "Vladimir Petrov - Extension Discussion",
    description: "0 of 16 docs submitted. Discuss extension timeline and international complexity.",
    start: setMinutes(setHours(addDays(new Date(), 1), 10), 0), // Tomorrow 10am
    end: setMinutes(setHours(addDays(new Date(), 1), 11), 0),
    color: "rose",
    location: "Google Meet"
  },
  {
    id: "4",
    title: "Marcus Chen - Restaurant Review",
    description: "Review 3-location Schedule C. Discuss 40% revenue drop and possible location closure.",
    start: setMinutes(setHours(addDays(new Date(), 2), 14), 0), // Day after tomorrow 2pm
    end: setMinutes(setHours(addDays(new Date(), 2), 15), 0),
    color: "amber",
    location: "Google Meet"
  },
  {
    id: "5",
    title: "Carlos & Elena Mendez - Partnership Review",
    description: "Review 1065 partnership return. Discuss Section 179 paint booth deduction.",
    start: setMinutes(setHours(addDays(new Date(), 3), 10), 0),
    end: setMinutes(setHours(addDays(new Date(), 3), 11), 0),
    color: "sky",
    location: "Google Meet"
  },
  {
    id: "6",
    title: "Kevin & Lisa Park - New Client Call",
    description: "Pending client. Dry cleaning business. Referred by David Park.",
    start: setMinutes(setHours(addDays(new Date(), 1), 14), 0),
    end: setMinutes(setHours(addDays(new Date(), 1), 15), 0),
    color: "violet",
    location: "Google Meet"
  },
  {
    id: "7",
    title: "Sarah Mitchell - New Client Call",
    description: "Pending client. Freelance photographer. Found on Nextdoor.",
    start: setMinutes(setHours(addDays(new Date(), 2), 10), 0),
    end: setMinutes(setHours(addDays(new Date(), 2), 11), 0),
    color: "violet",
    location: "Phone call"
  },
  {
    id: "8",
    title: "Daniel Okafor - New Client Call",
    description: "Pending client. College student, simple W-2. Mentor network referral.",
    start: setMinutes(setHours(addDays(new Date(), 3), 11), 0),
    end: setMinutes(setHours(addDays(new Date(), 3), 11), 30),
    color: "violet",
    location: "Phone call"
  },
  // Past events
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
    description: "Reviewed trucking company return. Complex depreciation.",
    start: setMinutes(setHours(subDays(new Date(), 2), 14), 0),
    end: setMinutes(setHours(subDays(new Date(), 2), 15), 30),
    color: "amber",
    location: "Google Meet"
  },
  // April 15 deadline marker
  {
    id: "11",
    title: "FILING DEADLINE - April 15",
    description: "IRS filing deadline for 2025 tax year",
    start: new Date(2026, 3, 15),
    end: new Date(2026, 3, 15),
    allDay: true,
    color: "rose",
    location: ""
  },
];

export default function EventCalendarApp() {
  const [events, setEvents] = useState<CalendarEvent[]>(taxEvents);

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  };

  const handleEventUpdate = (event: CalendarEvent) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === event.id ? event : e))
    );
  };

  const handleEventDelete = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  return (
    <EventCalendar
      events={events}
      onEventAdd={handleEventAdd}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
    />
  );
}
