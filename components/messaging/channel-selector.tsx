"use client";

import { cn } from "@/lib/utils";
import { Globe, Mail, Smartphone } from "lucide-react";
import type { CommChannel } from "@/lib/comms-mock-data";

type ComposableChannel = Exclude<CommChannel, "voice">;

const channels: { value: ComposableChannel; icon: React.ElementType; label: string; color: string }[] = [
  { value: "portal", icon: Globe, label: "Portal", color: "text-purple-600 dark:text-purple-400" },
  { value: "email", icon: Mail, label: "Email", color: "text-blue-600 dark:text-blue-400" },
  { value: "sms", icon: Smartphone, label: "SMS", color: "text-emerald-600 dark:text-emerald-400" },
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
            <Icon className={cn("size-3", isActive ? ch.color : "")} />
            <span>{ch.label}</span>
            {ch.value === "sms" && suggestSms && !isActive && (
              <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-amber-500" />
            )}
          </button>
        );
      })}
    </div>
  );
}
