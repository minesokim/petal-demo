"use client"

import * as React from "react"
import { Mail, Smartphone, Globe, Edit2, ChevronDown, Check, Loader2 } from "lucide-react"
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
import { useSessionSafe } from "@/lib/session-context"

const channelConfig: Record<MessageChannel, {
  label: string
  icon: React.ElementType
  color: string
  bgColor: string
  bubbleBg: string
  bubbleText: string
}> = {
  email: {
    label: "Email",
    icon: Mail,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    bubbleBg: "bg-blue-500",
    bubbleText: "text-white",
  },
  sms: {
    // Solid emerald bubble + white text - the iMessage / WhatsApp "outbound
    // bubble" pattern. Brought down from emerald-600 to emerald-500 per
    // feedback that 600 read too dark.
    label: "SMS",
    icon: Smartphone,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    bubbleBg: "bg-emerald-500",
    bubbleText: "text-white",
  },
  portal: {
    // Portal - pastel tan bubble (exact #F1E7DA via inline style). Icon
    // uses text-amber-700 (warm sepia/brown) so the channel has its own
    // color identity in the system alongside email-blue and SMS-emerald,
    // and stays in the same kraft-letterhead color family as the bubble
    // instead of reading as black.
    label: "Portal",
    icon: Globe,
    color: "text-amber-700 dark:text-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/20",
    bubbleBg: "", // applied via inline style; see bubble JSX
    bubbleText: "text-stone-700 dark:text-stone-200",
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
  /** Hide the card's built-in action footer when the parent owns the action
   *  row (e.g., the triage detail panel surfaces Send/Edit/Snooze/Resolve
   *  as one unified row below the card). Default false. */
  hideFooter?: boolean
}

export function DraftMessageCard({
  draft,
  client,
  onSend,
  onEdit,
  onChangeChannel,
  className,
  hideFooter = false,
}: DraftMessageCardProps) {
  const [selectedChannel, setSelectedChannel] = React.useState<MessageChannel>(draft.channel)
  const [sendState, setSendState] = React.useState<"idle" | "sending" | "sent">("idle")
  // Inline edit mode - clicking the Edit button swaps the body for a
  // textarea so the preparer can tweak the draft in-place before sending.
  // Saved edits live in component-local state (this is a mockup); a real
  // backend would persist to the draft record.
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedContent, setEditedContent] = React.useState(draft.content)
  const config = channelConfig[selectedChannel]
  const Icon = config.icon

  // The "From" identity on every draft = the active firm member. Petal
  // composes the body but the human sender is who owns sending it.
  // useSessionSafe handles components rendered outside the provider (e.g.,
  // isolated previews) by returning the firm owner as a safe default.
  const { user: preparer } = useSessionSafe()
  const PREPARER = {
    name: preparer.fullName,
    email: preparer.email,
    avatar: preparer.avatar,
  }

  // Reset edit state when the underlying draft changes (issue navigation).
  React.useEffect(() => {
    setEditedContent(draft.content)
    setIsEditing(false)
  }, [draft.id, draft.content])

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

  const handleEditClick = () => {
    setIsEditing(true)
    onEdit?.()
  }

  const handleSaveEdit = () => {
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedContent(draft.content)
    setIsEditing(false)
  }

  // Convenience - the body text that should render (edited vs original).
  const bodyContent = editedContent

  // Email channel renders as an Apple-Mail-style draft card
  if (selectedChannel === "email") {
    return (
      <article
        data-slot="draft-message"
        className={cn("overflow-hidden rounded-lg border border-border/60 bg-card", className)}
      >
        {/* Header - preparer block + DRAFT pill */}
        <header className="flex items-start gap-3 px-4 pt-3.5 pb-2.5">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={PREPARER.avatar} alt={PREPARER.name} />
            <AvatarFallback className="text-[10px]">{getInitials(PREPARER.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="truncate text-[13px] font-semibold text-foreground">{PREPARER.name}</span>
                <span className="truncate text-[11px] text-muted-foreground/70">&lt;{PREPARER.email}&gt;</span>
              </div>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                Draft
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground/80">
              to {client?.fullName ?? "client"}
              {client?.email && <span className="text-muted-foreground/50"> &lt;{client.email}&gt;</span>}
            </div>
          </div>
        </header>

        {/* Subject */}
        {draft.subject && (
          <div className="px-4 pb-2.5">
            <h3 className="text-[13.5px] font-semibold leading-snug text-foreground">{draft.subject}</h3>
          </div>
        )}

        {/* Body */}
        <div className="px-4 pb-4">
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
                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full resize-none rounded-md border border-foreground/15 bg-background px-3 py-2 text-[12.5px] leading-[1.6] text-foreground outline-none focus:border-foreground/35"
                    rows={Math.max(4, editedContent.split("\n").length)}
                    autoFocus
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-[12.5px] leading-[1.6] text-foreground/85">{bodyContent}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - built-in action bar. Hidden when parent owns actions
            (hideFooter=true), as in the triage detail panel. */}
        {sendState !== "sent" && !hideFooter && (
          <footer className="flex items-center gap-2 border-t border-border/40 px-3 py-2">
            {isEditing ? (
              <>
                <Button size="sm" className="h-8 gap-1.5 px-3 text-[12px]" onClick={handleSaveEdit}>
                  <Check className="size-3.5" /> Save changes
                </Button>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 text-[12px] text-muted-foreground" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className="h-8 gap-1.5 px-3 text-[12px]"
                  onClick={handleSend}
                  disabled={sendState === "sending"}
                >
                  {sendState === "sending" ? (
                    <><Loader2 className="size-3.5 animate-spin" /> Sending…</>
                  ) : (
                    <><Mail className="size-3.5" /> Send via Email</>
                  )}
                </Button>
                {sendState === "idle" && (
                  <>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 text-[12px] text-muted-foreground" onClick={handleEditClick}>
                      <Edit2 className="size-3.5" /> Edit
                    </Button>
                    <ChannelSwitcher
                      selectedChannel={selectedChannel}
                      onChange={handleChannelChange}
                    />
                  </>
                )}
              </>
            )}
          </footer>
        )}
      </article>
    )
  }

  // SMS + Portal - both render as chat-bubble drafts with the same layout.
  // Only the channel-meta (icon, label, recipient framing, color) differs.
  // Keeps the two channels visually consistent (chat-bubble = messaging-ish)
  // while still distinguishable by accent color and recipient framing.
  const isSms = selectedChannel === "sms"
  const recipientLine = isSms
    ? (
        <>
          to {client?.fullName ?? "client"}
          {client?.phone && <span className="text-muted-foreground/60"> · {client.phone}</span>}
        </>
      )
    : (<>posts to {client?.fullName ?? "client"}&apos;s portal inbox</>)

  const sentLabel = isSms ? "Message sent" : "Posted to portal"
  const sentSubLabel = isSms ? "Delivered via SMS" : `${client?.fullName ?? "Client"} gets a push notification`
  const sendVerb = isSms ? "Send via SMS" : "Post to portal"

  // SMS char-count meter - portal doesn't have a length limit so this only
  // renders for SMS.
  const charCount = bodyContent.length
  const overLimit = isSms && charCount > 160

  return (
    <article
      data-slot="draft-message"
      className={cn("overflow-hidden rounded-lg border border-border/60 bg-card", className)}
    >
      {/* Header - channel + recipient framing */}
      <header className="flex items-center justify-between gap-3 border-b border-border/40 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn("size-3.5 shrink-0", config.color)} />
          <span className="text-[12px] font-medium text-foreground/85">{config.label}</span>
          <span className="text-foreground/30">·</span>
          <span className="truncate text-[12px] text-muted-foreground">{recipientLine}</span>
        </div>
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Draft
        </span>
      </header>

      {/* Body - chat bubble (channel-tinted via config.bubbleBg) */}
      <div className="px-4 py-3.5">
        <AnimatePresence mode="wait">
          {sendState === "sent" ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
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
                <div className="text-[13px] font-semibold">{sentLabel}</div>
                <div className="text-[10px] text-muted-foreground">{sentSubLabel}</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="content" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {isEditing ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full resize-none rounded-2xl rounded-tr-md border border-foreground/15 bg-background px-3.5 py-2.5 text-[12.5px] leading-[1.5] text-foreground outline-none focus:border-foreground/35"
                  rows={Math.max(3, editedContent.split("\n").length)}
                  autoFocus
                />
              ) : (
                <div className="flex justify-end">
                  <p
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md px-3.5 py-2.5 text-[12.5px] leading-[1.5]",
                      config.bubbleBg,
                      config.bubbleText
                    )}
                    // Portal uses an inline style to guarantee the exact
                    // pastel tan renders regardless of Tailwind JIT behavior
                    // on arbitrary values inside config objects. Lightened
                    // 60% from the original #DDC3A2 (mixed 60% white) →
                    // #F1E7DA: a soft cream-tan that reads as "kraft paper"
                    // without the saturation.
                    style={selectedChannel === "portal" ? { backgroundColor: "#F1E7DA" } : undefined}
                  >
                    {bodyContent}
                  </p>
                </div>
              )}
              {isSms && !isEditing && (
                <div className="mt-1.5 flex justify-end text-[10px] text-muted-foreground/70">
                  <span className={cn("tabular-nums", overLimit && "text-amber-600 dark:text-amber-500")}>
                    {charCount} / 160 {overLimit && "· 2 segments"}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer - same Send/Edit/channel pattern as the email branch */}
      {sendState !== "sent" && !hideFooter && (
        <footer className="flex items-center gap-2 border-t border-border/40 px-3 py-2">
          {isEditing ? (
            <>
              <Button size="sm" className="h-8 gap-1.5 px-3 text-[12px]" onClick={handleSaveEdit}>
                <Check className="size-3.5" /> Save changes
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 text-[12px] text-muted-foreground" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" className="h-8 gap-1.5 bg-zinc-800 px-3 text-[12px] text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-100" onClick={handleSend} disabled={sendState === "sending"}>
                {sendState === "sending" ? (
                  <><Loader2 className="size-3.5 animate-spin" /> Sending…</>
                ) : (
                  <><Icon className="size-3.5" /> {sendVerb}</>
                )}
              </Button>
              {sendState === "idle" && (
                <>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-3 text-[12px] text-muted-foreground" onClick={handleEditClick}>
                    <Edit2 className="size-3.5" /> Edit
                  </Button>
                  <ChannelSwitcher
                    selectedChannel={selectedChannel}
                    onChange={handleChannelChange}
                  />
                </>
              )}
            </>
          )}
        </footer>
      )}
    </article>
  )
}

// Shared channel switcher dropdown - used by all three branches so the
// switcher chrome (icon + "via {channel}" + chevron) is identical across
// email / SMS / portal cards. Always right-aligned via ml-auto.
function ChannelSwitcher({
  selectedChannel,
  onChange,
}: {
  selectedChannel: MessageChannel
  onChange: (channel: MessageChannel) => void
}) {
  const current = channelConfig[selectedChannel]
  const CurrentIcon = current.icon
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="ml-auto h-8 gap-1.5 px-3 text-[12px] text-muted-foreground">
          <CurrentIcon className={cn("size-3.5", current.color)} /> via {current.label}
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
              <DropdownMenuItem key={ch} onClick={() => onChange(ch)} className="gap-2 text-xs">
                <ChIcon className={cn("size-3.5", meta.color)} />
                {meta.label}
              </DropdownMenuItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
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
