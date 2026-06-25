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
import { DailyBriefLink } from "@/components/os/roi-strip";
import { FeatureCallout } from "@/components/os/callout";
import { SkillPetal } from "@/components/os/primitives";
import { TodaysCall } from "@/components/os/todays-call";
import { TodayBrief } from "@/components/os/today-brief";
import { FilingReadiness } from "@/components/os/filing-readiness";
import { DEMO_DATE_LABEL } from "@/lib/fixtures/vocab";
import {
  FIRM_PROFILE,
  skillById, runById,
} from "@/lib/fixtures/firm";
import { useDerive, useFirmData } from "@/lib/client/firm-context";
import { useBanner } from "@/lib/banner-store";

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
      {badge != null && <span className="rounded bg-[var(--os-selected)] px-1.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{badge}</span>}
      {href && (
        <Link href={href} className={cn("ml-auto rounded text-[12px] text-[var(--os-ink-muted)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>
          {hrefLabel ?? "View all"}
        </Link>
      )}
    </div>
  );
}

export function TodayView() {
  const { healthCounts, roiWeek, taskById, householdById, engagementById, needsYouTasks } = useDerive();
  const firstName = useFirmData().viewer.firstName;
  const queue = needsYouTasks();
  const banner = useBanner();
  const needsYou = queue.length;
  const atRiskCount = healthCounts().at_risk;
  const roi = roiWeek();
  const reviewMinutes = queue.reduce((s, t) => s + t.estimatedMin, 0);

  // The first decision in the queue - embedded as the callout's live preview.
  const previewTask = queue[0];

  // Today's call - the Fuentes 1120S review; the brief is a running Pre-call Brief run.
  const callTask = taskById("t-brief-fuentes");
  const callHousehold = callTask ? householdById(callTask.householdId) : undefined;
  const callSkill = callTask ? skillById(callTask.skillId) : undefined;
  const callRun = callTask?.runId ? runById(callTask.runId) : undefined;
  const callForm = callRun?.engagementId ? engagementById(callRun.engagementId)?.form : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-6 px-6 pb-16 pt-8">

          {/* ── hero banner ── */}
          <div className="relative overflow-hidden rounded-xl border border-[var(--os-border)]">
            {banner === "aurora" ? (
              <div className="os-banner-aurora absolute inset-0 h-full w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover object-[center_42%]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/25 to-black/10" />
            <div className="relative px-7 py-8">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                {DEMO_DATE_LABEL}
                <DailyBriefLink tone="light" className="-my-1 ml-auto" />
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

          {/* ── Weekly digest (the news - IRS & practice developments, inline-expand per item) ── */}
          <TodayBrief />

          {/* ── Today's calls (hidden when the firm has no scheduled call) ── */}
          {callTask && callHousehold && callSkill && (
          <Card>
            <CardHead title="Today's calls" />
            <TodaysCall
              householdId={callHousehold.id}
              engagementId={callRun?.engagementId}
              time="3:00 PM"
              runId={callTask.runId}
              skillCategory={callSkill.category}
            />
          </Card>
          )}

        </div>
      </div>
    </div>
  );
}
