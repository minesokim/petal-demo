"use client"

import * as React from "react"
import { Mail, MessageSquare, Globe, Edit2, Send, ChevronDown, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"
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
  bgColor: string
}> = {
  email: {
    label: "Email",
    icon: Mail,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  sms: {
    label: "SMS",
    icon: MessageSquare,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  portal: {
    label: "Portal",
    icon: Globe,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
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
  const [sendState, setSendState] = React.useState<"idle" | "sending" | "sent">("idle")
  const config = channelConfig[selectedChannel]
  const Icon = config.icon

  const handleChannelChange = (channel: MessageChannel) => {
    setSelectedChannel(channel)
    onChangeChannel?.(channel)
  }

  const handleSend = () => {
    setSendState("sending")
    setTimeout(() => {
      setSendState("sent")
      onSend?.(selectedChannel)
    }, 1200)
  }

  return (
    <div
      data-slot="draft-message"
      className={cn(
        "rounded-xl border border-border/30 overflow-hidden",
        className
      )}
    >
      {/* Header bar */}
      <div className={cn("px-5 py-2.5 flex items-center justify-between", config.bgColor)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("size-3.5", config.color)} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground/60">
            Draft {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {draft.tone && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-background/60 text-foreground/50 capitalize font-medium">
              {draft.tone}
            </span>
          )}
          {sendState === "idle" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[10px] text-foreground/40 hover:text-foreground/60 transition-colors flex items-center gap-0.5">
                  Change
                  <ChevronDown className="size-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 bg-card">
        {/* Subject for email */}
        {selectedChannel === "email" && draft.subject && (
          <div className="text-[12px] text-foreground/50 mb-2">
            <span className="font-medium text-foreground/70">Subject:</span> {draft.subject}
          </div>
        )}

        {/* Message content */}
        <AnimatePresence mode="wait">
          {sendState === "sent" ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 py-2"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                className="flex size-8 items-center justify-center rounded-full bg-emerald-500"
              >
                <Check className="size-4 text-white" />
              </motion.div>
              <div>
                <div className="text-[14px] font-semibold">Message sent</div>
                <div className="text-[11px] text-foreground/50">Delivered via {config.label}</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="content" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <p className="text-[13.5px] text-foreground/75 leading-[1.7] italic">
                &ldquo;{draft.content}&rdquo;
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        {sendState !== "sent" && (
          <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-border/20">
            <Button
              size="sm"
              className="h-8 text-xs px-4 gap-1.5 transition-all duration-300"
              onClick={handleSend}
              disabled={sendState === "sending"}
            >
              <AnimatePresence mode="wait">
                {sendState === "sending" ? (
                  <motion.span
                    key="sending"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5"
                  >
                    <Loader2 className="size-3 animate-spin" />
                    Sending...
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1.5"
                  >
                    <Send className="size-3" />
                    Send as Antonio
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            {sendState === "idle" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-4 gap-1.5"
                onClick={onEdit}
              >
                <Edit2 className="size-3" />
                Edit
              </Button>
            )}
          </div>
        )}
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
        &ldquo;{content}&rdquo;
      </span>
    </button>
  )
}
