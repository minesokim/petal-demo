"use client";

import * as React from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TriageItem } from "@/lib/v4/triage-items";

/**
 * DetailPane — flex-right surface for the currently selected queue item.
 *
 * Layout (petal-direction-b-v2.html):
 *   sticky breadcrumb → header (tag + serif title + sub) →
 *   sections (context · insight · draft) → up-next → sticky actions
 *
 * Items without a `message`/`insight`/`draft` payload render just the
 * breadcrumb, header, up-next, and actions. Phase 2 fleshes out Priya;
 * other items get the structural shell so the rhythm is consistent.
 */
export interface DetailPaneProps {
  item: TriageItem;
  position: number;
  total: number;
  nextItem: TriageItem | null;
  onPrev: () => void;
  onNext: () => void;
}

export function DetailPane({ item, position, total, nextItem, onPrev, onNext }: DetailPaneProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-bg">
      <Breadcrumb
        item={item}
        position={position}
        total={total}
        onPrev={onPrev}
        onNext={onNext}
      />

      <DetailHeader item={item} />

      {item.message ? (
        <Section num={1} label="Context · her message">
          <MessageBubble item={item} />
        </Section>
      ) : null}

      {item.insight ? (
        <Section num={2} label="Petal noticed" hint="expand reasoning ⇧R">
          <InsightCard insight={item.insight} />
        </Section>
      ) : null}

      {item.draft ? (
        <Section num={3} label="Draft · ready to send" hint="edit inline · E">
          <DraftCard draft={item.draft} />
        </Section>
      ) : (
        <Section num={item.message || item.insight ? 3 : 1} label="Detail coming next phase">
          <p className="text-[13px] text-ink-3">
            This item type ({item.type}) renders with its full insight + draft
            in Phase 2b. The shell, breadcrumb, and action bar are wired so J/K
            cycling and keyboard shortcuts can be tested today.
          </p>
        </Section>
      )}

      <div className="flex-1" />

      {nextItem ? <UpNext next={nextItem} /> : null}
      <ActionBar item={item} />
    </div>
  );
}

/* ─────────────────────── Breadcrumb ─────────────────────── */

function Breadcrumb({
  item,
  position,
  total,
  onPrev,
  onNext
}: {
  item: TriageItem;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const timeLabel =
    item.estMinutes < 60 ? `${item.estMinutes} min to resolve` : `${item.estMinutes}m to resolve`;
  return (
    <div className="sticky top-0 z-[2] flex items-center gap-2.5 border-b border-hairline bg-bg px-7 py-2.5">
      <div className="flex gap-[2px]">
        <BcBtn title="Previous (K)" Icon={ArrowUp} onClick={onPrev} />
        <BcBtn title="Next (J)" Icon={ArrowDown} onClick={onNext} />
      </div>
      <span className="font-mono text-[11px] tracking-[0.02em] text-ink-3">
        <span className="font-medium text-ink">{position}</span> / {total}
      </span>
      <span className="text-ink-5">·</span>
      <div className="flex cursor-pointer items-center gap-1.5 rounded-[12px] border border-hairline bg-surface py-[3px] pr-2 pl-[5px] text-[12px] font-medium text-ink transition-colors hover:bg-surface-2">
        <span className="grid size-4 place-items-center rounded-full bg-surface-2 text-[8px] font-medium text-ink-2 shadow-[inset_0_0_0_1px_var(--hairline-2)]">
          {item.clientInitials}
        </span>
        {item.clientName}
        <span className="font-mono text-[11px] font-normal text-ink-4">· {item.serviceTier}</span>
      </div>
      <span className="text-ink-5">·</span>
      <span className="font-mono text-[11px] tracking-[0.02em] text-ink-3">{item.intakeLabel}</span>
      <span className="flex-1" />
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-4 before:block before:size-[5px] before:rounded-full before:bg-warning">
        {timeLabel}
      </span>
    </div>
  );
}

function BcBtn({
  title,
  Icon,
  onClick
}: {
  title: string;
  Icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="grid size-[22px] place-items-center rounded-[3px] border border-hairline bg-surface text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink">
      <Icon className="size-[11px] stroke-[1.5]" />
    </button>
  );
}

/* ─────────────────────── Header ─────────────────────── */

function DetailHeader({ item }: { item: TriageItem }) {
  const tagColor =
    item.severity === "critical"
      ? "text-error before:bg-error"
      : item.severity === "high"
        ? "text-rust before:bg-rust"
        : "text-ink-3 before:bg-ink-4";

  return (
    <div className="px-8 pt-6 pb-4">
      <div
        className={cn(
          "mb-3 inline-flex items-center gap-[7px] font-mono text-[10.5px] font-medium tracking-[0.11em] uppercase before:block before:size-[6px] before:rounded-full",
          tagColor
        )}>
        {item.type === "MSG" ? "Message" : item.type} · {item.severity} · {item.action.toLowerCase()}
      </div>
      <h1
        className="mb-[7px] max-w-[680px] font-serif text-[24px] font-medium leading-[1.18] text-ink"
        style={{
          letterSpacing: "-0.018em",
          fontVariationSettings: '"opsz" 144, "SOFT" 30'
        }}>
        <SerifWithAccent text={item.detailTitle} />
      </h1>
      <p className="max-w-[640px] text-[13.5px] leading-[1.5] text-ink-3">
        <MonoNumbers text={item.detailSubtitle} />
      </p>
    </div>
  );
}

/* Parses *asterisked* fragments as italic rust spans (editorial accent). */
function SerifWithAccent({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("*") && p.endsWith("*") ? (
          <em
            key={i}
            className="italic text-rust"
            style={{ fontVariationSettings: '"opsz" 14, "SOFT" 80' }}>
            {p.slice(1, -1)}
          </em>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

/* Wraps $NNN or standalone digit-like tokens in mono tabular-nums. */
function MonoNumbers({ text }: { text: string }) {
  const parts = text.split(/(\$[0-9,]+(?:\.[0-9]+)?)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\$/.test(p) ? (
          <span key={i} className="font-mono tabular-nums">
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

/* ─────────────────────── Section wrapper ─────────────────────── */

function Section({
  num,
  label,
  hint,
  children
}: {
  num: number;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-8 pb-5">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="grid size-[18px] place-items-center rounded-full border border-hairline-2 bg-surface-2 font-mono text-[10px] font-medium text-ink-3">
          {num}
        </div>
        <span className="font-mono text-[10.5px] font-medium tracking-[0.12em] text-ink-3 uppercase">
          {label}
        </span>
        <span className="h-px flex-1 bg-hairline" />
        {hint ? <span className="font-mono text-[10px] text-ink-4">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────── Message bubble ─────────────────────── */

function MessageBubble({ item }: { item: TriageItem }) {
  const msg = item.message!;
  return (
    <div className="flex gap-3">
      <span className="mt-[2px] grid size-[26px] flex-shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-medium text-ink-2 shadow-[inset_0_0_0_1px_var(--hairline-2)]">
        {item.clientInitials}
      </span>
      <div className="flex max-w-[560px] flex-1 flex-col gap-[5px]">
        <div className="rounded-tl-[10px] rounded-tr-[10px] rounded-br-[10px] rounded-bl-[2px] border border-hairline bg-surface px-[13px] py-[11px] text-[13.5px] leading-[1.5] text-ink">
          {msg.body}
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-ink-4">
          <span className="rounded-[2px] bg-surface-2 px-[5px] font-medium text-ink-3">
            {msg.channel}
          </span>
          {msg.timestamp}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Insight card ─────────────────────── */

function InsightCard({ insight }: { insight: NonNullable<TriageItem["insight"]> }) {
  return (
    <div className="rounded-[3px] border border-hairline border-l-2 border-l-rust bg-surface px-[18px] py-4">
      <div className="mb-2.5 flex items-center gap-2.5 font-mono text-[10px]">
        <span className="flex items-center gap-1.5 font-medium tracking-[0.12em] text-rust uppercase before:block before:size-[5px] before:rounded-full before:bg-rust">
          Insight
        </span>
        <span className="tracking-[0.02em] text-ink-4">
          {insight.grounding.map((g, i) => (
            <React.Fragment key={g}>
              {g}
              {i < insight.grounding.length - 1 ? <span className="mx-1 text-ink-5">·</span> : null}
            </React.Fragment>
          ))}
        </span>
      </div>
      <p
        className="mb-3.5 font-serif text-[15.5px] leading-[1.55] text-ink"
        style={{
          letterSpacing: "-0.003em",
          fontVariationSettings: '"opsz" 14, "SOFT" 50'
        }}>
        <SerifWithAccent text={insight.body} />
      </p>
      <div className="grid grid-cols-4 border-t border-hairline pt-3.5">
        {insight.stats.map((s, i) => (
          <div
            key={s.label}
            className={cn("pr-4", i < insight.stats.length - 1 && "border-r border-hairline")}>
            <div className="mb-[3px] font-mono text-[9.5px] font-medium tracking-[0.11em] text-ink-4 uppercase">
              {s.label}
            </div>
            <div
              className={cn(
                "font-mono text-[17px] font-medium tabular-nums",
                s.accent ? "text-rust" : "text-ink"
              )}
              style={{ letterSpacing: "-0.005em" }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Draft card ─────────────────────── */

function DraftCard({ draft }: { draft: NonNullable<TriageItem["draft"]> }) {
  return (
    <div className="overflow-hidden rounded-[4px] border border-hairline bg-surface">
      <div className="flex items-center justify-between border-b border-hairline bg-bg px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 font-mono text-[10px]">
          <span className="flex items-center gap-1.5 font-medium tracking-[0.12em] text-rust uppercase before:block before:size-[5px] before:rounded-full before:bg-rust">
            Petal drafted
          </span>
          <span className="tracking-[0.02em] text-ink-4">{draft.rationale}</span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.02em] text-ink-4">
          {draft.channel} · {draft.charsUsed} / {draft.charsMax} chars
        </span>
      </div>
      <div className="space-y-2.5 px-4 py-3.5 text-[13.5px] leading-[1.58] text-ink">
        {draft.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Up next preview ─────────────────────── */

function UpNext({ next }: { next: TriageItem }) {
  return (
    <div className="flex items-center gap-3 border-t border-dashed border-hairline px-8 pt-2.5 pb-4 text-[12px] text-ink-3">
      <span className="font-mono text-[10px] font-medium tracking-[0.11em] text-ink-4 uppercase">
        Up next
      </span>
      <div className="flex items-center gap-2 rounded-[14px] border border-hairline bg-surface py-1 pr-2.5 pl-1">
        <span className="grid size-[18px] place-items-center rounded-full bg-surface-2 text-[8.5px] font-medium text-ink-2 shadow-[inset_0_0_0_1px_var(--hairline-2)]">
          {next.clientInitials}
        </span>
        <span className="text-[12px] font-medium text-ink-2">{next.clientName}</span>
        <span className="text-[11.5px] text-ink-4">· {next.action.toLowerCase()}</span>
      </div>
      <Kbd>J</Kbd>
    </div>
  );
}

/* ─────────────────────── Action bar ─────────────────────── */

function ActionBar({ item }: { item: TriageItem }) {
  const hasDraft = Boolean(item.draft);
  return (
    <div className="sticky bottom-0 flex gap-2 border-t border-hairline bg-bg px-8 py-3.5">
      {hasDraft ? (
        <Button primary>
          Send as Antonio <Kbd inverted>R</Kbd>
        </Button>
      ) : (
        <Button primary>
          Resolve <Kbd inverted>R</Kbd>
        </Button>
      )}
      {hasDraft ? (
        <Button>
          Edit draft <Kbd>E</Kbd>
        </Button>
      ) : null}
      <Button>
        Call {item.clientName.split(" ")[0]} <Kbd>C</Kbd>
      </Button>
      <Button>
        Open client file <Kbd>⌘⏎</Kbd>
      </Button>
      <span className="flex-1" />
      <Button ghost>
        Snooze <Kbd>S</Kbd>
      </Button>
      <Button ghost>
        Archive <Kbd>⌫</Kbd>
      </Button>
    </div>
  );
}

function Button({
  primary,
  ghost,
  children
}: {
  primary?: boolean;
  ghost?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-2 rounded-[5px] border px-[13px] py-[7px] text-[13px] font-medium transition-colors",
        "border-hairline bg-surface text-ink-2 hover:bg-surface-2",
        primary && "border-ink bg-ink px-[15px] text-bg hover:bg-ink-2",
        ghost && "border-transparent bg-transparent text-ink-3 hover:bg-surface-2 hover:text-ink-2"
      )}
      style={{ letterSpacing: "-0.005em" }}>
      {children}
    </button>
  );
}

function Kbd({ children, inverted }: { children: React.ReactNode; inverted?: boolean }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded-[3px] border px-[5px] font-mono text-[10px] tracking-[0.02em]",
        inverted
          ? "border-white/15 bg-white/[0.08] text-white/75"
          : "border-hairline bg-bg text-ink-3"
      )}
      style={{ paddingTop: 1, paddingBottom: 1 }}>
      {children}
    </kbd>
  );
}
