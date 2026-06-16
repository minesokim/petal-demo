"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, I } from "@/components/os/icon";
import { Mic, Upload, ChevronRight } from "lucide-react";

/** The Ask Petal composer embedded on the home screen (Solve "complete a task" pattern). */
export function AskComposer() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [appsOpen, setAppsOpen] = useState(false);
  // hand the typed question to /os/ask, which runs it on arrival
  const go = () => router.push(q.trim() ? `/os/ask?q=${encodeURIComponent(q.trim())}` : "/os/ask");
  const connect = () => { setAppsOpen(false); router.push("/os/settings"); };

  return (
    <div>
      <div className="relative rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3.5 py-3 shadow-[0_1px_2px_rgba(17,17,26,0.04)] transition-shadow focus-within:shadow-[0_2px_10px_-2px_rgba(17,17,26,0.10)]">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setAppsOpen(v => !v)} aria-label="Connect apps" className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--os-border)] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]">
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

        {/* Connect apps popup (opened by the + button) */}
        {appsOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAppsOpen(false)} />
            <div className="absolute left-2 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-1.5 shadow-[0_8px_28px_-8px_rgba(17,17,26,0.18)]">
              <button onClick={() => setAppsOpen(false)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]">
                <Upload className="size-[18px] shrink-0 text-[var(--os-ink-muted)]" strokeWidth={1.75} /> Upload files
              </button>
              <button onClick={() => setAppsOpen(false)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]">
                <img src="/logos/google-drive.svg" alt="" className="size-[18px] shrink-0 object-contain" />
                <span className="flex-1">Google Drive</span>
                <ChevronRight className="size-4 shrink-0 text-[var(--os-ink-subtle)]" />
              </button>
              <div className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-[var(--os-ink)]">
                <img src="/logos/xero.svg" alt="" className="size-[18px] shrink-0 object-contain" />
                <span className="flex-1">Xero</span>
                <button onClick={connect} className="text-[12px] font-medium text-[var(--os-ink-muted)] underline underline-offset-2 transition-colors hover:text-[var(--os-ink)]">Connect</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
