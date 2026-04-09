"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExternalLink, Calendar, X } from "lucide-react";
import { getScheduledCallsForClient } from "@/lib/comms-mock-data";
import { format as formatDate, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

export function UpcomingCallBanner({ clientId, clientName }: { clientId: string; clientName: string }) {
  const calls = getScheduledCallsForClient(clientId);
  const [dismissed, setDismissed] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  if (calls.length === 0 || dismissed) return null;
  const call = calls[0];

  const startTime = parseISO(call.scheduledAt);

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="flex items-center gap-4 rounded-xl border bg-card p-4 cursor-pointer transition-colors hover:bg-muted/30"
      >
        <img
          src={call.platform === "zoom" ? "/images/zoom.webp" : "/images/google-meet.png"}
          alt={call.platform === "zoom" ? "Zoom" : "Google Meet"}
          className="size-10 rounded-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">Upcoming: {call.subject}</div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span>{formatDate(startTime, "EEEE, MMMM d")}</span>
            <span>&middot;</span>
            <span>{formatDate(startTime, "h:mm a")}</span>
            <span>&middot;</span>
            <span>{call.duration} min</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium">
              {call.platform === "zoom" ? "Zoom" : "Google Meet"}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 px-4 text-xs shrink-0"
          onClick={(e) => { e.stopPropagation(); window.open(call.meetingUrl, "_blank"); }}
        >
          <ExternalLink className="size-3.5" /> Join
        </Button>
        <button
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
          className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <X className="size-4" />
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
