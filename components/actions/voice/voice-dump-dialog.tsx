"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mic, Square, Check, X, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { voiceDumpSession, type VoiceParsedItem } from "@/lib/actions-mock-data";
import { GooeyFilter } from "@/components/ui/gooey-filter";

type VoiceState = "idle" | "recording" | "processing" | "results";

interface VoiceDumpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ============================================================
// Waveform - 24 independently animated bars
// ============================================================
function VoiceWaveform() {
  return (
    <div className="flex h-12 items-end justify-center gap-[3px]">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[4px] rounded-t-sm bg-red-400"
          animate={{
            height: [8, 12 + Math.random() * 36, 8],
          }}
          transition={{
            duration: 0.4 + Math.random() * 0.4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: i * 0.03,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Processing Steps
// ============================================================
function ProcessingSteps() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => setStep(2), 1600);
    const t3 = setTimeout(() => setStep(3), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const steps = [
    "Transcribing audio...",
    "Extracting items and matching to clients...",
    "Categorizing as actions or to-dos...",
  ];

  return (
    <div className="space-y-3 py-4">
      <GooeyFilter id="voice-process-goo" strength={6} />
      <div className="mb-4 flex items-center justify-center" style={{ filter: "url(#voice-process-goo)" }}>
        <motion.div className="size-4 rounded-full bg-primary" animate={{ x: [0, 10, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="size-4 rounded-full bg-primary/60" animate={{ x: [0, -10, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} />
      </div>
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3">
          {step > i ? (
            <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500">
              <Check className="size-3 text-white" />
            </div>
          ) : step === i ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : (
            <div className="size-5 rounded-full border-2 border-muted" />
          )}
          <span className={`text-sm ${step >= i ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Parsed Items with approve/reject + Action/To-do routing
// ============================================================
function ParsedItemsList({ items: initialItems, onDone }: { items: VoiceParsedItem[]; onDone: () => void }) {
  const [items, setItems] = useState(initialItems);

  const toggleCategory = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, category: item.category === "action" ? "todo" : "action" } : item
    ));
  };

  const setStatus = (id: string, status: "approved" | "rejected") => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  };

  const approved = items.filter(i => i.status === "approved");
  const pending = items.filter(i => i.status === "pending");

  return (
    <div className="space-y-3">
      <div className="text-center">
        <div className="font-display text-lg font-semibold">Found {items.length} items</div>
        <div className="text-xs text-muted-foreground">{approved.length} approved, {items.filter(i => i.status === "rejected").length} skipped{pending.length > 0 ? `, ${pending.length} pending` : ""}</div>
      </div>

      <div className="space-y-2">
        {items.map(item => (
          <motion.div
            key={item.id}
            layout
            className={`flex items-start gap-2 rounded-xl border p-3 transition-colors ${
              item.status === "approved" ? "bg-emerald-50/50 dark:bg-emerald-950/10" :
              item.status === "rejected" ? "opacity-40" : ""
            }`}
          >
            {/* Approve/Reject buttons */}
            <div className="flex shrink-0 gap-1 pt-0.5">
              <button
                onClick={() => setStatus(item.id, "approved")}
                className={`flex size-6 items-center justify-center rounded-md transition-colors ${
                  item.status === "approved" ? "bg-emerald-500 text-white" : "border hover:bg-emerald-50"
                }`}
              >
                <Check className="size-3" />
              </button>
              <button
                onClick={() => setStatus(item.id, "rejected")}
                className={`flex size-6 items-center justify-center rounded-md transition-colors ${
                  item.status === "rejected" ? "bg-red-500 text-white" : "border hover:bg-red-50"
                }`}
              >
                <X className="size-3" />
              </button>
            </div>

            {/* Item text */}
            <div className="min-w-0 flex-1">
              <div className="text-sm">{item.text}</div>
            </div>

            {/* Client badge or Personal */}
            <div className="flex shrink-0 items-center gap-1.5">
              {item.clientName ? (
                <Badge variant="outline" className="text-[10px]">{item.clientName.split(" ")[0]}</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">Personal</Badge>
              )}
              <button
                onClick={() => toggleCategory(item.id)}
                className="cursor-pointer"
              >
                <Badge
                  variant={item.category === "action" ? "default" : "secondary"}
                  className="text-[10px]"
                >
                  {item.category === "action" ? "Action" : "To-do"}
                </Badge>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button className="flex-1" onClick={onDone} disabled={approved.length === 0}>
          <ArrowRight className="size-3.5" /> Execute {approved.length} items
        </Button>
        <Button variant="outline" onClick={onDone}>Save for later</Button>
      </div>
    </div>
  );
}

// ============================================================
// Main Dialog
// ============================================================
export function VoiceDumpDialog({ open, onOpenChange }: VoiceDumpDialogProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    setState("recording");
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState("processing");
    setTimeout(() => setState("results"), 2800);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Dump</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-8"
            >
              <button
                onClick={startRecording}
                className="group flex size-28 items-center justify-center rounded-full bg-primary/10 transition-all hover:bg-primary/20"
              >
                <Mic className="size-10 text-primary transition-transform group-hover:scale-110" />
              </button>
              <p className="mt-4 text-sm font-medium">Tap to start recording</p>
              <p className="text-xs text-muted-foreground">Describe tasks, client notes, or meeting outcomes</p>
            </motion.div>
          )}

          {state === "recording" && (
            <motion.div
              key="recording"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-6"
            >
              <div className="mb-2 text-xs text-red-500 font-medium">Recording... {formatTime(timer)}</div>
              <VoiceWaveform />
              <button
                onClick={stopRecording}
                className="mt-6 flex size-16 items-center justify-center rounded-full bg-red-500 transition-all hover:bg-red-600"
              >
                <Square className="size-6 text-white" fill="white" />
              </button>
              <p className="mt-3 text-xs text-muted-foreground">Tap to stop</p>
            </motion.div>
          )}

          {state === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4"
            >
              <ProcessingSteps />
            </motion.div>
          )}

          {state === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ParsedItemsList items={voiceDumpSession.parsedItems} onDone={handleClose} />
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
