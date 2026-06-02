"use client";

import { useEffect, useState } from "react";
import {
  CheckIcon,
  MicIcon,
  SparklesIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PetalMark } from "@/components/petal-mark";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-notification";
import { clients } from "@/lib/mock-data";

/**
 * Voice recorder — the Slant pattern.
 *
 * Floating record button (bottom-right of every page) opens a multi-state
 * dialog: idle → recording → transcribing → result (with Petal summary +
 * client attribution + save to OmniContext memory).
 *
 * In production: hooks into mic, sends to transcription API, runs through
 * memory-curator agent. Here: simulated states with realistic timing.
 */

type RecorderState = "idle" | "recording" | "transcribing" | "result";

const MOCK_TRANSCRIPT_EXCERPTS = [
  { speaker: "You", text: "So tell me how the business has been going since we last talked.", tMin: 0, tSec: 42 },
  { speaker: "Client", text: "Better than I expected, honestly. I left the part-time job in February.", tMin: 1, tSec: 18 },
  { speaker: "You", text: "That's a big step. How's the cash flow been since?", tMin: 1, tSec: 52 },
  { speaker: "Client", text: "Better than the W-2 job, but irregular. I'm worried about Q4 estimates.", tMin: 2, tSec: 22 },
];

const MOCK_SUMMARY =
  "Client transitioned from part-time W-2 to full-time freelance in February. Income up but irregular. Concerned about Q4 estimates. Discussed Schedule C setup, home office eligibility, and S-Corp election (advised: not yet — payroll cost too high at current income). Promised setup checklist by Friday.";

const MOCK_FACTS = [
  "Left part-time W-2 · now full-time freelance",
  "Income: ~$54K projection · Schedule C",
  "Home office: dedicated 110 sqft (qualifies)",
  "S-Corp election: not yet (revisit at $80K+)",
];

const MOCK_ACTIONS = [
  "Send Schedule C setup checklist by Friday",
  "Schedule Q4 estimate review for Oct 1",
];

interface VoiceRecorderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoiceRecorderDialog({ open, onOpenChange }: VoiceRecorderDialogProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [attributedClientId, setAttributedClientId] = useState<string>("");
  const { showToast } = useToast();

  // Reset when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Wait for close animation before reset
      const t = setTimeout(() => {
        setState("idle");
        setElapsedSec(0);
        setAttributedClientId("");
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Recording timer
  useEffect(() => {
    if (state !== "recording") return;
    const interval = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Auto-advance transcribing → result after 2.5s
  useEffect(() => {
    if (state !== "transcribing") return;
    const t = setTimeout(() => setState("result"), 2500);
    return () => clearTimeout(t);
  }, [state]);

  const start = () => {
    setElapsedSec(0);
    setState("recording");
  };

  const stop = () => {
    setState("transcribing");
  };

  const save = () => {
    const client = clients.find((c) => c.id === attributedClientId);
    showToast(
      "success",
      "Saved to memory",
      client ? `Recording added to ${client.fullName}'s OmniContext` : "Recording added to your unattributed library"
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-lg gap-0 p-0">
        <DialogTitle className="sr-only">Voice recorder</DialogTitle>
        <DialogDescription className="sr-only">
          Record an in-person conversation. Petal will transcribe and summarize.
        </DialogDescription>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <div className="flex items-center gap-2">
            <PetalMark className="size-3.5 text-foreground/60" />
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-foreground/65">
              Voice recorder
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Content — switches per state */}
        <div className="px-6 pb-6 pt-5">
          {state === "idle" && <IdleState onStart={start} />}
          {state === "recording" && <RecordingState elapsedSec={elapsedSec} onStop={stop} />}
          {state === "transcribing" && <TranscribingState elapsedSec={elapsedSec} />}
          {state === "result" && (
            <ResultState
              durationSec={elapsedSec}
              attributedClientId={attributedClientId}
              onAttributedClientChange={setAttributedClientId}
              onSave={save}
              onDiscard={() => onOpenChange(false)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// States
// ─────────────────────────────────────────────────────────────────────────

function IdleState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <h2 className="font-display text-[22px] font-medium leading-tight tracking-tight">
        Record a conversation
      </h2>
      <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        I&apos;ll transcribe what&apos;s said, summarize the key points, and add it to the client&apos;s memory.
      </p>
      <button
        onClick={onStart}
        className="group flex size-20 items-center justify-center rounded-full bg-foreground transition-transform hover:scale-105"
        aria-label="Start recording"
      >
        <MicIcon className="size-8 text-background" />
      </button>
      <div className="text-[11px] text-muted-foreground">
        Or click + hold <kbd className="rounded border border-border/60 bg-background px-1 py-px font-mono text-[9.5px]">space</kbd> on the FAB to record
      </div>
    </div>
  );
}

function RecordingState({ elapsedSec, onStop }: { elapsedSec: number; onStop: () => void }) {
  const min = Math.floor(elapsedSec / 60);
  const sec = elapsedSec % 60;
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      {/* Pulsing red dot + timer */}
      <div className="flex items-center gap-3">
        <span className="relative flex size-3">
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
          <span className="relative size-3 rounded-full bg-red-500" />
        </span>
        <span className="font-display text-[28px] font-medium leading-none tabular-nums">
          {min}:{sec.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Animated waveform */}
      <div className="flex h-10 items-center gap-[3px]">
        {Array.from({ length: 32 }).map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-foreground/70"
            style={{
              height: `${20 + Math.abs(Math.sin(i * 0.6 + elapsedSec * 0.5)) * 28}px`,
              animation: `pulse 1.${(i % 4) + 1}s ease-in-out infinite`,
              animationDelay: `${i * 60}ms`,
            }}
          />
        ))}
      </div>

      <div className="text-[12px] text-muted-foreground">I&apos;m listening · speak naturally</div>

      <Button
        onClick={onStop}
        size="lg"
        className="gap-2 bg-foreground text-background hover:bg-foreground/90"
      >
        <SquareIcon className="size-4 fill-current" /> Stop recording
      </Button>
    </div>
  );
}

function TranscribingState({ elapsedSec }: { elapsedSec: number }) {
  const min = Math.floor(elapsedSec / 60);
  const sec = elapsedSec % 60;
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <PetalMark className="size-10 animate-spin text-foreground/70 [animation-duration:3s]" />
      <div>
        <div className="font-display text-[18px] font-medium leading-tight">Transcribing your conversation</div>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Processing {min}:{sec.toString().padStart(2, "0")} of audio · summarizing · extracting facts
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="font-mono">memory-curator</span>
        <span className="size-1 rounded-full bg-emerald-500" />
        <span>active</span>
      </div>
    </div>
  );
}

function ResultState({
  durationSec,
  attributedClientId,
  onAttributedClientChange,
  onSave,
  onDiscard,
}: {
  durationSec: number;
  attributedClientId: string;
  onAttributedClientChange: (id: string) => void;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const min = Math.floor(durationSec / 60);
  const sec = durationSec % 60;
  return (
    <div className="space-y-5">
      {/* Success header */}
      <div className="flex items-center gap-2 text-[12px]">
        <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          <CheckIcon className="size-3" />
        </span>
        <span className="font-medium">Transcript ready</span>
        <span className="text-muted-foreground">
          · {min}:{sec.toString().padStart(2, "0")}
        </span>
      </div>

      {/* Petal's summary — the hero */}
      <div className="rounded-lg border border-foreground/15 bg-background p-4">
        <div className="mb-2 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
          <PetalMark className="size-3 text-foreground/60" />
          My summary
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/85">{MOCK_SUMMARY}</p>
      </div>

      {/* Extracted facts */}
      <div>
        <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
          Facts I extracted
        </div>
        <ul className="space-y-1">
          {MOCK_FACTS.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[12.5px] text-foreground/85">
              <SparklesIcon className="mt-0.5 size-3 shrink-0 text-foreground/55" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action items */}
      <div>
        <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
          Action items
        </div>
        <ul className="space-y-1">
          {MOCK_ACTIONS.map((a) => (
            <li key={a} className="flex items-start gap-2 text-[12.5px] text-foreground/85">
              <CheckIcon className="mt-0.5 size-3 shrink-0 text-emerald-600" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Transcript preview (collapsible later) */}
      <details className="rounded-md border border-border/60 bg-muted/30">
        <summary className="cursor-pointer px-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-foreground/65">
          View transcript ({MOCK_TRANSCRIPT_EXCERPTS.length} excerpts)
        </summary>
        <ul className="space-y-2 px-3 pb-3 pt-1 text-[12px]">
          {MOCK_TRANSCRIPT_EXCERPTS.map((e, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-10 shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                {e.tMin}:{e.tSec.toString().padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <span className="font-medium text-foreground/85">{e.speaker}:</span>{" "}
                <span className="italic text-foreground/75">{e.text}</span>
              </div>
            </li>
          ))}
        </ul>
      </details>

      {/* Attribution */}
      <div className="rounded-md border border-border/60 bg-muted/30 p-3">
        <label className="mb-1.5 block text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
          Attribute to a client (optional)
        </label>
        <select
          value={attributedClientId}
          onChange={(e) => onAttributedClientChange(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none transition-colors focus:border-foreground/40"
        >
          <option value="">— unattributed (keep in personal library) —</option>
          {clients.slice(0, 14).map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
              {c.businessName ? ` · ${c.businessName}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
        <Button size="sm" variant="ghost" onClick={onDiscard}>
          Discard
        </Button>
        <Button
          size="sm"
          className="bg-foreground text-background hover:bg-foreground/90"
          onClick={onSave}
        >
          <CheckIcon className="size-3.5" /> Save to memory
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Floating Action Button
// ─────────────────────────────────────────────────────────────────────────

export function VoiceRecorderFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-all hover:scale-105 hover:shadow-xl"
        aria-label="Record a conversation"
        title="Record a conversation"
      >
        <MicIcon className="size-5" />
      </button>
      <VoiceRecorderDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
