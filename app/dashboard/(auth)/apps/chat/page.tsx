"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Search, Phone, FileText, Calendar, DollarSign, Clock,
  Bot, ChevronRight, MessageSquare, Mail, Smartphone,
  PhoneCall, Video, Send, Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { clients } from "@/lib/mock-data";
import {
  unifiedThreads, getUnifiedThread,
  type UnifiedMessage, type CommChannel,
} from "@/lib/comms-mock-data";
import { getClientDrafts } from "@/lib/messages-data";
import { AIDraftCard } from "@/components/messaging/ai-draft-card";
import { ChannelBadge } from "@/components/messaging/channel-badge";
import { EmailMessage } from "@/components/messaging/email-message";
import { VoiceMessage } from "@/components/messaging/voice-message";
// Channel is derived from active filter tab — no separate selector needed
import { format, parseISO, isToday, isYesterday } from "date-fns";

// ── Types ──
type ViewFilter = "all" | CommChannel;
type ComposableChannel = Exclude<CommChannel, "voice">;

// ── Build conversation list from unified threads ──
function buildConversationList() {
  return Object.entries(unifiedThreads)
    .map(([clientId, msgs]) => {
      const client = clients.find((c) => c.id === clientId);
      if (!client || msgs.length === 0) return null;
      const lastMsg = msgs[msgs.length - 1];
      const lastContent = lastMsg.systemCard
        ? lastMsg.systemCard.title
        : lastMsg.emailSubject
          ? lastMsg.emailSubject
          : lastMsg.voiceDuration
            ? `Voice call (${lastMsg.voiceDuration})`
            : lastMsg.content;
      const hasDraft = getClientDrafts(clientId).length > 0;
      const unreadCount =
        clientId === "c2" ? 2 : clientId === "c3" ? 3 : clientId === "c11" ? 1 : clientId === "c15" ? 2 : 0;
      // Collect unique channels used in this thread
      const channels = [...new Set(msgs.filter(m => m.sender !== "system").map((m) => m.channel))];
      return {
        clientId,
        client,
        lastMessage: lastContent,
        lastTime: lastMsg.timestamp,
        lastChannel: lastMsg.channel,
        channels,
        unread: unreadCount > 0,
        unreadCount,
        hasDraft,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a!.unread !== b!.unread) return a!.unread ? -1 : 1;
      if (a!.hasDraft !== b!.hasDraft) return a!.hasDraft ? -1 : 1;
      return new Date(b!.lastTime).getTime() - new Date(a!.lastTime).getTime();
    }) as NonNullable<ReturnType<typeof buildConversationList>[0]>[];
}

function formatConvoTime(timestamp: string): string {
  const date = parseISO(timestamp);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

function formatMsgTime(timestamp: string): string {
  const date = parseISO(timestamp);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday " + format(date, "h:mm a");
  return format(date, "MMM d, h:mm a");
}

// ── Channel icon for sidebar ──
function ChannelIcon({ channel }: { channel: CommChannel }) {
  switch (channel) {
    case "email": return <Mail className="size-2.5 text-blue-500/70" />;
    case "sms": return <Smartphone className="size-2.5 text-emerald-500/70" />;
    case "voice": return <PhoneCall className="size-2.5 text-violet-500/70" />;
    case "video": return <Video className="size-2.5 text-blue-500/70" />;
    default: return null;
  }
}

// ── System card icon ──
function SystemCardIcon({ type }: { type: string }) {
  switch (type) {
    case "status": return <Clock className="size-3 text-primary" />;
    case "signature": return <FileText className="size-3 text-blue-600" />;
    case "payment": return <DollarSign className="size-3 text-amber-600" />;
    case "appointment": return <Calendar className="size-3 text-violet-600" />;
    default: return <Bot className="size-3 text-muted-foreground" />;
  }
}

// ── Main Page ──
export default function ChatPage() {
  const conversationList = useMemo(() => buildConversationList(), []);
  const [selectedId, setSelectedId] = useState(conversationList[0]?.clientId || "c2");
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [localMessages, setLocalMessages] = useState<Record<string, UnifiedMessage[]>>({});
  const [dismissedDrafts, setDismissedDrafts] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const selected = conversationList.find((c) => c.clientId === selectedId);
  const baseThread = getUnifiedThread(selectedId);
  const thread = [...baseThread, ...(localMessages[selectedId] || [])];
  const pendingDrafts = getClientDrafts(selectedId).filter((d) => !dismissedDrafts.has(d.id));

  // Filter conversations by search
  const filteredConvos = conversationList.filter((c) =>
    c.client.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter messages by channel
  const filteredThread = viewFilter === "all" ? thread : thread.filter((m) => m.channel === viewFilter);

  // Channel counts for current conversation
  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = { all: thread.length, portal: 0, email: 0, sms: 0, voice: 0, video: 0 };
    for (const m of thread) {
      if (m.channel in counts) counts[m.channel]++;
    }
    return counts;
  }, [thread]);

  // Derive compose channel from active filter tab
  const composeChannel: ComposableChannel =
    viewFilter === "portal" ? "portal" :
    viewFilter === "email" ? "email" :
    viewFilter === "sms" ? "sms" : "portal";
  const canCompose = viewFilter === "all" || viewFilter === "portal" || viewFilter === "email" || viewFilter === "sms";

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
    setLocalMessages((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMsg],
    }));
    setInput("");
    setEmailSubject("");
    pendingDrafts.forEach((d) => setDismissedDrafts((prev) => new Set([...prev, d.id])));
  };

  const editDraft = (text: string) => {
    setInput(text);
    pendingDrafts.forEach((d) => setDismissedDrafts((prev) => new Set([...prev, d.id])));
  };

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread.length, selectedId]);

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] w-full overflow-hidden rounded-lg border bg-card">
      {/* ── Left: Conversation List ── */}
      <div className="w-[300px] shrink-0 border-r flex flex-col">
        {/* Search */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-1.5 text-sm outline-none"
            />
          </div>
        </div>

        {/* Conversation items */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvos.map((convo) => (
            <button
              key={convo.clientId}
              onClick={() => { setSelectedId(convo.clientId); setViewFilter("all"); }}
              className={cn(
                "w-full flex items-start gap-2.5 px-3 py-2.5 text-left border-b border-border/30 transition-colors",
                selectedId === convo.clientId ? "bg-muted/50" : "hover:bg-muted/20"
              )}
            >
              <Avatar className="size-9 shrink-0">
                <AvatarImage src={convo.client.avatar} />
                <AvatarFallback className="text-[10px]">
                  {convo.client.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm truncate", convo.unread ? "font-semibold" : "font-medium")}>
                    {convo.client.fullName}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                    {formatConvoTime(convo.lastTime)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {/* Channel indicator for last message */}
                  <ChannelIcon channel={convo.lastChannel} />
                  <p className={cn("text-xs truncate", convo.unread ? "text-foreground" : "text-muted-foreground")}>
                    {convo.lastMessage}
                  </p>
                </div>
                {/* Channel pills row */}
                {convo.channels.length > 1 && (
                  <div className="flex items-center gap-1 mt-1">
                    {convo.channels.map((ch) => (
                      <span key={ch} className="rounded bg-muted/60 px-1 py-0.5 text-[8px] text-muted-foreground">
                        {ch}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {convo.unreadCount > 0 && (
                <span className="mt-1.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-bold leading-none text-white">
                  {convo.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        {selected && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarImage src={selected.client.avatar} />
                <AvatarFallback className="text-[10px]">
                  {selected.client.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold">{selected.client.fullName}</div>
                <div className="text-[10px] text-muted-foreground">{selected.client.serviceTier}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground" asChild>
              <Link href={`/dashboard/clients/${selectedId}/overview`}>
                Open profile <ChevronRight className="size-3" />
              </Link>
            </Button>
          </div>
        )}

        {/* Channel filter tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border/30 shrink-0">
          {(["all", "portal", "email", "sms", "voice", "video"] as ViewFilter[]).map((filter) => {
            const count = channelCounts[filter] || 0;
            const isActive = viewFilter === filter;
            const icons: Record<string, React.ElementType> = {
              all: MessageSquare, portal: MessageSquare, email: Mail, sms: Smartphone, voice: PhoneCall, video: Video,
            };
            const labels: Record<string, string> = {
              all: "All", portal: "Portal", email: "Email", sms: "SMS", voice: "Calls", video: "Video",
            };
            const Icon = icons[filter];
            // Unread: client messages from last 48 hours in this channel
            const unread = filter !== "all" ? thread.filter(m => m.sender === "client" && m.channel === filter && new Date(m.timestamp).getTime() > new Date("2026-03-28T00:00:00").getTime()).length : 0;
            return (
              <button
                key={filter}
                onClick={() => setViewFilter(filter)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
                  isActive ? "bg-foreground/5 text-foreground" : "text-muted-foreground hover:text-foreground/70 hover:bg-muted/20",
                  count === 0 && filter !== "all" && "opacity-30"
                )}
              >
                <Icon className="size-3.5" />
                {labels[filter]}
                {count > 0 && filter !== "all" && (
                  <span className={cn("text-[10px] tabular-nums", isActive ? "text-foreground/50" : "text-muted-foreground/40")}>{count}</span>
                )}
                {unread > 0 && !isActive && (
                  <span className="flex size-[16px] items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold leading-none text-white">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredThread.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {viewFilter === "all" ? "No messages yet." : `No ${viewFilter} messages.`}
              </p>
            </div>
          ) : (
            filteredThread.map((msg) => {
              // System card
              if (msg.sender === "system" && msg.systemCard) {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="ml-9 max-w-[380px] rounded-xl border bg-muted/20 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex size-5 items-center justify-center rounded bg-primary/10">
                          <SystemCardIcon type={msg.systemCard.type} />
                        </div>
                        <span className="text-xs font-semibold">{msg.systemCard.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{msg.systemCard.description}</p>
                    </div>
                  </div>
                );
              }

              // System text
              if (msg.sender === "system") {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="text-[10px] text-muted-foreground">{msg.content}</span>
                  </div>
                );
              }

              const isClient = msg.sender === "client";
              const isVoice = msg.channel === "voice" || msg.channel === "video";
              const isEmail = msg.channel === "email";

              return (
                <div key={msg.id} className={cn("flex gap-2", isClient ? "justify-start" : "justify-end")}>
                  {isClient && selected && (
                    <Avatar className="size-7 shrink-0 mt-1">
                      <AvatarImage src={selected.client.avatar} />
                      <AvatarFallback className="text-[9px]">
                        {selected.client.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[70%] space-y-1", !isClient && "items-end")}>
                    {/* Channel + time row */}
                    <div className={cn("flex items-center gap-1.5", !isClient && "justify-end")}>
                      {msg.channel !== "portal" && <ChannelBadge channel={msg.channel} />}
                      <span className="text-[10px] text-muted-foreground/50">{formatMsgTime(msg.timestamp)}</span>
                    </div>
                    {/* Message bubble */}
                    <div
                      className={cn(
                        "rounded-2xl",
                        isVoice
                          ? "rounded-xl border bg-card px-4 py-3"
                          : isEmail
                            ? "rounded-xl border bg-card px-4 py-3"
                            : isClient
                              ? "bg-muted/50 px-3.5 py-2.5"
                              : "bg-primary text-primary-foreground px-3.5 py-2.5"
                      )}
                    >
                      {isVoice ? (
                        <VoiceMessage message={msg} />
                      ) : isEmail ? (
                        <EmailMessage message={msg} />
                      ) : (
                        <>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          {msg.emailAttachments && msg.emailAttachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.emailAttachments.map((att) => (
                                <div key={att.id} className="flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs">
                                  <FileText className="size-3" />
                                  <span className="truncate">{att.fileName}</span>
                                  <span className="text-[10px] opacity-60">{att.fileSize}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI Draft */}
        {pendingDrafts.length > 0 && (
          <div className="px-4 pt-2 shrink-0">
            <AIDraftCard
              draft={pendingDrafts[0]}
              onSend={(text) => {
                const newMsg: UnifiedMessage = {
                  id: `draft-${Date.now()}`,
                  sender: "preparer",
                  channel: "portal",
                  content: text,
                  timestamp: new Date().toISOString(),
                };
                setLocalMessages((prev) => ({
                  ...prev,
                  [selectedId]: [...(prev[selectedId] || []), newMsg],
                }));
                setDismissedDrafts((prev) => new Set([...prev, pendingDrafts[0].id]));
              }}
              onEdit={editDraft}
              onDismiss={() => setDismissedDrafts((prev) => new Set([...prev, pendingDrafts[0].id]))}
            />
          </div>
        )}

        {/* Compose area — channel derived from active filter tab */}
        <div className="shrink-0 border-t px-4 py-2.5 space-y-2">
          {canCompose && viewFilter !== "all" && (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span>Sending via</span>
              <span className="font-medium capitalize">{composeChannel}</span>
            </div>
          )}
          {canCompose && composeChannel === "email" && (
            <input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Subject..."
              className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50"
            />
          )}
          {canCompose ? (
            <div className="flex items-center gap-2">
              <input
                placeholder={
                  composeChannel === "email" ? "Compose email..." :
                  composeChannel === "sms" ? "Type a text..." :
                  `Message ${selected?.client.fullName.split(" ")[0] || ""}...`
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none"
              />
              <Button size="icon" className="size-9 shrink-0" onClick={sendMessage} disabled={!input.trim()}>
                <Send className="size-4" />
              </Button>
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground py-1">
              {viewFilter === "voice" ? "Voice calls are logged automatically" : "Video calls are recorded from Zoom/Google Meet"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
