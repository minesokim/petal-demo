"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, I } from "@/components/os/icon";
import { Mic } from "lucide-react";

/** The Ask Petal composer embedded on the home screen (Solve "complete a task" pattern). */
export function AskComposer() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = () => router.push("/os/ask");
  return (
    <div className="mb-6">
      <div className="rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3.5 py-3 shadow-[0_1px_2px_rgba(17,17,26,0.04)] transition-shadow focus-within:shadow-[0_2px_10px_-2px_rgba(17,17,26,0.10)]">
        <div className="flex items-center gap-2.5">
          <button onClick={go} aria-label="Attach" className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--os-border)] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]">
            <Icon icon={I.plus} size={16} />
          </button>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") go(); }}
            placeholder="Ask Petal anything, or describe work to run…"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
          />
          <button aria-label="Voice" className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
            <Mic className="size-[17px]" strokeWidth={1.75} />
          </button>
          <button onClick={go} disabled={!q.trim()} aria-label="Send" className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--os-primary)] text-[var(--os-primary-fg)] transition-transform active:scale-95 disabled:opacity-30">
            <Icon icon={I.send} size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
