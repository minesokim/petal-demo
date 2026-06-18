"use client";

// Notice detail - facts, the drafted response with provenance, the linked
// transcript change, and the approve/edit actions. n-cp2000 is the exemplar;
// n-cp14 renders the resolved state.

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { DeadlineChip } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { noticeById, householdById, runById } from "@/lib/fixtures/firm";
import { fmtDate } from "@/lib/fixtures/vocab";
import { noticeCountdown } from "@/lib/fixtures/derive";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="os-label mb-1">{label}</div>
      <div className="text-[13px] text-[var(--os-ink)]">{children}</div>
    </div>
  );
}

export default function NoticeDetailPage() {
  const params = useParams();
  const n = noticeById(String(params.id));
  const [approved, setApproved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [letter, setLetter] = useState(n?.draftedResponse ?? "");

  if (!n) {
    return (
      <div className="grid h-full place-items-center px-8">
        <div className="text-center">
          <p className="text-[13px] text-[var(--os-ink-muted)]">This notice isn&apos;t on file.</p>
          <Link href="/os/notices" className={cn("mt-2 inline-flex items-center gap-1 text-[13px] text-[var(--os-link)] hover:underline", FOCUS)}>
            Back to Notices <Icon icon={I.chevronRight} size={13} />
          </Link>
        </div>
      </div>
    );
  }

  const household = householdById(n.householdId);
  const resolved = n.status === "resolved";
  const transcriptRun = n.linkedTranscriptRunId ? runById(n.linkedTranscriptRunId) : undefined;
  const transcriptDay = transcriptRun?.startedAt.split(",")[0];

  return (
    <div className="flex h-full flex-col">
      {/* breadcrumb header */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <Link href="/os/notices" className={cn("text-[13px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", FOCUS)}>
          Notices
        </Link>
        <Icon icon={I.chevronRight} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
        <span className="rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">{n.type}</span>
        <span className="truncate text-[13px] font-semibold text-[var(--os-ink)]">
          {n.type} - {household?.name}
        </span>
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)] sm:inline-flex">
          <span className={cn("size-1.5 rounded-full", resolved ? "bg-emerald-500" : "bg-amber-500")} />
          {resolved ? `Resolved by ${n.resolvedBy}` : "Response drafted - awaiting your approval"}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-[760px] space-y-6">
          {/* facts grid */}
          <section className="rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] p-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Fact label="Type">{n.type}</Fact>
              <Fact label="Tax year"><span className="tabular-nums">{n.taxYear}</span></Fact>
              <Fact label="Received">{fmtDate(n.received)}</Fact>
              <Fact label="Respond by">
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <DeadlineChip iso={n.respondBy} />
                  {!resolved && (
                    <span className="tabular-nums text-[12px] text-[var(--os-ink-muted)]">
                      {noticeCountdown(n)} days left
                    </span>
                  )}
                </span>
              </Fact>
              {n.amount && <Fact label="Amount"><span className="tabular-nums">{n.amount}</span></Fact>}
              {resolved && n.resolvedBy && <Fact label="Resolved by">{n.resolvedBy}</Fact>}
              {resolved && n.resolvedOn && <Fact label="Resolved on">{fmtDate(n.resolvedOn)}</Fact>}
            </div>
          </section>

          {/* drafted response letter */}
          {n.draftedResponse && (
            <section className="overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-card)]">
              <div className="flex items-center gap-1.5 border-b border-[var(--os-border)] px-4 py-2.5 text-[12px] font-medium text-[var(--os-ink-muted)]">
                <PetalMark className="size-3.5 shrink-0" /> Petal drafted
              </div>
              {editing ? (
                <div className="p-3">
                  <textarea
                    value={letter}
                    onChange={e => setLetter(e.target.value)}
                    aria-label="Edit the drafted response"
                    className={cn("h-64 w-full resize-y rounded-md border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--os-ink)] outline-none focus:border-[var(--os-border-hover)]", FOCUS)}
                  />
                </div>
              ) : (
                <p className="whitespace-pre-line px-4 py-4 text-[13px] leading-relaxed text-[var(--os-ink)]">{letter}</p>
              )}
            </section>
          )}

          {/* provenance for the drafted artifact */}
          {n.runId && <ProvenancePanel runId={n.runId} defaultOpen />}

          {/* linked transcript change */}
          {transcriptRun && (
            <section className="space-y-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-subtle)] p-3">
              <div className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                <PetalMark className="size-3.5 shrink-0" />
                Transcript change detected {transcriptDay} - matches this notice
              </div>
              <ProvenancePanel runId={transcriptRun.id} />
            </section>
          )}

          {/* actions / resolution */}
          {resolved ? (
            n.note && (
              <section className="rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-subtle)] p-3.5">
                <div className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-[var(--os-ink-muted)]">
                  <Icon icon={I.check} size={14} className="text-[var(--os-success)]" /> Resolution
                </div>
                <p className="text-[13px] leading-relaxed text-[var(--os-ink)]">{n.note}</p>
              </section>
            )
          ) : approved ? (
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--os-success)]">
              <Icon icon={I.check} size={15} /> Approved &amp; mailed - deadline cleared from your queue
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <button
                onClick={() => { setEditing(false); setApproved(true); }}
                className={cn("flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[13px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}
              >
                <Icon icon={I.mail} size={14} /> Approve &amp; mail
              </button>
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className={cn("flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}
                  >
                    <Icon icon={I.check} size={14} className="text-[var(--os-ink-muted)]" /> Save
                  </button>
                  <button
                    onClick={() => { setLetter(n.draftedResponse ?? ""); setEditing(false); }}
                    className={cn("flex h-8 items-center rounded-md px-3 text-[13px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className={cn("flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}
                >
                  <Icon icon={I.edit} size={14} /> Edit
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
