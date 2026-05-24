import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * StatusBar — 28px bottom bar, persistent across both modes.
 *
 * Per PETAL-V4-PRD.md §3.5 and design-references/petal-direction-b-v2.html:
 *   [ ⌘T back to triage (N)?  |  J K navigate | ⏎ open | R respond | S snooze |
 *     ⌫ archive | ⌘K command  |  April 17 · 18 days to deadline ]   [ SYNCED 2 MIN AGO ]
 *
 * All text is Geist Mono uppercase at 10px except the date/deadline which
 * preserve case. Sync indicator renders right-aligned with a positive dot.
 *
 * `returnHint` appears only in client workspace — it is the always-visible
 * rust reminder that ⌘T goes back to the triage queue.
 */

export type Shortcut = {
  /** Keys shown inside the kbd (e.g. ["J", "K"] renders as "J K"). */
  keys: string[];
  label: string;
};

export interface StatusBarProps {
  shortcuts?: Shortcut[];
  /** Date segment, e.g. "April 17". */
  date?: string;
  /** Days until tax deadline; rendered in rust. Omit for off-season. */
  deadlineDaysRemaining?: number | null;
  /** Human sync freshness, e.g. "2 min ago". */
  syncedAgo?: string;
  /** Client workspace only: "⌘T back to triage (N remaining)" in rust. */
  returnHint?: { remaining: number } | null;
  className?: string;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { keys: ["J", "K"], label: "navigate" },
  { keys: ["⏎"], label: "open" },
  { keys: ["R"], label: "respond" },
  { keys: ["S"], label: "snooze" },
  { keys: ["⌫"], label: "archive" },
  { keys: ["⌘K"], label: "command" }
];

export function StatusBar({
  shortcuts = DEFAULT_SHORTCUTS,
  date = "April 17",
  deadlineDaysRemaining = 18,
  syncedAgo = "2 min ago",
  returnHint = null,
  className
}: StatusBarProps) {
  return (
    <div
      className={cn(
        "flex h-full items-center gap-3.5 bg-surface px-4 font-mono text-[10px] uppercase tracking-[0.03em] text-ink-4",
        className
      )}>
      {returnHint ? (
        <>
          <div className="flex items-center gap-1.5 normal-case tracking-[0.02em] text-rust">
            <Kbd className="border-rust/25 bg-rust-bg text-rust">⌘T</Kbd>
            <span>back to triage ({returnHint.remaining} remaining)</span>
          </div>
          <Divider />
        </>
      ) : null}

      {shortcuts.map((s, i) => (
        <React.Fragment key={`${s.label}-${i}`}>
          <div className="flex items-center gap-1.5">
            <Kbd>{s.keys.join(" ")}</Kbd>
            <span>{s.label}</span>
          </div>
          {i < shortcuts.length - 1 ? <Divider /> : null}
        </React.Fragment>
      ))}

      <Divider />
      <div className="flex items-center gap-1.5 normal-case tracking-[0.02em]">
        <span>{date}</span>
        {typeof deadlineDaysRemaining === "number" ? (
          <>
            <span className="text-ink-5">·</span>
            <span className="font-medium text-rust">
              {deadlineDaysRemaining} days to deadline
            </span>
          </>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-1.5 text-positive">
        <span className="size-[5px] rounded-full bg-positive" aria-hidden />
        <span>Synced {syncedAgo}</span>
      </div>
    </div>
  );
}

function Kbd({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded-[2px] border border-hairline bg-bg px-1 font-mono text-[9.5px] normal-case tracking-normal text-ink-3",
        className
      )}
      style={{ lineHeight: "15px" }}>
      {children}
    </kbd>
  );
}

function Divider() {
  return <span className="h-3 w-px bg-hairline" aria-hidden />;
}
