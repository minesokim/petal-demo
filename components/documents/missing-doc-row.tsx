"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send, Check } from "lucide-react";
import { type ChecklistItem } from "@/lib/documents-mock-data";
import { clients } from "@/lib/mock-data";

export function MissingDocRow({ item }: { item: ChecklistItem }) {
  const [reminded, setReminded] = useState(false);
  const client = clients.find(c => c.id === item.clientId);

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
      <Avatar className="size-8 shrink-0">
        {client && <img src={client.avatar} alt={client.fullName} className="size-full rounded-full object-cover" />}
        <AvatarFallback className="text-[10px]">
          {client?.fullName.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium">{item.label}</div>
        <div className="text-muted-foreground text-xs">
          {client?.fullName || "Unknown"} &middot; requested {item.daysSinceRequested} days ago
        </div>
      </div>
      {item.daysSinceRequested >= 5 && <span className="size-1.5 shrink-0 rounded-full bg-red-500" />}
      {item.daysSinceRequested >= 2 && item.daysSinceRequested < 5 && <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />}
      {reminded ? (
        <span className="flex items-center gap-1 text-xs text-emerald-600"><Check className="size-3" /> Sent</span>
      ) : (
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setReminded(true)}>
          <Send className="size-3" /> Remind
        </Button>
      )}
    </div>
  );
}
