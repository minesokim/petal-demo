"use client";

import { useState } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { AgentAvatar, SkillPetal, TrustDial, MemberAvatar } from "@/components/os/primitives";
import { integrations, integrationCategories, type Integration } from "@/lib/os-integrations";
import { mcpServer, accessTokens } from "@/lib/os-api";
import {
  skills, firmMembers, roleMeta, ROLE_PERMISSIONS, PERMISSIONS, PERMISSION_LABEL, isCurrentUser,
  type FirmRole,
} from "@/lib/fixtures/firm";
import { skillCategoryMeta, trustTierMeta, type TrustTier } from "@/lib/fixtures/vocab";

const ROLE_ORDER: FirmRole[] = ["owner", "reviewer", "preparer", "admin"];

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]";

const SOON_AFTER = [
  { label: "Billing", icon: I.returns },
];

const connectedCount = integrations.filter(i => i.status === "connected").length;

type SectionId = "members" | "trust" | "integrations" | "developer";

function SoonRow({ label, icon }: { label: string; icon: IconSvgElement }) {
  return (
    <div className="flex h-7 cursor-default items-center gap-2 rounded-md px-2 text-[13px] text-[var(--os-ink-subtle)]">
      <Icon icon={icon} size={15} className="shrink-0 opacity-60" />
      <span className="truncate">{label}</span>
      <span className="ml-auto rounded bg-[var(--os-selected)] px-1.5 text-[10px] font-medium text-[var(--os-ink-subtle)]">Soon</span>
    </div>
  );
}

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
          <button className={cn("shrink-0 rounded-md px-2 py-1 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>Manage</button>
        ) : (
          <button className={cn("shrink-0 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--os-ink)] hover:bg-[var(--os-hover)]", FOCUS)}>Connect</button>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<"connected" | "all">("all");
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState<SectionId>("members");

  // Trust & autonomy — per-skill dials, local state seeded from fixtures.
  const [tiers, setTiers] = useState<Record<string, TrustTier>>(
    () => Object.fromEntries(skills.map(s => [s.id, s.trust])),
  );
  const docChase = skills.find(s => s.graduation);
  const grad = docChase?.graduation;
  const [gradChoice, setGradChoice] = useState<"open" | "promoted" | "kept">("open");
  const showGrad = !!docChase && !!grad && gradChoice === "open" && tiers[docChase.id] < grad.promoteTo;

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  const go = (id: SectionId) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const shown = tab === "connected" ? integrations.filter(i => i.status === "connected") : integrations;

  const navBtn = (id: SectionId, label: string, icon: IconSvgElement) => (
    <button
      onClick={() => go(id)}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors",
        active === id
          ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]"
          : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
        FOCUS,
      )}
    >
      <Icon icon={icon} size={15} className="shrink-0" /> <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1">
        {/* settings rail */}
        <aside className="flex w-[208px] shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border)] px-2.5 py-3">
          <div className="os-label mb-1 px-2">Workspace</div>
          <div className="mb-3 space-y-0.5">
            <SoonRow label="General" icon={I.settings} />
            {navBtn("members", "Members", I.clients)}
            {navBtn("trust", "Trust & autonomy", I.shield)}
            {SOON_AFTER.map(s => <SoonRow key={s.label} label={s.label} icon={s.icon} />)}
          </div>

          <div className="os-label mb-1 px-2">Connections</div>
          {navBtn("integrations", "Integrations", I.globe)}
          {navBtn("developer", "API & MCP", I.link)}
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[840px] px-6 py-6">
            {/* ── Members ── */}
            <div id="members" className="mb-4 scroll-mt-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold os-display">Members</h2>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink-muted)]">Your firm's team and what each role can do.</p>
                </div>
                <button className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[13px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}>
                  <Icon icon={I.plus} size={14} /> Invite member
                </button>
              </div>
            </div>

            {/* roster */}
            <div className="overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)]">
              {firmMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 border-b border-[var(--os-border)] px-3.5 py-3 last:border-b-0">
                  <MemberAvatar memberId={m.id} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[13px] font-medium text-[var(--os-ink)]">{m.name}</span>
                      {m.credential && <span className="text-[11px] font-medium text-[var(--os-ink-subtle)]">{m.credential}</span>}
                      {isCurrentUser(m.id) && <span className="rounded bg-[var(--os-selected)] px-1.5 text-[10px] font-medium text-[var(--os-ink-muted)]">You</span>}
                    </div>
                    <div className="truncate text-[12px] text-[var(--os-ink-subtle)]">{m.email}</div>
                  </div>
                  <span className={cn("inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium", roleMeta[m.role].tint)} title={roleMeta[m.role].blurb}>
                    {roleMeta[m.role].label}
                  </span>
                  <button aria-label="Member options" className={cn("grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
                    <Icon icon={I.more} size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* permissions matrix */}
            <div className="mb-10 mt-5">
              <div className="os-label mb-2">Role permissions</div>
              <div className="overflow-x-auto rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)]">
                <div className="min-w-[520px]">
                  <div className="grid border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)]" style={{ gridTemplateColumns: "minmax(150px,1.4fr) repeat(4, 1fr)" }}>
                    <div className="px-3.5 py-2 os-label">Permission</div>
                    {ROLE_ORDER.map(r => (
                      <div key={r} className="flex items-center gap-1.5 px-3 py-2">
                        <span className={cn("size-1.5 rounded-full", roleMeta[r].dot)} />
                        <span className="text-[11px] font-medium text-[var(--os-ink-muted)]">{roleMeta[r].label}</span>
                      </div>
                    ))}
                  </div>
                  {PERMISSIONS.map(p => (
                    <div key={p} className="grid border-b border-[var(--os-border)] last:border-b-0" style={{ gridTemplateColumns: "minmax(150px,1.4fr) repeat(4, 1fr)" }}>
                      <div className="px-3.5 py-2 text-[13px] text-[var(--os-ink)]">{PERMISSION_LABEL[p]}</div>
                      {ROLE_ORDER.map(r => (
                        <div key={r} className="flex items-center px-3 py-2">
                          {ROLE_PERMISSIONS[r].includes(p)
                            ? <Icon icon={I.check} size={14} className="text-emerald-600" />
                            : <span className="text-[var(--os-border-strong)]">—</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Trust & autonomy ── */}
            <div id="trust" className="scroll-mt-4 border-t border-[var(--os-border)] pt-6 mb-4">
              <h2 className="text-[15px] font-semibold os-display">Trust &amp; autonomy</h2>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink-muted)]">
                Petal prepares everything; what it may <span className="font-medium text-[var(--os-ink)]">do</span> is set per skill.
              </p>
            </div>

            {/* per-skill dials */}
            <div className="overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)]">
              {skills.map(s => {
                const tier = tiers[s.id];
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--os-border)] px-3.5 py-3 last:border-b-0">
                    <SkillPetal category={s.category} size={20} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[13px] font-medium text-[var(--os-ink)]">{s.name}</span>
                        <span className="text-[11px] text-[var(--os-ink-subtle)]">{skillCategoryMeta[s.category].label}</span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-[var(--os-ink-muted)]">{trustTierMeta[tier].blurb}</div>
                    </div>
                    <TrustDial tier={tier} onChange={t => setTiers(prev => ({ ...prev, [s.id]: t }))} />
                  </div>
                );
              })}
            </div>

            {/* Doc Chase graduation */}
            {docChase && grad && showGrad && (
              <div className="mt-4 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-4 py-3.5">
                <div className="flex items-start gap-2">
                  <PetalMark className="mt-0.5 size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
                  <p className="text-[13px] leading-relaxed text-[var(--os-ink)]">{grad.prompt}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setGradChoice("promoted");
                      setTiers(prev => ({ ...prev, [docChase.id]: grad.promoteTo }));
                    }}
                    className={cn("flex h-7 items-center rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}
                  >
                    Promote to {trustTierMeta[grad.promoteTo].code}
                  </button>
                  <button
                    onClick={() => setGradChoice("kept")}
                    className={cn("flex h-7 items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}
                  >
                    Keep approving
                  </button>
                </div>
              </div>
            )}
            {docChase && grad && gradChoice === "promoted" && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-3 py-2 text-[12px] text-[var(--os-ink)]">
                <Icon icon={I.check} size={14} className="shrink-0 text-emerald-600" />
                {docChase.name} promoted to {trustTierMeta[grad.promoteTo].code} — acts after 24h unless you stop it
              </div>
            )}
            {docChase && gradChoice === "kept" && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-3 py-2 text-[12px] text-[var(--os-ink-muted)]">
                <Icon icon={I.check} size={14} className="shrink-0" />
                Keeping approval on every send — {docChase.name} stays at {trustTierMeta[tiers[docChase.id]].code}.
              </div>
            )}

            {/* assurances */}
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-4 py-3.5">
              <Icon icon={I.shield} size={15} className="mt-0.5 shrink-0 text-[var(--os-ink-muted)]" />
              <p className="text-[12px] leading-relaxed text-[var(--os-ink-muted)]">
                Your skills, processes, and client data are never shared with other firms and never used to train models. Zero-data-retention agreements with model providers. §7216 consent templates included.
              </p>
            </div>

            {/* onboarding strip */}
            <div className="mb-10 mt-3 rounded-lg border border-dashed border-[var(--os-border)] px-4 py-3 text-[12px] text-[var(--os-ink-subtle)]">
              Set up in under an hour: import last year&apos;s returns → Petal builds each client&apos;s checklist → the chase is running.
            </div>

            {/* ── Integrations ── */}
            <div id="integrations" className="mb-4 scroll-mt-4 border-t border-[var(--os-border)] pt-6">
              <h2 className="text-[15px] font-semibold os-display">Integrations</h2>
              <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--os-ink-muted)]">
                Connect your stack. Petal reads from these to draft work and keep records in sync —{" "}
                <button onClick={() => go("trust")} className={cn("rounded-sm text-[var(--os-accent)] hover:underline", FOCUS)}>
                  writes stay gated by trust tiers
                </button>.
              </p>
            </div>

            {/* tabs */}
            <div className="mb-5 flex items-center gap-1 border-b border-[var(--os-border)]">
              {([["all", "All"], ["connected", "Connected"]] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn("relative flex items-center gap-1.5 px-2.5 py-2 text-[13px] transition-colors", tab === k ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]", FOCUS)}
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
              Don&apos;t see what you use? <button className={cn("font-medium text-[var(--os-accent)] hover:underline", FOCUS)}>Request an integration</button>
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
