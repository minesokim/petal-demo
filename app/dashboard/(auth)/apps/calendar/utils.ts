import { isSameDay } from "date-fns";

import type { CalendarEvent, EventColor } from "./components";

/**
 * Get CSS classes for event colors
 */
export function getEventColorClasses(color?: EventColor | string): string {
  const eventColor = color || "sky";

  switch (eventColor) {
    case "sky":
      return "bg-sky-100/80 hover:bg-sky-200/80 hover:shadow-sm text-sky-950 dark:bg-sky-400/20 dark:text-sky-200";
    case "amber":
      return "bg-amber-100/80 hover:bg-amber-200/80 hover:shadow-sm text-amber-950 dark:bg-amber-400/20 dark:text-amber-200";
    case "violet":
      return "bg-violet-100/80 hover:bg-violet-200/80 hover:shadow-sm text-violet-950 dark:bg-violet-400/20 dark:text-violet-200";
    case "rose":
      return "bg-rose-100/80 hover:bg-rose-200/80 hover:shadow-sm text-rose-950 dark:bg-rose-400/20 dark:text-rose-200";
    case "emerald":
      return "bg-emerald-100/80 hover:bg-emerald-200/80 hover:shadow-sm text-emerald-950 dark:bg-emerald-400/20 dark:text-emerald-200";
    case "orange":
      return "bg-orange-100/80 hover:bg-orange-200/80 hover:shadow-sm text-orange-950 dark:bg-orange-400/20 dark:text-orange-200";
    default:
      return "bg-sky-100/80 hover:bg-sky-200/80 hover:shadow-sm text-sky-950 dark:bg-sky-400/20 dark:text-sky-200";
  }
}

/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(isFirstDay: boolean, isLastDay: boolean): string {
  if (isFirstDay && isLastDay) {
    return "rounded-lg"; // Both ends rounded
  } else if (isFirstDay) {
    return "rounded-l-lg rounded-r-none"; // Only left end rounded
  } else if (isLastDay) {
    return "rounded-r-lg rounded-l-none"; // Only right end rounded
  } else {
    return "rounded-none"; // No rounded corners
  }
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  return event.allDay || eventStart.getDate() !== eventEnd.getDate();
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) || isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * Get all events for a day (for agenda view)
 */
export function getAgendaEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}
