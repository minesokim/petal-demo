"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExternalLink, Calendar, X } from "lucide-react";
import { getScheduledCallsForClient } from "@/lib/comms-mock-data";
import { format as formatDate, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// Lead with WHEN, in human terms. Future meetings get a relative label and the
// "Join" button only goes loud (green) when it's actually time. Past/far dates
// fall back to an absolute date so a static demo clock never shows "in -50 min".
function relativeWhen(start: Date): { label: string; imminent: boolean } {
  const now = new Date();
  const min = Math.round((start.getTime() - now.getTime()) / 60000);
  const sameDay = start.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = start.toDateString() === tomorrow.toDateString();

  if (min >= 0 && min <= 1) return { label: "Starting now", imminent: true };
  if (min > 1 && min < 60) return { label: `In ${min} min`, imminent: true };
  if (min >= 0 && sameDay) return { label: `Today · ${formatDate(start, "h:mm a")}`, imminent: min < 120 };
  if (min >= 0 && isTomorrow) return { label: `Tomorrow · ${formatDate(start, "h:mm a")}`, imminent: false };
  return { label: `${formatDate(start, "EEE, MMM d")} · ${formatDate(start, "h:mm a")}`, imminent: false };
}

export function UpcomingCallBanner({ clientId, clientName }: { clientId: string; clientName: string }) {
  const calls = getScheduledCallsForClient(clientId);
  const [dismissed, setDismissed] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  if (calls.length === 0 || dismissed) return null;
  const call = calls[0];

  const startTime = parseISO(call.scheduledAt);
  const { label: whenLabel, imminent } = relativeWhen(startTime);
  const accent = call.platform === "zoom" ? "bg-blue-500" : "bg-emerald-500";

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="group flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-border/60 bg-card pr-2 transition-colors hover:border-border"
      >
        {/* Provider accent rail — identity without a redundant text tag */}
        <div className={cn("h-full w-1 shrink-0 self-stretch", accent)} />

        <img
          src={call.platform === "zoom" ? "/images/zoom.webp" : "/images/google-meet.png"}
          alt={call.platform === "zoom" ? "Zoom" : "Google Meet"}
          className="my-2.5 size-8 shrink-0 rounded-lg"
        />

        <div className="min-w-0 flex-1 py-2">
          <div className="flex items-center gap-2">
            {imminent && <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />}
            <span className={cn("shrink-0 text-[11px] font-semibold", imminent ? "text-emerald-600" : "text-foreground")}>{whenLabel}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="truncate text-[11px] text-muted-foreground">{call.duration} min</span>
          </div>
          <div className="mt-0.5 truncate text-[13px] font-medium">{call.subject}</div>
        </div>

        <Button
          size="sm"
          variant={imminent ? "default" : "outline"}
          className={cn(
            "h-8 shrink-0 gap-1.5 px-3.5 text-xs font-medium",
            imminent && "bg-emerald-600 text-white hover:bg-emerald-700",
          )}
          onClick={(e) => { e.stopPropagation(); window.open(call.meetingUrl, "_blank"); }}
        >
          <ExternalLink className="size-3.5" /> Join
        </Button>
        <button
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
          className="shrink-0 rounded-md p-1 text-muted-foreground/40 opacity-0 transition-all hover:bg-muted hover:text-muted-foreground group-hover:opacity-100"
          aria-label="Dismiss meeting reminder"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {showDetail && (
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <div className={cn(
              "px-6 pt-6 pb-4",
              call.platform === "zoom" ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-emerald-50/50 dark:bg-emerald-950/20"
            )}>
              <h2 className="text-base font-semibold">{call.subject}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">with {clientName}</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{formatDate(startTime, "EEEE, MMMM d, yyyy")}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(startTime, "h:mm a")} – {formatDate(new Date(startTime.getTime() + call.duration * 60000), "h:mm a")}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 gap-2" onClick={() => window.open(call.meetingUrl, "_blank")}>
                  <ExternalLink className="size-4" /> Join Call
                </Button>
                <Button variant="outline" onClick={() => setShowDetail(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
