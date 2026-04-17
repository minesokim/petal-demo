"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { HeaderSlot } from "@/components/v4/layout/shell-context";
import { QueueList } from "./queue-list";
import { DetailPane } from "./detail-pane";
import { ProgressStrip } from "./progress-strip";
import { TRIAGE_ITEMS, TRIAGE_PROGRESS, type TriageItem } from "@/lib/v4/triage-items";

/**
 * TriageView — top-level client component for /dashboard/triage.
 *
 * Owns:
 *   - selection state (id of the currently active queue item)
 *   - keyboard handlers: J/K cycle, Enter opens, R/E/S/⌫ stubs
 *   - mounts ProgressStrip into the shell's HeaderSlot
 *
 * Presentational children (QueueList, DetailPane) are controlled.
 */

const KEY_ACTIONS = {
  next: ["j", "arrowdown"],
  prev: ["k", "arrowup"],
  open: ["enter"],
  respond: ["r"],
  edit: ["e"],
  snooze: ["s"],
  archive: ["backspace"]
} as const;

export function TriageView({ items = TRIAGE_ITEMS }: { items?: TriageItem[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = React.useState<string>(items[0]?.id ?? "");

  const selectedIndex = React.useMemo(
    () => Math.max(items.findIndex((i) => i.id === selectedId), 0),
    [items, selectedId]
  );
  const selected = items[selectedIndex] ?? items[0];
  const next = items[selectedIndex + 1] ?? null;

  const advance = React.useCallback(
    (delta: number) => {
      const nextIdx = Math.min(Math.max(selectedIndex + delta, 0), items.length - 1);
      setSelectedId(items[nextIdx].id);
    },
    [items, selectedIndex]
  );

  const openWorkspace = React.useCallback(() => {
    if (selected?.clientId) {
      router.push(`/dashboard/client/${selected.clientId}`);
    }
  }, [router, selected]);

  // Global keyboard handler — ignore when user is typing in a text input.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const k = e.key.toLowerCase();

      if (KEY_ACTIONS.next.includes(k as (typeof KEY_ACTIONS.next)[number])) {
        e.preventDefault();
        advance(1);
      } else if (KEY_ACTIONS.prev.includes(k as (typeof KEY_ACTIONS.prev)[number])) {
        e.preventDefault();
        advance(-1);
      } else if (KEY_ACTIONS.open.includes(k as (typeof KEY_ACTIONS.open)[number])) {
        e.preventDefault();
        openWorkspace();
      } else if (KEY_ACTIONS.respond.includes(k as (typeof KEY_ACTIONS.respond)[number])) {
        console.log("[triage] R: resolve/respond", selected?.id);
      } else if (KEY_ACTIONS.edit.includes(k as (typeof KEY_ACTIONS.edit)[number])) {
        console.log("[triage] E: edit draft", selected?.id);
      } else if (KEY_ACTIONS.snooze.includes(k as (typeof KEY_ACTIONS.snooze)[number])) {
        console.log("[triage] S: snooze", selected?.id);
      } else if (KEY_ACTIONS.archive.includes(k as (typeof KEY_ACTIONS.archive)[number])) {
        e.preventDefault();
        console.log("[triage] ⌫: archive", selected?.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, openWorkspace, selected]);

  if (!selected) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-ink-3">
        Queue is empty. Nice.
      </div>
    );
  }

  return (
    <>
      <HeaderSlot>
        <ProgressStrip
          done={TRIAGE_PROGRESS.done}
          total={TRIAGE_PROGRESS.total}
          goalCopy={TRIAGE_PROGRESS.goalCopy}
          paceEstimate={TRIAGE_PROGRESS.paceEstimate}
        />
      </HeaderSlot>

      <div
        className="grid h-full min-h-0"
        style={{ gridTemplateColumns: "440px minmax(0, 1fr)" }}>
        <QueueList items={items} selectedId={selected.id} onSelect={setSelectedId} />
        <DetailPane
          item={selected}
          position={selectedIndex + 1}
          total={items.length}
          nextItem={next}
          onPrev={() => advance(-1)}
          onNext={() => advance(1)}
        />
      </div>
    </>
  );
}
