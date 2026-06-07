"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { AgentAvatar } from "@/components/os/primitives";
import { integrations, integrationCategories, type Integration } from "@/lib/os-integrations";
import { mcpServer, accessTokens } from "@/lib/os-api";

const SOON = [
  { label: "General", icon: I.settings },
  { label: "Members", icon: I.clients },
  { label: "Trust & autonomy", icon: I.shield },
  { label: "Billing", icon: I.returns },
];

const connectedCount = integrations.filter(i => i.status === "connected").length;

function IntegrationCard({ it }: { it: Integration }) {
  const connected = it.status === "connected";
  return (
    <div className="flex flex-col rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-3.5 transition-colors hover:border-[var(--os-border-strong)]">
      <div className="flex items-start gap-2.5">
        <AgentAvatar gradient={it.gradient} icon={it.glyph} size={32} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold text-[var(--os-ink)]">{it.name}</div>
          {connected ? (
            <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <Icon icon={I.check} size={12} /> Connected
            </div>
          ) : (
            <div className="mt-0.5 text-[11px] text-[var(--os-ink-subtle)]">Not connected</div>
          )}
        </div>
      </div>
      <p className="mt-2 flex-1 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{it.desc}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {connected && it.account ? (
          <span className="truncate text-[11px] text-[var(--os-ink-subtle)]">{it.account} · {it.lastSync}</span>
        ) : <span />}
        {connected ? (
          <button className="shrink-0 rounded-md px-2 py-1 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">Manage</button>
        ) : (
          <button className="shrink-0 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--os-ink)] hover:bg-[var(--os-hover)]">Connect</button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<"connected" | "all">("all");
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const shown = tab === "connected" ? integrations.filter(i => i.status === "connected") : integrations;

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        {/* settings rail */}
        <aside className="flex w-[208px] shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border)] px-2.5 py-3">
          <div className="os-label mb-1 px-2">Workspace</div>
          <div className="mb-3 space-y-0.5">
            {SOON.map(s => (
              <div key={s.label} className="flex h-7 cursor-default items-center gap-2 rounded-md px-2 text-[13px] text-[var(--os-ink-subtle)]">
                <Icon icon={s.icon} size={15} className="shrink-0 opacity-60" />
                <span className="truncate">{s.label}</span>
                <span className="ml-auto rounded bg-[var(--os-selected)] px-1.5 text-[10px] font-medium text-[var(--os-ink-subtle)]">Soon</span>
              </div>
            ))}
          </div>

          <div className="os-label mb-1 px-2">Connections</div>
          <button onClick={() => scrollTo("integrations")} className="flex h-7 items-center gap-2 rounded-md bg-[var(--os-selected)] px-2 text-left text-[13px] font-medium text-[var(--os-ink)]">
            <Icon icon={I.globe} size={15} className="shrink-0" /> <span className="truncate">Integrations</span>
          </button>
          <button onClick={() => scrollTo("developer")} className="flex h-7 items-center gap-2 rounded-md px-2 text-left text-[13px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
            <Icon icon={I.shield} size={15} className="shrink-0" /> <span className="truncate">API &amp; MCP</span>
          </button>
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[840px] px-6 py-6">
            {/* header */}
            <div id="integrations" className="mb-4 scroll-mt-4">
              <h2 className="text-[15px] font-semibold os-display">Integrations</h2>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink-muted)]">
                Connect your stack. Petal reads from these to draft work and keep records in sync — writes stay gated by trust tiers.
              </p>
            </div>

            {/* tabs */}
            <div className="mb-5 flex items-center gap-1 border-b border-[var(--os-border)]">
              {([["all", "All"], ["connected", "Connected"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn("relative flex items-center gap-1.5 px-2.5 py-2 text-[13px] transition-colors", tab === k ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}
                >
                  {label}
                  <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{k === "connected" ? connectedCount : integrations.length}</span>
                  {tab === k && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
                </button>
              ))}
            </div>

            {/* categorized grid */}
            {integrationCategories.map(cat => {
              const items = shown.filter(i => i.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat} className="mb-7">
                  <div className="os-label mb-2.5">{cat}</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map(it => <IntegrationCard key={it.id} it={it} />)}
                  </div>
                </div>
              );
            })}

            <div className="mb-9 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--os-border)] px-8 py-3 text-[12px] text-[var(--os-ink-subtle)]">
              Don&apos;t see what you use? <button className="font-medium text-[var(--os-accent)] hover:underline">Request an integration</button>
            </div>

            {/* ── Developer · API & MCP (the agentic read layer, kept compact) ── */}
            <div id="developer" className="scroll-mt-4 border-t border-[var(--os-border)] pt-6">
              <div className="mb-3">
                <h2 className="text-[15px] font-semibold os-display">API &amp; MCP</h2>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">
                  For builders: read your firm OS over REST or a native MCP server. Reads are open to authorized keys; writes are gated by trust tiers.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-4">
                <div className="flex items-center gap-3">
                  <AgentAvatar gradient="from-emerald-500 to-teal-500" icon={I.sparkle} size={32} rounded={10} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[var(--os-ink)]">Petal MCP</span>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]"><span className="size-1.5 rounded-full bg-emerald-500" /> Live</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-[var(--os-ink-subtle)]">{mcpServer.protocol} · {mcpServer.tools} tools · {accessTokens.length} keys</div>
                  </div>
                  <button className="shrink-0 rounded-md bg-[var(--os-primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--os-primary-fg)]">Add to Claude</button>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-2">
                  <Icon icon={I.globe} size={14} className="shrink-0 text-[var(--os-ink-subtle)]" />
                  <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-[var(--os-ink)]">{mcpServer.url}</code>
                  <button onClick={() => copy(mcpServer.url)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]">
                    <Icon icon={copied ? I.check : I.copy} size={13} className={cn(copied && "text-emerald-600")} /> {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
