"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChannelBadge } from "./channel-badge";
import { EmailMessage } from "./email-message";
import { VoiceMessage } from "./voice-message";
import { FileText, Calendar, DollarSign, Clock, Bot } from "lucide-react";
import type { UnifiedMessage } from "@/lib/comms-mock-data";
import type { Client } from "@/lib/mock-data";
import { format, isToday, isYesterday, parseISO } from "date-fns";

interface UnifiedTimelineProps {
  messages: UnifiedMessage[];
  client: Client;
}

function formatMessageTime(timestamp: string): string {
  const date = parseISO(timestamp);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday " + format(date, "h:mm a");
  return format(date, "MMM d") + " " + format(date, "h:mm a");
}

function groupByDate(messages: UnifiedMessage[]): { date: string; messages: UnifiedMessage[] }[] {
  const groups: { date: string; messages: UnifiedMessage[] }[] = [];
  let currentDate = "";

  for (const msg of messages) {
    const date = parseISO(msg.timestamp);
    const dateKey = isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "EEEE, MMM d");
    if (dateKey !== currentDate) {
      currentDate = dateKey;
      groups.push({ date: dateKey, messages: [] });
    }
    groups[groups.length - 1].messages.push(msg);
  }
  return groups;
}

// System card icons
function SystemCardIcon({ type }: { type: string }) {
  switch (type) {
    case "status": return <Clock className="size-3 text-primary" />;
    case "signature": return <FileText className="size-3 text-blue-600" />;
    case "payment": return <DollarSign className="size-3 text-amber-600" />;
    case "appointment": return <Calendar className="size-3 text-violet-600" />;
    default: return <Bot className="size-3 text-muted-foreground" />;
  }
}

export function UnifiedTimeline({ messages, client }: UnifiedTimelineProps) {
  if (messages.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No messages yet with {client.fullName.split(" ")[0]}.
      </div>
    );
  }

  const groups = groupByDate(messages);
  const clientInitials = client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.date}>
          {/* Date separator */}
          <div className="relative mb-4 flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 h-px bg-border/40" />
            <span className="relative bg-background px-3 text-[10px] font-medium text-muted-foreground">
              {group.date}
            </span>
          </div>

          <div className="space-y-4">
            {group.messages.map((msg) => {
              // System card
              if (msg.sender === "system" && msg.systemCard) {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="ml-9 max-w-[400px] rounded-2xl border bg-muted/30 p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="flex size-5 items-center justify-center rounded bg-primary/10">
                          <SystemCardIcon type={msg.systemCard.type} />
                        </div>
                        <span className="text-xs font-semibold">{msg.systemCard.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {msg.systemCard.description}
                      </p>
                    </div>
                  </div>
                );
              }

              // System text message (non-card)
              if (msg.sender === "system") {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span className="text-[10px] text-muted-foreground">{msg.content}</span>
                  </div>
                );
              }

              const isClient = msg.sender === "client";
              const isVoice = msg.channel === "voice" || msg.channel === "video";
              const isEmail = msg.channel === "email";

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2.5",
                    isClient ? "justify-start" : "justify-end"
                  )}
                >
                  {/* Client avatar */}
                  {isClient && (
                    <Avatar className="size-7 shrink-0">
                      <AvatarImage src={client.avatar} />
                      <AvatarFallback className="text-[10px]">{clientInitials}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={cn("max-w-[75%] space-y-1", !isClient && "items-end")}>
                    {/* Channel + time */}
                    <div className={cn("flex items-center gap-1.5", !isClient && "justify-end")}>
                      {msg.channel !== "portal" && <ChannelBadge channel={msg.channel} />}
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatMessageTime(msg.timestamp)}
                      </span>
                    </div>

                    {/* Message bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5",
                        isVoice
                          ? "rounded-lg border bg-card px-4 py-3"
                          : isClient
                            ? "bg-muted/60"
                            : "bg-primary text-primary-foreground",
                        isEmail && isClient && "rounded-lg border bg-card px-4 py-3",
                        isEmail && !isClient && "rounded-lg border bg-primary/5 text-foreground px-4 py-3"
                      )}
                    >
                      {isVoice ? (
                        <VoiceMessage message={msg} />
                      ) : isEmail ? (
                        <EmailMessage message={msg} />
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>

                  {/* Preparer avatar */}
                  {!isClient && (
                    <Avatar className="size-7 shrink-0">
                      <AvatarImage src="/images/avatars/antonio.jpg" />
                      <AvatarFallback className="text-[10px]">AV</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
