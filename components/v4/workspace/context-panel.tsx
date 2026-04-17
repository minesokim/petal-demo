import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { InkStrong } from "@/components/v4/text";
import type {
  ActivityEvent,
  ClientWorkspace,
  ComplianceRow,
  MessagePreview,
  SimilarClient
} from "@/lib/v4/clients";

/**
 * ContextPanel — 320px right-hand column on the client workspace.
 *
 * Sections per docket-synthesis.html:
 *   1. Recent messages   (3 previews, unread → rust left border)
 *   2. Activity          (timeline dots, dashed-separator rows)
 *   3. Compliance        (safety rows with ok/miss/pending states)
 *   4. Similar in your book (3 prior clients)
 */
export function ContextPanel({ client }: { client: ClientWorkspace }) {
  return (
    <div className="overflow-y-auto border-l border-hairline bg-bg px-5 py-[18px]">
      <ContextSection label="Recent messages" more={`${client.recentMessages.length} · M`}>
        {client.recentMessages.map((m, i) => (
          <MsgPreview key={i} msg={m} />
        ))}
      </ContextSection>

      <ContextSection label="Activity" more="full →">
        {client.activity.map((a, i) => (
          <TimelineItem key={i} event={a} />
        ))}
      </ContextSection>

      <ContextSection label="Compliance" more="audit →">
        {client.compliance.map((row, i) => (
          <SafetyRow key={i} row={row} />
        ))}
      </ContextSection>

      <ContextSection label="Similar in your book" more={String(client.similar.length)} last>
        {client.similar.map((s, i) => (
          <SimilarItem key={i} item={s} />
        ))}
      </ContextSection>
    </div>
  );
}

/* ─────────────────────── Section wrapper ─────────────────────── */

function ContextSection({
  label,
  more,
  last,
  children
}: {
  label: string;
  more?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(!last && "mb-6")}>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[10px] font-[550] tracking-[0.12em] text-ink-3 uppercase">
          {label}
        </span>
        {more ? (
          <span className="cursor-pointer font-mono text-[10px] tracking-[0.02em] text-ink-4 hover:text-ink-2">
            {more}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────── Message preview ─────────────────────── */

function MsgPreview({ msg }: { msg: MessagePreview }) {
  return (
    <button
      type="button"
      className={cn(
        "mb-1.5 w-full cursor-pointer rounded-[5px] border border-hairline bg-surface px-3 py-2.5 text-left transition-colors hover:bg-surface-2",
        msg.unread && "border-l-2 border-l-rust"
      )}>
      <div className="mb-1 flex items-center gap-[7px]">
        <span className="inline-flex items-center rounded-[2px] border border-hairline bg-surface-2 px-[5px] py-[1px] font-mono text-[9px] font-medium tracking-[0.08em] text-ink-3 uppercase">
          {msg.channel}
        </span>
        <span className="text-[12px] font-[550] text-ink">{msg.who}</span>
        <span className="ml-auto font-mono text-[10px] tracking-[0.02em] text-ink-4">
          {msg.when}
        </span>
      </div>
      <div className="truncate text-[11.5px] leading-[1.4] text-ink-2">{msg.body}</div>
    </button>
  );
}

/* ─────────────────────── Timeline item ─────────────────────── */

function TimelineItem({ event }: { event: ActivityEvent }) {
  return (
    <div className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 border-b border-dashed border-hairline py-2 last:border-b-0">
      <span
        aria-hidden
        className={cn(
          "mt-[6px] size-[7px] justify-self-center rounded-full shadow-[0_0_0_2px_var(--bg)]",
          event.tone === "rust" ? "bg-rust" : event.tone === "positive" ? "bg-positive" : "bg-ink-5"
        )}
      />
      <div>
        <div className="font-mono text-[10px] tracking-[0.02em] text-ink-4">{event.when}</div>
        <div className="mt-[2px] text-[12px] leading-[1.45] text-ink-2">
          <InkStrong text={event.what} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Compliance safety row ─────────────────────── */

function SafetyRow({ row }: { row: ComplianceRow }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 border-b border-dashed border-hairline py-[7px] text-[11.5px] text-ink-2 last:border-b-0">
      <span className="flex items-center">
        <CheckMark state={row.state} />
        <span className="truncate">{row.label}</span>
      </span>
      <span
        className={cn(
          "font-mono text-[10px] tracking-[0.02em] text-ink-4",
          row.state === "pending" && "text-warning"
        )}>
        {row.ref}
      </span>
    </div>
  );
}

function CheckMark({ state }: { state: ComplianceRow["state"] }) {
  if (state === "ok") {
    return (
      <span className="mr-[7px] inline-grid size-[13px] place-items-center rounded-[3px] bg-positive text-bg">
        <Check className="size-[9px] stroke-[2.5]" aria-hidden />
      </span>
    );
  }
  return (
    <span className="mr-[7px] inline-grid size-[13px] place-items-center rounded-[3px] border border-hairline-2 bg-surface-3 font-mono text-[11px] font-bold text-ink-4">
      —
    </span>
  );
}

/* ─────────────────────── Similar in your book ─────────────────────── */

function SimilarItem({ item }: { item: SimilarClient }) {
  return (
    <div className="grid grid-cols-[14px_minmax(0,1fr)] gap-3 border-b border-dashed border-hairline py-2 last:border-b-0">
      <span
        aria-hidden
        className="mt-[6px] size-[7px] justify-self-center rounded-full bg-ink-5 shadow-[0_0_0_2px_var(--bg)]"
      />
      <div>
        <div className="font-mono text-[10px] tracking-[0.02em] text-ink-4">{item.when}</div>
        <div className="mt-[2px] text-[12px] leading-[1.45] text-ink-2">
          <InkStrong text={item.label} />
        </div>
      </div>
    </div>
  );
}
