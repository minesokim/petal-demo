"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, Reply, ReplyAll, Forward } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AttachmentCard } from "./attachment-card";
import { useToast } from "@/components/ui/toast-notification";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { UnifiedMessage } from "@/lib/comms-mock-data";
import type { Client } from "@/lib/mock-data";
import { useSessionSafe } from "@/lib/session-context";

interface EmailMessageProps {
  message: UnifiedMessage;
  client: Client;
  /** Compact mode = tighter padding + ~10-15% smaller text. Used in the popup
      where vertical space is at a premium vs. the full-page messages view. */
  compact?: boolean;
}

function formatEmailDate(timestamp: string) {
  const d = parseISO(timestamp);
  const time = format(d, "h:mm a");
  if (isToday(d)) return `Today at ${time}`;
  if (isYesterday(d)) return `Yesterday at ${time}`;
  return `${format(d, "MMM d")} at ${time}`;
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function EmailMessage({ message, client, compact = false }: EmailMessageProps) {
  const [recipientsExpanded, setRecipientsExpanded] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);
  const { showToast } = useToast();

  // Outbound sender = the active firm member; fall back to the owner if this
  // component renders outside the session provider (isolated previews/tests).
  const { user: sessionUser } = useSessionSafe();
  const PREPARER = {
    name: sessionUser.fullName,
    email: sessionUser.email,
    avatar: sessionUser.avatar,
  };

  // Compact-mode size tokens — pulled out so the JSX stays readable.
  const sz = {
    avatar: compact ? "size-7" : "size-9",
    headerPad: compact ? "px-3.5 pt-3 pb-2" : "px-5 pt-4 pb-3",
    senderName: compact ? "text-[13px]" : "text-[14px]",
    senderEmail: compact ? "text-[11px]" : "text-[12px]",
    timestamp: compact ? "text-[10px]" : "text-[11px]",
    recipient: compact ? "text-[11px]" : "text-[12px]",
    subjectPad: compact ? "px-3.5 pb-2" : "px-5 pb-3",
    subjectText: compact ? "text-[13.5px]" : "text-[15px]",
    bodyPad: compact ? "px-3.5 pb-3" : "px-5 pb-4",
    bodyText: compact ? "text-[12.5px] leading-[1.55]" : "text-[13.5px] leading-[1.65]",
    attachPad: compact ? "px-3.5 py-2.5" : "px-5 py-3",
    footerPad: compact ? "px-2 py-1.5" : "px-3 py-2",
    actionIcon: compact ? "size-3" : "size-3.5",
    actionText: compact ? "text-[11px] px-2.5 py-1" : "text-[12px] px-3 py-1.5",
  };

  const isInbound = message.sender === "client";
  const sender = isInbound
    ? { name: client.fullName, email: client.email, avatar: client.avatar }
    : PREPARER;
  const recipientLabel = isInbound
    ? `to ${PREPARER.name.split(" ")[0]}`
    : `to ${client.fullName.split(" ")[0]}`;
  const recipientFull = isInbound ? PREPARER.email : client.email;

  const isLong = message.content.length > 320;
  const displayContent = !isLong || bodyExpanded
    ? message.content
    : message.content.slice(0, 320).trimEnd() + "…";

  const allAttachments = [...(message.emailAttachments || []), ...(message.attachments || [])];

  return (
    <article
      className={cn(
        "rounded-xl border transition-shadow hover:shadow-sm",
        // Sender direction conveyed by bg + "You" label only — no decorative
        // left-border accent. Inbound = white card (attention), outbound =
        // muted card (recedes). The labels do the rest.
        isInbound
          ? "border-border/60 bg-card"
          : "border-border/40 bg-muted/30"
      )}
      onClick={e => e.stopPropagation()}
    >
      {/* Header row — sender block + timestamp */}
      <header className={`flex items-start gap-3 ${sz.headerPad}`}>
        <Avatar className={`${sz.avatar} shrink-0`}>
          <AvatarImage src={sender.avatar} alt={sender.name} />
          <AvatarFallback className="text-[10px]">{getInitials(sender.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2 min-w-0">
              {/* "You" for outbound — saves the mental step of reading your own
                  name and recognizing it as yours. Slightly muted so it visually
                  recedes. Inbound keeps the full client name at full weight. */}
              <span
                className={cn(
                  "truncate font-semibold",
                  sz.senderName,
                  isInbound ? "text-foreground" : "text-foreground/65"
                )}
              >
                {isInbound ? sender.name : "You"}
              </span>
              <span className={`truncate ${sz.senderEmail} text-muted-foreground/70`}>&lt;{sender.email}&gt;</span>
            </div>
            <time className={`shrink-0 ${sz.timestamp} tabular-nums text-muted-foreground/70`}>
              {formatEmailDate(message.timestamp)}
            </time>
          </div>
          <button
            onClick={() => setRecipientsExpanded(v => !v)}
            className={`mt-0.5 flex items-center gap-1 ${sz.recipient} text-muted-foreground/80 transition-colors hover:text-foreground`}
          >
            <span>{recipientLabel}</span>
            <ChevronDown className={`size-3 transition-transform ${recipientsExpanded ? "rotate-180" : ""}`} />
          </button>
          {recipientsExpanded && (
            <div className="mt-1.5 space-y-0.5 rounded-md bg-muted/40 px-2.5 py-2 text-[11px] text-muted-foreground">
              <div><span className="text-foreground/60">From:</span> {sender.name} &lt;{sender.email}&gt;</div>
              <div><span className="text-foreground/60">To:</span> {recipientFull}</div>
            </div>
          )}
        </div>
      </header>

      {/* Subject — only render if present */}
      {message.emailSubject && (
        <div className={sz.subjectPad}>
          <h3 className={`${sz.subjectText} font-semibold leading-snug text-foreground`}>{message.emailSubject}</h3>
        </div>
      )}

      {/* Body */}
      <div className={sz.bodyPad}>
        <p className={`whitespace-pre-wrap ${sz.bodyText} text-foreground/85`}>{displayContent}</p>
        {isLong && !bodyExpanded && (
          <button
            onClick={() => setBodyExpanded(true)}
            className="mt-2 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Show more
          </button>
        )}
      </div>

      {/* Attachments */}
      {allAttachments.length > 0 && (
        <div className={`border-t border-border/40 ${sz.attachPad}`}>
          <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            {allAttachments.length} {allAttachments.length === 1 ? "attachment" : "attachments"}
          </div>
          <div className="flex flex-wrap gap-2">
            {allAttachments.map(att => (
              <AttachmentCard key={att.id} attachment={att} isInbound={isInbound} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <footer className={`flex items-center gap-1 border-t border-border/40 ${sz.footerPad}`}>
        <ActionButton icon={<Reply className={sz.actionIcon} />} label="Reply" textClass={sz.actionText} onClick={() => showToast("info", "Reply", "Reply composer coming soon")} />
        <ActionButton icon={<ReplyAll className={sz.actionIcon} />} label="Reply All" textClass={sz.actionText} onClick={() => showToast("info", "Reply All", "Reply All composer coming soon")} />
        <ActionButton icon={<Forward className={sz.actionIcon} />} label="Forward" textClass={sz.actionText} onClick={() => showToast("info", "Forward", "Forward composer coming soon")} />
      </footer>
    </article>
  );
}

function ActionButton({ icon, label, onClick, textClass }: { icon: React.ReactNode; label: string; onClick: () => void; textClass?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${textClass ?? "px-3 py-1.5 text-[12px]"}`}
    >
      {icon}
      {label}
    </button>
  );
}
