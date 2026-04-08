"use client"

import * as React from "react"
import { Mail, MessageSquare, Globe, Edit2, Send, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DraftMessage, MessageChannel } from "@/lib/mock-data"

const channelConfig: Record<MessageChannel, {
  label: string
  icon: React.ElementType
  color: string
}> = {
  email: {
    label: "Email",
    icon: Mail,
    color: "text-blue-600 dark:text-blue-400",
  },
  sms: {
    label: "SMS",
    icon: MessageSquare,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  portal: {
    label: "Portal",
    icon: Globe,
    color: "text-purple-600 dark:text-purple-400",
  },
}

interface DraftMessageCardProps {
  draft: DraftMessage
  onSend?: (channel: MessageChannel) => void
  onEdit?: () => void
  onChangeChannel?: (channel: MessageChannel) => void
  className?: string
}

export function DraftMessageCard({
  draft,
  onSend,
  onEdit,
  onChangeChannel,
  className,
}: DraftMessageCardProps) {
  const [selectedChannel, setSelectedChannel] = React.useState<MessageChannel>(draft.channel)
  const config = channelConfig[selectedChannel]
  const Icon = config.icon

  const handleChannelChange = (channel: MessageChannel) => {
    setSelectedChannel(channel)
    onChangeChannel?.(channel)
  }

  return (
    <div
      data-slot="draft-message"
      className={cn(
        "bg-white dark:bg-card border border-border/60 rounded-lg p-3 space-y-2",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-3.5", config.color)} />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Draft {config.label}
          </span>
        </div>
        {draft.tone && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
            {draft.tone}
          </span>
        )}
      </div>

      {/* Subject line for email */}
      {selectedChannel === "email" && draft.subject && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">Subject:</span> {draft.subject}
        </div>
      )}

      {/* Message content */}
      <p className="text-sm text-foreground/80 leading-relaxed italic">
        "{draft.content}"
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="xs"
          onClick={() => onSend?.(selectedChannel)}
          className="gap-1"
        >
          <Send className="size-3" />
          Send as Antonio
        </Button>

        <Button
          variant="outline"
          size="xs"
          onClick={onEdit}
          className="gap-1"
        >
          <Edit2 className="size-3" />
          Edit
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="xs" className="gap-1">
              Change to
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.keys(channelConfig) as MessageChannel[])
              .filter((ch) => ch !== selectedChannel)
              .map((channel) => {
                const chConfig = channelConfig[channel]
                const ChIcon = chConfig.icon
                return (
                  <DropdownMenuItem
                    key={channel}
                    onClick={() => handleChannelChange(channel)}
                    className="gap-2"
                  >
                    <ChIcon className={cn("size-3.5", chConfig.color)} />
                    {chConfig.label}
                  </DropdownMenuItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// Inline draft preview - more compact version
interface InlineDraftProps {
  content: string
  channel: MessageChannel
  onExpand?: () => void
  className?: string
}

export function InlineDraftPreview({ content, channel, onExpand, className }: InlineDraftProps) {
  const config = channelConfig[channel]
  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={onExpand}
      className={cn(
        "w-full flex items-start gap-2 p-2 rounded-md text-left",
        "bg-white/50 dark:bg-card/50 border border-border/40",
        "hover:bg-white dark:hover:bg-card hover:border-border/60 transition-colors",
        className
      )}
    >
      <Icon className={cn("size-3.5 mt-0.5 shrink-0", config.color)} />
      <span className="text-xs text-muted-foreground italic line-clamp-2 flex-1">
        "{content}"
      </span>
    </button>
  )
}
