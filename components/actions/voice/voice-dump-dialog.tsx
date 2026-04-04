"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { voiceDumpSession } from "@/lib/actions-mock-data";
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
    if (timerRef.current) clearInterval(timerRef.current);
    setState("idle");
    setTimer(0);
    onOpenChange(false);

    // Show processing toast, then open side panel with results
    showToast("info", "Processing voice note...", `${formatTime(timer)} recorded`);
    setTimeout(() => {
      aiPanel.askQuestion(`__voice_results__`);
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
      <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden border-0 bg-zinc-950 text-white">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center px-8 py-10"
            >
              <p className="text-sm text-zinc-400 mb-6">What's on your mind?</p>
              <button
                onClick={startRecording}
                className="group flex size-16 items-center justify-center rounded-full bg-white/10 transition-all hover:bg-white/20 active:scale-95"
              >
                <Mic className="size-6 text-white transition-transform group-hover:scale-105" />
              </button>
              <p className="mt-4 text-[11px] text-zinc-500">
                Tasks, client notes, meeting outcomes
              </p>
            </motion.div>
          )}

          {state === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center px-8 py-10"
            >
              {/* Pulse ring */}
              <div className="relative mb-6">
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-500/20"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 64, height: 64, left: 0, top: 0 }}
                />
                <button
                  onClick={stopRecording}
                  className="relative flex size-16 items-center justify-center rounded-full bg-red-500 transition-all hover:bg-red-600 active:scale-95"
                >
                  <Square className="size-5 text-white" fill="white" />
                </button>
              </div>

              {/* Timer */}
              <div className="font-mono text-2xl font-light tracking-wider text-white tabular-nums">
                {formatTime(timer)}
              </div>
              <p className="mt-2 text-[11px] text-zinc-500">Tap to stop</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
