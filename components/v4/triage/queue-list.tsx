"use client";

import * as React from "react";
import { ListFilter, ArrowDownUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TypeBadge } from "./type-badge";
import { HORIZONS, type TriageItem } from "@/lib/v4/triage-items";

/**
 * QueueList — 440px left pane.
 *
 * Groups items by `horizon` in the order declared in HORIZONS.
 * Selection is driven by the parent (TriageView); this component
 * just renders and reports clicks.
 */
export interface QueueListProps {
  items: TriageItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Editorial tagline shown below the title, italic rust serif.
   *  e.g. "inbox zero by 4 pm · est 2h 20m at pace". */
  tagline?: string;
}

export function QueueList({ items, selectedId, onSelect, tagline }: QueueListProps) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, TriageItem[]>();
    for (const i of items) {
      const list = map.get(i.horizon) ?? [];
      list.push(i);
      map.set(i.horizon, list);
    }
    return map;
  }, [items]);

  return (
    <div className="flex h-full flex-col overflow-y-auto border-r border-hairline bg-bg">
      <div className="sticky top-0 z-[3] border-b border-hairline bg-bg px-4 pt-2.5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2 font-serif text-[16px] font-medium tracking-[-0.015em] text-ink">
            Triage{" "}
            <span className="font-mono text-[11px] font-normal text-ink-4">
              {items.length} items
            </span>
          </div>
          <div className="flex gap-1">
            <ListBtn title="Filter" Icon={ListFilter} />
            <ListBtn title="Sort" Icon={ArrowDownUp} />
          </div>
        </div>
        {tagline ? (
          <p
            className="mt-1 text-[13px] leading-snug tracking-[-0.003em] text-rust italic"
            style={{
              // Pull Fraunces italic directly (bypass the P22-first serif stack):
              // the self-hosted P22 Mackinac build ships roman-only AND includes
              // DEMO watermarks on certain glyphs (notably digits), so routing
              // through P22 for italic body text produces visible artifacts like
              // "inbox zero by [DEMO]pm". Fraunces has a real italic face loaded
              // via next/font/google — use it unconditionally for this moment.
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontVariationSettings: '"opsz" 14',
              fontSynthesis: "none"
            }}>
            {tagline}
          </p>
        ) : null}
      </div>

      {HORIZONS.map((h) => {
        const group = grouped.get(h.key) ?? [];
        if (group.length === 0) return null;
        return (
          <React.Fragment key={h.key}>
            <div className="flex items-center gap-2.5 bg-bg px-4 pt-4 pb-1.5 first:pt-3">
              <span
                className={cn(
                  "font-mono text-[10px] font-medium tracking-[0.13em] uppercase",
                  h.urgent ? "text-rust" : "text-ink-3"
                )}>
                {h.label}
              </span>
              <span className="h-px flex-1 bg-hairline" />
              <span className="font-mono text-[10px] text-ink-4">{group.length}</span>
            </div>
            {group.map((item) => (
              <QueueRow
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={() => onSelect(item.id)}
              />
            ))}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ListBtn({ title, Icon }: { title: string; Icon: React.ElementType }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className="grid size-[22px] place-items-center rounded-[3px] border border-hairline bg-surface text-ink-3 transition-colors hover:bg-surface-2">
      <Icon className="size-[11px] stroke-[1.5]" />
    </button>
  );
}

function QueueRow({
  item,
  selected,
  onSelect
}: {
  item: TriageItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-selected={selected || undefined}
      className={cn(
        "group relative grid grid-cols-[22px_minmax(0,1fr)_auto] items-start gap-2.5 border-b border-hairline px-4 py-2.5 text-left transition-colors",
        "hover:bg-surface",
        selected && "bg-surface"
      )}>
      {selected ? (
        <span className="absolute inset-y-0 left-0 w-[2px] bg-rust" aria-hidden />
      ) : null}
      <TypeBadge type={item.type} className="mt-[1px]" />

      <div className="min-w-0">
        <div className="mb-[2px] flex items-center gap-2">
          <span className="max-w-[240px] truncate text-[13px] font-medium text-ink">
            {item.clientName}
          </span>
          <span className="font-mono text-[10px] text-ink-4">
            · {item.serviceTier} · ${item.fee}
          </span>
        </div>
        <div className="truncate text-[12.5px] leading-[1.4] text-ink-2">
          <ActionText
            action={item.action}
            emphasis={item.actionEmphasis}
          />
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-col items-end gap-1 pt-[2px]">
        <span
          className={cn(
            "font-mono text-[10px] tracking-[0.01em]",
            item.timeCost === "call" ? "text-warning" : "text-ink-4"
          )}>
          {item.timeCost === "call" ? "call" : `${item.timeCost}m`}
        </span>
        <span className={cn("font-mono text-[10px]", item.ageOverdue ? "text-error" : "text-ink-4")}>
          {item.age}
        </span>
      </div>
    </button>
  );
}

/** Renders the action line; if `emphasis` is a substring, that span gets rust weight-500. */
function ActionText({ action, emphasis }: { action: string; emphasis?: string }) {
  if (!emphasis) return <>{action}</>;
  const idx = action.indexOf(emphasis);
  if (idx === -1) return <>{action}</>;
  return (
    <>
      {action.slice(0, idx)}
      <span className="font-medium text-rust">{emphasis}</span>
      {action.slice(idx + emphasis.length)}
    </>
  );
}
