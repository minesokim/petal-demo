"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { clients } from "@/lib/mock-data";
import { getUnifiedThread, type UnifiedMessage, type CommChannel } from "@/lib/comms-mock-data";
import { getClientDrafts } from "@/lib/messages-data";
import { AIDraftCard } from "@/components/messaging/ai-draft-card";
import { UnifiedTimeline } from "@/components/messaging/unified-timeline";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, MessageSquare, Mail, Smartphone, PhoneCall, Video } from "lucide-react";

type ComposableChannel = "portal" | "email" | "sms";
type ViewFilter = "all" | CommChannel;

const filterTabs: { value: ViewFilter; label: string; icon: React.ElementType; composable?: ComposableChannel }[] = [
  { value: "all", label: "All", icon: MessageSquare },
  { value: "portal", label: "Portal", icon: MessageSquare, composable: "portal" },
  { value: "email", label: "Email", icon: Mail, composable: "email" },
  { value: "sms", label: "SMS", icon: Smartphone, composable: "sms" },
  { value: "voice", label: "Calls", icon: PhoneCall },
  { value: "video", label: "Video", icon: Video },
];

const channelPlaceholders: Record<string, string> = {
  all: "Type a message...",
  portal: "Type a portal message...",
  email: "Compose email...",
  sms: "Type a text message...",
};

export default function ClientMessagesPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  const [input, setInput] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [localMessages, setLocalMessages] = useState<UnifiedMessage[]>([]);
  const [dismissedDrafts, setDismissedDrafts] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const baseThread = getUnifiedThread(client.id);
  const thread = [...baseThread, ...localMessages];
  const pendingDrafts = getClientDrafts(client.id).filter(d => !dismissedDrafts.has(d.id));

  const filteredThread = viewFilter === "all" ? thread : thread.filter(m => m.channel === viewFilter);

  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: thread.length, portal: 0, email: 0, sms: 0, voice: 0, video: 0 };
    for (const m of thread) { if (m.channel in counts) counts[m.channel]++; }
    return counts;
  }, [thread]);

  // Determine compose channel from the active filter tab
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
    <div className="flex flex-col" style={{ height: "calc(100vh - 320px)" }}>
      {/* Channel tabs — filter + sets compose channel */}
      <div className="shrink-0 flex items-center gap-0.5 border-b border-border/40 pb-2 mb-3">
        {filterTabs.map(tab => {
          const Icon = tab.icon;
          const count = channelCounts[tab.value] || 0;
          const isActive = viewFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setViewFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                isActive ? "bg-foreground/5 text-foreground" : "text-muted-foreground hover:text-foreground/70 hover:bg-muted/30",
                count === 0 && tab.value !== "all" && "opacity-30"
              )}
            >
              <Icon className="size-3" />
              {tab.label}
              {count > 0 && tab.value !== "all" && (
                <span className={cn("text-[9px] tabular-nums", isActive ? "text-foreground/60" : "text-muted-foreground/50")}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4 pr-1">
        <UnifiedTimeline messages={filteredThread} client={client} />
      </div>

      {/* AI Drafts */}
      {pendingDrafts.length > 0 && (
        <div className="space-y-2 border-t border-border/30 pt-3 pb-2">
          {pendingDrafts.map((draft) => (
            <AIDraftCard
              key={draft.id}
              draft={draft}
              clientName={client.fullName}
              onSend={() => {
                setLocalMessages((prev) => [...prev, {
                  id: `draft-${Date.now()}`, sender: "preparer", channel: "portal",
                  content: draft.aiDraft || "", timestamp: new Date().toISOString(),
                }]);
                setDismissedDrafts((prev) => new Set([...prev, draft.id]));
              }}
              onEdit={() => editDraft(draft.aiDraft || "")}
              onDismiss={() => setDismissedDrafts((prev) => new Set([...prev, draft.id]))}
            />
          ))}
        </div>
      )}

      {/* Compose — no redundant channel selector, channel comes from active tab */}
      {canCompose && (
        <div className="shrink-0 border-t border-border/50 pt-3 space-y-2">
          {/* Sending via indicator */}
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

      {/* Non-composable tabs (voice/video) show read-only note */}
      {!canCompose && (
        <div className="shrink-0 border-t border-border/50 pt-3 pb-1">
          <p className="text-center text-xs text-muted-foreground">
            {viewFilter === "voice" ? "Voice calls are logged automatically" : "Video calls are recorded from Zoom/Google Meet"}
          </p>
        </div>
      )}
    </div>
  );
}
