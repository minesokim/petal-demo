"use client";

// Command search - the sidebar search (and ⌘K). Jumps to any page or client.
// Keyboard: ↑/↓ move, ↵ open, Esc close. Results = nav pages + every household.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Home, ListChecks, Inbox, CalendarDays, Users, FileText, MailWarning, CreditCard,
  BookOpen, Settings, Search, Blocks, Brain, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { households } from "@/lib/fixtures/firm";

type Result = { id: string; label: string; sub?: string; href: string; icon: LucideIcon | "petal"; group: "Pages" | "Clients" };

const PAGES: Result[] = [
  { id: "p-today", label: "Today", href: "/os/today", icon: Home, group: "Pages" },
  { id: "p-tasks", label: "Tasks", href: "/os/tasks", icon: ListChecks, group: "Pages" },
  { id: "p-review", label: "Review mode", href: "/os/review", icon: "petal", group: "Pages" },
  { id: "p-inbox", label: "Inbox", href: "/os/inbox", icon: Inbox, group: "Pages" },
  { id: "p-calendar", label: "Calendar", href: "/os/calendar", icon: CalendarDays, group: "Pages" },
  { id: "p-clients", label: "Clients", href: "/os/clients", icon: Users, group: "Pages" },
  { id: "p-documents", label: "Documents", href: "/os/documents", icon: FileText, group: "Pages" },
  { id: "p-notices", label: "Notices", href: "/os/notices", icon: MailWarning, group: "Pages" },
  { id: "p-billing", label: "Billing", href: "/os/billing", icon: CreditCard, group: "Pages" },
  { id: "p-knowledge", label: "Knowledge", href: "/os/knowledge", icon: BookOpen, group: "Pages" },
  { id: "p-memory", label: "Memory", href: "/os/memory", icon: Brain, group: "Pages" },
  { id: "p-connections", label: "Connections", href: "/os/connections", icon: Blocks, group: "Pages" },
  { id: "p-settings", label: "Settings", href: "/os/settings", icon: Settings, group: "Pages" },
];

const CLIENTS: Result[] = households.map(h => ({
  id: h.id,
  label: h.name,
  sub: `${h.kind === "business" ? "Business" : h.kind === "mixed" ? "Mixed" : "Individual"} · ${h.serviceTier}`,
  href: `/os/clients/${h.id}`,
  icon: Users,
  group: "Clients",
}));

// On open (empty query) we show a small, intentional launchpad - not the whole nav.
// Full search across every page + client only kicks in once you start typing.
const QUICK_IDS = ["p-today", "p-tasks", "p-clients", "p-inbox"];
const QUICK: Result[] = QUICK_IDS.map(id => PAGES.find(p => p.id === id)!).filter(Boolean);

export function CommandSearch({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const empty = !q.trim();
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return QUICK;
    return [...PAGES, ...CLIENTS].filter(r => r.label.toLowerCase().includes(needle) || r.sub?.toLowerCase().includes(needle));
  }, [q]);

  // keep active index in range; reset to top on query change
  useEffect(() => { setActive(0); }, [q]);

  const go = (r?: Result) => { if (!r) return; router.push(r.href); onClose(); };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(results[active]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };

  // scroll the active row into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // group boundaries for headers
  let lastGroup = "";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-[12vh] backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        onClick={e => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Search"
        className="w-full max-w-[680px] overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl"
      >
        {/* input */}
        <div className="flex items-center gap-2.5 border-b border-[var(--os-border)] px-4">
          <Search className="size-4 shrink-0 text-[var(--os-ink-subtle)]" />
          <input
            autoFocus
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search pages and clients…"
            className="h-12 flex-1 bg-transparent text-[14px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
          />
          <kbd className="hidden shrink-0 rounded border border-[var(--os-border-strong)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--os-ink-subtle)] sm:inline">esc</kbd>
        </div>

        {/* results */}
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-[var(--os-ink-muted)]">No matches for “{q}”.</p>
          ) : (
            results.map((r, i) => {
              const showHeader = r.group !== lastGroup;
              lastGroup = r.group;
              const isActive = i === active;
              const IconC = r.icon;
              return (
                <div key={r.id}>
                  {showHeader && <div className="os-label px-2.5 pb-1 pt-2">{empty ? "Jump to" : r.group}</div>}
                  <button
                    data-idx={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                      isActive ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]",
                    )}
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[var(--os-bg-subtle)] text-[var(--os-ink-muted)]">
                      {IconC === "petal" ? <PetalMark className="size-3.5" /> : <IconC className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--os-ink)]">{r.label}</span>
                      {r.sub && <span className="block truncate text-[11px] text-[var(--os-ink-subtle)]">{r.sub}</span>}
                    </span>
                    {isActive && <span className="shrink-0 text-[10.5px] text-[var(--os-ink-subtle)]">↵</span>}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* footer hint */}
        <div className="flex items-center gap-3 border-t border-[var(--os-border)] px-4 py-2 text-[10.5px] text-[var(--os-ink-subtle)]">
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-[var(--os-border-strong)] px-1">↑</kbd><kbd className="rounded border border-[var(--os-border-strong)] px-1">↓</kbd> navigate</span>
          <span className="inline-flex items-center gap-1"><kbd className="rounded border border-[var(--os-border-strong)] px-1">↵</kbd> open</span>
          <span className="ml-auto tabular-nums">{empty ? "Type to search clients & pages" : `${results.length} result${results.length === 1 ? "" : "s"}`}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
