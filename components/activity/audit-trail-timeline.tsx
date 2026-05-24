"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChannelBadge } from "@/components/messaging/channel-badge";
import { AnimatePresence, motion } from "motion/react";
import {
  Mail, MailOpen, MousePointerClick, MessageSquare, MessageCircle,
  LogIn, Upload, FileCheck, Phone, CreditCard, Calendar, GitBranch,
  Brain, AlertTriangle, Send, FileText, Check, Pen,
  Receipt, ChevronDown,
} from "lucide-react";
import { PetalMark } from "@/components/petal-mark";
import type { ActivityEvent, ActivityEventType, ActivityChannel } from "@/lib/mock-data";
import { format, isToday, isYesterday, parseISO } from "date-fns";

// Icon + color config for all event types
const eventConfig: Record<string, { icon: React.ElementType; color: string }> = {
  email_sent: { icon: Mail, color: "text-blue-600" },
  email_opened: { icon: MailOpen, color: "text-emerald-600" },
  email_clicked: { icon: MousePointerClick, color: "text-emerald-600" },
  sms_sent: { icon: MessageSquare, color: "text-blue-600" },
  sms_delivered: { icon: MessageSquare, color: "text-emerald-600" },
  sms_replied: { icon: MessageCircle, color: "text-emerald-600" },
  portal_login: { icon: LogIn, color: "text-violet-600" },
  document_uploaded: { icon: Upload, color: "text-emerald-600" },
  form_completed: { icon: FileCheck, color: "text-emerald-600" },
  call_logged: { icon: Phone, color: "text-blue-600" },
  payment_received: { icon: CreditCard, color: "text-emerald-600" },
  appointment_scheduled: { icon: Calendar, color: "text-violet-600" },
  stage_changed: { icon: GitBranch, color: "text-blue-600" },
  ai_extraction: { icon: PetalMark, color: "text-emerald-600" },
  ai_classification: { icon: Brain, color: "text-emerald-600" },
  ai_flag: { icon: AlertTriangle, color: "text-amber-600" },
  message_sent: { icon: Send, color: "text-blue-600" },
  message_received: { icon: MessageSquare, color: "text-blue-600" },
  signature_sent: { icon: FileText, color: "text-blue-600" },
  signature_completed: { icon: Check, color: "text-emerald-600" },
  return_filed: { icon: Check, color: "text-emerald-600" },
  invoice_sent: { icon: Receipt, color: "text-blue-600" },
  note_added: { icon: Pen, color: "text-muted-foreground" },
};

// Actor indicator
function ActorIndicator({ actor, clientAvatar, clientInitials }: {
  actor?: string;
  clientAvatar: string;
  clientInitials: string;
}) {
  switch (actor) {
    case "antonio":
      return (
        <Avatar className="size-6">
          <AvatarImage src="/images/avatars/antonio.jpg" />
          <AvatarFallback className="text-[8px]">AV</AvatarFallback>
        </Avatar>
      );
    case "client":
      return (
        <Avatar className="size-6">
          <AvatarImage src={clientAvatar} />
          <AvatarFallback className="text-[8px]">{clientInitials}</AvatarFallback>
        </Avatar>
      );
    case "ai":
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
          <Brain className="size-3 text-emerald-600" />
        </div>
      );
    case "system":
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-muted">
          <GitBranch className="size-3 text-muted-foreground" />
        </div>
      );
    default:
      return (
        <div className="flex size-6 items-center justify-center rounded-full bg-muted">
          <div className="size-2 rounded-full bg-muted-foreground/30" />
        </div>
      );
  }
}

function formatTime(timestamp: string): string {
  const date = parseISO(timestamp);
  return format(date, "h:mm a");
}

function groupByDate(events: ActivityEvent[]): { date: string; dateKey: string; events: ActivityEvent[] }[] {
  const groups: { date: string; dateKey: string; events: ActivityEvent[] }[] = [];
  let currentKey = "";

  for (const event of events) {
    const date = parseISO(event.timestamp);
    const dateKey = format(date, "yyyy-MM-dd");
    const dateLabel = isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "EEEE, MMMM d");

    if (dateKey !== currentKey) {
      currentKey = dateKey;
      groups.push({ date: dateLabel, dateKey, events: [] });
    }
    groups[groups.length - 1].events.push(event);
  }
  return groups;
}

// Single event row
function EventRow({ event, clientAvatar, clientInitials }: {
  event: ActivityEvent;
  clientAvatar: string;
  clientInitials: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = eventConfig[event.type] || { icon: GitBranch, color: "text-muted-foreground" };
  const Icon = config.icon;
  const hasDetail = !!event.detail;
  const channel = event.channel as ActivityChannel;

  return (
    <div className="group relative flex gap-3 py-2">
      {/* Timeline connector line */}
      <div className="absolute left-[11px] top-10 bottom-0 w-px bg-border/40 group-last:hidden" />

      {/* Actor indicator */}
      <ActorIndicator actor={event.actor} clientAvatar={clientAvatar} clientInitials={clientInitials} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <Icon className={cn("mt-0.5 size-3 shrink-0", config.color)} />
          <div className="flex-1 min-w-0">
            <p className="text-xs leading-snug text-foreground/85">
              {event.description}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-[10px] tabular-nums text-muted-foreground/60">
                {formatTime(event.timestamp)}
              </span>
              {channel && channel !== "system" && channel !== null && (
                <ChannelBadge channel={channel as "portal" | "email" | "sms" | "voice"} />
              )}
            </div>
          </div>
        </div>

        {/* Expandable detail */}
        {hasDetail && (
          <div className="ml-5 mt-1">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "size-2.5 transition-transform duration-150",
                  expanded && "rotate-180"
                )}
              />
              {expanded ? "Hide detail" : "View detail"}
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <p className="mt-1.5 rounded-md bg-muted/40 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                    {event.detail}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// Main timeline
interface AuditTrailTimelineProps {
  events: ActivityEvent[];
  clientAvatar: string;
  clientName: string;
}

export function AuditTrailTimeline({ events, clientAvatar, clientName }: AuditTrailTimelineProps) {
  const clientInitials = clientName.split(" ").map(n => n[0]).join("").slice(0, 2);

  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No activity recorded yet.
      </div>
    );
  }

  // Sort ascending for timeline display (oldest first within groups)
  const sortedAsc = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const groups = groupByDate(sortedAsc);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.dateKey}>
          {/* Date header */}
          <div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-background/95 py-1 backdrop-blur-sm">
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.date}
            </span>
            <div className="h-px flex-1 bg-border/30" />
          </div>

          <div className="space-y-0">
            {group.events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                clientAvatar={clientAvatar}
                clientInitials={clientInitials}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
