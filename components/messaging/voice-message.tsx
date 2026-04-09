"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PhoneCall, Video, ChevronDown, Clock, CheckCircle2, ArrowRight, AlertCircle, Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast-notification";
import type { UnifiedMessage } from "@/lib/comms-mock-data";

interface VoiceMessageProps {
  message: UnifiedMessage;
}

type SuggestedItemStatus = "pending" | "accepted" | "dismissed";

export function VoiceMessage({ message }: VoiceMessageProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSuggestedItems, setShowSuggestedItems] = useState(true);
  const [itemStatuses, setItemStatuses] = useState<Record<number, SuggestedItemStatus>>({});
  const { showToast } = useToast();
  const isVideo = message.channel === "video";
  const platform = message.videoPlatform;

  const acceptItem = (index: number, text: string) => {
    setItemStatuses(prev => ({ ...prev, [index]: "accepted" }));
    showToast("success", "Added to flags", text);
  };

  const dismissItem = (index: number) => {
    setItemStatuses(prev => ({ ...prev, [index]: "dismissed" }));
  };

  const suggestedItems = message.suggestedItems || [];
  const pendingCount = suggestedItems.filter((_, i) => !itemStatuses[i]).length;
  const acceptedCount = suggestedItems.filter((_, i) => itemStatuses[i] === "accepted").length;

  return (
    <div className="space-y-3">
      {/* Call header */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex size-7 items-center justify-center rounded-full",
          isVideo ? "bg-blue-100 dark:bg-blue-950/40" : "bg-violet-100 dark:bg-violet-950/40"
        )}>
          {isVideo ? (
            <Video className="size-3.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <PhoneCall className="size-3.5 text-violet-600 dark:text-violet-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground/90">
              {isVideo ? "Video Call" : "Voice Call"}
            </span>
            {platform && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                {platform === "zoom" ? "Zoom" : "Google Meet"}
              </Badge>
            )}
          </div>
        </div>
        {message.voiceDuration && (
          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
            <Clock className="size-2.5" />
            {message.voiceDuration}
          </span>
        )}
      </div>

      {/* AI Summary */}
      {message.voiceAiSummary && (
        <p className="text-sm leading-relaxed text-foreground/80">{message.voiceAiSummary}</p>
      )}

      {/* Key Points */}
      {message.voiceKeyPoints && message.voiceKeyPoints.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Key Points</span>
          <ul className="space-y-0.5">
            {message.voiceKeyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-500/60" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      {message.voiceActionItems && message.voiceActionItems.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action Items</span>
          <ul className="space-y-0.5">
            {message.voiceActionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                <ArrowRight className="mt-0.5 size-3 shrink-0 text-blue-500/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested flags — actionable */}
      {suggestedItems.length > 0 && (
        <div>
          <button
            onClick={() => setShowSuggestedItems(!showSuggestedItems)}
            className="flex items-center gap-1.5 text-[11px] text-foreground/70 transition-colors hover:text-foreground"
          >
            <AlertCircle className="size-3 text-amber-500" />
            <span className="font-medium">
              {pendingCount > 0
                ? `${pendingCount} suggested open item${pendingCount > 1 ? "s" : ""}`
                : `${acceptedCount} item${acceptedCount > 1 ? "s" : ""} added`
              }
            </span>
            <ChevronDown className={cn("size-3 transition-transform", showSuggestedItems && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showSuggestedItems && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 space-y-1 rounded-lg border border-border/40 bg-card p-2">
                  {suggestedItems.map((item, i) => {
                    const status = itemStatuses[i];
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                          status === "accepted" && "bg-emerald-50/30 dark:bg-emerald-950/10",
                          status === "dismissed" && "opacity-40",
                        )}
                      >
                        {/* Status indicator */}
                        {status === "accepted" ? (
                          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                        ) : status === "dismissed" ? (
                          <X className="size-3.5 shrink-0 text-muted-foreground/40" />
                        ) : (
                          <div className="size-1.5 rounded-full bg-amber-500 shrink-0 ml-1 mr-0.5" />
                        )}

                        {/* Item text */}
                        <span className={cn(
                          "flex-1 text-xs",
                          status === "accepted" && "text-foreground/70",
                          status === "dismissed" && "text-muted-foreground line-through",
                          !status && "text-foreground/80",
                        )}>
                          {item}
                        </span>

                        {/* Action buttons */}
                        {!status && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={(e) => { e.stopPropagation(); acceptItem(i, item); }}
                              title="Add to flags"
                            >
                              <Check className="size-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground/50 hover:text-muted-foreground"
                              onClick={(e) => { e.stopPropagation(); dismissItem(i); }}
                              title="Dismiss"
                            >
                              <X className="size-3" />
                            </Button>
                          </div>
                        )}

                        {status === "accepted" && (
                          <span className="text-[9px] text-emerald-600 shrink-0">Added</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Transcript toggle */}
      {message.voiceTranscript && (
        <div>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronDown className={cn("size-3 transition-transform", showTranscript && "rotate-180")} />
            {showTranscript ? "Hide transcript" : "View full transcript"}
          </button>
          <AnimatePresence>
            {showTranscript && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <pre className="mt-2 max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 font-sans text-xs leading-relaxed text-muted-foreground">
                  {message.voiceTranscript}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
