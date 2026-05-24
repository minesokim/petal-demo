"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/mock-data";
import { getUnifiedThread, getScheduledCallsForClient, type UnifiedMessage, type CommChannel, type ScheduledCall } from "@/lib/comms-mock-data";
import { getClientDrafts } from "@/lib/messages-data";
import { AIDraftCard } from "@/components/messaging/ai-draft-card";
import { UnifiedTimeline } from "@/components/messaging/unified-timeline";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, MessageSquare, Globe, Mail, Smartphone, PhoneCall, Video, ExternalLink, Calendar, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";

type ComposableChannel = "portal" | "email" | "sms";
type ViewFilter = "all" | CommChannel;

const filterTabs: { value: ViewFilter; label: string; icon: React.ElementType; composable?: ComposableChannel; activeColor?: string }[] = [
  { value: "all", label: "All", icon: MessageSquare },
  { value: "portal", label: "Portal", icon: Globe, composable: "portal", activeColor: "text-purple-600 dark:text-purple-400" },
  { value: "email", label: "Email", icon: Mail, composable: "email", activeColor: "text-blue-600 dark:text-blue-400" },
  { value: "sms", label: "SMS", icon: Smartphone, composable: "sms", activeColor: "text-emerald-600 dark:text-emerald-400" },
  { value: "voice", label: "Calls", icon: PhoneCall, activeColor: "text-amber-600 dark:text-amber-400" },
  { value: "video", label: "Video", icon: Video, activeColor: "text-rose-600 dark:text-rose-400" },
];

const channelPlaceholders: Record<string, string> = {
  all: "Type a message...",
  portal: "Type a portal message...",
  email: "Compose email...",
  sms: "Type a text message...",
};

interface ClientMessagesViewProps {
  client: Client;
  /** Container height override (defaults to full-page height). Use for popup contexts. */
  containerHeight?: string;
  /** Popup mode — ~15% smaller channel selector + tighter top spacing */
  compact?: boolean;
}

export function ClientMessagesView({ client, containerHeight = "calc(100vh - 220px)", compact = false }: ClientMessagesViewProps) {
  const [input, setInput] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [localMessages, setLocalMessages] = useState<UnifiedMessage[]>([]);
  const [dismissedDrafts, setDismissedDrafts] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const baseThread = getUnifiedThread(client.id);
  const thread = [...baseThread, ...localMessages];
  const pendingDrafts = getClientDrafts(client.id).filter(d => !dismissedDrafts.has(d.id));

  const filteredThread = viewFilter === "all" ? thread : thread.filter(m => m.channel === viewFilter);

  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: thread.length, portal: 0, email: 0, sms: 0, voice: 0, video: 0 };
    for (const m of thread) { if (m.channel in counts) counts[m.channel]++; }
    return counts;
  }, [thread]);

  // Unread counts per channel — client messages after the demo's "today" cutoff
  const unreadByChannel = useMemo(() => {
    const cutoff = new Date("2026-03-28T00:00:00").getTime();
    const unreads: Record<string, number> = { portal: 0, email: 0, sms: 0, voice: 0, video: 0 };
    for (const m of thread) {
      if (m.sender === "client" && new Date(m.timestamp).getTime() > cutoff) {
        if (m.channel in unreads) unreads[m.channel]++;
      }
    }
    return unreads;
  }, [thread]);

  const activeTab = filterTabs.find(t => t.value === viewFilter);
  const composeChannel: ComposableChannel = activeTab?.composable || "portal";
  const canCompose = viewFilter === "all" || !!activeTab?.composable;

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: UnifiedMessage = {
      id: `sent-${Date.now()}`,
      sender: "preparer",
      channel: composeChannel,
      content: input,
      timestamp: new Date().toISOString(),
      ...(composeChannel === "email" && emailSubject ? { emailSubject } : {}),
    };
    setLocalMessages((prev) => [...prev, newMsg]);
    setInput("");
    setEmailSubject("");
    pendingDrafts.forEach(d => setDismissedDrafts(prev => new Set([...prev, d.id])));
  };

  const editDraft = (text: string) => {
    setInput(text);
    pendingDrafts.forEach(d => setDismissedDrafts(prev => new Set([...prev, d.id])));
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread.length]);

  return (
    <div className="flex flex-col" style={{ height: containerHeight }}>
      {/* Channel tabs — filter + sets compose channel.
          In compact (popup) mode: ~15% smaller fonts/icons/padding + tighter top margin
          to close the gap below the dialog tab bar. */}
      <div className={cn(
        "shrink-0 flex items-center border-b border-border/40",
        compact ? "gap-0 pb-1 mb-1.5" : "gap-0.5 pb-2 mb-3"
      )}>
        {filterTabs.map(tab => {
          const Icon = tab.icon;
          const count = channelCounts[tab.value] || 0;
          const isActive = viewFilter === tab.value;
          const unread = tab.value !== "all" ? (unreadByChannel[tab.value] || 0) : 0;
          return (
            <button
              key={tab.value}
              onClick={() => setViewFilter(tab.value)}
              className={cn(
                "relative flex items-center rounded-md font-medium transition-all",
                compact ? "gap-1 px-2 py-1 text-[11px]" : "gap-1.5 px-3 py-1.5 text-[13px]",
                isActive ? "bg-foreground/5 text-foreground" : "text-muted-foreground hover:text-foreground/70 hover:bg-muted/30",
                count === 0 && tab.value !== "all" && "opacity-30"
              )}
            >
              <Icon className={cn(
                compact ? "size-3" : "size-3.5",
                isActive && tab.activeColor
              )} />
              {tab.label}
              {count > 0 && tab.value !== "all" && (
                <span className={cn(
                  "tabular-nums",
                  compact ? "text-[9px]" : "text-[10px]",
                  isActive ? "text-foreground/50" : "text-muted-foreground/40"
                )}>{count}</span>
              )}
              {unread > 0 && !isActive && (
                <span className={cn(
                  "flex items-center justify-center rounded-full bg-emerald-600 font-bold text-white leading-[0]",
                  compact ? "size-[12px] text-[6px]" : "size-[14px] text-[7px]"
                )}>
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* In-thread upcoming-call banner removed — the layout-level sticky
          UpcomingCallBanner (in clients/[id]/layout.tsx + client-detail-dialog.tsx)
          already shows this above the tab content, so showing it again here was a
          visible duplicate. */}

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4 pr-1">
        <UnifiedTimeline messages={filteredThread} client={client} compact={compact} />
      </div>

      {/* AI Drafts */}
      {pendingDrafts.length > 0 && canCompose && (
        <div className="space-y-2 border-t border-border/30 pt-2 pb-1">
          {pendingDrafts.map((draft) => (
            <AIDraftCard
              key={draft.id}
              draft={draft}
              onSend={(text, channel) => {
                setLocalMessages((prev) => [...prev, {
                  id: `draft-${Date.now()}`, sender: "preparer", channel,
                  content: text, timestamp: new Date().toISOString(),
                }]);
                setDismissedDrafts((prev) => new Set([...prev, draft.id]));
              }}
              onEdit={(text) => editDraft(text)}
              onDismiss={() => setDismissedDrafts((prev) => new Set([...prev, draft.id]))}
            />
          ))}
        </div>
      )}

      {/* Compose */}
      {canCompose && (
        <div className="shrink-0 border-t border-border/50 pt-2 pb-2 space-y-2">
          {viewFilter !== "all" && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>Sending via</span>
              <span className="font-medium capitalize">{composeChannel}</span>
            </div>
          )}

          {composeChannel === "email" && (
            <input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Subject..."
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50"
            />
          )}

          <div className="flex items-center gap-2">
            <button className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <Paperclip className="size-4" />
            </button>
            <input
              placeholder={channelPlaceholders[viewFilter] || channelPlaceholders.all}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
            />
            <Button size="icon" className="size-9 shrink-0" onClick={sendMessage} disabled={!input.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {!canCompose && viewFilter === "voice" && (
        <div className="shrink-0 border-t border-border/50 pt-3 pb-1">
          <p className="text-center text-xs text-muted-foreground">Voice calls are logged automatically</p>
        </div>
      )}

      {!canCompose && viewFilter === "video" && (
        <ScheduledCallSection clientId={client.id} clientName={client.fullName} />
      )}
    </div>
  );
}

// ── Scheduled Call Section ──
function ScheduledCallSection({ clientId, clientName }: { clientId: string; clientName: string }) {
  const calls = getScheduledCallsForClient(clientId);
  const [detailCall, setDetailCall] = useState<(typeof calls)[0] | null>(null);

  if (calls.length === 0) {
    return (
      <div className="shrink-0 border-t border-border/50 pt-4 pb-2">
        <p className="text-center text-xs text-muted-foreground">No upcoming video calls with {clientName.split(" ")[0]}</p>
      </div>
    );
  }

  return (
    <>
      <div className="shrink-0 border-t border-border/50 pt-4 pb-2 space-y-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Upcoming</span>
        {calls.map(call => (
          <button
            key={call.id}
            onClick={() => setDetailCall(call)}
            className="w-full flex items-center gap-4 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/30"
          >
            <div className={cn(
              "flex size-11 items-center justify-center rounded-xl",
              call.platform === "zoom" ? "bg-blue-50 dark:bg-blue-950/30" : "bg-emerald-50 dark:bg-emerald-950/30"
            )}>
              <Video className={cn("size-5", call.platform === "zoom" ? "text-blue-600" : "text-emerald-600")} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{call.subject}</div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                <span>{format(parseISO(call.scheduledAt), "EEEE, MMMM d")}</span>
                <span>&middot;</span>
                <Clock className="size-3" />
                <span>{format(parseISO(call.scheduledAt), "h:mm a")}</span>
                <span>&middot;</span>
                <span>{call.duration} min</span>
              </div>
              <div className="mt-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {call.platform === "zoom" ? "Zoom" : "Google Meet"}
                </Badge>
              </div>
            </div>
            <Button
              size="sm"
              className="h-9 gap-2 px-4 text-sm shrink-0"
              onClick={(e) => { e.stopPropagation(); window.open(call.meetingUrl, "_blank"); }}
            >
              <ExternalLink className="size-3.5" /> Join
            </Button>
          </button>
        ))}
      </div>

      {detailCall && (
        <CallDetailDialog call={detailCall} open={!!detailCall} onOpenChange={(o) => !o && setDetailCall(null)} />
      )}
    </>
  );
}

// ── Call Detail Dialog ──
function CallDetailDialog({ call, open, onOpenChange }: { call: ScheduledCall; open: boolean; onOpenChange: (o: boolean) => void }) {
  const startTime = parseISO(call.scheduledAt);
  const endTime = new Date(startTime.getTime() + call.duration * 60000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className={cn(
          "px-6 pt-6 pb-4",
          call.platform === "zoom" ? "bg-blue-50/50 dark:bg-blue-950/20" : "bg-emerald-50/50 dark:bg-emerald-950/20"
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "flex size-10 items-center justify-center rounded-xl",
              call.platform === "zoom" ? "bg-blue-100 dark:bg-blue-900/40" : "bg-emerald-100 dark:bg-emerald-900/40"
            )}>
              <Video className={cn("size-5", call.platform === "zoom" ? "text-blue-600" : "text-emerald-600")} />
            </div>
            <Badge variant="outline" className="text-[10px]">
              {call.platform === "zoom" ? "Zoom Meeting" : "Google Meet"}
            </Badge>
          </div>
          <h2 className="text-base font-semibold">{call.subject}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">with {call.clientName}</p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{format(startTime, "EEEE, MMMM d, yyyy")}</div>
                <div className="text-xs text-muted-foreground">
                  {format(startTime, "h:mm a")} – {format(endTime, "h:mm a")} ({call.duration} minutes)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Video className="size-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">{call.platform === "zoom" ? "Zoom" : "Google Meet"}</div>
                <div className="text-xs text-muted-foreground truncate">{call.meetingUrl}</div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => window.open(call.meetingUrl, "_blank")}
            >
              <ExternalLink className="size-4" /> Join Call
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
