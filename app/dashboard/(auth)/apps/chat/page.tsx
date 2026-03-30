"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Search, Send, Phone, MoreHorizontal, FileText,
  Calendar, DollarSign, Clock, Bot, ChevronRight,
  Sparkles, X, Pen
} from "lucide-react";
import { clients, messages } from "@/lib/mock-data";
import { feedActions } from "@/lib/actions-mock-data";
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
    { id: "3", sender: "preparer", content: "No problem! We still need your W-2 and the $150 deposit to start. April 15 is coming up.", time: "Mar 22" },
    { id: "4", sender: "client", content: "Sorry I've been busy. Will try to get my W-2 uploaded this weekend.", time: "Mar 26" },
    { id: "5", sender: "system", content: "", time: "Mar 26", systemCard: { type: "payment", title: "Deposit Required", description: "$150 deposit required to begin preparing your return.", action: "Pay Now" } },
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
  // Clients with AI drafts but no prior conversation
  c7: [
    { id: "1", sender: "system", content: "New client. Intake form sent 2 days ago — no portal login yet.", time: "Mar 26" },
  ],
  c13: [
    { id: "1", sender: "system", content: "New client. 0 of 16 documents submitted. No portal login. Extension likely.", time: "Mar 20" },
  ],
  c17: [
    { id: "1", sender: "system", content: "Last activity 9 days ago. 2 of 5 documents submitted.", time: "Mar 19" },
  ],
};

// Build conversation list from threads
const conversationList = Object.entries(threads).map(([clientId, msgs]) => {
  const client = clients.find(c => c.id === clientId);
  if (!client) return null;
  const lastMsg = msgs[msgs.length - 1];
  const lastContent = lastMsg.systemCard ? lastMsg.systemCard.title : lastMsg.content;
  // Check if this client has a pending AI draft
  const hasDraft = feedActions.some(a => a.clientId === clientId && a.aiDraft && !a.isResolved);
  return {
    clientId,
    client,
    lastMessage: lastContent,
    lastTime: lastMsg.time,
    unread: clientId === "c2" || clientId === "c3" || clientId === "c11" || clientId === "c15",
    hasDraft,
    messages: msgs,
  };
}).filter(Boolean).sort((a, b) => {
  // Unread first, then drafts, then rest
  if (a!.unread !== b!.unread) return a!.unread ? -1 : 1;
  if (a!.hasDraft !== b!.hasDraft) return a!.hasDraft ? -1 : 1;
  return 0;
}) as NonNullable<typeof conversationList[0]>[];

export default function Page() {
  const [selectedId, setSelectedId] = useState(conversationList[0]?.clientId || "c2");
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [localThreads, setLocalThreads] = useState<Record<string, ChatMessage[]>>(threads);
  const [dismissedDrafts, setDismissedDrafts] = useState<Set<string>>(new Set());

  const selected = conversationList.find(c => c.clientId === selectedId);
  const thread = localThreads[selectedId] || [];

  // Find AI drafts for selected conversation
  const pendingDrafts = feedActions.filter(
    a => a.clientId === selectedId && a.aiDraft && !a.isResolved && !dismissedDrafts.has(a.id)
  );

  const filtered = conversationList.filter(c =>
    c.client.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sendDraft = (draft: string) => {
    const newMsg: ChatMessage = {
      id: `sent-${Date.now()}`,
      sender: "preparer",
      content: draft,
      time: "Just now",
    };
    setLocalThreads(prev => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), newMsg],
    }));
    // Dismiss all drafts for this client after sending
    pendingDrafts.forEach(d => setDismissedDrafts(prev => new Set([...prev, d.id])));
  };

  const editDraft = (draft: string) => {
    setInput(draft);
    // Dismiss the draft card since user is editing
    pendingDrafts.forEach(d => setDismissedDrafts(prev => new Set([...prev, d.id])));
  };

  const dismissDraft = (draftId: string) => {
    setDismissedDrafts(prev => new Set([...prev, draftId]));
  };

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
                {convo.hasDraft && !dismissedDrafts.has(feedActions.find(a => a.clientId === convo.clientId && a.aiDraft)?.id || "") && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Sparkles className="size-2.5 text-primary" />
                    <span className="text-[10px] text-primary font-medium">Draft ready</span>
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

        {/* AI Draft Suggestion */}
        {pendingDrafts.length > 0 && (
          <div className="px-3 pt-2">
            {pendingDrafts.slice(0, 1).map(draft => (
              <div key={draft.id} className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="text-[11px] font-semibold text-primary">Docket suggests</span>
                    <span className="text-[10px] text-muted-foreground">· {draft.title}</span>
                  </div>
                  <button onClick={() => dismissDraft(draft.id)} className="text-muted-foreground/50 hover:text-muted-foreground">
                    <X className="size-3.5" />
                  </button>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{draft.aiDraft}</p>
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" className="h-7 text-xs" onClick={() => sendDraft(draft.aiDraft!)}>
                    <Send className="size-3" /> Send as Antonio
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => editDraft(draft.aiDraft!)}>
                    <Pen className="size-3" /> Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t">
          <div className="flex items-center gap-2">
            <Input
              placeholder={selected ? `Message ${selected.client.fullName.split(" ")[0]}...` : "Select a conversation..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && input.trim()) {
                  sendDraft(input);
                  setInput("");
                }
              }}
              className="h-10"
            />
            <Button size="icon" onClick={() => { if (input.trim()) { sendDraft(input); setInput(""); } }}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
