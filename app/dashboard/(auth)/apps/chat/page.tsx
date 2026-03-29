"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Search, Send, Phone, MoreHorizontal, FileText,
  Calendar, DollarSign, Clock, Bot, ChevronRight
} from "lucide-react";
import { clients, messages } from "@/lib/mock-data";
import Link from "next/link";

type ChatMessage = {
  id: string;
  sender: "client" | "preparer" | "system";
  content: string;
  time: string;
  systemCard?: { type: string; title: string; description: string; action?: string };
};

// Full conversation threads per client
const threads: Record<string, ChatMessage[]> = {
  c2: [
    { id: "1", sender: "client", content: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it. Can you help?", time: "2:30 PM" },
    { id: "3", sender: "preparer", content: "Hey Priya! The easiest way is to log into your portal and go to the Docs tab. There's an upload button right at the top. You can take a photo of the 1099 with your phone too - we'll extract the data automatically.", time: "2:45 PM" },
    { id: "4", sender: "client", content: "Oh perfect! I'll do that now. Also, do I need to report the $500 I made from a one-time sponsored post?", time: "2:52 PM" },
    { id: "5", sender: "preparer", content: "Yes, all income needs to be reported even if you don't receive a 1099 for it. We'll include it on your Schedule C.", time: "3:10 PM" },
    { id: "6", sender: "client", content: "Got it! When will my return be ready?", time: "3:15 PM" },
    { id: "7", sender: "system", content: "", time: "3:15 PM", systemCard: { type: "status", title: "Return Status", description: "Your return is in the document collection phase. 3 of 7 documents received. Once complete, preparation takes 3-5 business days.", action: "View Status" } },
    { id: "7n", sender: "system", content: "Antonio will follow up personally.", time: "3:15 PM" },
    { id: "8", sender: "client", content: "Thanks Antonio!", time: "3:20 PM" },
  ],
  c3: [
    { id: "1", sender: "client", content: "Hi Antonio, just wanted to check in. Are our returns done?", time: "Mar 25" },
    { id: "2", sender: "preparer", content: "Hi James! Yes, your returns are complete. I just need you and Sofia to sign Form 8879 to authorize e-filing.", time: "Mar 26" },
    { id: "3", sender: "client", content: "We're ready to sign whenever you are!", time: "7:45 AM" },
    { id: "4", sender: "system", content: "", time: "7:45 AM", systemCard: { type: "signature", title: "E-Signature Ready", description: "Form 8879 is ready for signature. Both James and Sofia need to sign.", action: "Sign Now" } },
  ],
  c4: [
    { id: "1", sender: "preparer", content: "Hi DeShawn! Welcome to Vazant Consulting. I've sent your intake form - just follow the link to get started.", time: "Mar 18" },
    { id: "2", sender: "client", content: "Thanks! I'll try to get to it this weekend.", time: "Mar 20" },
    { id: "3", sender: "preparer", content: "No problem! We still need your W-2 and the $50 deposit to start. April 15 is coming up.", time: "Mar 22" },
    { id: "4", sender: "client", content: "Sorry I've been busy. Will try to get my W-2 uploaded this weekend.", time: "Mar 26" },
    { id: "5", sender: "system", content: "", time: "Mar 26", systemCard: { type: "payment", title: "Deposit Required", description: "$50 deposit required to begin preparing your return.", action: "Pay Now" } },
  ],
  c11: [
    { id: "1", sender: "preparer", content: "David, your S-Corp return is coming along. I have questions about the payroll summary and new equipment. Can we schedule a call?", time: "Mar 25" },
    { id: "2", sender: "client", content: "Sure! How about Thursday at 2pm?", time: "Mar 26" },
    { id: "3", sender: "preparer", content: "Thursday at 2pm works. I'll send over a Google Meet link.", time: "Mar 26" },
    { id: "4", sender: "client", content: "Can we push the call to 3pm instead of 2? Got a patient emergency.", time: "8:15 AM" },
    { id: "5", sender: "preparer", content: "Of course. Moved to 3pm. Hope everything is okay!", time: "8:30 AM" },
  ],
  c15: [
    { id: "1", sender: "client", content: "Elena wants to know if we can deduct the new paint booth equipment we bought in December.", time: "Mar 27" },
    { id: "2", sender: "preparer", content: "Great question! Yes, the paint booth likely qualifies for Section 179 immediate expensing. Full deduction in 2025 instead of 7-year depreciation. How much was it?", time: "Mar 27" },
    { id: "3", sender: "client", content: "It was about $32,000. That would be a big deduction!", time: "Mar 27" },
    { id: "4", sender: "preparer", content: "Significant deduction. I'll include it as Section 179. Should save roughly $8,200 in taxes. Numbers ready for our review Monday.", time: "Mar 27" },
  ],
  c1: [
    { id: "1", sender: "client", content: "All 3 restaurant P&Ls have been uploaded. Let me know if you need anything else.", time: "Mar 27" },
    { id: "2", sender: "preparer", content: "Got them, thanks Marcus! I'll review everything and we'll go over it in our call on the 30th.", time: "Mar 27" },
  ],
  c12: [
    { id: "1", sender: "client", content: "Quick question - do I need to report the $200 I made from a one-time logo design?", time: "Mar 26" },
    { id: "2", sender: "preparer", content: "Yes, all income should be reported regardless of amount. We'll include it on your Schedule C with your other freelance income.", time: "Mar 26" },
  ],
};

// Build conversation list from threads
const conversationList = Object.entries(threads).map(([clientId, msgs]) => {
  const client = clients.find(c => c.id === clientId);
  const lastMsg = msgs[msgs.length - 1];
  const unreadMsgs = msgs.filter(m => m.sender === "client");
  const lastContent = lastMsg.systemCard ? lastMsg.systemCard.title : lastMsg.content;
  return {
    clientId,
    client: client!,
    lastMessage: lastContent,
    lastTime: lastMsg.time,
    unread: clientId === "c2" || clientId === "c3" || clientId === "c11" || clientId === "c15",
    messages: msgs,
  };
}).sort((a, b) => (a.unread === b.unread ? 0 : a.unread ? -1 : 1));

export default function Page() {
  const [selectedId, setSelectedId] = useState(conversationList[0]?.clientId || "c2");
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");

  const selected = conversationList.find(c => c.clientId === selectedId);
  const thread = threads[selectedId] || [];

  const filtered = conversationList.filter(c =>
    c.client.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] w-full overflow-hidden rounded-xl border">
      {/* Conversation list */}
      <div className="w-[320px] shrink-0 border-r flex flex-col">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search conversations..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(convo => (
            <button
              key={convo.clientId}
              onClick={() => setSelectedId(convo.clientId)}
              className={`w-full flex items-start gap-3 p-3 text-left border-b transition-colors ${
                selectedId === convo.clientId ? "bg-muted/50" : "hover:bg-muted/30"
              }`}
            >
              <Avatar className="size-10 shrink-0 relative">
                <AvatarImage src={convo.client.avatar} alt={convo.client.fullName} />
                <AvatarFallback className="text-xs">{convo.client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm truncate ${convo.unread ? "font-semibold" : "font-medium"}`}>{convo.client.fullName}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{convo.lastTime}</span>
                </div>
                <p className={`text-xs truncate ${convo.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>{convo.lastMessage}</p>
              </div>
              {convo.unread && <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
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
              <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
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
                        {msg.systemCard.type === "documents" && <FileText className="size-3 text-primary" />}
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
                  <div className={`mt-1 text-[10px] ${isClient ? "text-muted-foreground" : "text-primary-foreground/60"}`}>{msg.time}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-3 border-t">
          <div className="flex items-center gap-2">
            <Input
              placeholder={selected ? `Message ${selected.client.fullName.split(" ")[0]}...` : "Select a conversation..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              className="h-10"
            />
            <Button size="icon"><Send className="size-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
