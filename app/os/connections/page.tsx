"use client";

// /os/connections — "Apps". A marketplace for the firm's stack: connect the tools
// Petal reads from to draft work and keep records in sync (writes stay gated by
// trust tiers). Hero shows live example actions; the grid connects/disconnects via
// connection-store. Brand logos on white tiles, colored gradient fallback otherwise.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/os/icon";
import { browserHealthMeta, type Integration } from "@/lib/os-integrations";
import { connectionStore, useConnections } from "@/lib/connection-store";
import { connectAppAction, getConnectedToolkitsAction, syncConnectionsAction } from "./actions";
import { Search, Plus, Check, ChevronDown, ArrowDownUp, X, Puzzle } from "lucide-react";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

/** brand logo on a white tile, falling back to the gradient + glyph when missing */
function LogoTile({ i, size = 40 }: { i: Integration; size?: number }) {
  const [err, setErr] = useState(false);
  if (i.logo && !err) {
    return (
      <span className="grid shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--os-border)] bg-white" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={i.logo} alt="" className="object-contain" style={{ width: size * 0.6, height: size * 0.6 }} onError={() => setErr(true)} />
      </span>
    );
  }
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white", i.gradient)} style={{ width: size, height: size }}>
      <Icon icon={i.glyph} size={size * 0.5} className="text-white" />
    </span>
  );
}

// Live example cards in the hero — each app paired with the tax work Petal runs off it.
const HERO: { id: string; action: string }[] = [
  { id: "gmail", action: "Draft replies to the clients you're behind on" },
  { id: "qbo", action: "Flag ledger variances before you prep" },
  { id: "gcal", action: "Brief you before every client call" },
];

function HeroCard({ i, action }: { i: Integration; action: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white/85 px-3.5 py-2.5 shadow-[0_2px_10px_rgba(17,17,26,0.06)] backdrop-blur">
      <LogoTile i={i} size={22} />
      <span className="shrink-0 text-[13px] font-semibold text-[#1f1f22]">{i.name}</span>
      <span className="truncate text-[13px] text-[#5c5b59]">{action}</span>
    </div>
  );
}

function AppCard({ i, onToast, onBrowserConnect }: { i: Integration; onToast: (m: string) => void; onBrowserConnect: (i: Integration) => void }) {
  const connected = i.status === "connected";
  const browser = i.kind === "browser";
  const health = browser && connected ? (i.health ?? "ok") : undefined;
  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--os-hover)]">
      <LogoTile i={i} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13.5px] font-semibold text-[var(--os-ink)]">{i.name}</span>
          {browser && <span className="shrink-0 rounded bg-[var(--os-selected)] px-1.5 py-px text-[10px] font-medium text-[var(--os-ink-muted)]">Automated access</span>}
        </div>
        <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{i.desc}</div>
      </div>
      {health ? (
        <span className={cn("flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium", browserHealthMeta[health].text)} title={browserHealthMeta[health].label}>
          <span className={cn("size-1.5 rounded-full", browserHealthMeta[health].dot)} />
          {browserHealthMeta[health].label}
        </span>
      ) : connected ? (
        <span className="grid size-7 shrink-0 place-items-center text-[var(--os-success)]" title="Connected" aria-label="Connected"><Check className="size-4" /></span>
      ) : (
        <button onClick={() => { if (browser) onBrowserConnect(i); else { onToast(`Opening ${i.name} authorization…`); void connectAppAction(i.id).then(r => { if ("redirectUrl" in r && r.redirectUrl) window.open(r.redirectUrl, "_blank", "noopener,noreferrer"); else onToast("error" in r ? r.error : `Couldn't start ${i.name} connection`); }); } }} aria-label={`Connect ${i.name}`}
          className={cn("grid size-7 shrink-0 place-items-center rounded-full border border-[var(--os-border)] bg-[var(--os-surface)] text-[var(--os-ink-muted)] transition-colors hover:border-[var(--os-border-strong)] hover:text-[var(--os-ink)]", FOCUS)}>
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  );
}

// Browser-extension connect flow — the honest "we drive it in your own browser" dialog.
function ExtensionConnectModal({ i, extInstalled, onInstall, onConnect, onClose }: { i: Integration; extInstalled: boolean; onInstall: () => void; onConnect: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[460px] rounded-2xl border border-[var(--os-border)] bg-[var(--os-card)] p-5 shadow-[0_24px_60px_rgba(17,17,26,0.22)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <LogoTile i={i} size={36} />
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-semibold text-[var(--os-ink)]">Connect {i.name}</h3>
            <p className="text-[11.5px] text-[var(--os-ink-subtle)]">Automated access · Petal browser extension</p>
          </div>
          <button onClick={onClose} aria-label="Close" className={cn("rounded p-1 text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}><X className="size-4" /></button>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-[var(--os-ink-muted)]">
          {i.name} has no API, so Petal drives it right in your own browser, using the session you're already signed into. Your password and login session never leave your machine.
        </p>

        {/* step 1 — the extension */}
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3.5 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--os-card)] text-[var(--os-ink-muted)]"><Puzzle className="size-4" /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-[var(--os-ink)]">Petal browser extension</div>
            <div className="text-[11.5px] text-[var(--os-ink-subtle)]">{extInstalled ? "Installed and running in your browser" : "Required — it runs the automation in your browser"}</div>
          </div>
          {extInstalled
            ? <span className="flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-[var(--os-success)]"><Check className="size-3.5" /> Installed</span>
            : <button onClick={onInstall} className={cn("inline-flex h-7 shrink-0 items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>Add to Chrome</button>}
        </div>

        {/* steps 2-3 — what happens after */}
        <ol className="mt-4 space-y-2.5">
          {[
            "Stay signed in to OLT in your browser — your login, your MFA.",
            "Run a pull: the extension operates OLT in your tab, reads every value back, and reconciles it against the source document. Writes into a return queue for your approval.",
          ].map((s, idx) => (
            <li key={idx} className="flex gap-2.5 text-[12.5px] leading-snug text-[var(--os-ink)]">
              <span className="grid size-5 shrink-0 place-items-center rounded-full border border-[var(--os-border-strong)] bg-white text-[10px] font-semibold tabular-nums text-[var(--os-ink-muted)]">{idx + 2}</span>
              {s}
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-center gap-2">
          <button onClick={onConnect} disabled={!extInstalled} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100", FOCUS)}>Connect {i.name}</button>
          <button onClick={onClose} className={cn("inline-flex h-8 items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[12.5px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>Cancel</button>
        </div>
        <p className="mt-3 text-[11px] leading-snug text-[var(--os-ink-subtle)]">Runs while your browser is open — nothing happens in the background. No password or session ever reaches Petal's servers.</p>
      </div>
    </div>
  );
}

type Sort = "featured" | "name" | "connected";
const SORTS: { key: Sort; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "name", label: "Name" },
  { key: "connected", label: "Connected first" },
];

export default function AppsPage() {
  const all = useConnections();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<Integration | null>(null);
  const [extInstalled, setExtInstalled] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (m: string) => { setToast(m); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 2400); };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  // Seed the catalog with the firm's REAL connection status. Null = not signed in, so the
  // mockup's catalog defaults render untouched (signed-out stays 1:1). Only OAuth/Composio
  // connectors are reconciled; browser connectors keep their catalog state.
  useEffect(() => {
    let cancelled = false;
    const reconcile = (connected: string[] | null) => {
      if (cancelled || connected === null) return; // not signed in → keep catalog defaults (mockup 1:1)
      const MANAGED = ["gmail", "qbo", "gcal", "outlook", "xero", "dropbox", "onedrive"];
      const set = new Set(connected);
      for (const id of MANAGED) { if (set.has(id)) connectionStore.connect(id); else connectionStore.disconnect(id); }
    };
    // Poll Composio for any pending authorizations, then reflect real connected state.
    const refresh = () => { void syncConnectionsAction().catch(() => {}).then(() => getConnectedToolkitsAction()).then(reconcile).catch(() => {}); };
    refresh();
    // When you come back from the authorize tab, re-check so the checkmark appears.
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => { cancelled = true; window.removeEventListener("focus", onFocus); };
  }, []);
  useEffect(() => {
    if (!sortOpen) return;
    const onDown = (e: MouseEvent) => { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [sortOpen]);

  const byId = (id: string) => all.find(i => i.id === id);
  const connectedCount = all.filter(i => i.status === "connected").length;

  const q = query.trim().toLowerCase();
  let visible = all.filter(i => !q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q));
  if (sort === "name") visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "connected") visible = [...visible].sort((a, b) => Number(b.status === "connected") - Number(a.status === "connected"));

  return (
    <div className="h-full overflow-y-auto bg-[var(--os-canvas)]">
      <div className="mx-auto max-w-[840px] px-6 py-8">
        {/* hero header */}
        <h1 className="text-center text-[24px] font-semibold tracking-[-0.02em] text-[var(--os-ink)] os-display">Connect the tools your firm already uses</h1>
        <p className="mt-1.5 text-center text-[13px] text-[var(--os-ink-muted)]">Petal reads from what you connect to draft work and keep records in sync. {connectedCount} connected.</p>

        {/* search + sort */}
        <div className="mt-6 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--os-ink-subtle)]" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search marketplace…"
              className={cn("h-10 w-full rounded-full border border-[var(--os-border)] bg-[var(--os-surface)] pl-10 pr-4 text-[13.5px] text-[var(--os-ink)] outline-none transition-colors placeholder:text-[var(--os-ink-subtle)] focus:border-[var(--os-border-strong)]", FOCUS)} />
          </div>
          <div className="relative shrink-0" ref={sortRef}>
            <button onClick={() => setSortOpen(o => !o)} className={cn("inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--os-border)] bg-[var(--os-surface)] px-3.5 text-[13px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
              <ArrowDownUp className="size-3.5 text-[var(--os-ink-subtle)]" /> {SORTS.find(s => s.key === sort)!.label}
              <ChevronDown className="size-3.5 text-[var(--os-ink-subtle)]" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-12 z-20 w-44 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-1.5 shadow-[0_10px_34px_rgba(17,17,26,0.13)]">
                {SORTS.map(s => (
                  <button key={s.key} onClick={() => { setSort(s.key); setSortOpen(false); }} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
                    {s.key === sort ? <Check className="size-3.5 text-[var(--os-success)]" /> : <span className="size-3.5" />}
                    <span className="text-[var(--os-ink)]">{s.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* hero banner — live example actions */}
        <div className="relative mt-5 overflow-hidden rounded-2xl border border-[var(--os-border)]"
          style={{ background: "linear-gradient(108deg, #d4e6ff 0%, #e9ddf7 28%, #ffe6cf 64%, #fef0c9 100%)" }}>
          <div className="mx-auto flex max-w-[600px] flex-col gap-2.5 px-6 py-9">
            {HERO.map(h => { const i = byId(h.id); return i ? <HeroCard key={h.id} i={i} action={h.action} /> : null; })}
          </div>
        </div>

        {/* featured grid */}
        <div className="mt-8">
          <h2 className="mb-2 text-[15px] font-semibold text-[var(--os-ink)]">{q ? `${visible.length} result${visible.length === 1 ? "" : "s"}` : "Featured"}</h2>
          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--os-border-strong)] px-4 py-8 text-center text-[13px] text-[var(--os-ink-muted)]">No apps match “{query}”.</div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              {visible.map(i => <AppCard key={i.id} i={i} onToast={show} onBrowserConnect={setHandoff} />)}
            </div>
          )}
        </div>
      </div>

      {handoff && (
        <ExtensionConnectModal
          i={handoff}
          extInstalled={extInstalled}
          onInstall={() => { setExtInstalled(true); show("Petal extension installed"); }}
          onConnect={() => { connectionStore.connect(handoff.id); show(`Connected ${handoff.name} · running in your browser`); setHandoff(null); }}
          onClose={() => setHandoff(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--os-primary)] px-4 py-2 text-[12.5px] font-medium text-[var(--os-primary-fg)] shadow-[0_10px_34px_rgba(17,17,26,0.25)]">
          {toast}
        </div>
      )}
    </div>
  );
}
