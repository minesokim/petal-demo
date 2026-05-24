"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Pen, X, Check, Loader2, Globe, Mail, Smartphone, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import type { FeedAction } from "@/lib/actions-mock-data";

type DraftChannel = "portal" | "email" | "sms";

const channelConfig: Record<DraftChannel, { label: string; icon: React.ElementType; color: string }> = {
  portal: { label: "Portal", icon: Globe, color: "text-purple-600 dark:text-purple-400" },
  email: { label: "Email", icon: Mail, color: "text-blue-600 dark:text-blue-400" },
  sms: { label: "SMS", icon: Smartphone, color: "text-emerald-600 dark:text-emerald-400" },
};

interface AIDraftCardProps {
  draft: FeedAction;
  onSend: (text: string, channel: DraftChannel) => void;
  onEdit: (text: string) => void;
  onDismiss: () => void;
}

/**
 * Two-tier AI draft card.
 *
 * Compact (default, ~52px): pill row with sparkle icon, "Suggested reply"
 * label, single-line preview text, channel pill, Send, Expand, Dismiss.
 * One-click send is always available — users who trust the AI never need
 * to expand. One-click expand reveals the full draft + Edit + channel
 * picker for users who want to review or modify before sending.
 *
 * Pattern: borrowed from Front / Help Scout / Linear AI — proactive AI
 * suggestions live as a thin strip above the composer so the message
 * thread remains visible.
 */
export function AIDraftCard({ draft, onSend, onEdit, onDismiss }: AIDraftCardProps) {
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  const [channel, setChannel] = useState<DraftChannel>("portal");
  const [expanded, setExpanded] = useState(false);

  if (!draft.aiDraft) return null;

  const channelMeta = channelConfig[channel];
  const ChannelIcon = channelMeta.icon;

  const handleSend = () => {
    setSendState("sending");
    setTimeout(() => {
      setSendState("sent");
      onSend(draft.aiDraft!, channel);
    }, 1200);
  };

  // ─── Sent state — same in both compact + expanded ───
  if (sendState === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/15 px-3 py-2"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500"
        >
          <Check className="size-3 text-white" />
        </motion.div>
        <div className="text-xs font-medium">Message sent</div>
        <div className="text-[10px] text-muted-foreground">Delivered via {channelMeta.label}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-xl border border-border/60 bg-muted/30"
    >
      {/* HEADER ROW — always rendered, identical in both modes */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06]">
          <PetalMark className="size-3 text-foreground/55" />
        </div>

        {/* Label + (when collapsed) inline preview */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">Suggested reply</span>
          {!expanded && (
            <>
              <span className="shrink-0 text-muted-foreground/30">·</span>
              <span className="truncate text-[12px] text-foreground/70">{draft.aiDraft}</span>
            </>
          )}
        </button>

        {/* Channel pill — clickable to swap */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground">
              <ChannelIcon className={cn("size-3", channelMeta.color)} />
              <span className="hidden sm:inline">{channelMeta.label}</span>
              <ChevronDown className="size-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            {(Object.keys(channelConfig) as DraftChannel[])
              .filter((ch) => ch !== channel)
              .map((ch) => {
                const meta = channelConfig[ch];
                const Icon = meta.icon;
                return (
                  <DropdownMenuItem key={ch} onClick={() => setChannel(ch)} className="gap-2 text-xs">
                    <Icon className={cn("size-3.5", meta.color)} />
                    {meta.label}
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Send — primary one-click action */}
        <Button
          size="sm"
          className="h-7 shrink-0 gap-1 px-2.5 text-[11px]"
          disabled={sendState === "sending"}
          onClick={handleSend}
        >
          {sendState === "sending" ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Send className="size-3" />
          )}
          <span className="hidden sm:inline">Send</span>
        </Button>

        {/* Dismiss — close X now comes first (inner), expand chevron is rightmost */}
        <button
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-muted hover:text-muted-foreground"
          aria-label="Dismiss draft"
        >
          <X className="size-3.5" />
        </button>

        {/* Expand chevron — now rightmost */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
          aria-label={expanded ? "Collapse draft" : "Expand draft"}
        >
          <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {/* EXPANDED BODY — full draft + Edit affordance */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 px-3 pt-2.5 pb-3">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
                {draft.aiDraft}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  onClick={() => onEdit(draft.aiDraft!)}
                >
                  <Pen className="size-3" /> Edit before sending
                </Button>
                {draft.title && (
                  <span className="ml-auto text-[10px] text-muted-foreground/50">{draft.title}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
