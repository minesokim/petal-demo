"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Send, Pen, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type ActionItem } from "@/lib/mock-data";

type DraftState = "idle" | "editing" | "sending" | "sent";

export function ActionDraftCard({ action }: { action: ActionItem }) {
  const [state, setState] = useState<DraftState>("idle");
  const [draft, setDraft] = useState(action.aiDraft || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state === "editing" && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [state]);

  const handleSend = () => {
    setState("sending");
    setTimeout(() => setState("sent"), 1200);
  };

  const handleEdit = () => {
    setState("editing");
  };

  const handleCancelEdit = () => {
    setDraft(action.aiDraft || "");
    setState("idle");
  };

  const handleSaveEdit = () => {
    setState("idle");
  };

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{action.title}</div>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{action.description}</p>
        </div>
      </div>

      {action.aiDraft && (
        <>
          <Separator className="my-3" />

          <AnimatePresence mode="wait">
            {state === "sent" ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-2 py-3"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-primary">
                  <Check className="size-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Message sent</div>
                  <div className="text-xs text-muted-foreground">Delivered to {action.clientName}</div>
                </div>
              </motion.div>
            ) : state === "sending" ? (
              <motion.div
                key="sending"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 py-3"
              >
                <motion.div
                  className="size-5 rounded-full border-2 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <span className="text-sm text-muted-foreground">Sending to {action.clientName}...</span>
              </motion.div>
            ) : (
              <motion.div
                key="draft"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Suggested message
                </div>

                {state === "editing" ? (
                  <div>
                    <Textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="min-h-[80px] text-sm leading-relaxed"
                    />
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Check className="size-3.5" /> Done
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        <X className="size-3.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{draft}</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={handleSend}>
                        <Send className="size-3.5" /> Send as Antonio
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleEdit}>
                        <Pen className="size-3.5" /> Edit
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
