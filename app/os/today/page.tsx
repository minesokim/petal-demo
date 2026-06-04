"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { AgentAvatar } from "@/components/os/primitives";
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

const total = returns.length;
const prepped = returns.filter(r => ["in_preparation", "client_review", "pay_and_sign", "filed"].includes(r.stage)).length;
const readyPct = Math.round((prepped / total) * 100);

const totalFees = returns.reduce((s, r) => s + r.fee, 0);
const avgFee = Math.round(totalFees / total);
const feeVals = [1500, 3000, 4200, 5500, 6800, 8000, 9000, totalFees];
const readyVals = [8, 16, 24, 33, 42, 50, 56, readyPct];

// the returns most at risk, with their blocker (drives the readiness hero list)
const atRiskList = [
  { name: "DeShawn Williams", hid: "h-deshawn", blocker: "missing 5 documents" },
  { name: "Priya Sharma", hid: "h-priya", blocker: "missing 4 documents" },
  { name: "David Park", hid: "h-park", blocker: "position unresolved" },
];

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-4", className)}>{children}</div>;
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
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-4 py-2.5">
        <Icon icon={I.reports} size={17} className="text-[var(--os-ink-muted)]" />
        <h1 className="text-[15px] font-semibold text-[var(--os-ink)]">Today</h1>
      </div>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1180px] px-8 py-7">
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* ── Row 1 · Numbers — one surface, hairline-split, full-bleed charts (Attio/Linear grammar) ── */}
            <div className="grid grid-cols-1 divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:col-span-12">
              {/* Filing readiness */}
              <div className="flex flex-col pt-4">
                <div className="flex items-center gap-2 px-5">
                  <h3 className="text-[12px] font-medium text-[var(--os-ink-muted)]">Filing readiness</h3>
                  <PeriodButton className="ml-auto" label="This season" />
                </div>
                <div className="mt-3 px-5">
                  <div className="flex items-end gap-2.5">
                    <span className="text-[32px] font-semibold leading-none tabular-nums os-display">{readyPct}<span className="align-top text-[17px] text-[var(--os-ink-muted)]">%</span></span>
                    <span className="inline-flex items-center gap-1 pb-1 text-[12px] font-medium text-[var(--os-success)]"><Icon icon={I.deltaUp} size={12} /> 6%</span>
                  </div>
                  <div className="mt-1.5 text-[12px] text-[var(--os-ink-muted)]"><span className="font-medium text-[var(--os-ink)]">{atRisk.length}</span> returns at risk · +6 pts vs last week</div>
                </div>
                <div className="mt-4"><MiniChart vals={readyVals} max={Math.round(readyPct * 1.15)} h={88} gradId="readyFill" /></div>
              </div>
              {/* Fees this season */}
              <div className="flex flex-col pt-4">
                <div className="flex items-center gap-2 px-5">
                  <h3 className="text-[12px] font-medium text-[var(--os-ink-muted)]">Fees this season</h3>
                  <PeriodButton className="ml-auto" label="This season" />
                </div>
                <div className="mt-3 px-5">
                  <div className="text-[32px] font-semibold leading-none tabular-nums os-display">${totalFees.toLocaleString()}</div>
                  <div className="mt-1.5 text-[12px] text-[var(--os-ink-muted)]">across {total} returns · avg ${avgFee.toLocaleString()}/return</div>
                </div>
                <div className="mt-4"><MiniChart vals={feeVals} max={Math.round(totalFees * 1.12)} h={88} gradId="feesFill" /></div>
              </div>
            </div>

            {/* ── Row 2 · Needs you now (Linear) + brief ── */}
            <Card className="lg:col-span-7">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-[12px] font-medium text-[var(--os-ink-muted)]">Needs you now</h3>
                <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{needs.length}</span>
                <Link href="/os/tasks" className="ml-auto text-[12px] text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]">View all</Link>
              </div>
              <div className="-mx-2">
                {needs.map(t => {
                  const ag = agentByName(t.agent);
                  return (
                    <Link key={t.id} href="/os/tasks" className="flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]">
                      <span className="size-3.5 shrink-0 rounded-full border-[1.5px] border-[var(--os-border-strong)]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{t.title}</div>
                        <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{t.clientName}</div>
                      </div>
                      <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{t.when}</span>
                      {ag ? <AgentAvatar gradient={ag.gradient} size={20} bare /> : <Avatar name={t.clientName} />}
                    </Link>
                  );
                })}
              </div>
            </Card>

            {/* ── Today's brief (the newspaper) ── */}
            <Card className="lg:col-span-5">
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
            </Card>

            {/* ── Row 3 · At risk (Linear) + calls / handled ── */}
            <Card className="lg:col-span-7">
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

            <div className="flex flex-col gap-4 lg:col-span-5">
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
    </div>
  );
}
