"use client";

// Today — the command center. Every number on this page derives from
// lib/fixtures/derive at render time; nothing is hard-coded (see /os/debug/tie-out).

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { AskComposer } from "@/components/os/ask-composer";
import { RoiStrip } from "@/components/os/roi-strip";
import { ProvenancePanel } from "@/components/os/provenance";
import { SkillPetal } from "@/components/os/primitives";
import { DEMO_DATE_LABEL, fmtDate, healthMeta } from "@/lib/fixtures/vocab";
import {
  FIRM_PROFILE, brief, briefToneDot, booksItems, booksMonth, booksStatusMeta,
  taskById, householdById, skillById, runById, engagementById,
} from "@/lib/fixtures/firm";
import { needsYouCount, atRiskHouseholds, filedThisWeek, booksClients } from "@/lib/fixtures/derive";

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-card)] p-4 transition-colors duration-200 hover:border-[var(--os-border-hover)]", className)}>{children}</div>;
}

function CardHead({ title, mark, badge, href, hrefLabel }: { title: string; mark?: boolean; badge?: number; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {mark && <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" />}
      <h3 className="text-[12px] font-medium text-[var(--os-ink-muted)]">{title}</h3>
      {badge != null && <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{badge}</span>}
      {href && (
        <Link href={href} className={cn("ml-auto rounded text-[12px] text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>
          {hrefLabel ?? "View all"}
        </Link>
      )}
    </div>
  );
}

// flat people avatar — records stay monochrome; color lives only on the AI layer (DESIGN.md §2a)
function PersonAvatar({ name }: { name: string }) {
  return <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-semibold text-[var(--os-ink-muted)]">{initials(name)}</span>;
}

export default function TodayPage() {
  const firstName = FIRM_PROFILE.owner.name.split(" ")[0];
  const needsYou = needsYouCount();
  const atRisk = atRiskHouseholds();

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

          {/* ── header row ── */}
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
            <div>
              <h2 className="os-display text-[20px] font-semibold leading-tight text-[var(--os-ink)]">Good morning, {firstName}</h2>
              <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">
                {DEMO_DATE_LABEL} · <span className="tabular-nums">{needsYou}</span> items need you
              </p>
            </div>
            <Link
              href="/os/review"
              className={cn("inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[13px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", focusRing)}
            >
              Review <span className="tabular-nums">{needsYou}</span> items
              <Icon icon={I.chevronRight} size={13} />
            </Link>
          </div>

          {/* ── ROI strip ── */}
          <div className="mb-6"><RoiStrip /></div>

          {/* ── Ask Petal ── */}
          <AskComposer />

          {/* ── card grid ── */}
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">

            {/* Today's brief */}
            <Card className="md:col-span-2">
              <CardHead title="Today's brief" mark />
              <ul className="-mx-2 flex-1">
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
                    <li key={i}>
                      {b.href ? (
                        <Link href={b.href} className={cn("flex gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]", focusRing)}>{row}</Link>
                      ) : (
                        <div className="flex gap-2.5 px-2 py-2">{row}</div>
                      )}
                      {b.runId && (
                        <div className="mb-1.5 ml-6 mr-2 mt-0.5">
                          <ProvenancePanel runId={b.runId} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>

            {/* At risk */}
            <Card>
              <CardHead title="At risk" badge={atRisk.length} href="/os/clients" />
              {atRisk.length === 0 ? (
                <p className="px-2 text-[12px] text-[var(--os-ink-muted)]">
                  Every client is on pace.{" "}
                  <Link href="/os/clients" className={cn("rounded text-[var(--os-accent)] hover:underline", focusRing)}>Open clients</Link>
                </p>
              ) : (
                <div className="-mx-2 flex-1">
                  {atRisk.map(({ household, health, reason, nextAction }) => (
                    <div key={household.id} className="flex gap-2.5 rounded-md px-2 py-2">
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

            {/* Filed this week — the receipt */}
            <Card>
              <CardHead title="Filed this week" mark href="/os/returns" hrefLabel="All returns" />
              <Link href={`/os/tasks?task=${efiledTask.id}`} className={cn("-mx-2 flex gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]", focusRing)}>
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

            {/* Books-to-tax readiness — renders only while books clients exist */}
            {booksHH.length > 0 && (
              <Link
                href="/os/books"
                className={cn("flex flex-col rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-card)] p-4 transition-colors duration-200 hover:border-[var(--os-border-hover)]", focusRing)}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-[var(--os-ink)] os-display">{booksMonth} books — wrapping up</h3>
                  <span className="flex shrink-0 items-center gap-1 text-[12px] text-[var(--os-ink-muted)]">
                    <span className="tabular-nums">{booksHH.length}</span> clients <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
                  </span>
                </div>
                <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-[var(--os-selected)]">
                  <div className="h-full bg-emerald-500" style={{ width: `${(booksDone / booksTotal) * 100}%` }} />
                  <div className="h-full bg-amber-500" style={{ width: `${(booksProg / booksTotal) * 100}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
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
                </div>
              </Link>
            )}

            {/* Today's calls */}
            <Card className={cn(booksHH.length > 0 ? "" : "md:col-span-2")}>
              <CardHead title="Today's calls" />
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

          </div>
        </div>
      </div>
    </div>
  );
}
