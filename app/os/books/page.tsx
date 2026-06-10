"use client";

// Books — books-to-tax readiness for the firm's books clients. This module
// exists to get each ledger tax-ready; every row + count derives from
// lib/fixtures. Petal runs reconciliation/categorization; the owner signs off.

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { SkillPetal } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { FeatureCallout } from "@/components/os/callout";
import {
  booksItems, booksMonth, booksStatusMeta, BOOKS_ORDER,
  householdById, skillById, type BooksItem, type BooksStatus,
} from "@/lib/fixtures/firm";
import { trustTierMeta } from "@/lib/fixtures/vocab";
import { booksClients } from "@/lib/fixtures/derive";

/** Status circle — the old close-checklist row glyph, kept verbatim. */
function StatusGlyph({ status }: { status: BooksStatus }) {
  return (
    <span
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-full border-2",
        status === "complete"
          ? "border-[var(--os-brand)] bg-[var(--os-brand)] text-white"
          : status === "in_progress"
            ? "border-[var(--os-brand-soft)]"
            : "border-[var(--os-border-strong)]",
      )}
    >
      {status === "complete" && <Icon icon={I.check} size={10} />}
    </span>
  );
}

function Row({ item }: { item: BooksItem }) {
  // bk-1 (the completed reconciliation with run-recon-park) opens by default —
  // the worked example of a completed Petal run with provenance.
  const [open, setOpen] = useState(item.id === "bk-1");
  const [queued, setQueued] = useState(false);

  const client = householdById(item.householdId)?.name ?? "";
  const expandable = Boolean(item.runId);

  const skill = skillById("sk-books");
  const skillTip = skill
    ? `${skill.name} · ${trustTierMeta[skill.trust].code} ${trustTierMeta[skill.trust].label}`
    : undefined;

  const titleBlock = (
    <div className="min-w-0 flex-1">
      <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{item.title}</div>
      <div className="truncate text-[12px] text-[var(--os-ink-subtle)]">{client}</div>
    </div>
  );

  return (
    <div className="border-b border-[var(--os-border)]">
      <div className="flex min-h-14 items-center gap-3 px-8 py-2 transition-colors hover:bg-[var(--os-hover)]">
        <StatusGlyph status={item.status} />

        {expandable ? (
          <button
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            className="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
          >
            {titleBlock}
            <Icon
              icon={I.chevronDown}
              size={13}
              className={cn("shrink-0 text-[var(--os-ink-subtle)] transition-transform", !open && "-rotate-90")}
            />
          </button>
        ) : (
          titleBlock
        )}

        <span className="hidden shrink-0 rounded-md border border-[var(--os-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-muted)] sm:inline-flex">
          {item.group}
        </span>
        <span className="hidden w-14 shrink-0 text-right text-[12px] tabular-nums text-[var(--os-ink-muted)] sm:inline-block">
          {item.due}
        </span>

        {item.petalRunnable ? (
          queued ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
              <PetalMark className="size-3 shrink-0" />
              Queued — lands in Tasks for your approval
            </span>
          ) : (
            <button
              onClick={() => setQueued(true)}
              title={skillTip}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
            >
              <SkillPetal category="books" size={13} />
              Run with Petal
            </button>
          )
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--os-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--os-ink-subtle)]">
            Owner review
          </span>
        )}
      </div>

      {expandable && open && item.runId && (
        <div className="px-8 pb-4 pt-1">
          <ProvenancePanel runId={item.runId} defaultOpen className="sm:ml-7" />
        </div>
      )}
    </div>
  );
}

export default function BooksPage() {
  const clients = booksClients();
  const groups = BOOKS_ORDER
    .map(s => ({ status: s, items: booksItems.filter(t => t.status === s) }))
    .filter(g => g.items.length > 0);

  const runnable = booksItems.filter(b => b.petalRunnable && b.status !== "complete");
  const previewItem = runnable[0];

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <h1 className="os-display text-[24px] font-semibold text-[var(--os-ink)]">Books</h1>
        <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">
          {booksMonth} · books-to-tax readiness for {clients.length} clients
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {clients.map(h => (
            <Link
              key={h.id}
              href={`/os/clients/${h.id}`}
              className="inline-flex items-center rounded-md border border-[var(--os-border)] px-2 py-0.5 text-[12px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
            >
              {h.name}
            </Link>
          ))}
        </div>
      </div>

      {/* checklist grouped by status */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* the crafted moment — run the remaining readiness items with Petal */}
        {runnable.length > 0 && (
          <div className="px-8 pt-5">
            <FeatureCallout
              className="mb-5"
              eyebrow={<><SkillPetal category="books" size={13} /> Books-to-Tax Close · {trustTierMeta[skillById("sk-books")!.trust].code} {trustTierMeta[skillById("sk-books")!.trust].label}</>}
              title={`Petal can run ${runnable.length} of the open items`}
              body="Reconciliations and categorization queue as drafts for your approval — owner sign-off stays yours. Every run logs its sources."
              action={{ label: "Run with Petal", href: "/os/tasks?task=t-park-books" }}
              secondary={{ label: "See a finished run", href: "/os/activity?run=run-recon-park" }}
              preview={
                previewItem && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--os-ink-subtle)]">
                      <SkillPetal category="books" size={11} />
                      {householdById(previewItem.householdId)?.name}
                    </div>
                    <div className="mt-1 text-[12px] font-semibold leading-snug text-[var(--os-ink)]">{previewItem.title}</div>
                    <div className="mt-2 space-y-1 text-[10.5px] leading-tight text-[var(--os-ink-muted)]">
                      <div className="flex items-center gap-1.5 rounded-md border border-[var(--os-border)] px-2 py-1">
                        <span className="size-1 rounded-full bg-emerald-500" /> Categories proposed from David's email
                      </div>
                      <div className="flex items-center gap-1.5 rounded-md border border-[var(--os-border)] px-2 py-1">
                        <span className="size-1 rounded-full bg-emerald-500" /> Adjusting entries drafted
                      </div>
                      <div className="flex items-center gap-1.5 rounded-md border border-[var(--os-border-strong)] bg-[var(--os-card)] px-2 py-1 font-medium text-[var(--os-ink)]">
                        <PetalMark className="size-2.5" /> Lands in Tasks for your approval
                      </div>
                    </div>
                  </div>
                )
              }
            />
          </div>
        )}

        {groups.length === 0 ? (
          <div className="grid place-items-center gap-1.5 px-6 py-16 text-center">
            <PetalMark className="size-4 text-[var(--os-ink-subtle)]" />
            <p className="text-[13px] text-[var(--os-ink-muted)]">
              Nothing on the books checklist yet. Petal starts the {booksMonth} run at month
              end for {clients.length} clients — or run a skill from any client record now.
            </p>
          </div>
        ) : (
          groups.map(g => (
            <div key={g.status}>
              <div className="flex items-center gap-2 bg-[var(--os-bg-subtle)] px-8 py-1.5">
                <span className={cn("size-2 shrink-0 rounded-full", booksStatusMeta[g.status].dot)} />
                <span className="text-[13px] font-medium text-[var(--os-ink)]">
                  {booksStatusMeta[g.status].label}
                </span>
                <span className="text-[13px] tabular-nums text-[var(--os-ink-subtle)]">{g.items.length}</span>
              </div>
              {g.items.map(item => (
                <Row key={item.id} item={item} />
              ))}
            </div>
          ))
        )}

        {/* quiet caption */}
        <div className="flex items-start gap-1.5 px-8 py-4 text-[12px] text-[var(--os-ink-subtle)]">
          <PetalMark className="mt-0.5 size-3 shrink-0" />
          <span>
            Petal reconciles and categorizes; you review and sign off. Books here exist to
            make the tax return defensible.
          </span>
        </div>
      </div>
    </div>
  );
}
