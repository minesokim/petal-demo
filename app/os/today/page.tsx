"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { AgentAvatar } from "@/components/os/primitives";
import { AskComposer } from "@/components/os/ask-composer";
import { agents } from "@/lib/os-agents";
import { triage } from "@/lib/os-triage";
import { returns } from "@/lib/os-entities";
import { brief, briefToneDot } from "@/lib/os-news";

const agentByName = (n?: string) => agents.find(a => a.name === n);
const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

// ── derived state ──
const needs = triage.filter(t => t.tier === "right_now" && t.trust !== "auto");
const handled = triage.filter(t => t.trust === "auto" && t.when !== "Running" && t.when !== "Scheduled");
const calls = triage.filter(t => t.type === "meeting_prep" && t.when === "Running");
const atRisk = returns.filter(r => r.stage !== "filed" && (r.urgency === "urgent" || r.urgency === "high"));

// "Your actions" counts (Solve home pattern, CPA context)
const reviewCount = triage.filter(t => (t.tier === "right_now" || t.tier === "today") && t.trust !== "auto").length;
const missingDocs = returns.reduce((s, r) => s + Math.max(0, r.docsRequired - r.docsSubmitted), 0);
const awaitingSign = returns.filter(r => r.stage === "pay_and_sign" || r.stage === "client_review").length;
const overdueCount = returns.filter(r => !r.depositPaid && r.stage !== "filed").length;

// "Close the books" — period close progress across business entities
const closeList = returns.filter(r => r.form === "1120S" || r.form === "1065" || r.form === "1120");
const closeDone = closeList.filter(r => r.stage === "filed").length;
const closeProg = closeList.filter(r => r.stage === "in_preparation" || r.stage === "client_review" || r.stage === "pay_and_sign").length;
const closeTodo = Math.max(0, closeList.length - closeDone - closeProg);
const closeTotal = closeList.length || 1;

// the returns most at risk, with their blocker (drives the readiness hero list)
const atRiskList = [
  { name: "DeShawn Williams", hid: "h-deshawn", blocker: "missing 5 documents" },
  { name: "Priya Sharma", hid: "h-priya", blocker: "missing 4 documents" },
  { name: "David Park", hid: "h-park", blocker: "position unresolved" },
];

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-card)] p-4 transition-colors duration-200 hover:border-[var(--os-border-hover)]", className)}>{children}</div>;
}
function CardHead({ title, mark, href }: { title: string; mark?: boolean; href?: string }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      {mark && <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" />}
      <h3 className="text-[12px] font-medium text-[var(--os-ink-muted)]">{title}</h3>
      {href && <Link href={href} className="ml-auto text-[12px] text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]">View all</Link>}
    </div>
  );
}
function Avatar({ name }: { name: string }) {
  return <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[9.5px] font-semibold text-[var(--os-ink-muted)]">{initials(name)}</span>;
}
// flat people avatar — records stay monochrome; color lives only on the agent layer (DESIGN.md §2a)
function PersonAvatar({ name }: { name: string }) {
  return <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-semibold text-[var(--os-ink-muted)]">{initials(name)}</span>;
}

/** Mercury-style period control (visual). */
function PeriodButton({ label, className }: { label: string; className?: string }) {
  return (
    <button className={cn("flex h-7 items-center gap-1 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]", className)}>
      {label} <Icon icon={I.chevronDown} size={12} />
    </button>
  );
}

/** Mercury-style soft area + thin line trend (monochrome). */
function MiniChart({ vals, max, h = 64, gradId }: { vals: number[]; max: number; h?: number; gradId: string }) {
  const W = 320, pad = 6;
  const stepX = W / (vals.length - 1);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const pts = vals.map((v, i) => `${(i * stepX).toFixed(1)} ${y(v).toFixed(1)}`);
  const line = "M " + pts.join(" L ");
  const area = `${line} L ${W} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: h }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke="#1a1a1a" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function TodayPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[780px] px-6 py-8">
          {/* greeting — hero cover banner */}
          <div className="relative mb-6 overflow-hidden rounded-xl border border-[var(--os-border)]">
            <img src="/images/today-banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_42%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
            <div className="relative px-7 py-8">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                <PetalMark className="size-3.5 text-white/85" /> Daily brief
              </div>
              <h2 className="text-[22px] font-semibold leading-tight text-white os-display">Good morning, Antonio</h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/85">
                Petal handled <span className="font-semibold text-white">{handled.length}</span> things overnight.{" "}
                <span className="font-semibold text-white">{needs.length}</span> need you, and{" "}
                <span className="font-semibold text-white">{atRisk.length}</span> returns are approaching their deadline.
              </p>
            </div>
          </div>

          <AskComposer />

          {/* Close the books — period close progress */}
          <div className="mb-6 rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-5 transition-colors duration-200 hover:border-[var(--os-border-hover)]">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[var(--os-ink)] os-display">Month-end close</h3>
              <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]">May 2026 <Icon icon={I.chevronDown} size={13} className="text-[var(--os-ink-subtle)]" /></button>
            </div>
            <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-[var(--os-selected)]">
              <div className="h-full bg-emerald-500" style={{ width: `${(closeDone / closeTotal) * 100}%` }} />
              <div className="h-full bg-amber-500" style={{ width: `${(closeProg / closeTotal) * 100}%` }} />
            </div>
            <div className="mt-3.5 flex items-center gap-10">
              {([["Completed", "bg-emerald-500", closeDone], ["In progress", "bg-amber-500", closeProg], ["Not started", "bg-[var(--os-border-strong)]", closeTodo]] as const).map(([label, dot, count]) => (
                <div key={label}>
                  <div className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]"><span className={cn("size-2 rounded-full", dot)} /> {label}</div>
                  <div className="mt-1 text-[20px] font-semibold tabular-nums os-display text-[var(--os-ink)]">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* ── Today's brief (the newspaper) ── */}
            <Card>
              <CardHead title="Today's brief" mark />
              <ul className="-mx-2 flex-1">
                {brief.map((b, i) => {
                  const body = (
                    <>
                      <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", briefToneDot[b.tone])} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-[13px] font-medium leading-snug text-[var(--os-ink)]">{b.headline}</span>
                          {b.source && <span className="shrink-0 text-[10px] font-medium tracking-wide text-[var(--os-ink-subtle)]">{b.source}</span>}
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-[var(--os-ink-muted)]">{b.detail}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={i}>
                      {b.href ? (
                        <Link href={b.href} className="flex gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]">{body}</Link>
                      ) : (
                        <div className="flex gap-2.5 px-2 py-2">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Link href="/os/reports" className="-mx-2 mt-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]">
                Read full brief <Icon icon={I.chevronRight} size={13} />
              </Link>
            </Card>

            {/* ── At risk (Linear) ── */}
            <Card>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-[12px] font-medium text-[var(--os-ink-muted)]">At risk</h3>
                <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{atRiskList.length}</span>
                <Link href="/os/clients" className="ml-auto text-[12px] text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]">View all</Link>
              </div>
              <div className="-mx-2">
                {atRiskList.map(a => (
                  <Link key={a.hid} href={`/os/clients/${a.hid}`} className="flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]">
                    <PersonAvatar name={a.name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{a.name}</div>
                      <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{a.blocker}</div>
                    </div>
                    <Icon icon={I.chevronRight} size={14} className="shrink-0 text-[var(--os-ink-subtle)]" />
                  </Link>
                ))}
              </div>
            </Card>

            {/* Petal activity — vertical summary box */}
              <div className="rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-4 transition-colors duration-200 hover:border-[var(--os-border-hover)]">
                <div className="mb-3 flex items-center gap-2">
                  <PetalMark className="size-4 text-[var(--os-ink)]" />
                  <h3 className="text-[13px] font-semibold text-[var(--os-ink)] os-display">Petal activity</h3>
                </div>
                <div className="space-y-0.5">
                  {([
                    { label: "Drafts awaiting approval", count: reviewCount, icon: I.sparkle, href: "/os/tasks" },
                    { label: "Documents outstanding", count: missingDocs, icon: I.file, href: "/os/documents" },
                    { label: "Awaiting signature", count: awaitingSign, icon: I.edit, href: "/os/tasks" },
                    { label: "Overdue invoices", count: overdueCount, icon: I.billing, href: "/os/billing" },
                  ]).map(a => (
                    <Link key={a.label} href={a.href} className="-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]">
                      <Icon icon={a.icon} size={16} className="shrink-0 text-[var(--os-ink-muted)]" />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{a.label}</span>
                      <span className="shrink-0 text-[18px] font-semibold tabular-nums os-display text-[var(--os-ink)]">{a.count}</span>
                    </Link>
                  ))}
                </div>
                <Link href="/os/tasks" className="-mx-2 mt-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]">
                  Open tasks <Icon icon={I.chevronRight} size={13} />
                </Link>
              </div>
              {calls.length > 0 && (
                <Card>
                  <CardHead title="Today's calls" />
                  {calls.map(t => (
                    <div key={t.id} className="flex items-center gap-3 py-1">
                      <span className="w-14 shrink-0 text-[12px] tabular-nums text-[var(--os-ink-muted)]">9:00 AM</span>
                      <Avatar name={t.clientName} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] text-[var(--os-ink)]">{t.clientName}</div>
                        <div className="truncate text-[12px] text-[var(--os-ink-muted)]">1120S review</div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                        <PetalMark className="size-3 text-[var(--os-ink-muted)]" /> Brief ready
                      </span>
                    </div>
                  ))}
                </Card>
              )}

              <Card>
                <CardHead title="Petal handled overnight" mark href="/os/tasks" />
                <div>
                  {handled.slice(0, 4).map(t => {
                    const ag = agentByName(t.agent);
                    return (
                      <Link key={t.id} href="/os/tasks" className="flex items-center gap-3 -mx-2 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]">
                        {ag ? <AgentAvatar gradient={ag.gradient} size={22} bare /> : <Avatar name={t.clientName} />}
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] text-[var(--os-ink)]">{t.title}</div>
                          <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{t.clientName}</div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-[var(--os-ink-subtle)]">
                          <span className="size-1.5 rounded-full bg-emerald-500" /> {t.when}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
