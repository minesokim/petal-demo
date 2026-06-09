"use client";

// Return detail — one engagement from the canonical world (param = engagement id,
// e.g. en-parkdental). Everything derives from lib/fixtures at render time.

import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { StageTag, DeadlineChip, StatusPill, SkillPetal } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import {
  engagementById, householdById, entityById, docsOfEngagement, tasks, skillRuns, skillById,
  type ExpectedDoc,
} from "@/lib/fixtures/firm";
import { docsOf, engagementDeadline } from "@/lib/fixtures/derive";
import {
  expectedDocMeta, TASK_STATUS_ORDER, fmtDate, money,
  type ExpectedDocStatus,
} from "@/lib/fixtures/vocab";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const CONFIDENCE_BAR = 0.95;
const DOC_STATUS_ORDER: ExpectedDocStatus[] = ["needs_review", "requested", "have", "na"];

function DocRow({ d }: { d: ExpectedDoc }) {
  const m = expectedDocMeta[d.status];
  const flagged = d.status === "needs_review" && d.fields
    ? d.fields.filter(f => f.flag || f.confidence < CONFIDENCE_BAR)
    : [];
  return (
    <div className="px-3.5 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={cn("size-1.5 shrink-0 rounded-full", m.dot)} />
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{d.source}</span>
        {d.when && <span className="shrink-0 text-[11px] text-[var(--os-ink-subtle)]">{d.when}</span>}
        <span className={cn("shrink-0 text-[12px]", d.status === "needs_review" ? "font-medium text-[var(--os-warning)]" : "text-[var(--os-ink-muted)]")}>
          {m.label}
        </span>
      </div>
      {d.note && <p className="mt-1 pl-4 text-[11px] leading-relaxed text-[var(--os-ink-subtle)]">{d.note}</p>}
      {flagged.length > 0 && (
        <div className="mt-1.5 ml-4 overflow-hidden rounded-md border border-[var(--os-border)] bg-white">
          {flagged.map((f, i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-b border-[var(--os-border)] bg-amber-50/60 px-2.5 py-1.5 text-[12px] last:border-b-0">
              <span className="text-[var(--os-ink-muted)]">{f.label}</span>
              <span className="flex items-center gap-2">
                <span className="font-medium tabular-nums text-[var(--os-ink)]">{f.value}</span>
                <span className="tabular-nums text-[10.5px] font-medium text-amber-700">{Math.round(f.confidence * 100)}% · review</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReturnPage() {
  const params = useParams();
  const e = engagementById(String(params.id));

  if (!e) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div>
          <p className="text-[13px] text-[var(--os-ink-muted)]">No return matches that link.</p>
          <Link
            href="/os/returns"
            className={cn("mt-3 inline-flex h-8 items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", focusRing)}
          >
            Back to the Returns board
          </Link>
        </div>
      </div>
    );
  }

  const hh = householdById(e.householdId)!;
  const entity = entityById(e.entityId);
  const docs = docsOf(e.id);
  const docRows = [...docsOfEngagement(e.id)].sort(
    (a, b) => DOC_STATUS_ORDER.indexOf(a.status) - DOC_STATUS_ORDER.indexOf(b.status),
  );
  const related = tasks
    .filter(t => t.engagementId === e.id)
    .sort((a, b) => TASK_STATUS_ORDER.indexOf(a.status) - TASK_STATUS_ORDER.indexOf(b.status));
  const run = skillRuns.find(r => r.engagementId === e.id);
  const finished = e.stage === "e_filed" || e.stage === "accepted";
  const k1Target = e.k1FlowsTo ? engagementById(e.k1FlowsTo) : undefined;
  const pct = docs.denom > 0 ? Math.round((docs.inHand / docs.denom) * 100) : 0;

  return (
    <div className="flex h-full flex-col">
      {/* breadcrumb: Clients › household › form + year */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <Link href="/os/clients" className={cn("text-[13px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>Clients</Link>
        <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
        <Link href={`/os/clients/${hh.id}`} className={cn("text-[13px] text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", focusRing)}>{hh.name}</Link>
        <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
        <span className="rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-[var(--os-ink-muted)]">{e.form}</span>
        <span className="text-[13px] font-semibold text-[var(--os-ink)]">{entity?.name ?? hh.name} · {e.taxYear}</span>
        <div className="ml-auto flex items-center gap-2.5">
          <StageTag stage={e.stage} />
          {finished
            ? e.acceptedOn && <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">Accepted {fmtDate(e.acceptedOn)}</span>
            : <DeadlineChip {...engagementDeadline(e)} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-[820px] space-y-6">
          {/* blocked callout */}
          {e.blockedBy && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3">
              <Icon icon={I.alert} size={15} className="mt-px shrink-0 text-amber-700" />
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-amber-800">Blocked</div>
                <p className="text-[13px] leading-relaxed text-amber-900">{e.blockedBy}</p>
              </div>
            </div>
          )}

          {/* return facts */}
          <section>
            <div className="os-label mb-2">Return</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                ["Form", e.form],
                ["Tax year", String(e.taxYear)],
                ["Fee", money(e.fee)],
                ["Deposit", e.depositPaid ? "Paid" : "Not collected"],
              ] as const).map(([label, val]) => (
                <div key={label} className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-3">
                  <div className="text-[11px] text-[var(--os-ink-muted)]">{label}</div>
                  <div className="mt-1 text-[15px] font-semibold tabular-nums os-display text-[var(--os-ink)]">{val}</div>
                </div>
              ))}
            </div>
            {finished && (
              <p className="mt-2 text-[12px] tabular-nums text-[var(--os-ink-muted)]">
                {e.eFiledOn && <>E-filed {fmtDate(e.eFiledOn)}</>}
                {e.acceptedOn && <> · Accepted {fmtDate(e.acceptedOn)}</>}
                {e.refund != null && <> · Refund <span className="font-medium text-[var(--os-success)]">{money(e.refund)}</span></>}
              </p>
            )}
          </section>

          {/* documents */}
          <section>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <div className="os-label">Documents</div>
              <span className="text-[12px] tabular-nums text-[var(--os-ink-muted)]">
                Expected {docs.expected} · Have {docs.have}
                {docs.needsReview > 0 && <> · Needs review {docs.needsReview}</>}
                {docs.requested > 0 && <> · Requested {docs.requested}</>}
                {docs.na > 0 && <> · N/A {docs.na}</>}
              </span>
              <span className="ml-auto text-[11px] text-[var(--os-ink-subtle)]">Based on the 2024 return</span>
            </div>
            <div className="mb-2 flex items-center gap-3 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3.5 py-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
                <div className="h-full rounded-full bg-[var(--os-ink-muted)]" style={{ width: `${pct}%` }} />
              </div>
              <span className={cn("shrink-0 text-[12px] tabular-nums", docs.inHand >= docs.denom ? "text-[var(--os-ink-subtle)]" : "text-[var(--os-warning)]")}>
                {docs.label} docs
              </span>
            </div>
            <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
              {docRows.map(d => <DocRow key={d.id} d={d} />)}
            </div>
          </section>

          {/* tasks touching this return */}
          <section>
            <div className="os-label mb-2">Tasks on this return</div>
            {related.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--os-border)] px-3.5 py-3 text-[12px] text-[var(--os-ink-subtle)]">
                Nothing queued — Petal surfaces work here as it comes up.
              </p>
            ) : (
              <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
                {related.map(t => {
                  const sk = skillById(t.skillId);
                  return (
                    <Link
                      key={t.id}
                      href={`/os/tasks?task=${t.id}`}
                      className={cn("flex items-center gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-[var(--os-hover)]", focusRing)}
                    >
                      {sk && <SkillPetal category={sk.category} size={14} />}
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{t.title}</span>
                      <StatusPill status={t.status} className="shrink-0" />
                      <Icon icon={I.chevronRight} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* provenance for the latest run touching this engagement */}
          {run && (
            <section>
              <div className="os-label mb-2">Latest run</div>
              <ProvenancePanel runId={run.id} defaultOpen />
            </section>
          )}

          {/* household + relationship links */}
          <section>
            <div className="os-label mb-2">Household</div>
            <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
              <Link href={`/os/clients/${hh.id}`} className={cn("flex items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-[var(--os-hover)]", focusRing)}>
                <span className="text-[12px] text-[var(--os-ink-muted)]">Household record</span>
                <span className="flex items-center gap-1 text-[13px] text-[var(--os-ink)]">
                  {hh.name} <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
                </span>
              </Link>
              {k1Target && (
                <Link href={`/os/returns/${k1Target.id}`} className={cn("flex items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-[var(--os-hover)]", focusRing)}>
                  <span className="text-[12px] text-[var(--os-ink-muted)]">K-1 flows to</span>
                  <span className="flex items-center gap-1 text-[13px] text-[var(--os-ink)]">
                    {entityById(k1Target.entityId)?.name ?? householdById(k1Target.householdId)?.name} · {k1Target.form}
                    <Icon icon={I.chevronRight} size={13} className="text-[var(--os-ink-subtle)]" />
                  </span>
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
