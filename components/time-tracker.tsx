"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play, Pause, Square, Clock, ChevronDown, ChevronUp, Plus, X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeEntry {
  id: string;
  clientId: string;
  clientName: string;
  duration: number; // seconds
  activity: string;
  note: string;
  date: string;
}

// Shared state across component mounts
let globalTimerState = {
  isRunning: false,
  clientId: "",
  clientName: "",
  activity: "Prep",
  elapsed: 0,
  startedAt: 0,
};

let globalEntries: TimeEntry[] = [
  { id: "1", clientId: "marcus-chen", clientName: "Marcus Chen", duration: 8100, activity: "Return prep", note: "Reviewed W-2s and 1099s", date: "2026-03-29" },
  { id: "2", clientId: "marcus-chen", clientName: "Marcus Chen", duration: 2700, activity: "Document review", note: "", date: "2026-03-28" },
  { id: "3", clientId: "david-park", clientName: "David Park", duration: 6300, activity: "S-Corp review", note: "Reviewed 1120S draft", date: "2026-03-29" },
  { id: "4", clientId: "roberto-fuentes", clientName: "Roberto Fuentes", duration: 5400, activity: "Filing", note: "1120S preparation", date: "2026-03-28" },
  { id: "5", clientId: "priya-sharma", clientName: "Priya Sharma", duration: 2700, activity: "Follow-up", note: "Document collection", date: "2026-03-27" },
];

const activities = ["Prep", "Review", "Call", "Filing", "Follow-up", "Meeting"];

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function FloatingTimeTracker({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [isRunning, setIsRunning] = useState(globalTimerState.isRunning && globalTimerState.clientId === clientId);
  const [elapsed, setElapsed] = useState(() => {
    if (globalTimerState.isRunning && globalTimerState.clientId === clientId) {
      return globalTimerState.elapsed + Math.floor((Date.now() - globalTimerState.startedAt) / 1000);
    }
    return 0;
  });
  const [activity, setActivity] = useState(globalTimerState.activity);
  const [expanded, setExpanded] = useState(false);
  const [showActivityPicker, setShowActivityPicker] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if timer is running for a different client
  const otherClientRunning = globalTimerState.isRunning && globalTimerState.clientId !== clientId;
  const otherClientName = otherClientRunning ? globalTimerState.clientName : "";

  const startTimer = useCallback(() => {
    globalTimerState = {
      isRunning: true,
      clientId,
      clientName,
      activity,
      elapsed: 0,
      startedAt: Date.now(),
    };
    setIsRunning(true);
    setElapsed(0);
  }, [clientId, clientName, activity]);

  const pauseTimer = useCallback(() => {
    const currentElapsed = globalTimerState.elapsed + Math.floor((Date.now() - globalTimerState.startedAt) / 1000);
    globalTimerState = { ...globalTimerState, isRunning: false, elapsed: currentElapsed, startedAt: 0 };
    setIsRunning(false);
    setElapsed(currentElapsed);
  }, []);

  const stopTimer = useCallback(() => {
    const finalElapsed = isRunning
      ? globalTimerState.elapsed + Math.floor((Date.now() - globalTimerState.startedAt) / 1000)
      : elapsed;

    if (finalElapsed >= 60) {
      const entry: TimeEntry = {
        id: Date.now().toString(),
        clientId,
        clientName,
        duration: finalElapsed,
        activity: globalTimerState.activity,
        note: "",
        date: new Date().toISOString().split("T")[0],
      };
      globalEntries = [entry, ...globalEntries];
    }

    globalTimerState = { isRunning: false, clientId: "", clientName: "", activity: "Prep", elapsed: 0, startedAt: 0 };
    setIsRunning(false);
    setElapsed(0);
  }, [clientId, clientName, isRunning, elapsed]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(globalTimerState.elapsed + Math.floor((Date.now() - globalTimerState.startedAt) / 1000));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const clientEntries = globalEntries.filter((e) => e.clientId === clientId);
  const totalTime = clientEntries.reduce((sum, e) => sum + e.duration, 0);

  return (
    <div className="fixed bottom-6 left-[var(--sidebar-width,280px)] z-40 ml-6">
      <div
        className={cn(
          "rounded-2xl border bg-background/95 backdrop-blur-sm shadow-lg transition-all duration-300",
          expanded ? "w-72" : "w-auto"
        )}
      >
        {/* Compact pill */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            {isRunning ? (
              <span className="font-mono text-xs font-medium tabular-nums text-foreground">{formatTime(elapsed)}</span>
            ) : otherClientRunning ? (
              <span className="text-[11px] text-muted-foreground">
                Timer on {otherClientName}
              </span>
            ) : totalTime > 0 ? (
              <span className="text-[11px] text-muted-foreground">{formatDuration(totalTime)} logged</span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Track time</span>
            )}
          </div>

          {isRunning && (
            <div className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          )}

          <div className="flex items-center gap-0.5">
            {!isRunning && !otherClientRunning && (
              <button
                onClick={startTimer}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Play className="size-3" />
              </button>
            )}
            {isRunning && (
              <>
                <button
                  onClick={pauseTimer}
                  className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pause className="size-3" />
                </button>
                <button
                  onClick={stopTimer}
                  className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                >
                  <Square className="size-3" />
                </button>
              </>
            )}
          </div>

          {isRunning && (
            <button
              onClick={() => setShowActivityPicker(!showActivityPicker)}
              className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              {activity}
            </button>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
          </button>
        </div>

        {/* Activity picker */}
        {showActivityPicker && isRunning && (
          <div className="border-t px-3 py-2">
            <div className="flex flex-wrap gap-1">
              {activities.map((a) => (
                <button
                  key={a}
                  onClick={() => {
                    setActivity(a);
                    globalTimerState.activity = a;
                    setShowActivityPicker(false);
                  }}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                    a === activity
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Expanded: recent entries */}
        {expanded && (
          <div className="border-t">
            <div className="px-3 py-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">Recent entries</span>
                {totalTime > 0 && (
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{formatDuration(totalTime)} total</span>
                )}
              </div>
              {clientEntries.length === 0 ? (
                <p className="py-3 text-center text-[11px] text-muted-foreground">No time logged yet</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {clientEntries.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5">
                      <div>
                        <div className="text-[11px] font-medium">{entry.activity}</div>
                        {entry.note && <div className="text-[10px] text-muted-foreground">{entry.note}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[11px] tabular-nums">{formatDuration(entry.duration)}</div>
                        <div className="text-[10px] text-muted-foreground">{entry.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// For the client overview/detail page — shows time summary inline
export function ClientTimeSummary({ clientId }: { clientId: string }) {
  const entries = globalEntries.filter((e) => e.clientId === clientId);
  const totalTime = entries.reduce((sum, e) => sum + e.duration, 0);

  if (totalTime === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Clock className="size-3" />
      <span className="text-xs">{formatDuration(totalTime)} tracked</span>
    </div>
  );
}
