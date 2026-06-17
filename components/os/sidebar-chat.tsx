"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { Tip } from "@/components/os/tooltip";
import { recentChats, type RecentChat } from "@/lib/fixtures/firm";

/** Sidebar bottom - the Ask Petal chat zone: Recent convos, history, New chat (Solve pattern).
 *  Opening history calls onOpenHistory → the layout's full-shell glass takeover.
 *  Chats that produced an artifact open that artifact - chats and tasks reference the same objects. */
export function SidebarChat({ onOpenHistory }: { onOpenHistory: () => void }) {
  const router = useRouter();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [hoverList, setHoverList] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const recent = recentChats.slice(0, 6);
  const noFade = hoverList || expanded;
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Every recent item is an AI conversation - clicking reopens it in Ask Petal.
  const open = (c?: RecentChat) => {
    router.push(c ? `/os/ask?q=${encodeURIComponent(c.title)}` : "/os/ask");
    setMenuFor(null);
  };

  return (
    <>
      <div
        className="px-2 pb-3.5 pt-1"
        onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
        onMouseLeave={() => { closeTimer.current = setTimeout(() => { setExpanded(false); setHoverList(false); setMenuFor(null); }, 500); }}
      >
        <div className="os-label mb-1.5 px-2">Recent</div>
        <div className="overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ maxHeight: expanded ? 340 : 110 }}>
        <div
          className="space-y-1.5 transition-transform duration-200 ease-out"
          style={{ transform: hoverList && !expanded ? "translateY(-2px)" : "none" }}
          onMouseEnter={() => setHoverList(true)}
          onMouseLeave={() => setHoverList(false)}
        >
          {recent.map((c, i) => (
            <div
              key={c.id}
              className="group/chat relative transition-opacity duration-200 ease-out"
              style={{ opacity: noFade ? 1 : Math.max(0.35, 1 - i * 0.28) }}
            >
              <button
                onClick={() => open(c)}
                className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"
              >
                <span className={cn("size-1.5 shrink-0 rounded-full", c.unread ? "bg-[var(--os-info)]" : "border border-[var(--os-border-strong)]")} />
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)] group-hover/chat:opacity-0">{c.when}</span>
              </button>
              <button
                onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                aria-label="Chat options"
                className="absolute right-1 top-1/2 hidden size-6 -translate-y-1/2 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] group-hover/chat:grid"
              >
                <Icon icon={I.more} size={15} />
              </button>
              {menuFor === c.id && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuFor(null)} />
                  <div className="absolute right-1 top-9 z-50 min-w-[150px] rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-md">
                    <button onClick={() => setMenuFor(null)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]">
                      <Icon icon={I.edit} size={14} className="text-[var(--os-ink-muted)]" /> Rename
                    </button>
                    <button onClick={() => setMenuFor(null)} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]">
                      <Icon icon={I.archive} size={14} className="text-[var(--os-ink-muted)]" /> Archive
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <Tip label="Chat history" side="top">
          <button onClick={onOpenHistory} onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); setExpanded(true); }} aria-label="Chat history" className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
            <Icon icon={I.history} size={17} />
          </button>
          </Tip>
          <button onClick={() => open()} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--os-border)] bg-[var(--os-surface)] text-[13px] font-medium text-[var(--os-ink)] shadow-[0_1px_2px_rgba(17,17,26,0.05)] transition-colors hover:bg-[var(--os-hover)]">
            <PetalMark className="size-4" /> New chat
          </button>
        </div>
      </div>
    </>
  );
}
