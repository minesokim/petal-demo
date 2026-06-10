"use client";

// Today — the command center. Every number on this page derives from
// lib/fixtures/derive at render time; nothing is hard-coded (see /os/debug/tie-out).
//
// Layout language (DESIGN.md §7, after Ramp Stack / Ferndesk):
//   hero (calm — one sentence carries the week) → composer → ONE gradient callout →
//   brief as a grid of glyph-tile cards (Ferndesk) → client rows with avatars + pills
//   (Linear × Ramp) → receipt card with chips → Ramp-style close card for books.

import Link from "next/link";
import type { IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { AskComposer } from "@/components/os/ask-composer";
import { WeeklyDigestLink } from "@/components/os/roi-strip";
import { FeatureCallout } from "@/components/os/callout";
import { ProvenancePanel } from "@/components/os/provenance";
import { SkillPetal } from "@/components/os/primitives";
import { DEMO_DATE_LABEL, fmtDate, type Health } from "@/lib/fixtures/vocab";
import {
  FIRM_PROFILE, brief, booksItems, booksMonth, booksStatusMeta, entityById,
  taskById, householdById, skillById, runById, engagementById, type BriefTopic,
} from "@/lib/fixtures/firm";
import {
  needsYouCount, needsYouTasks, atRiskHouseholds, healthCounts, filedThisWeek,
  booksClients, roiWeek,
} from "@/lib/fixtures/derive";

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

/** Ferndesk eyebrow — tiny caps label above each section. */
function SectionLabel({ children, count, href, hrefLabel }: { children: React.ReactNode; count?: number; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-2.5 flex items-baseline gap-2 px-0.5">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--os-ink-subtle)]">{children}</h3>
      {count != null && <span className="text-[10px] font-medium tabular-nums text-[var(--os-ink-subtle)]">{count}</span>}
      {href && (
        <Link href={href} className={cn("ml-auto rounded text-[11px] font-medium text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>
          {hrefLabel ?? "View all"}
        </Link>
      )}
    </div>
  );
}

/** Glyph tile — the Ferndesk card icon, tinted by topic. */
const TOPIC_TILE: Record<BriefTopic, { icon: keyof typeof I; bg: string; text: string }> = {
  returns:    { icon: "badge",    bg: "bg-emerald-50", text: "text-emerald-600" },
  transcript: { icon: "eye",      bg: "bg-violet-50",  text: "text-violet-600" },
  notice:     { icon: "mail",     bg: "bg-amber-50",   text: "text-amber-600" },
  deadline:   { icon: "calendar", bg: "bg-sky-50",     text: "text-sky-600" },
  policy:     { icon: "shield",   bg: "bg-[var(--os-selected)]", text: "text-[var(--os-ink-muted)]" },
  filing:     { icon: "file",     bg: "bg-cyan-50",    text: "text-cyan-600" },
};

function GlyphTile({ icon, bg, text, size = 32 }: { icon: IconSvgElement; bg: string; text: string; size?: number }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-lg", bg, text)} style={{ width: size, height: size }}>
      <Icon icon={icon} size={Math.round(size / 2)} />
    </span>
  );
}

// flat people avatar — records stay monochrome; color lives only on the AI layer (DESIGN.md §2a)
function PersonAvatar({ name, size = 28 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-semibold text-[var(--os-ink-muted)]"
      style={{ width: size, height: size }}
    >
      {initials(name)}
    </span>
  );
}

const HEALTH_PILL: Record<Exclude<Health, "healthy">, { label: string; cls: string }> = {
  at_risk: { label: "At risk", cls: "bg-red-50 text-red-700" },
  watch:   { label: "Watch",   cls: "bg-amber-50 text-amber-700" },
};

export default function TodayPage() {
  const firstName = FIRM_PROFILE.owner.name.split(" ")[0];
  const needsYou = needsYouCount();
  const queue = needsYouTasks();
  const atRisk = atRiskHouseholds();
  const atRiskCount = healthCounts().at_risk;
  const roi = roiWeek();
  const reviewMinutes = queue.reduce((s, t) => s + t.estimatedMin, 0);

  // The first decision in the queue — embedded as the callout's live preview.
  const previewTask = queue[0];

  // Filed-this-week receipt — names + date derive from the e-filed engagements.
  const filed = filedThisWeek();
  const efiledTask = taskById("t-efiled-3")!;
  const filedOn = filed[0] ? fmtDate(filed[0].eFiledOn!) : "";

  // Books-to-tax readiness (renders only because books clients exist).
  const booksHH = booksClients();
  const booksDone = booksItems.filter(b => b.status === "complete").length;
  const booksProg = booksItems.filter(b => b.status === "in_progress").length;
  const booksTodo = booksItems.filter(b => b.status === "not_started").length;
  const booksTotal = booksItems.length || 1;

  // Today's call — the Fuentes 1120S review; the brief is a running Pre-call Brief run.
  const callTask = taskById("t-brief-fuentes")!;
  const callHousehold = householdById(callTask.householdId)!;
  const callSkill = skillById(callTask.skillId)!;
  const callRun = callTask.runId ? runById(callTask.runId) : undefined;
  const callForm = callRun?.engagementId ? engagementById(callRun.engagementId)?.form : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[820px] px-6 py-8">

          {/* ── hero — calm: eyebrow, greeting, one sentence that carries the week ── */}
          <div className="relative mb-5 overflow-hidden rounded-xl border border-[var(--os-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/today-banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_42%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
            <div className="relative px-7 py-8">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                <PetalMark className="size-3.5 text-white/85" /> Daily brief · {DEMO_DATE_LABEL}
                <WeeklyDigestLink tone="light" className="-my-1 ml-auto" />
              </div>
              <h2 className="os-display text-[22px] font-semibold leading-tight text-white">Good morning, {firstName}</h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/85">
                Petal ran <span className="font-semibold text-white tabular-nums">{roi.actions}</span> actions this week — about{" "}
                <span className="font-semibold text-white tabular-nums">{roi.hoursReturned} hours</span> returned.{" "}
                <span className="font-semibold text-white tabular-nums">{needsYou}</span> items need you, and{" "}
                <span className="font-semibold text-white tabular-nums">{atRiskCount}</span> clients are at risk.
              </p>
            </div>
          </div>

          {/* ── Ask Petal ── */}
          <AskComposer />

          {/* ── review queue — the crafted moment ── */}
          <FeatureCallout
            className="mb-10"
            eyebrow={<><PetalMark className="size-3.5" /> Review mode</>}
            title={`${needsYou} items are ready for your sign-off`}
            body={`Approve, edit, or skip each one with its sources alongside — keyboard A, E, S. About ${reviewMinutes} minutes.`}
            action={{ label: "Start reviewing", href: "/os/review" }}
            secondary={{ label: "View all tasks", href: "/os/tasks" }}
            preview={
              previewTask && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--os-ink-subtle)]">
                    <SkillPetal category={skillById(previewTask.skillId)!.category} size={11} />
                    1 of {needsYou} · {householdById(previewTask.householdId)!.name}
                  </div>
                  <div className="mt-1 text-[12px] font-semibold leading-snug text-[var(--os-ink)]">{previewTask.title}</div>
                  <div className="mt-2 space-y-1">
                    {previewTask.proposedActions?.slice(0, 3).map(a => (
                      <div
                        key={a.key}
                        className={cn(
                          "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10.5px] leading-tight",
                          a.key === previewTask.recommendedAction
                            ? "border-[var(--os-border-strong)] bg-[var(--os-card)] font-medium text-[var(--os-ink)]"
                            : "border-[var(--os-border)] text-[var(--os-ink-muted)]",
                        )}
                      >
                        <span className="font-semibold">{a.key}</span>
                        <span className="truncate">{a.label}</span>
                        {a.key === previewTask.recommendedAction && (
                          <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[9.5px] text-[var(--os-ink-muted)]">
                            <PetalMark className="size-2.5" /> recommends
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          />

          {/* ── Today's brief — a grid of glyph-tile cards (Ferndesk) ── */}
          <section className="mb-10">
            <SectionLabel>Today's brief</SectionLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {brief.map((b, i) => {
                const tile = TOPIC_TILE[b.topic];
                const inner = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <GlyphTile icon={I[tile.icon]} bg={tile.bg} text={tile.text} />
                      {b.source && (
                        <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[var(--os-ink-subtle)]">{b.source}</span>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="text-[13px] font-semibold leading-snug text-[var(--os-ink)]">{b.headline}</div>
                      <div className="mt-1 text-[12px] leading-relaxed text-[var(--os-ink-muted)] line-clamp-2">{b.detail}</div>
                    </div>
                    {b.runId && (
                      <div className="mt-auto flex items-center gap-1 pt-3 text-[10.5px] font-medium text-[var(--os-ink-subtle)]">
                        <PetalMark className="size-2.5" /> Run logged
                      </div>
                    )}
                  </>
                );
                const cardCls = cn(
                  "flex flex-col rounded-xl border border-[var(--os-border)] bg-white p-4",
                  "transition-[border-color,box-shadow] duration-150",
                );
                return b.href ? (
                  <Link
                    key={i}
                    href={b.href}
                    className={cn(cardCls, "hover:border-[var(--os-border-hover)] hover:shadow-[0_2px_10px_rgba(17,17,26,0.05)]", focusRing)}
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={i} className={cardCls}>{inner}</div>
                );
              })}
            </div>
          </section>

          {/* ── Needs watching — client rows: avatar + health pill + one action ── */}
          <section className="mb-10">
            <SectionLabel count={atRisk.length} href="/os/clients">Needs watching</SectionLabel>
            <div className="overflow-hidden rounded-xl border border-[var(--os-border)] bg-white">
              {atRisk.length === 0 ? (
                <p className="px-4 py-4 text-[12px] text-[var(--os-ink-muted)]">
                  Every client is on pace.{" "}
                  <Link href="/os/clients" className={cn("rounded font-medium text-[var(--os-ink)] underline decoration-[var(--os-border-strong)] underline-offset-2", focusRing)}>Open clients</Link>
                </p>
              ) : (
                atRisk.map(({ household, health, reason, nextAction }, i) => (
                  <div key={household.id} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-[var(--os-border)]")}>
                    <PersonAvatar name={household.name} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/os/clients/${household.id}`}
                          className={cn("rounded text-[13px] font-semibold leading-snug text-[var(--os-ink)] hover:underline", focusRing)}
                        >
                          {household.name}
                        </Link>
                        {health !== "healthy" && (
                          <span className={cn("rounded-full px-1.5 py-px text-[10px] font-semibold", HEALTH_PILL[health].cls)}>
                            {HEALTH_PILL[health].label}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-[var(--os-ink-muted)]">{reason}</p>
                    </div>
                    {nextAction && (
                      <Link
                        href={nextAction.href}
                        className={cn(
                          "hidden h-7 shrink-0 items-center rounded-md border border-[var(--os-border)] bg-white px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)] sm:inline-flex",
                          focusRing,
                        )}
                      >
                        {nextAction.label}
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* ── Filed this week · Today's calls ── */}
          <div className="mb-10 grid grid-cols-1 items-start gap-x-4 gap-y-10 md:grid-cols-2">
            <section>
              <SectionLabel href="/os/returns" hrefLabel="All returns">Filed this week</SectionLabel>
              <div className="rounded-xl border border-[var(--os-border)] bg-white p-4">
                <Link href={`/os/tasks?task=${efiledTask.id}`} className={cn("group/row -m-1 flex items-start gap-3 rounded-lg p-1", focusRing)}>
                  <GlyphTile icon={I.badge} bg="bg-emerald-50" text="text-emerald-600" size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold leading-snug text-[var(--os-ink)]">
                      <span className="tabular-nums">{filed.length}</span> returns filed clean
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-[var(--os-ink-muted)]">
                      Pre-approved by you {filedOn} · all accepted Jun 24
                    </span>
                  </span>
                  <Icon icon={I.chevronRight} size={13} className="mt-1 shrink-0 text-[var(--os-ink-subtle)] opacity-0 transition-opacity duration-150 group-hover/row:opacity-100" />
                </Link>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {filed.map(e => {
                    const entity = entityById(e.entityId)!;
                    return (
                      <Link
                        key={e.id}
                        href={`/os/returns/${e.id}`}
                        className={cn("inline-flex items-center gap-1 rounded-md border border-[var(--os-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}
                      >
                        {entity.name.split("&")[0].trim().split(" ")[0]} · {e.form}
                      </Link>
                    );
                  })}
                </div>
                {efiledTask.runId && <ProvenancePanel runId={efiledTask.runId} className="mt-3" />}
              </div>
            </section>

            <section>
              <SectionLabel>Today's calls</SectionLabel>
              <div className="rounded-xl border border-[var(--os-border)] bg-white p-4">
                <div className="flex items-start gap-3">
                  <GlyphTile icon={I.call} bg="bg-yellow-50" text="text-yellow-600" size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <Link
                        href={`/os/clients/${callHousehold.id}`}
                        className={cn("rounded text-[13px] font-semibold text-[var(--os-ink)] hover:underline", focusRing)}
                      >
                        {callHousehold.name}
                      </Link>
                      <span className="text-[11px] font-medium tabular-nums text-[var(--os-ink-subtle)]">3:00 PM</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-[var(--os-ink-muted)]">{callForm ? `${callForm} review` : "Review call"}</div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--os-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)]">
                    <SkillPetal category={callSkill.category} size={12} /> Brief generating
                  </span>
                </div>
                {callTask.runId && <ProvenancePanel runId={callTask.runId} className="mt-3" />}
              </div>
            </section>
          </div>

          {/* ── Books — the Ramp close card (renders only while books clients exist) ── */}
          {booksHH.length > 0 && (
            <section className="mb-2">
              <SectionLabel href="/os/books" hrefLabel="Open books">Books</SectionLabel>
              <Link
                href="/os/books"
                className={cn("block rounded-xl border border-[var(--os-border)] bg-white p-5 transition-[border-color,box-shadow] duration-150 hover:border-[var(--os-border-hover)] hover:shadow-[0_2px_10px_rgba(17,17,26,0.05)]", focusRing)}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="os-display text-[15px] font-semibold text-[var(--os-ink)]">{booksMonth} books</h3>
                  <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--os-ink-muted)]">
                    <span className="tabular-nums">{booksHH.length}</span> clients <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
                  </span>
                </div>
                <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-[var(--os-selected)]">
                  <div className="h-full bg-emerald-500" style={{ width: `${(booksDone / booksTotal) * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${(booksProg / booksTotal) * 100}%` }} />
                </div>
                <div className="mt-3.5 flex items-center gap-10">
                  {([
                    ["complete", booksDone],
                    ["in_progress", booksProg],
                    ["not_started", booksTodo],
                  ] as const).map(([status, count]) => (
                    <div key={status}>
                      <div className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                        <span className={cn("size-2 rounded-full", booksStatusMeta[status].dot)} /> {booksStatusMeta[status].label}
                      </div>
                      <div className="os-display mt-1 text-[20px] font-semibold tabular-nums text-[var(--os-ink)]">{count}</div>
                    </div>
                  ))}
                </div>
              </Link>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
