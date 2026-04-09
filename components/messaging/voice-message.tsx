"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PhoneCall, Video, ChevronDown, Clock, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import type { UnifiedMessage } from "@/lib/comms-mock-data";

interface VoiceMessageProps {
  message: UnifiedMessage;
}

export function VoiceMessage({ message }: VoiceMessageProps) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSuggestedItems, setShowSuggestedItems] = useState(false);
  const isVideo = message.channel === "video";
  const platform = message.videoPlatform;

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

      {/* Suggested Open Items (video calls) */}
      {message.videoSuggestedItems && message.videoSuggestedItems.length > 0 && (
        <div>
          <button
            onClick={() => setShowSuggestedItems(!showSuggestedItems)}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <AlertCircle className="size-3" />
            <span>{message.videoSuggestedItems.length} suggested open items</span>
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
                <ul className="mt-1.5 space-y-1 rounded-lg bg-muted/30 p-2.5">
                  {message.videoSuggestedItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-foreground/70">
                      <div className="mt-1 size-1 rounded-full bg-amber-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
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
