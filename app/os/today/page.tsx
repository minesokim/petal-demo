"use client";

// Today — the command center. Every number derives from lib/fixtures/derive at
// render time; nothing is hard-coded (see /os/debug/tie-out).
//
// Layout language: the ORIGINAL Today card grammar (the deployed design the user
// prefers — petal-os.vercel.app circa Jun 9, 2026): one centered column of soft
// cream cards (--os-card fill, border-strong), each with a small muted header
// INSIDE the card; compact rows; tone dots live only inside cards; big tabular
// numbers as focal points. Kept from the redesign journey: the hero banner, the
// review-queue FeatureCallout, and quiet provenance lines (DESIGN.md §7).

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { AskComposer } from "@/components/os/ask-composer";
import { WeeklyDigestLink } from "@/components/os/roi-strip";
import { FeatureCallout } from "@/components/os/callout";
import { ProvenancePanel } from "@/components/os/provenance";
import { SkillPetal } from "@/components/os/primitives";
import { DEMO_DATE_LABEL, healthMeta } from "@/lib/fixtures/vocab";
import {
  FIRM_PROFILE, brief, briefToneDot, booksItems, booksMonth, booksStatusMeta,
  taskById, householdById, skillById, runById, engagementById, expectedDocs,
} from "@/lib/fixtures/firm";
import {
  atRiskHouseholds, healthCounts,
  booksClients, roiWeek, billingKpis, activeEngagements,
} from "@/lib/fixtures/derive";
import { useLiveNeedsYou } from "@/lib/demo-store";

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

/** The original soft card — cream fill, stronger border, hover border only. */
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-4 transition-colors duration-200 hover:border-[var(--os-border-hover)]", className)}>{children}</div>;
}

/** Card header — the `title` token (15/600 ink) so containers announce themselves. */
function CardHead({ title, mark, badge, href, hrefLabel }: { title: string; mark?: boolean; badge?: number; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {mark && <PetalMark className="size-4 text-[var(--os-ink-muted)]" />}
      <h3 className="os-display text-[15px] font-semibold text-[var(--os-ink)]">{title}</h3>
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

export default function TodayPage() {
  const firstName = FIRM_PROFILE.owner.name.split(" ")[0];
  const queue = useLiveNeedsYou();
  const needsYou = queue.length;
  const atRisk = atRiskHouseholds();
  const atRiskCount = healthCounts().at_risk;
  const roi = roiWeek();
  const reviewMinutes = queue.reduce((s, t) => s + t.estimatedMin, 0);

  // The first decision in the queue — embedded as the callout's live preview.
  const previewTask = queue[0];

  // "Petal activity" focal numbers (the original stat-list card, now canon-derived).
  const docsOutstanding = expectedDocs.filter(d => d.status === "requested").length;
  const awaitingSign = activeEngagements().filter(e => e.stage === "pay_and_sign").length;
  const overdueInvoices = billingKpis().overdueCount;

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
        <div className="mx-auto flex max-w-[760px] flex-col gap-6 px-6 pb-16 pt-8">

          {/* ── hero banner ── */}
          <div className="relative overflow-hidden rounded-xl border border-[var(--os-border)]">
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

          {/* ── review queue — the crafted moment (hidden once the queue is clear) ── */}
          {needsYou > 0 && (
          <FeatureCallout
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
                          <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[9.5px] text-[var(--os-ink-subtle)]">
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
          )}

          {/* ── Books — the close card (renders only while books clients exist) ── */}
          {booksHH.length > 0 && (
            <Link
              href="/os/books"
              className={cn("block rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-5 transition-colors duration-200 hover:border-[var(--os-border-hover)]", focusRing)}
            >
              <div className="flex items-center justify-between">
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
          )}

          {/* ── Today's brief (the newspaper) ── */}
          <Card>
            <CardHead title="Today's brief" mark />
            <ul className="-mx-2 flex-1">
              {brief.map((b, i) => {
                const body = (
                  <>
                    <span className={cn("mt-[7px] size-1.5 shrink-0 rounded-full", briefToneDot[b.tone])} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-1.5">
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
                      <Link href={b.href} className={cn("flex gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]", focusRing)}>{body}</Link>
                    ) : (
                      <div className="flex gap-2.5 px-2 py-2">{body}</div>
                    )}
                    {b.runId && (
                      <div className="mb-1 ml-6 mr-2">
                        <ProvenancePanel runId={b.runId} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link href="/os/activity" className={cn("-mx-2 mt-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>
              View activity log <Icon icon={I.chevronRight} size={13} />
            </Link>
          </Card>

          {/* ── At risk ── */}
          <Card>
            <CardHead title="At risk" badge={atRisk.length} href="/os/clients" />
            <div className="-mx-2">
              {atRisk.map(({ household, health, reason }) => (
                <Link
                  key={household.id}
                  href={`/os/clients/${household.id}`}
                  className={cn("flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]", focusRing)}
                >
                  <PersonAvatar name={household.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 truncate">
                      <span className="truncate text-[13px] font-medium text-[var(--os-ink)]">{household.name}</span>
                      <span className={cn("shrink-0 text-[10.5px] font-semibold", healthMeta[health].text)}>{healthMeta[health].label}</span>
                    </div>
                    <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{reason}</div>
                  </div>
                  <Icon icon={I.chevronRight} size={14} className="shrink-0 text-[var(--os-ink-subtle)]" />
                </Link>
              ))}
            </div>
          </Card>

          {/* ── Petal activity — the focal-number summary ── */}
          <div className="rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-4 transition-colors duration-200 hover:border-[var(--os-border-hover)]">
            <div className="mb-3 flex items-center gap-2">
              <PetalMark className="size-4 text-[var(--os-ink)]" />
              <h3 className="os-display text-[15px] font-semibold text-[var(--os-ink)]">Petal activity</h3>
            </div>
            <div className="space-y-0.5">
              {([
                { label: "Drafts awaiting approval", count: needsYou, icon: I.sparkle, href: "/os/review" },
                { label: "Documents outstanding", count: docsOutstanding, icon: I.file, href: "/os/documents" },
                { label: "Awaiting signature", count: awaitingSign, icon: I.edit, href: "/os/returns" },
                { label: "Overdue invoices", count: overdueInvoices, icon: I.billing, href: "/os/billing" },
              ]).map(a => (
                <Link key={a.label} href={a.href} className={cn("-mx-2 flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-[var(--os-hover)]", focusRing)}>
                  <Icon icon={a.icon} size={16} className="shrink-0 text-[var(--os-ink-muted)]" />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{a.label}</span>
                  <span className="os-display shrink-0 text-[20px] font-semibold tabular-nums text-[var(--os-ink)]">{a.count}</span>
                </Link>
              ))}
            </div>
            <Link href="/os/tasks" className={cn("-mx-2 mt-1 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>
              Open tasks <Icon icon={I.chevronRight} size={13} />
            </Link>
          </div>

          {/* ── Today's calls ── */}
          <Card>
            <CardHead title="Today's calls" />
            <div className="flex items-center gap-3 py-1">
              <span className="w-14 shrink-0 text-[12px] tabular-nums text-[var(--os-ink-muted)]">3:00 PM</span>
              <PersonAvatar name={callHousehold.name} size={24} />
              <div className="min-w-0 flex-1">
                <Link href={`/os/clients/${callHousehold.id}`} className={cn("truncate rounded text-[13px] text-[var(--os-ink)] hover:underline", focusRing)}>
                  {callHousehold.name}
                </Link>
                <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{callForm ? `${callForm} review` : "Review call"}</div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                <SkillPetal category={callSkill.category} size={13} /> Brief generating
              </span>
            </div>
            {callTask.runId && <ProvenancePanel runId={callTask.runId} className="mt-2 pl-[68px]" />}
          </Card>

        </div>
      </div>
    </div>
  );
}
