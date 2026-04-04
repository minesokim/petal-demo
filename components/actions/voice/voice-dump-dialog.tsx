"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mic, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "@/components/ui/toast-notification";
import { useAIPanel } from "@/components/ai-panel";

type VoiceState = "idle" | "recording";

interface VoiceDumpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceDumpDialog({ open, onOpenChange }: VoiceDumpDialogProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast } = useToast();
  let aiPanel = { open: () => {}, askQuestion: (_q: string) => {} };
  try { aiPanel = useAIPanel(); } catch {}

  const startRecording = () => {
    setState("recording");
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  };

  const stopRecording = () => {
    const recorded = timer;
    if (timerRef.current) clearInterval(timerRef.current);
    setState("idle");
    setTimer(0);
    onOpenChange(false);

    showToast("info", "Processing voice note...", `${formatTime(recorded)} recorded`);
    setTimeout(() => {
      aiPanel.askQuestion("__voice_results__");
    }, 1800);
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState("idle");
    setTimer(0);
    onOpenChange(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xs p-0 gap-0 overflow-hidden rounded-2xl border border-border/50 shadow-2xl">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center px-10 pt-10 pb-8"
            >
              {/* Mic button */}
              <button
                onClick={startRecording}
                className="group relative flex size-20 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary/90 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
              >
                <Mic className="size-7 text-primary-foreground" />
              </button>

              <p className="mt-5 text-[13px] font-medium text-foreground">Voice Note</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tap to start recording
              </p>
            </motion.div>
          )}

          {state === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center px-10 pt-10 pb-8"
            >
              {/* Animated rings + stop button */}
              <div className="relative flex items-center justify-center">
                {/* Outer pulse */}
                <motion.div
                  className="absolute rounded-full border border-red-500/15"
                  animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                  style={{ width: 80, height: 80 }}
                />
                {/* Inner pulse */}
                <motion.div
                  className="absolute rounded-full border border-red-500/20"
                  animate={{ scale: [1, 1.25], opacity: [0.4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.3 }}
                  style={{ width: 80, height: 80 }}
                />
                <button
                  onClick={stopRecording}
                  className="relative flex size-20 items-center justify-center rounded-full bg-red-500 shadow-lg shadow-red-500/25 transition-all hover:bg-red-600 active:scale-95"
                >
                  <div className="size-6 rounded-[5px] bg-white" />
                </button>
              </div>

              {/* Timer */}
              <div className="mt-5 font-mono text-[28px] font-light tracking-widest text-foreground tabular-nums">
                {formatTime(timer)}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Recording</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
