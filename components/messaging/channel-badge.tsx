"use client";

import { cn } from "@/lib/utils";
import { Globe, Mail, Smartphone, PhoneCall, Video } from "lucide-react";
import type { CommChannel } from "@/lib/comms-mock-data";

const channelConfig: Record<CommChannel, { icon: React.ElementType; label: string; className: string }> = {
  portal: {
    icon: Globe,
    label: "Portal",
    className: "text-purple-600 dark:text-purple-400",
  },
  email: {
    icon: Mail,
    label: "Email",
    className: "text-blue-600 dark:text-blue-400",
  },
  sms: {
    icon: Smartphone,
    label: "SMS",
    className: "text-emerald-600 dark:text-emerald-400",
  },
  voice: {
    icon: PhoneCall,
    label: "Voice",
    className: "text-violet-600 dark:text-violet-400",
  },
  video: {
    icon: Video,
    label: "Video",
    className: "text-blue-600 dark:text-blue-400",
  },
};

interface ChannelBadgeProps {
  channel: CommChannel;
  className?: string;
}

export function ChannelBadge({ channel, className }: ChannelBadgeProps) {
  const config = channelConfig[channel];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted/60 px-1.5 py-0.5",
        className
      )}
    >
      <Icon className={cn("size-2.5", config.className)} />
      <span className={cn("text-[9px] font-medium leading-none", config.className)}>
        {config.label}
      </span>
    </span>
  );
}
