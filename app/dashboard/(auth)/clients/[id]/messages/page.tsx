"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Send, FileText, Calendar, DollarSign, Clock, Bot, ChevronRight } from "lucide-react";
import { clients } from "@/lib/mock-data";

// Per-client message threads with system cards
type ChatMessage = {
  id: string;
  sender: "client" | "preparer" | "system";
  content: string;
  time: string;
  systemCard?: {
    type: string;
    title: string;
    description: string;
    action?: string;
  };
};

const clientThreads: Record<string, ChatMessage[]> = {
  c2: [ // Priya Sharma
    { id: "m1", sender: "client", content: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it. Can you help?", time: "2:30 PM" },
    { id: "m3", sender: "preparer", content: "Hey Priya! The easiest way is to log into your portal and go to the Docs tab. There's an upload button right at the top. You can take a photo of the 1099 with your phone too - we'll extract the data automatically.", time: "2:45 PM" },
    { id: "m4", sender: "client", content: "Oh perfect! I'll do that now. Also, do I need to report the $500 I made from a one-time sponsored post?", time: "2:52 PM" },
    { id: "m5", sender: "preparer", content: "Yes, all income needs to be reported even if you don't receive a 1099 for it. We'll include it on your Schedule C. Just mention it when you upload your other docs and I'll make sure it's captured.", time: "3:10 PM" },
    { id: "m6", sender: "client", content: "When will my return be ready?", time: "3:15 PM" },
    { id: "m7", sender: "system", content: "", time: "3:15 PM", systemCard: { type: "status", title: "Return Status", description: "Your return is in the document collection phase. 3 of 7 documents received. Once complete, preparation takes 3-5 business days.", action: "View Status" } },
    { id: "m7n", sender: "system", content: "Antonio will follow up personally.", time: "3:15 PM" },
    { id: "m8", sender: "client", content: "Thanks Antonio!", time: "3:20 PM" },
  ],
  c4: [ // DeShawn Williams
    { id: "m1", sender: "preparer", content: "Hi DeShawn! Welcome to Vazant Consulting. I've sent your intake form. Just follow the link to get started.", time: "Mar 18" },
    { id: "m2", sender: "client", content: "Thanks! I'll try to get to it this weekend. Been really busy with work.", time: "Mar 20" },
    { id: "m3", sender: "preparer", content: "No problem at all! Just a heads up - we still need your W-2 and the $50 deposit to start your return. The April 15 deadline is coming up.", time: "Mar 22" },
    { id: "m4", sender: "client", content: "Sorry I've been busy. Will try to get my W-2 uploaded this weekend.", time: "Mar 26" },
    { id: "m5", sender: "system", content: "", time: "Mar 26", systemCard: { type: "payment", title: "Deposit Required", description: "A $50 deposit is required to begin preparing your return. You can pay securely through your portal.", action: "Pay Now" } },
  ],
  c3: [ // Rodriguez
    { id: "m1", sender: "client", content: "Hi Antonio, just wanted to check in. Are our returns done?", time: "Mar 25" },
    { id: "m2", sender: "preparer", content: "Hi James! Yes, your returns are complete and reviewed. I just need you and Sofia to sign Form 8879 to authorize e-filing. I'll send it over now.", time: "Mar 26" },
    { id: "m3", sender: "client", content: "Great! We're ready to sign whenever you are!", time: "Mar 28, 7:45 AM" },
    { id: "m4", sender: "system", content: "", time: "Mar 28", systemCard: { type: "signature", title: "E-Signature Ready", description: "Form 8879 is ready for your signature. Both James and Sofia need to sign.", action: "Sign Now" } },
  ],
  c11: [ // David Park
    { id: "m1", sender: "preparer", content: "David, your S-Corp return is coming along. I have a few questions about the payroll summary and the new equipment. Can we schedule a call?", time: "Mar 25" },
    { id: "m2", sender: "client", content: "Sure! How about Thursday at 2pm?", time: "Mar 26" },
    { id: "m3", sender: "preparer", content: "Thursday at 2pm works. I'll send over a Google Meet link.", time: "Mar 26" },
    { id: "m4", sender: "client", content: "Can we push the call to 3pm instead of 2? Got a patient emergency.", time: "Mar 28, 8:15 AM" },
    { id: "m5", sender: "preparer", content: "Of course, no problem. I've moved it to 3pm. Hope everything is okay!", time: "Mar 28, 8:30 AM" },
  ],
  c15: [ // Mendez
    { id: "m1", sender: "client", content: "Elena wants to know if we can deduct the new paint booth equipment we bought in December.", time: "Mar 27" },
    { id: "m2", sender: "preparer", content: "Great question! Yes, the paint booth likely qualifies for Section 179 immediate expensing. That's a full deduction in 2025 instead of depreciating over 7 years. How much was it?", time: "Mar 27" },
    { id: "m3", sender: "client", content: "It was about $32,000. That would be a big deduction!", time: "Mar 27" },
    { id: "m4", sender: "preparer", content: "That's a significant deduction. I'll include it as Section 179 on your return. Should save you roughly $8,200 in taxes. I'll have the numbers ready for our review on Monday.", time: "Mar 27" },
  ],
};

const defaultThread: ChatMessage[] = [
  { id: "d1", sender: "preparer", content: "No messages yet. This conversation will appear once the client sends their first message or you reach out to them.", time: "" },
];

export default function ClientMessagesPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  const [input, setInput] = useState("");

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const thread = clientThreads[client.id] || defaultThread;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 320px)" }}>
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {thread.map(msg => {
          // System card (Lane 1 auto-response)
          if (msg.sender === "system" && msg.systemCard) {
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="ml-9 max-w-[320px] rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-2">
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

          // System note (italic note after auto-response)
          if (msg.sender === "system" && !msg.systemCard) {
            return (
              <div key={msg.id} className="text-center">
                <span className="text-[11px] text-muted-foreground italic">{msg.content}</span>
              </div>
            );
          }

          // Regular message
          const isClient = msg.sender === "client";
          return (
            <div key={msg.id} className={`flex ${isClient ? "justify-start" : "justify-end"}`}>
              {isClient && (
                <Avatar className="mr-2 size-7 shrink-0 mt-1">
                  <AvatarImage src={client.avatar} alt={client.fullName} />
                  <AvatarFallback className="text-[9px]">{client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                isClient ? "border bg-muted/50" : "bg-primary text-primary-foreground"
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.time && <div className={`mt-1 text-[10px] ${isClient ? "text-muted-foreground" : "text-primary-foreground/60"}`}>{msg.time}</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t pt-4">
        <input
          type="text"
          placeholder={`Message ${client.fullName.split(" ")[0]}...`}
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <Button size="icon" className="shrink-0"><Send className="size-4" /></Button>
      </div>
    </div>
  );
}
