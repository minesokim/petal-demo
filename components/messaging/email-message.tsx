"use client";

import { useState } from "react";
import { Mail, ChevronDown } from "lucide-react";
import { AttachmentCard } from "./attachment-card";
import type { UnifiedMessage } from "@/lib/comms-mock-data";

interface EmailMessageProps {
  message: UnifiedMessage;
  onViewDocument?: (fileName: string) => void;
}

export function EmailMessage({ message, onViewDocument }: EmailMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = message.content.length > 200;
  const displayContent = !isLong || expanded
    ? message.content
    : message.content.slice(0, 200) + "...";

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      {/* Subject line */}
      {message.emailSubject && (
        <div className="flex items-center gap-1.5">
          <Mail className="size-3 text-blue-500/60" />
          <span className="text-xs font-semibold text-foreground/90">
            {message.emailSubject}
          </span>
        </div>
      )}

      {/* Body */}
      <p className="text-sm leading-relaxed text-foreground/80">
        {displayContent}
      </p>

      {isLong && !expanded && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Show more
          <ChevronDown className="size-3" />
        </button>
      )}

      {/* Attachments */}
      {message.emailAttachments && message.emailAttachments.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {message.emailAttachments.map((att) => (
            <AttachmentCard
              key={att.id}
              attachment={att}
              onViewDocument={onViewDocument ? () => onViewDocument(att.fileName) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
