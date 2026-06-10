"use client";

// Today — the command center. Every number on this page derives from
// lib/fixtures/derive at render time; nothing is hard-coded (see /os/debug/tie-out).
// Layout: hero banner → ROI strip → composer → review callout → quiet labeled sections.

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { AskComposer } from "@/components/os/ask-composer";
import { RoiStrip } from "@/components/os/roi-strip";
import { FeatureCallout } from "@/components/os/callout";
import { ProvenancePanel } from "@/components/os/provenance";
import { SkillPetal } from "@/components/os/primitives";
import { DEMO_DATE_LABEL, fmtDate, healthMeta } from "@/lib/fixtures/vocab";
import {
  FIRM_PROFILE, brief, briefToneDot, booksItems, booksMonth, booksStatusMeta,
  taskById, householdById, skillById, runById, engagementById,
} from "@/lib/fixtures/firm";
import {
  needsYouCount, needsYouTasks, atRiskHouseholds, healthCounts, filedThisWeek,
  booksClients, activityFeed,
} from "@/lib/fixtures/derive";

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

/** Quiet section micro-label — lives outside the card (Ferndesk pattern), sentence case. */
function SectionLabel({ children, badge, href, hrefLabel }: { children: React.ReactNode; badge?: number; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-2 flex items-baseline gap-2 px-0.5">
      <h3 className="text-[11px] font-medium tracking-wide text-[var(--os-ink-muted)]">{children}</h3>
      {badge != null && <span className="rounded bg-[var(--os-selected)] px-1.5 text-[10.5px] font-medium tabular-nums text-[var(--os-ink-muted)]">{badge}</span>}
      {href && (
        <Link href={href} className={cn("ml-auto rounded text-[11px] font-medium text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>
          {hrefLabel ?? "View all"}
        </Link>
      )}
    </div>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] p-4", className)}>{children}</div>;
}

// flat people avatar — records stay monochrome; color lives only on the AI layer (DESIGN.md §2a)
function PersonAvatar({ name }: { name: string }) {
  return <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-semibold text-[var(--os-ink-muted)]">{initials(name)}</span>;
}

export default function TodayPage() {
  const firstName = FIRM_PROFILE.owner.name.split(" ")[0];
  const needsYou = needsYouCount();
  const queue = needsYouTasks();
  const atRisk = atRiskHouseholds();
  const atRiskCount = healthCounts().at_risk;
  const overnight = activityFeed({ day: 25 }).filter(a => a.actor === "Petal").length;
  const reviewMinutes = queue.reduce((s, t) => s + t.estimatedMin, 0);

  // The first decision in the queue — embedded as the callout's live preview.
  const previewTask = queue[0];

  // Filed-this-week receipt — count + date derive from the e-filed engagements.
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
        <div className="mx-auto max-w-[780px] px-6 py-8">

          {/* ── hero banner ── */}
          <div className="relative mb-4 overflow-hidden rounded-xl border border-[var(--os-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/today-banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_42%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
            <div className="relative px-7 py-8">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                <PetalMark className="size-3.5 text-white/85" /> Daily brief · {DEMO_DATE_LABEL}
              </div>
              <h2 className="os-display text-[22px] font-semibold leading-tight text-white">Good morning, {firstName}</h2>
              <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-white/85">
                Petal handled <span className="font-semibold text-white tabular-nums">{overnight}</span> things since last night.{" "}
                <span className="font-semibold text-white tabular-nums">{needsYou}</span> need you, and{" "}
                <span className="font-semibold text-white tabular-nums">{atRiskCount}</span> clients are at risk.
              </p>
            </div>
          </div>

          {/* ── ROI strip ── */}
          <div className="mb-5"><RoiStrip /></div>

          {/* ── Ask Petal ── */}
          <AskComposer />

          {/* ── review queue — the crafted moment ── */}
          <FeatureCallout
            className="mb-8"
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

          {/* ── Today's brief ── */}
          <section className="mb-7">
            <SectionLabel>Today's brief</SectionLabel>
            <Card className="px-2 py-1.5">
              <ul>
                {brief.map((b, i) => {
                  const row = (
                    <>
                      <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", briefToneDot[b.tone])} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-1.5">
                          <span className="text-[13px] font-medium leading-snug text-[var(--os-ink)]">{b.headline}</span>
                          {b.source && <span className="shrink-0 text-[10px] font-medium tracking-wide text-[var(--os-ink-subtle)]">{b.source}</span>}
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-snug text-[var(--os-ink-muted)]">{b.detail}</span>
                      </span>
                      {b.href && <Icon icon={I.chevronRight} size={13} className="mt-1.5 shrink-0 text-[var(--os-ink-subtle)]" />}
                    </>
                  );
                  return (
                    <li key={i} className={cn(i > 0 && "border-t border-[var(--os-border)]")}>
                      {b.href ? (
                        <Link href={b.href} className={cn("flex gap-2.5 rounded-md px-2 py-2.5 transition-colors hover:bg-[var(--os-hover)]", focusRing)}>{row}</Link>
                      ) : (
                        <div className="flex gap-2.5 px-2 py-2.5">{row}</div>
                      )}
                      {b.runId && (
                        <div className="mb-2 ml-6 mr-2">
                          <ProvenancePanel runId={b.runId} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          </section>

          {/* ── At risk · receipts ── */}
          <div className="mb-7 grid grid-cols-1 items-start gap-x-4 gap-y-7 md:grid-cols-2">

            <section>
              <SectionLabel badge={atRisk.length} href="/os/clients">At risk</SectionLabel>
              <Card className="px-2 py-1.5">
                {atRisk.length === 0 ? (
                  <p className="px-2 py-2 text-[12px] text-[var(--os-ink-muted)]">
                    Every client is on pace.{" "}
                    <Link href="/os/clients" className={cn("rounded text-[var(--os-accent)] hover:underline", focusRing)}>Open clients</Link>
                  </p>
                ) : (
                  <div>
                    {atRisk.map(({ household, health, reason, nextAction }, i) => (
                      <div key={household.id} className={cn("flex gap-2.5 px-2 py-2.5", i > 0 && "border-t border-[var(--os-border)]")}>
                        <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", healthMeta[health].dot)} />
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/os/clients/${household.id}`}
                            className={cn("rounded text-[13px] font-medium leading-snug text-[var(--os-ink)] hover:underline", focusRing)}
                          >
                            {household.name}
                          </Link>
                          <p className="mt-0.5 text-[12px] leading-snug text-[var(--os-ink-muted)]">
                            {reason}
                            {nextAction && (
                              <>
                                {" · "}
                                <Link href={nextAction.href} className={cn("rounded font-medium text-[var(--os-accent)] hover:underline", focusRing)}>
                                  {nextAction.label}
                                </Link>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>

            <div className="flex flex-col gap-7">
              <section>
                <SectionLabel href="/os/returns" hrefLabel="All returns">Filed this week</SectionLabel>
                <Card>
                  <Link href={`/os/tasks?task=${efiledTask.id}`} className={cn("-mx-2 -mt-1 flex gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--os-hover)]", focusRing)}>
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium leading-snug text-[var(--os-ink)]">
                        Petal filed <span className="tabular-nums">{filed.length}</span> returns clean — pre-approved by you {filedOn}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-[var(--os-ink-muted)]">{efiledTask.why}</span>
                    </span>
                    <Icon icon={I.chevronRight} size={13} className="mt-1.5 shrink-0 text-[var(--os-ink-subtle)]" />
                  </Link>
                  {efiledTask.runId && <ProvenancePanel runId={efiledTask.runId} className="mt-2" />}
                </Card>
              </section>

              <section>
                <SectionLabel>Today's calls</SectionLabel>
                <Card>
                  <div className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-[12px] tabular-nums text-[var(--os-ink-muted)]">3:00 PM</span>
                    <PersonAvatar name={callHousehold.name} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/os/clients/${callHousehold.id}`}
                        className={cn("rounded text-[13px] font-medium text-[var(--os-ink)] hover:underline", focusRing)}
                      >
                        {callHousehold.name}
                      </Link>
                      <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{callForm ? `${callForm} review` : "Review call"}</div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                      <SkillPetal category={callSkill.category} size={13} /> Brief generating
                    </span>
                  </div>
                  {callTask.runId && <ProvenancePanel runId={callTask.runId} className="mt-3" />}
                </Card>
              </section>
            </div>
          </div>

          {/* ── Books — one-row strip (renders only while books clients exist) ── */}
          {booksHH.length > 0 && (
            <section className="mb-2">
              <SectionLabel href="/os/books" hrefLabel="Open books">Books</SectionLabel>
              <Link
                href="/os/books"
                className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] px-4 py-3 transition-colors duration-200 hover:border-[var(--os-border-hover)]", focusRing)}
              >
                <span className="os-display text-[13px] font-semibold text-[var(--os-ink)]">{booksMonth} books</span>
                <span className="hidden h-1.5 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[var(--os-selected)] sm:flex">
                  <span className="h-full bg-emerald-500" style={{ width: `${(booksDone / booksTotal) * 100}%` }} />
                  <span className="h-full bg-amber-500" style={{ width: `${(booksProg / booksTotal) * 100}%` }} />
                </span>
                {([
                  ["complete", booksDone],
                  ["in_progress", booksProg],
                  ["not_started", booksTodo],
                ] as const).map(([status, count]) => (
                  <span key={status} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                    <span className={cn("size-1.5 rounded-full", booksStatusMeta[status].dot)} />
                    <span className="tabular-nums font-medium text-[var(--os-ink)]">{count}</span> {booksStatusMeta[status].label.toLowerCase()}
                  </span>
                ))}
                <span className="inline-flex items-center gap-1 text-[12px] text-[var(--os-ink-muted)]">
                  <span className="tabular-nums">{booksHH.length}</span> clients
                  <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
                </span>
              </Link>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
