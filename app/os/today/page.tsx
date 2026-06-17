"use client";

// Today - the command center. Every number derives from lib/fixtures/derive at
// render time; nothing is hard-coded (see /os/debug/tie-out).
//
// Layout language: the ORIGINAL Today card grammar (the deployed design the user
// prefers - petal-os.vercel.app circa Jun 9, 2026): one centered column of soft
// cream cards (--os-card fill, border-strong), each with a small muted header
// INSIDE the card; compact rows; tone dots live only inside cards; big tabular
// numbers as focal points. Kept from the redesign journey: the hero banner, the
// review-queue FeatureCallout, and quiet provenance lines (DESIGN.md §7).

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { AskComposer } from "@/components/os/ask-composer";
import { WeeklyDigestLink } from "@/components/os/roi-strip";
import { FeatureCallout } from "@/components/os/callout";
import { ProvenancePanel } from "@/components/os/provenance";
import { SkillPetal } from "@/components/os/primitives";
import { TodayBrief } from "@/components/os/today-brief";
import { FilingReadiness } from "@/components/os/filing-readiness";
import { DEMO_DATE_LABEL } from "@/lib/fixtures/vocab";
import {
  FIRM_PROFILE,
  taskById, householdById, skillById, runById, engagementById,
} from "@/lib/fixtures/firm";
import { healthCounts, roiWeek } from "@/lib/fixtures/derive";
import { useLiveNeedsYou } from "@/lib/demo-store";

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

/** The original soft card - cream fill, stronger border, hover border only. */
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("flex flex-col rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-card)] p-4 transition-colors duration-200 hover:border-[var(--os-border-hover)]", className)}>{children}</div>;
}

/** Card header - the `title` token (15/600 ink) so containers announce themselves. */
function CardHead({ title, mark, badge, href, hrefLabel }: { title: string; mark?: boolean; badge?: number; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {mark && <PetalMark className="size-4 text-[var(--os-ink-muted)]" />}
      <h3 className="os-display text-[15px] font-semibold text-[var(--os-ink)]">{title}</h3>
      {badge != null && <span className="rounded bg-emerald-50 px-1.5 text-[11px] font-medium tabular-nums text-emerald-600">{badge}</span>}
      {href && (
        <Link href={href} className={cn("ml-auto rounded text-[12px] text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>
          {hrefLabel ?? "View all"}
        </Link>
      )}
    </div>
  );
}

// flat people avatar - records stay monochrome; color lives only on the AI layer (DESIGN.md §2a)
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
  const atRiskCount = healthCounts().at_risk;
  const roi = roiWeek();
  const reviewMinutes = queue.reduce((s, t) => s + t.estimatedMin, 0);

  // The first decision in the queue - embedded as the callout's live preview.
  const previewTask = queue[0];

  // Today's call - the Fuentes 1120S review; the brief is a running Pre-call Brief run.
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
                Petal ran <span className="font-semibold text-white tabular-nums">{roi.actions}</span> actions this week - about{" "}
                <span className="font-semibold text-white tabular-nums">{roi.hoursReturned} hours</span> returned.{" "}
                <span className="font-semibold text-white tabular-nums">{needsYou}</span> items need you, and{" "}
                <span className="font-semibold text-white tabular-nums">{atRiskCount}</span> clients are at risk.
              </p>
            </div>
          </div>

          {/* ── Ask Petal ── */}
          <AskComposer />

          {/* ── Filing readiness - card opens the full modal (who's lagging, what needs review) ── */}
          <FilingReadiness />

          {/* ── review queue - the crafted moment, under filing readiness (hidden once the queue is clear) ── */}
          {needsYou > 0 && (
          <FeatureCallout
            eyebrow={<><PetalMark className="size-3.5" /> Review mode</>}
            title={`${needsYou} items are ready for your sign-off`}
            body={`Approve or skip each one with its sources and reasoning alongside - keyboard A and S. About ${reviewMinutes} minutes.`}
            action={{ label: "Start reviewing", href: "/os/review" }}
            secondary={{ label: "View all tasks", href: "/os/tasks" }}
            preview={
              previewTask && (
                <div>
                  <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-[var(--os-ink-subtle)]">
                    <SkillPetal category={skillById(previewTask.skillId)!.category} size={12} />
                    1 of {needsYou} · {householdById(previewTask.householdId)!.name}
                  </div>
                  <div className="mt-1.5 line-clamp-1 text-[13px] font-semibold leading-snug text-[var(--os-ink)]">{previewTask.title}</div>
                  <div className="mt-3 space-y-1.5">
                    {previewTask.proposedActions?.slice(0, 3).map(a => {
                      const rec = a.key === previewTask.recommendedAction;
                      return (
                        <div
                          key={a.key}
                          className={cn(
                            "flex items-center gap-2 rounded-md border px-2 py-1.5 text-[11px]",
                            rec ? "border-[var(--os-border-strong)] bg-[var(--os-card)] shadow-[0_1px_2px_rgba(0,0,0,0.04)]" : "border-[var(--os-border)]",
                          )}
                        >
                          <span className={cn("grid size-[17px] shrink-0 place-items-center rounded-full text-[8px] font-semibold leading-none ring-1", rec ? "bg-[var(--os-primary)] text-[var(--os-primary-fg)] ring-[var(--os-primary)]" : "bg-[var(--os-surface)] text-[var(--os-ink-muted)] ring-[var(--os-border-strong)]")}>{a.key}</span>
                          <span className={cn("min-w-0 flex-1 truncate", rec ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}>{a.label}</span>
                          {rec && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-[5px] bg-[var(--os-selected)] px-1.5 py-0.5 text-[9.5px] font-medium text-[var(--os-ink-muted)]">
                              <PetalMark className="size-2.5" /> Recommended
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            }
          />
          )}

          {/* ── Today's brief (the newspaper - situational awareness, modal per item) ── */}
          <TodayBrief />

          {/* ── Today's calls ── */}
          <Card>
            <CardHead title="Today's calls" />
            <div className="flex items-center gap-3 py-1">
              <span className="w-14 shrink-0 text-[12px] tabular-nums text-[var(--os-ink-muted)]">3:00 PM</span>
              <PersonAvatar name={callHousehold.name} size={24} />
              <div className="min-w-0 flex-1">
                <Link href={`/os/clients/${callHousehold.id}`} className={cn("truncate rounded text-[13px] text-[var(--os-link)] hover:underline", focusRing)}>
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
