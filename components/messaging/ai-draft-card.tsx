"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Pen, X, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { FeedAction } from "@/lib/actions-mock-data";

interface AIDraftCardProps {
  draft: FeedAction;
  onSend: (text: string) => void;
  onEdit: (text: string) => void;
  onDismiss: () => void;
}

export function AIDraftCard({ draft, onSend, onEdit, onDismiss }: AIDraftCardProps) {
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");

  if (!draft.aiDraft) return null;

  const handleSend = () => {
    setSendState("sending");
    setTimeout(() => {
      setSendState("sent");
      onSend(draft.aiDraft!);
    }, 1200);
  };

  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-md bg-foreground/[0.07]">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-foreground/50">
              <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">Suggested reply</span>
          <span className="text-[10px] text-muted-foreground/60">{draft.title}</span>
        </div>
        {sendState === "idle" && (
          <button onClick={onDismiss} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {sendState === "sent" ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 py-2 pl-7"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              className="flex size-6 items-center justify-center rounded-full bg-emerald-500"
            >
              <Check className="size-3.5 text-white" />
            </motion.div>
            <div>
              <div className="text-sm font-medium">Message sent</div>
              <div className="text-[10px] text-muted-foreground">Delivered to client</div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="draft" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <p className="text-[13px] leading-relaxed text-foreground/80 pl-7">{draft.aiDraft}</p>
            <div className="mt-2.5 pl-7 flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs transition-all duration-300"
                disabled={sendState === "sending"}
                onClick={handleSend}
              >
                {sendState === "sending" ? (
                  <><Loader2 className="size-3 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="size-3" /> Send as Antonio</>
                )}
              </Button>
              {sendState === "idle" && (
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => onEdit(draft.aiDraft!)}>
                  <Pen className="size-3" /> Edit
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
