"use client";

// Petal AI takeover — pressing "Petal AI" in the sidebar sweeps the glass across
// the shell (same mechanism as Chat History) and turns the left column into an
// AI sidebar: New chat on top, then the AI surfaces (Agents, Skills, Knowledge,
// Memory, Connections, Activity), then recent chats. Picking one routes and
// closes. The canvas stays framed behind the glass.

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Users, BookOpen, Brain, Blocks, Activity, ChevronsUpDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { recentChats } from "@/lib/fixtures/firm";
import { agents } from "@/lib/fixtures/agents";

type NavItem = { label: string; href: string; icon?: LucideIcon; petal?: boolean; badge?: string };

const NAV: NavItem[] = [
  { label: "Agents", href: "/os/agents", icon: Users },
  { label: "Knowledge", href: "/os/knowledge", icon: BookOpen },
  { label: "Memory", href: "/os/memory", icon: Brain },
  { label: "Connections", href: "/os/connections", icon: Blocks },
  { label: "Activity", href: "/os/activity", icon: Activity },
];

export function PetalAiOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const recents = recentChats.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // navigate the canvas but keep the AI sidebar open (the canvas floats above the glass)
  const goto = (href: string) => { router.push(href); };
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <motion.div
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
        {/* top — same as the real sidebar header (workspace switcher), with the
            notification bell swapped for a search icon */}
        <div className="flex items-center gap-1.5 px-3 pb-2 pt-3">
          <button onClick={onClose} className="-mx-1 flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-1 transition-colors hover:bg-[var(--os-hover)]">
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]"><PetalMark className="size-3.5" /></span>
            <span className="truncate text-[14px] font-semibold text-[var(--os-ink)]">Vazant EA</span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-[var(--os-ink-subtle)]" />
          </button>
          <button
            onClick={() => { setSearching(s => !s); if (searching) setQuery(""); }}
            aria-label="Search"
            className={cn("grid size-7 shrink-0 place-items-center rounded-md transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", searching ? "text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}
          >
            <Icon icon={I.search} size={16} />
          </button>
          <button
            onClick={onClose}
            aria-label="Close Petal AI"
            className="grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]"
          >
            <Icon icon={I.close} size={16} />
          </button>
        </div>

        {/* compact search — only when the search icon is active */}
        {searching && (
          <div className="px-2 pb-1.5">
            <div className="flex h-8 items-center gap-2 rounded-md bg-[var(--os-hover)] px-2.5">
              <Icon icon={I.search} size={14} className="shrink-0 text-[var(--os-ink-subtle)]" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search chats"
                className="w-full bg-transparent text-[13px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
              />
            </div>
          </div>
        )}

        {/* AI surfaces */}
        <div className="space-y-0.5 px-2 pt-1">
          {NAV.map(n => {
            const active = isActive(n.href);
            return (
              <button
                key={n.href}
                onClick={() => goto(n.href)}
                className={cn(
                  "flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors",
                  active ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
                )}
              >
                {n.petal ? <PetalMark className="size-3.5 shrink-0" /> : n.icon ? <n.icon className="size-[15px] shrink-0" /> : null}
                <span className="flex-1 truncate text-left">{n.label}</span>
                {n.label === "Agents" && (
                  <span className="shrink-0 rounded-full bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{agents.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* recents */}
        <div className="os-label px-3 pb-1 pt-4">Recent chats</div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {recents.length === 0 && (
            <p className="px-2 py-2 text-[12.5px] text-[var(--os-ink-subtle)]">No chats match.</p>
          )}
          {recents.map(c => (
            <button key={c.id} onClick={() => goto(`/os/ask?q=${encodeURIComponent(c.title)}`)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--os-hover)]">
              <span className={cn("size-1.5 shrink-0 rounded-full", c.unread ? "bg-[var(--os-info)]" : "bg-[var(--os-border-strong)]")} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink-muted)]">{c.title}</span>
            </button>
          ))}
        </div>

        {/* new chat — pinned to the bottom, like the sidebar */}
        <div className="shrink-0 border-t border-[var(--os-border)] px-2 py-2">
          <button
            onClick={() => goto("/os/ask")}
            className="flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-[var(--os-border)] bg-[var(--os-surface)] text-[13px] font-medium text-[var(--os-ink)] shadow-[0_1px_2px_rgba(17,17,26,0.05)] transition-colors hover:bg-[var(--os-hover)]"
          >
            <PetalMark className="size-4" /> New chat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
