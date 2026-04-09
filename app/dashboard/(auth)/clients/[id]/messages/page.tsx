"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { clients } from "@/lib/mock-data";
import { getUnifiedThread, type UnifiedMessage, type CommChannel } from "@/lib/comms-mock-data";
import { getClientDrafts } from "@/lib/messages-data";
import { AIDraftCard } from "@/components/messaging/ai-draft-card";
import { UnifiedTimeline } from "@/components/messaging/unified-timeline";
import { ChannelSelector } from "@/components/messaging/channel-selector";
import { Button } from "@/components/ui/button";
import { Send, Paperclip } from "lucide-react";

type ComposableChannel = Exclude<CommChannel, "voice">;

const channelPlaceholders: Record<ComposableChannel, string> = {
  portal: "Type a message...",
  email: "Compose email...",
  sms: "Type a text message...",
};

export default function ClientMessagesPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  const [input, setInput] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [channel, setChannel] = useState<ComposableChannel>("portal");
  const [localMessages, setLocalMessages] = useState<UnifiedMessage[]>([]);
  const [dismissedDrafts, setDismissedDrafts] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const baseThread = getUnifiedThread(client.id);
  const thread = [...baseThread, ...localMessages];
  const pendingDrafts = getClientDrafts(client.id).filter(d => !dismissedDrafts.has(d.id));

  // Suggest SMS if client hasn't logged in recently
  const lastLogin = client.lastPortalLogin ? new Date(client.lastPortalLogin) : null;
  const daysSinceLogin = lastLogin
    ? Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;
  const suggestSms = daysSinceLogin > 7;

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: UnifiedMessage = {
      id: `sent-${Date.now()}`,
      sender: "preparer",
      channel,
      content: input,
      timestamp: new Date().toISOString(),
      ...(channel === "email" && emailSubject ? { emailSubject } : {}),
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread.length]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 320px)" }}>
      {/* Scrollable timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4 pr-1">
        <UnifiedTimeline messages={thread} client={client} />
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
                const newMsg: UnifiedMessage = {
                  id: `draft-${Date.now()}`,
                  sender: "preparer",
                  channel: "portal",
                  content: draft.aiDraft || "",
                  timestamp: new Date().toISOString(),
                };
                setLocalMessages((prev) => [...prev, newMsg]);
                setDismissedDrafts((prev) => new Set([...prev, draft.id]));
              }}
              onEdit={() => editDraft(draft.aiDraft || "")}
              onDismiss={() => setDismissedDrafts((prev) => new Set([...prev, draft.id]))}
            />
          ))}
        </div>
      )}

      {/* Compose area */}
      <div className="border-t border-border/50 pt-3 space-y-2">
        {/* Channel selector */}
        <div className="flex items-center gap-2">
          <ChannelSelector value={channel} onChange={setChannel} suggestSms={suggestSms} />
          {suggestSms && channel !== "sms" && (
            <span className="text-[9px] text-amber-600">
              Client hasn&apos;t logged in for {daysSinceLogin === Infinity ? "ever" : `${daysSinceLogin}d`} — consider SMS
            </span>
          )}
        </div>

        {/* Email subject line */}
        {channel === "email" && (
          <input
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder="Subject..."
            className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50"
          />
        )}

        {/* Input row */}
        <div className="flex items-center gap-2">
          <button className="shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
            <Paperclip className="size-4" />
          </button>
          <input
            placeholder={channelPlaceholders[channel]}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
          />
          <Button
            size="icon"
            className="size-9 shrink-0"
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
