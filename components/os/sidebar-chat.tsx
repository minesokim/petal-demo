"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { chats, chatGroups } from "@/lib/os-chats";

/** Sidebar bottom — the Ask Petal chat zone: Recent convos, history, New chat (Solve pattern).
 *  Opening history slides the whole sidebar up into a Chat history view. */
export function SidebarChat() {
  const router = useRouter();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const recent = chats.slice(0, 6);

  const open = () => { router.push("/os/ask"); setHistoryOpen(false); setMenuFor(null); };

  return (
    <>
      <div
        className="px-2 pb-2 pt-1"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => { setExpanded(false); setMenuFor(null); }}
      >
        <div className="os-label mb-1.5 px-2">Recent</div>
        <div className="overflow-hidden transition-[max-height] duration-300 ease-out" style={{ maxHeight: expanded ? 300 : 116 }}>
        <div className="space-y-1.5">
          {recent.map((c, i) => (
            <div
              key={c.id}
              className="group/chat relative transition-all duration-200 ease-out"
              style={{ opacity: hovered === c.id ? 1 : Math.max(0.4, 1 - i * 0.2), transform: hovered === c.id ? "translateY(-2px)" : "none" }}
              onMouseEnter={() => setHovered(c.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <button
                onClick={open}
                className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"
              >
                <span className={cn("size-1.5 shrink-0 rounded-full", c.unread ? "bg-[var(--os-accent)]" : "border border-[var(--os-border-strong)]")} />
                <span className="min-w-0 flex-1 truncate">{c.title}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)] group-hover/chat:opacity-0">{c.when}</span>
              </button>
              <button
                onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                aria-label="Chat options"
                className="absolute right-1 top-1/2 hidden size-6 -translate-y-1/2 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)] group-hover/chat:grid"
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
          <button onClick={() => setHistoryOpen(true)} aria-label="Chat history" className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
            <Icon icon={I.history} size={17} />
          </button>
          <button onClick={open} className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--os-border)] bg-[var(--os-surface)] text-[13px] font-medium text-[var(--os-ink)] shadow-[0_1px_2px_rgba(17,17,26,0.05)] transition-colors hover:bg-[var(--os-hover)]">
            <PetalMark className="size-4" /> New chat
          </button>
        </div>
      </div>

      {/* Chat history — takes over the sidebar, sliding up from the bottom */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-0 z-30 flex flex-col bg-[var(--os-shell)]"
          >
            <div className="flex items-center gap-2 px-3 pb-2 pt-3">
              <h2 className="text-[14px] font-semibold text-[var(--os-ink)]">Chat history</h2>
              <button onClick={() => setHistoryOpen(false)} aria-label="Close history" className="ml-auto grid size-7 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
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
              {chatGroups.map(g => {
                const items = chats.filter(c => c.group === g && c.title.toLowerCase().includes(query.toLowerCase()));
                if (!items.length) return null;
                return (
                  <div key={g} className="mb-2">
                    <div className="os-label mb-1 px-2">{g}</div>
                    {items.map(c => (
                      <button key={c.id} onClick={open} className="flex h-8 w-full items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-[var(--os-hover)]">
                        <span className={cn("size-1.5 shrink-0 rounded-full", c.unread ? "bg-[var(--os-accent)]" : "bg-[var(--os-border-strong)]")} />
                        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{c.title}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{c.when}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
