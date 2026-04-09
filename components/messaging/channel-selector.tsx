"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, Mail, Smartphone } from "lucide-react";
import type { CommChannel } from "@/lib/comms-mock-data";

type ComposableChannel = Exclude<CommChannel, "voice">;

const channels: { value: ComposableChannel; icon: React.ElementType; label: string }[] = [
  { value: "portal", icon: MessageSquare, label: "Portal" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "sms", icon: Smartphone, label: "SMS" },
];

interface ChannelSelectorProps {
  value: ComposableChannel;
  onChange: (channel: ComposableChannel) => void;
  suggestSms?: boolean;
}

export function ChannelSelector({ value, onChange, suggestSms }: ChannelSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-0.5">
      {channels.map((ch) => {
        const Icon = ch.icon;
        const isActive = value === ch.value;

        return (
          <button
            key={ch.value}
            onClick={() => onChange(ch.value)}
            className={cn(
              "relative flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground/70"
            )}
          >
            <Icon className="size-3" />
            <span className="hidden sm:inline">{ch.label}</span>
            {ch.value === "sms" && suggestSms && !isActive && (
              <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
