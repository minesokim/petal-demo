"use client";

// Assignee picker — reassign a client (household) to a firm member. Writes to the
// assign store, so every avatar + Mine/Firm filter updates live. Two looks: a labelled
// "chip" (name + avatar) for headers, and a bare "avatar" for dense table cells.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { MemberAvatar } from "@/components/os/primitives";
import { firmMembers, memberById, roleMeta } from "@/lib/fixtures/firm";
import { assignStore, assigneeOf, useAssignVersion } from "@/lib/assign-store";

export function AssigneePicker({
  householdId, variant = "chip", align = "left", placement = "down", className,
}: {
  householdId: string;
  variant?: "chip" | "avatar";
  align?: "left" | "right";
  placement?: "down" | "up";
  className?: string;
}) {
  useAssignVersion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = assigneeOf(householdId);
  const m = memberById(current);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); e.preventDefault(); setOpen(o => !o); }}
        aria-label={`Assigned to ${m?.name ?? "no one"}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]",
          variant === "chip"
            ? "px-1.5 py-1 hover:bg-[var(--os-hover)]"
            : "p-0.5 hover:bg-[var(--os-hover)]",
        )}
      >
        <MemberAvatar memberId={current} size={variant === "chip" ? 20 : 22} />
        {variant === "chip" && <span className="text-[12.5px] font-medium text-[var(--os-ink)]">{m?.name ?? "Unassigned"}</span>}
        <Icon icon={I.chevronDown} size={11} className="text-[var(--os-ink-subtle)]" />
      </button>

      {open && (
        <div className={cn("absolute z-30 w-[216px] rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-1.5 shadow-[0_10px_34px_rgba(17,17,26,0.13)]", align === "right" ? "right-0" : "left-0", placement === "up" ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]")}>
          <div className="os-label px-2 pb-1 pt-0.5">Assign to</div>
          {firmMembers.filter(mm => mm.active).map(mm => (
            <button
              key={mm.id}
              onClick={e => { e.stopPropagation(); e.preventDefault(); assignStore.assign(householdId, mm.id); setOpen(false); }}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--os-hover)]"
            >
              <MemberAvatar memberId={mm.id} size={24} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-[var(--os-ink)]">{mm.name}</span>
                <span className="block truncate text-[11px] text-[var(--os-ink-subtle)]">{roleMeta[mm.role].label}{mm.credential ? ` · ${mm.credential}` : ""}</span>
              </span>
              {mm.id === current && <Icon icon={I.check} size={14} className="shrink-0 text-[var(--os-success)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
