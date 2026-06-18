"use client";

// /os/connections — the firm's integration stack. Catalog grouped by category;
// each tile connects/disconnects live (connection-store). Petal reads from connected
// sources to draft work and keep records in sync; writes stay gated by trust tiers.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { integrationCategories, type Integration } from "@/lib/os-integrations";
import { connectionStore, useConnections } from "@/lib/connection-store";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
type Filter = "all" | "connected" | "available";

/** brand logo on a white tile, falling back to the gradient + glyph when missing */
function LogoTile({ i }: { i: Integration }) {
  const [err, setErr] = useState(false);
  if (i.logo && !err) {
    return (
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--os-border)] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={i.logo} alt="" className="size-6 object-contain" onError={() => setErr(true)} />
      </span>
    );
  }
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white", i.gradient)}>
      <Icon icon={i.glyph} size={20} className="text-white" />
    </span>
  );
}

function ConnectionCard({ i, onToast }: { i: Integration; onToast: (m: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const connected = i.status === "connected";

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const connect = () => { connectionStore.connect(i.id); onToast(`Connected ${i.name}`); };
  const disconnect = () => { connectionStore.disconnect(i.id); setMenuOpen(false); onToast(`Disconnected ${i.name}`); };

  return (
    <div className={cn("flex flex-col rounded-xl border bg-[var(--os-card)] p-3.5 transition-colors", connected ? "border-[var(--os-border-strong)]" : "border-[var(--os-border)] hover:border-[var(--os-border-strong)]")}>
      <div className="flex items-start gap-3">
        <LogoTile i={i} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-semibold text-[var(--os-ink)]">{i.name}</span>
          </div>
          <div className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[var(--os-ink-muted)]">{i.desc}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-[var(--os-border)] pt-2.5">
        {connected ? (
          <>
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[11.5px] text-[var(--os-ink-muted)]">
              <span className="size-1.5 shrink-0 rounded-full bg-[var(--os-success)]" />
              <span className="truncate">{i.account ?? "Connected"}{i.lastSync ? ` · ${i.lastSync}` : ""}</span>
            </span>
            <div className="relative shrink-0" ref={menuRef}>
              <button onClick={() => setMenuOpen(o => !o)} aria-label="Options" className={cn("grid size-6 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
                <Icon icon={I.more} size={15} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-20 w-36 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-[0_10px_34px_rgba(17,17,26,0.13)]">
                  <button onClick={disconnect} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] text-[var(--os-danger)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                    <Icon icon={I.close} size={13} /> Disconnect
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button onClick={connect} className={cn("ml-auto inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
            <Icon icon={I.plus} size={13} /> Connect
          </button>
        )}
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const all = useConnections();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (m: string) => { setToast(m); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2400); };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const connectedCount = all.filter(i => i.status === "connected").length;
  const q = query.trim().toLowerCase();
  const visible = all.filter(i =>
    (filter === "all" || i.status === filter) &&
    (!q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)),
  );

  const FILTERS: { key: Filter; label: string; n: number }[] = [
    { key: "all", label: "All", n: all.length },
    { key: "connected", label: "Connected", n: connectedCount },
    { key: "available", label: "Available", n: all.length - connectedCount },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="os-display text-[24px] font-semibold text-[var(--os-ink)]">Connections</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--os-ink-muted)]">
              <PetalMark className="size-3.5 text-[var(--os-ink-subtle)]" />
              Petal reads from connected tools to draft work and keep records in sync.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="os-display text-[22px] font-semibold leading-none tabular-nums text-[var(--os-ink)]">{connectedCount}</div>
            <div className="mt-1 text-[11px] text-[var(--os-ink-subtle)]">connected</div>
          </div>
        </div>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--os-border)] px-8 py-2.5">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-0.5">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium transition-colors", FOCUS, filter === f.key ? "bg-[var(--os-selected)] text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}
            >
              {f.label}
              <span className="tabular-nums text-[var(--os-ink-subtle)]">{f.n}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Icon icon={I.search} size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--os-ink-subtle)]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search connections…"
            className={cn("h-8 w-[220px] rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] pl-8 pr-2.5 text-[13px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)] focus:border-[var(--os-border-strong)]", FOCUS)}
          />
        </div>
      </div>

      {/* catalog grouped by category */}
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        {visible.length === 0 ? (
          <div className="grid place-items-center py-20 text-center text-[13px] text-[var(--os-ink-muted)]">No connections match.</div>
        ) : (
          <div className="space-y-7">
            {integrationCategories.map(cat => {
              const items = visible.filter(i => i.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat}>
                  <h2 className="os-label mb-2.5">{cat}</h2>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map(i => <ConnectionCard key={i.id} i={i} onToast={show} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 6, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 6, x: "-50%" }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="fixed bottom-5 left-1/2 z-50 rounded-md bg-[var(--os-primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--os-primary-fg)] shadow-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
