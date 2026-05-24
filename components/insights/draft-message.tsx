"use client"

import * as React from "react"
import { Mail, Smartphone, Globe, Edit2, Send, ChevronDown, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DraftMessage, MessageChannel, Client } from "@/lib/mock-data"

const PREPARER = {
  name: "Antonio Vazquez",
  email: "antonio@vazantconsulting.com",
  avatar: "/images/avatars/antonio.jpg",
}

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
    icon: Smartphone,
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

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

interface DraftMessageCardProps {
  draft: DraftMessage
  client?: Client
  onSend?: (channel: MessageChannel) => void
  onEdit?: () => void
  onChangeChannel?: (channel: MessageChannel) => void
  className?: string
}

export function DraftMessageCard({
  draft,
  client,
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

  // Email channel renders as an Apple-Mail-style draft card
  if (selectedChannel === "email") {
    return (
      <article
        data-slot="draft-message"
        className={cn("overflow-hidden rounded-xl border border-border/60 bg-card", className)}
      >
        {/* Header — preparer block + DRAFT pill */}
        <header className="flex items-start gap-3 px-5 pt-4 pb-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={PREPARER.avatar} alt={PREPARER.name} />
            <AvatarFallback className="text-[10px]">{getInitials(PREPARER.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[14px] font-semibold text-foreground">{PREPARER.name}</span>
                <span className="truncate text-[12px] text-muted-foreground/70">&lt;{PREPARER.email}&gt;</span>
              </div>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Draft
              </span>
            </div>
            <div className="mt-0.5 text-[12px] text-muted-foreground/80">
              to {client?.fullName ?? "client"}
              {client?.email && <span className="text-muted-foreground/50"> &lt;{client.email}&gt;</span>}
            </div>
          </div>
        </header>

        {/* Subject */}
        {draft.subject && (
          <div className="px-5 pb-3">
            <h3 className="text-[15px] font-semibold leading-snug text-foreground">{draft.subject}</h3>
          </div>
        )}

        {/* Body */}
        <div className="px-5 pb-4">
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
                  <div className="text-[11px] text-muted-foreground">Delivered via Email</div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="content" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <p className="whitespace-pre-wrap text-[13.5px] leading-[1.65] text-foreground/85">{draft.content}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {sendState !== "sent" && (
          <footer className="flex items-center gap-2 border-t border-border/40 px-3 py-2">
            <Button
              size="sm"
              className="h-8 gap-1.5 px-3 text-[12px]"
              onClick={handleSend}
              disabled={sendState === "sending"}
            >
              {sendState === "sending" ? (
                <><Loader2 className="size-3.5 animate-spin" /> Sending…</>
              ) : (
                <><Send className="size-3.5" /> Send via Email</>
              )}
            </Button>
            {sendState === "idle" && (
              <>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 text-[12px] text-muted-foreground" onClick={onEdit}>
                  <Edit2 className="size-3.5" /> Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto h-8 gap-1.5 px-3 text-[12px] text-muted-foreground">
                      <Icon className={cn("size-3.5", config.color)} /> via {config.label}
                      <ChevronDown className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[120px]">
                    {(Object.keys(channelConfig) as MessageChannel[])
                      .filter(ch => ch !== selectedChannel)
                      .map(ch => {
                        const meta = channelConfig[ch]
                        const ChIcon = meta.icon
                        return (
                          <DropdownMenuItem key={ch} onClick={() => handleChannelChange(ch)} className="gap-2 text-xs">
                            <ChIcon className={cn("size-3.5", meta.color)} />
                            {meta.label}
                          </DropdownMenuItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </footer>
        )}
      </article>
    )
  }

  // Portal / SMS — compact preview card (kept close to existing pattern but flatter)
  return (
    <div
      data-slot="draft-message"
      className={cn("overflow-hidden rounded-xl border border-border/60 bg-card", className)}
    >
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-3.5", config.color)} />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Draft {config.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {draft.tone && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium capitalize text-foreground/60">
              {draft.tone}
            </span>
          )}
          {sendState === "idle" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 transition-colors hover:text-foreground">
                  Change <ChevronDown className="size-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(channelConfig) as MessageChannel[])
                  .filter(ch => ch !== selectedChannel)
                  .map(ch => {
                    const meta = channelConfig[ch]
                    const ChIcon = meta.icon
                    return (
                      <DropdownMenuItem key={ch} onClick={() => handleChannelChange(ch)} className="gap-2 text-xs">
                        <ChIcon className={cn("size-3.5", meta.color)} />
                        {meta.label}
                      </DropdownMenuItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="border-t border-border/40 px-4 py-3">
        <AnimatePresence mode="wait">
          {sendState === "sent" ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 py-1"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
                className="flex size-7 items-center justify-center rounded-full bg-emerald-500"
              >
                <Check className="size-3.5 text-white" />
              </motion.div>
              <div>
                <div className="text-[13px] font-semibold">Message sent</div>
                <div className="text-[10px] text-muted-foreground">Delivered via {config.label}</div>
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="content"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[13px] leading-[1.65] text-foreground/85"
            >
              {draft.content}
            </motion.p>
          )}
        </AnimatePresence>

        {sendState !== "sent" && (
          <div className="mt-3 flex items-center gap-2 border-t border-border/30 pt-2.5">
            <Button size="sm" className="h-7 gap-1.5 px-3 text-[11px]" onClick={handleSend} disabled={sendState === "sending"}>
              {sendState === "sending" ? (
                <><Loader2 className="size-3 animate-spin" /> Sending…</>
              ) : (
                <><Send className="size-3" /> Send via {config.label}</>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-3 text-[11px] text-muted-foreground" onClick={onEdit}>
              <Edit2 className="size-3" /> Edit
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Inline draft preview - compact one-liner
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
