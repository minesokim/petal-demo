"use client";

import { useEffect, useRef } from "react";
import { format, differenceInMinutes } from "date-fns";
import { X, Pencil, Trash2, Video, Phone, Clock, Calendar, MapPin, FileText, PhoneCall } from "lucide-react";
import { type CalendarEvent } from "./";
import { clients } from "@/lib/mock-data";
import Link from "next/link";

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

const colorDotMap: Record<string, string> = {
  sky: "bg-sky-400",
  amber: "bg-amber-400",
  violet: "bg-violet-400",
  rose: "bg-rose-400",
  emerald: "bg-emerald-400",
  orange: "bg-orange-400",
};

interface EventDetailPopoverProps {
  event: CalendarEvent;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function EventDetailPopover({ event, position, onClose, onEdit, onDelete }: EventDetailPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid immediate close from the click that opened it
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Position the popover relative to viewport
  const style: React.CSSProperties = {
    position: "fixed",
    zIndex: 50,
  };

  // Position to the right of the click, or left if too close to edge
  const popoverWidth = 320;
  const popoverHeight = 280;
  if (position.x + popoverWidth + 20 > window.innerWidth) {
    style.right = window.innerWidth - position.x + 8;
  } else {
    style.left = position.x + 8;
  }
  if (position.y + popoverHeight > window.innerHeight) {
    style.bottom = window.innerHeight - position.y + 8;
  } else {
    style.top = position.y - 20;
  }

  const isVideo = event.location?.includes("Meet");
  const isPhone = event.location?.includes("Phone") || event.location?.includes("call");
  const isMeeting = isVideo || isPhone;
  const duration = differenceInMinutes(new Date(event.end), new Date(event.start));
  const clientId = getClientId(event.title);
  const client = clientId ? clients.find(c => c.id === clientId) : null;
  const colorDot = colorDotMap[event.color || "sky"] || "bg-sky-400";

  return (
    <div
      ref={ref}
      style={style}
      className="w-[320px] rounded-xl bg-white shadow-lg shadow-black/8 border border-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Top action bar */}
      <div className="flex items-center justify-end gap-0.5 px-3 pt-2.5 pb-0">
        <button
          onClick={onEdit}
          className="flex items-center justify-center size-7 rounded-full hover:bg-muted/60 transition-colors"
          title="Edit"
        >
          <Pencil className="size-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="flex items-center justify-center size-7 rounded-full hover:bg-muted/60 transition-colors"
          title="Delete"
        >
          <Trash2 className="size-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={onClose}
          className="flex items-center justify-center size-7 rounded-full hover:bg-muted/60 transition-colors"
          title="Close"
        >
          <X className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-1">
        {/* Title row with color dot */}
        <div className="flex items-start gap-3">
          <div className={`size-2.5 rounded-sm shrink-0 mt-1.5 ${colorDot}`} />
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold tracking-tight leading-snug">{event.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(event.start), "EEEE, MMMM d")}
              {!event.allDay && (
                <span className="tabular-nums"> · {format(new Date(event.start), "h:mm a")} - {format(new Date(event.end), "h:mm a")}</span>
              )}
            </p>
          </div>
        </div>

        {/* Join / Call button */}
        {isVideo && (
          <div className="mt-3 flex items-center gap-3 ml-5.5">
            <button className="flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-4 py-1.5 text-xs font-medium transition-colors">
              <Video className="size-3.5" />
              Join with Google Meet
            </button>
          </div>
        )}
        {isPhone && client?.phone && (
          <div className="mt-3 ml-5.5 space-y-1.5">
            <button className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-medium transition-colors">
              <PhoneCall className="size-3.5" />
              Call {client.phone}
            </button>
          </div>
        )}

        {/* Details rows */}
        <div className="mt-3 space-y-2 ml-5.5">
          {event.location && (
            <div className="flex items-center gap-2.5 text-xs text-foreground/70">
              {isVideo ? <Video className="size-3.5 text-muted-foreground shrink-0" /> : isPhone ? <Phone className="size-3.5 text-muted-foreground shrink-0" /> : <MapPin className="size-3.5 text-muted-foreground shrink-0" />}
              <span>{event.location}{isPhone && client?.phone ? ` · ${client.phone}` : ""}</span>
            </div>
          )}

          {event.description && (
            <div className="flex items-start gap-2.5 text-xs text-foreground/70">
              <FileText className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="leading-relaxed line-clamp-3">{event.description}</span>
            </div>
          )}

          {clientId && (
            <div className="flex items-center gap-2.5 text-xs">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <Link
                href={`/dashboard/clients/${clientId}/overview`}
                className="text-foreground/70 hover:text-foreground underline-offset-2 hover:underline transition-colors"
              >
                View client profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
