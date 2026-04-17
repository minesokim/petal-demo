import * as React from "react";
import { cn } from "@/lib/utils";
import type { TriageItemType } from "@/lib/v4/triage-items";

/**
 * TypeBadge — 22px square mono glyph identifying triage item category.
 *
 * Colors per docket-direction-b-v2.html:
 *   MSG    warning (amber)
 *   FILE   rust
 *   FLAG   error (red)
 *   DOC    positive (green)
 *   CALL   surface-3 (warm neutral)
 *   INTAKE surface-2
 *   COMP   surface-2
 *   PREP   rust
 */
const TONE: Record<
  TriageItemType,
  { bg: string; fg: string }
> = {
  MSG: { bg: "bg-warning-bg", fg: "text-warning" },
  FILE: { bg: "bg-rust-bg", fg: "text-rust" },
  FLAG: { bg: "bg-error-bg", fg: "text-error" },
  DOC: { bg: "bg-positive-bg", fg: "text-positive" },
  CALL: { bg: "bg-surface-3", fg: "text-ink-2" },
  INTAKE: { bg: "bg-surface-2", fg: "text-ink-3" },
  COMP: { bg: "bg-surface-2", fg: "text-ink-3" },
  PREP: { bg: "bg-rust-bg", fg: "text-rust" }
};

export function TypeBadge({ type, className }: { type: TriageItemType; className?: string }) {
  const tone = TONE[type];
  return (
    <span
      className={cn(
        "grid size-[22px] place-items-center rounded-[3px] font-mono text-[10px] font-medium tracking-[0.04em]",
        tone.bg,
        tone.fg,
        className
      )}
      aria-label={`${type} item`}>
      {type}
    </span>
  );
}
