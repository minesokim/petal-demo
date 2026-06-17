"use client";

// Chat history takeover — the glass effect sweeps across the WHOLE shell (the
// sidebar AND the frame around the canvas), with the searchable history list in
// the left column. The content card stays floating above it, so the glass reads
// as framing the canvas rather than just replacing the sidebar.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { recentChats, type RecentChat } from "@/lib/fixtures/firm";

export function ChatHistoryOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = (c?: RecentChat) => {
    router.push(c ? `/os/ask?q=${encodeURIComponent(c.title)}` : "/os/ask");
    onClose();
  };

  const list = recentChats.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <motion.div
      // open: sweep the glass in from the sidebar edge across the shell.
      // close: a clean fade (the reverse clip-collapse read as jarring).
      initial={{ clipPath: "inset(0 100% 0 0)", opacity: 1 }}
      animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1, transition: { duration: 0.42, ease: [0.32, 0.72, 0, 1] } }}
      exit={{ opacity: 0, transition: { duration: 0.2, ease: "easeOut" } }}
      onClick={onClose}
      className="os-chrome absolute inset-0 z-30 bg-[color-mix(in_srgb,#ffffff_24%,transparent)] backdrop-blur-2xl backdrop-saturate-150"
    >
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 18, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1], delay: 0.06 }}
        className="flex h-full w-[208px] flex-col"
      >
        <div className="flex items-center gap-2 px-3 pb-2 pt-3">
          <h2 className="text-[14px] font-semibold text-[var(--os-ink)]">Chat history</h2>
          <button onClick={onClose} aria-label="Close history" className="ml-auto grid size-7 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
            <Icon icon={I.close} size={16} />
          </button>
        </div>
        <div className="px-2 pb-2">
          <div className="flex h-8 items-center gap-2 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2">
            <Icon icon={I.search} size={14} className="shrink-0 text-[var(--os-ink-subtle)]" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" className="w-full bg-transparent text-[13px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {list.map(c => (
            <button key={c.id} onClick={() => open(c)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-[var(--os-hover)]">
              <span className={cn("size-1.5 shrink-0 rounded-full", c.unread ? "bg-[var(--os-info)]" : "bg-[var(--os-border-strong)]")} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{c.title}</span>
              <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{c.when}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
