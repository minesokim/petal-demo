"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileText, Check, X, ArrowRight, Loader2 } from "lucide-react";
import type { EmailAttachment } from "@/lib/comms-mock-data";

const docTypeLabels: Record<string, string> = {
  w2: "W-2",
  "1099_nec": "1099-NEC",
  "1099_int": "1099-INT",
  expense: "Expense",
  id: "ID",
};

interface AttachmentCardProps {
  attachment: EmailAttachment;
  onProcess?: () => void;
  onIgnore?: () => void;
}

export function AttachmentCard({ attachment, onProcess, onIgnore }: AttachmentCardProps) {
  const [status, setStatus] = useState<"idle" | "processing" | "processed" | "ignored">("idle");

  const handleProcess = () => {
    setStatus("processing");
    setTimeout(() => {
      setStatus("processed");
      onProcess?.();
    }, 1200);
  };

  const handleIgnore = () => {
    setStatus("ignored");
    onIgnore?.();
  };

  const typeLabel = attachment.docType ? docTypeLabels[attachment.docType] : null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
        status === "processed" && "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20",
        status === "ignored" && "border-muted bg-muted/30 opacity-50",
        status === "idle" && "bg-card",
        status === "processing" && "bg-card"
      )}
    >
      <div className="flex size-8 items-center justify-center rounded-md bg-muted">
        {status === "processing" ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        ) : status === "processed" ? (
          <Check className="size-3.5 text-emerald-600" />
        ) : (
          <FileText className="size-3.5 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium">
            {attachment.fileName}
          </span>
          {typeLabel && (
            <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
              {typeLabel}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{attachment.fileSize}</span>
      </div>

      {status === "idle" && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-2 text-[10px]"
            onClick={handleProcess}
          >
            <ArrowRight className="size-3" />
            Process
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px] text-muted-foreground"
            onClick={handleIgnore}
          >
            Ignore
          </Button>
        </div>
      )}

      {status === "processed" && (
        <span className="text-[10px] font-medium text-emerald-600">Filed</span>
      )}

      {status === "processing" && (
        <span className="text-[10px] text-muted-foreground">Processing...</span>
      )}
    </div>
  );
}
