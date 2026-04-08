"use client"

import * as React from "react"
import {
  Mail,
  MailOpen,
  MousePointerClick,
  MessageSquare,
  MessageCircle,
  LogIn,
  Upload,
  FileCheck,
  Phone,
  CreditCard,
  Calendar,
  GitBranch,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivityEvent, ActivityEventType } from "@/lib/mock-data"

const eventConfig: Record<ActivityEventType, {
  icon: React.ElementType
  color: string
  bgColor: string
}> = {
  email_sent: {
    icon: Mail,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
  },
  email_opened: {
    icon: MailOpen,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  email_clicked: {
    icon: MousePointerClick,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  sms_sent: {
    icon: MessageSquare,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
  },
  sms_delivered: {
    icon: MessageSquare,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  sms_replied: {
    icon: MessageCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  portal_login: {
    icon: LogIn,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/40",
  },
  document_uploaded: {
    icon: Upload,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  form_completed: {
    icon: FileCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  call_logged: {
    icon: Phone,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
  },
  payment_received: {
    icon: CreditCard,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
  },
  appointment_scheduled: {
    icon: Calendar,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/40",
  },
  stage_changed: {
    icon: GitBranch,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/40",
  },
}

function formatEventTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

interface ActivityTimelineProps {
  events: ActivityEvent[]
  maxItems?: number
  className?: string
}

export function ActivityTimeline({ events, maxItems, className }: ActivityTimelineProps) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events
  const hasMore = maxItems && events.length > maxItems

  return (
    <div
      data-slot="activity-timeline"
      className={cn("relative pl-3", className)}
    >
      {/* Timeline line */}
      <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border/60" />

      <div className="space-y-0">
        {displayEvents.map((event, index) => {
          const config = eventConfig[event.type]
          const Icon = config.icon
          const isLast = index === displayEvents.length - 1

          return (
            <div
              key={event.id}
              className={cn(
                "relative flex items-start gap-2 py-1.5",
                isLast && "pb-0"
              )}
            >
              {/* Dot/Icon */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center",
                  "size-3 rounded-full border-2 border-background",
                  config.bgColor
                )}
              >
                <div className={cn("size-1.5 rounded-full", config.color.replace("text-", "bg-"))} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex items-baseline gap-2">
                <span className="text-[10px] text-muted-foreground shrink-0 w-12 tabular-nums">
                  {formatEventTime(event.timestamp)}
                </span>
                <span className="text-[11px] text-foreground/80 leading-snug">
                  {event.description}
                </span>
              </div>
            </div>
          )
        })}

        {hasMore && (
          <div className="relative flex items-center gap-2 py-1.5 pl-5">
            <span className="text-[10px] text-muted-foreground">
              +{events.length - maxItems} more events
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// More detailed timeline with icons
interface DetailedTimelineProps {
  events: ActivityEvent[]
  className?: string
}

export function DetailedActivityTimeline({ events, className }: DetailedTimelineProps) {
  return (
    <div
      data-slot="detailed-activity-timeline"
      className={cn("space-y-3", className)}
    >
      {events.map((event) => {
        const config = eventConfig[event.type]
        const Icon = config.icon

        return (
          <div
            key={event.id}
            className="flex items-start gap-3"
          >
            <div
              className={cn(
                "flex items-center justify-center size-7 rounded-full shrink-0",
                config.bgColor
              )}
            >
              <Icon className={cn("size-3.5", config.color)} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm text-foreground leading-snug">
                {event.description}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatEventTime(event.timestamp)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
