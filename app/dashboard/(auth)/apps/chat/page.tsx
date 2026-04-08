"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Search, Phone, MoreHorizontal, FileText,
  Calendar, DollarSign, Clock, Bot, ChevronRight,
  Sparkles, Image as ImageIcon
} from "lucide-react";
import { clients } from "@/lib/mock-data";
import { threads as sharedThreads, getClientDrafts, type ChatMessage } from "@/lib/messages-data";
import { AIDraftCard } from "@/components/messaging/ai-draft-card";
import { MessageInput } from "@/components/messaging/message-input";
import Link from "next/link";

// Build conversation list from shared threads
const conversationList = Object.entries(sharedThreads).map(([clientId, msgs]) => {
  const client = clients.find(c => c.id === clientId);
  if (!client) return null;
  const lastMsg = msgs[msgs.length - 1];
  const lastContent = lastMsg.systemCard ? lastMsg.systemCard.title : lastMsg.content;
  const hasDraft = getClientDrafts(clientId).length > 0;
  return { clientId, client, lastMessage: lastContent, lastTime: lastMsg.time, unread: clientId === "c2" || clientId === "c3" || clientId === "c11" || clientId === "c15", hasDraft, messages: msgs };
}).filter(Boolean).sort((a, b) => {
  if (a!.unread !== b!.unread) return a!.unread ? -1 : 1;
  if (a!.hasDraft !== b!.hasDraft) return a!.hasDraft ? -1 : 1;
  return 0;
}) as NonNullable<(typeof conversationList)[0]>[];

export default function Page() {
  const [selectedId, setSelectedId] = useState(conversationList[0]?.clientId || "c2");
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [localThreads, setLocalThreads] = useState<Record<string, ChatMessage[]>>(sharedThreads);
  const [dismissedDrafts, setDismissedDrafts] = useState<Set<string>>(new Set());

  const selected = conversationList.find(c => c.clientId === selectedId);
  const thread = localThreads[selectedId] || [];
  const pendingDrafts = getClientDrafts(selectedId).filter(d => !dismissedDrafts.has(d.id));

  const filtered = conversationList.filter(c =>
    c.client.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendMessage = (text: string) => {
    const newMsg: ChatMessage = { id: `sent-${Date.now()}`, sender: "preparer", content: text, time: "Just now" };
    setLocalThreads(prev => ({ ...prev, [selectedId]: [...(prev[selectedId] || []), newMsg] }));
    pendingDrafts.forEach(d => setDismissedDrafts(prev => new Set([...prev, d.id])));
  };

  const editDraft = (text: string) => {
    setInput(text);
    pendingDrafts.forEach(d => setDismissedDrafts(prev => new Set([...prev, d.id])));
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] w-full overflow-hidden rounded-lg border bg-white">
      {/* Conversation list */}
      <div className="w-[320px] shrink-0 border-r flex flex-col">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search conversations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(convo => (
            <button
              key={convo.clientId}
              onClick={() => setSelectedId(convo.clientId)}
              className={`w-full flex items-start gap-3 p-3 text-left border-b transition-colors ${selectedId === convo.clientId ? "bg-muted/50" : "hover:bg-muted/30"}`}
            >
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={convo.client.avatar} alt={convo.client.fullName} />
                <AvatarFallback className="text-xs">{convo.client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm truncate ${convo.unread ? "font-semibold" : "font-medium"}`}>{convo.client.fullName}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{convo.lastTime}</span>
                </div>
                <p className={`text-xs truncate ${convo.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>{convo.lastMessage}</p>
                {convo.hasDraft && !dismissedDrafts.has(getClientDrafts(convo.clientId)[0]?.id || "") && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="size-1.5 rounded-full bg-foreground/30" />
                    <span className="text-[10px] text-muted-foreground font-medium">Draft ready</span>
                  </div>
                )}
              </div>
              {convo.unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {selected && (
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={selected.client.avatar} alt={selected.client.fullName} />
                <AvatarFallback className="text-xs">{selected.client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold">{selected.client.fullName}</div>
                <div className="text-xs text-muted-foreground">{selected.client.serviceTier} Client</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="size-8" asChild>
                <Link href={`/dashboard/clients/${selectedId}/overview`}><ChevronRight className="size-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" className="size-8"><Phone className="size-4" /></Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {thread.map(msg => {
            if (msg.sender === "system" && msg.systemCard) {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="ml-9 max-w-[320px] rounded-2xl border bg-muted/30 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex size-5 items-center justify-center rounded bg-primary/10">
                        {msg.systemCard.type === "status" && <Clock className="size-3 text-primary" />}
                        {msg.systemCard.type === "payment" && <DollarSign className="size-3 text-primary" />}
                        {msg.systemCard.type === "signature" && <FileText className="size-3 text-primary" />}
                        {msg.systemCard.type === "appointment" && <Calendar className="size-3 text-primary" />}
                      </div>
                      <span className="text-xs font-semibold">{msg.systemCard.title}</span>
                      <Badge variant="outline" className="ml-auto text-[9px]"><Bot className="mr-0.5 size-2" /> Auto</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{msg.systemCard.description}</p>
                    {msg.systemCard.action && (
                      <button className="mt-2 text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
                        {msg.systemCard.action} <ChevronRight className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            if (msg.sender === "system" && !msg.systemCard) {
              return <div key={msg.id} className="text-center"><span className="text-[11px] text-muted-foreground italic">{msg.content}</span></div>;
            }

            const isClient = msg.sender === "client";
            return (
              <div key={msg.id} className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
                {isClient && selected && (
                  <Avatar className="mr-2 size-7 shrink-0 mt-1">
                    <AvatarImage src={selected.client.avatar} alt={selected.client.fullName} />
                    <AvatarFallback className="text-[9px]">{selected.client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[65%] rounded-2xl px-4 py-3 ${isClient ? "border bg-muted/50" : "bg-primary text-primary-foreground"}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.attachment && (
                    <div className={`mt-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${isClient ? "border-border" : "border-primary-foreground/20"}`}>
                      {msg.attachment.type === "image" ? <ImageIcon className="size-3" /> : <FileText className="size-3" />}
                      <span className="truncate">{msg.attachment.name}</span>
                      <span className="text-[10px] opacity-60">{msg.attachment.size}</span>
                    </div>
                  )}
                  <div className={`mt-1 text-[10px] ${isClient ? "text-muted-foreground" : "text-primary-foreground/60"}`}>{msg.time}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Draft Suggestion */}
        {pendingDrafts.length > 0 && (
          <div className="px-3 pt-2">
            <AIDraftCard
              draft={pendingDrafts[0]}
              onSend={sendMessage}
              onEdit={editDraft}
              onDismiss={() => setDismissedDrafts(prev => new Set([...prev, pendingDrafts[0].id]))}
            />
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t">
          <MessageInput
            placeholder={selected ? `Message ${selected.client.fullName.split(" ")[0]}...` : "Select a conversation..."}
            value={input}
            onChange={setInput}
            onSend={(text) => { sendMessage(text); setInput(""); }}
          />
        </div>
      </div>
    </div>
  );
}
