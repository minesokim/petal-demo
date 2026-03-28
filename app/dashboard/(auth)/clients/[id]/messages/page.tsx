"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { clients, messages } from "@/lib/mock-data";

const demoThread = [
  { id: "t1", sender: "client" as const, content: "Hi Antonio! I have my TikTok 1099 but I'm not sure how to upload it. Can you help?", time: "2:30 PM" },
  { id: "t2", sender: "preparer" as const, content: "Hey! The easiest way is to log into your portal and go to the Docs tab. There's an upload button right at the top. You can take a photo of the 1099 with your phone too - we'll extract the data automatically.", time: "2:45 PM" },
  { id: "t3", sender: "client" as const, content: "Oh perfect! I'll do that now. Also, do I need to report the $500 I made from a one-time sponsored post?", time: "2:52 PM" },
  { id: "t4", sender: "preparer" as const, content: "Yes, all income needs to be reported even if you don't receive a 1099 for it. We'll include it on your Schedule C. Just mention it when you upload your other docs and I'll make sure it's captured.", time: "3:10 PM" },
];

export default function ClientMessagesPage() {
  const params = useParams();
  const client = clients.find(c => c.id === params.id);
  const [input, setInput] = useState("");

  if (!client) return <div className="text-muted-foreground">Client not found</div>;

  const clientMessages = messages.filter(m => m.clientId === client.id);

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 320px)" }}>
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {(clientMessages.length > 0 ? demoThread : [{ id: "empty", sender: "preparer" as const, content: "No messages yet. Start a conversation.", time: "" }]).map(msg => (
          <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.sender === "client" ? "border bg-muted/50" : "bg-primary text-primary-foreground"
            }`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              {msg.time && <div className={`mt-1 text-[10px] ${msg.sender === "client" ? "text-muted-foreground" : "text-primary-foreground/60"}`}>{msg.time}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t pt-4">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
        <Button size="icon" className="shrink-0"><Send className="size-4" /></Button>
      </div>
    </div>
  );
}
