"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, DollarSign, Clock, Bot, ChevronRight, Image as ImageIcon } from "lucide-react";
import { clients } from "@/lib/mock-data";
import { getThread, getClientDrafts, type ChatMessage } from "@/lib/messages-data";
import { AIDraftCard } from "@/components/messaging/ai-draft-card";
import { MessageInput } from "@/components/messaging/message-input";

export default function ClientMessagesPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  const [input, setInput] = useState("");
  const [localThread, setLocalThread] = useState<ChatMessage[] | null>(null);
  const [dismissedDrafts, setDismissedDrafts] = useState<Set<string>>(new Set());

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const baseThread = getThread(client.id);
  const thread = localThread || baseThread;
  const pendingDrafts = getClientDrafts(client.id).filter(d => !dismissedDrafts.has(d.id));

  const sendMessage = (text: string) => {
    const newMsg: ChatMessage = { id: `sent-${Date.now()}`, sender: "preparer", content: text, time: "Just now" };
    setLocalThread([...thread, newMsg]);
    pendingDrafts.forEach(d => setDismissedDrafts(prev => new Set([...prev, d.id])));
  };

  const editDraft = (text: string) => {
    setInput(text);
    pendingDrafts.forEach(d => setDismissedDrafts(prev => new Set([...prev, d.id])));
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 320px)" }}>
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {thread.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No messages yet with {client.fullName.split(" ")[0]}.</div>
        ) : thread.map(msg => {
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
              {isClient && (
                <Avatar className="mr-2 size-7 shrink-0 mt-1">
                  <AvatarImage src={client.avatar} alt={client.fullName} />
                  <AvatarFallback className="text-[9px]">{client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isClient ? "border bg-muted/50" : "bg-primary text-primary-foreground"}`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.attachment && (
                  <div className={`mt-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs ${isClient ? "border-border" : "border-primary-foreground/20"}`}>
                    {msg.attachment.type === "image" ? <ImageIcon className="size-3" /> : <FileText className="size-3" />}
                    <span className="truncate">{msg.attachment.name}</span>
                    <span className="text-[10px] opacity-60">{msg.attachment.size}</span>
                  </div>
                )}
                {msg.time && <div className={`mt-1 text-[10px] ${isClient ? "text-muted-foreground" : "text-primary-foreground/60"}`}>{msg.time}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Draft Suggestion */}
      {pendingDrafts.length > 0 && (
        <div className="pb-2">
          <AIDraftCard
            draft={pendingDrafts[0]}
            onSend={sendMessage}
            onEdit={editDraft}
            onDismiss={() => setDismissedDrafts(prev => new Set([...prev, pendingDrafts[0].id]))}
          />
        </div>
      )}

      {/* Input with file attachments */}
      <div className="border-t pt-3">
        <MessageInput
          placeholder={`Message ${client.fullName.split(" ")[0]}...`}
          value={input}
          onChange={setInput}
          onSend={(text) => { sendMessage(text); setInput(""); }}
        />
      </div>
    </div>
  );
}
