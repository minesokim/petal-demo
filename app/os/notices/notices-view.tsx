"use client";

// Notices - every IRS/state notice the firm is handling, with the response
// drafted for approval. All rows + counts derive from lib/fixtures.

import Link from "next/link";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { type Notice } from "@/lib/fixtures/firm";
import { fmtDate } from "@/lib/fixtures/vocab";
import { noticeCountdown } from "@/lib/fixtures/derive";
import { useFirmData, useDerive } from "@/lib/client/firm-context";

const COLS = "grid-cols-[92px_minmax(150px,1.3fr)_76px_88px_148px_minmax(230px,1.7fr)]";

function TypeChip({ type }: { type: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-md border border-[var(--os-border)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--os-ink)]">
      {type}
    </span>
  );
}

function Countdown({ n }: { n: Notice }) {
  if (n.status === "resolved") {
    return <span className="text-[12px] text-[var(--os-ink-subtle)]">Resolved {n.resolvedOn ? fmtDate(n.resolvedOn) : ""}</span>;
  }
  const d = noticeCountdown(n);
  return (
    <span className={cn("text-[13px] tabular-nums", d < 14 ? "font-medium text-[var(--os-danger)]" : "text-[var(--os-ink)]")}>
      {d} days left
    </span>
  );
}

function StatusCell({ n }: { n: Notice }) {
  if (n.status === "resolved") {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
        <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
        <span className="truncate">Resolved by {n.resolvedBy}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
      <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
      <span className="truncate">Response drafted - awaiting your approval</span>
    </span>
  );
}

export function NoticesView() {
  const { notices } = useFirmData();
  const { householdById, transcriptWatchCount } = useDerive();
  const rows = [...notices].sort(
    (a, b) =>
      (a.status === "resolved" ? 1 : 0) - (b.status === "resolved" ? 1 : 0) ||
      a.respondBy.localeCompare(b.respondBy),
  );
  const watching = transcriptWatchCount();

  return (
    <div className="flex h-full flex-col">
      {/* header */}
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <h1 className="os-display text-[24px] font-semibold text-[var(--os-ink)]">Notices</h1>
        <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">
          Every notice matched against the filed return, with the response drafted for your approval.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          {rows.length === 0 ? (
            <div className="grid place-items-center gap-1.5 rounded-lg border border-dashed border-[var(--os-border-strong)] px-4 py-10 text-center">
              <PetalMark className="size-4 text-[var(--os-ink-subtle)]" />
              <p className="text-[13px] text-[var(--os-ink-muted)]">
                No notices. Petal is watching transcripts for {watching} clients.
              </p>
            </div>
          ) : (
            <>
              {/* table - horizontal scroll at narrow widths */}
              <div className="overflow-x-auto">
                <div className="min-w-[780px]">
                  <div className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] px-2 py-2", COLS)}>
                    {["Type", "Client", "Tax year", "Received", "Respond by", "Status"].map(h => (
                      <div key={h} className="os-label">{h}</div>
                    ))}
                  </div>
                  {rows.map(n => (
                    <Link
                      key={n.id}
                      href={`/os/notices/${n.id}`}
                      className={cn(
                        "grid w-full items-center gap-x-4 border-b border-[var(--os-border)] px-2 py-2.5 text-left transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
                        COLS,
                      )}
                    >
                      <TypeChip type={n.type} />
                      <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">
                        {householdById(n.householdId)?.name}
                      </div>
                      <div className="text-[13px] tabular-nums text-[var(--os-ink-muted)]">{n.taxYear}</div>
                      <div className="text-[13px] text-[var(--os-ink-muted)]">{fmtDate(n.received)}</div>
                      <Countdown n={n} />
                      <StatusCell n={n} />
                    </Link>
                  ))}
                </div>
              </div>

              {/* quiet caption - always under the table */}
              <div className="flex items-center gap-1.5 px-2 py-3 text-[12px] text-[var(--os-ink-subtle)]">
                <PetalMark className="size-3 shrink-0" />
                Petal is watching transcripts for {watching} clients.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
