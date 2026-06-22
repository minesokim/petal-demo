"use client";

// Task assignee — your people, or Petal. You never pick a skill or hand-pick a
// specialist: the task's type routes Petal to the one specialist whose job it is,
// surfaced as a consequence ("Petal · IRS Desk"), never as a choice. Work no
// specialist covers stays people-only. Demo-local selection.
//
// The menu renders in a portal with fixed positioning: it flips up/down by
// available space and caps its own height with scroll, so a short or scrolling
// container (task popup, detail sheet) can never clip it.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { MemberAvatar } from "@/components/os/primitives";
import { firmMembers, memberById, roleMeta } from "@/lib/fixtures/firm";
import { assigneeOf } from "@/lib/assign-store";
import { agentForSkill } from "@/lib/fixtures/agents";

export function TaskAssigneePicker({
  skillId, householdId, defaultAI = false, align = "right", placement = "down",
}: {
  skillId: string;
  householdId: string;
  /** is the task currently Petal's rather than a person's? */
  defaultAI?: boolean;
  align?: "left" | "right";
  /** preferred open direction; flips automatically when space is tight */
  placement?: "down" | "up";
}) {
  // The specialist Petal routes this task to — provenance only, never a choice.
  const agent = agentForSkill(skillId);
  const [open, setOpen] = useState(false);
  const [aiOn, setAiOn] = useState(defaultAI && !!agent);
  const [memberId, setMemberId] = useState<string>(() => assigneeOf(householdId));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);

  // Position the portal menu off the trigger's viewport rect.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const gap = 6, margin = 12;
    const spaceBelow = vh - r.bottom - margin;
    const spaceAbove = r.top - margin;
    let openUp = spaceAbove > spaceBelow;
    if (placement === "up" && spaceAbove > 200) openUp = true;
    if (placement === "down" && spaceBelow > 200) openUp = false;
    const maxHeight = Math.round(Math.max(160, Math.min(360, openUp ? spaceAbove : spaceBelow)));
    // background inline: Tailwind v4 skips bg-[var(--…)] (ambiguous color/image),
    // and the portal sits outside .petal-os, so set it explicitly.
    const s: React.CSSProperties = { position: "fixed", maxHeight, zIndex: 80, background: "var(--os-surface)" };
    if (align === "right") s.right = Math.round(vw - r.right); else s.left = Math.round(r.left);
    if (openUp) s.bottom = Math.round(vh - r.top + gap); else s.top = Math.round(r.bottom + gap);
    setMenuStyle(s);
  }, [open, align, placement]);

  // Dismiss: outside click (trigger + portal menu), Escape, or scroll/resize.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    // Close when the page/container scrolls (the fixed menu would detach from the
    // trigger) — but NOT when scrolling inside the menu itself.
    const onScroll = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  const m = memberById(memberId);

  return (
    <>
      <button
        ref={triggerRef}
        onClick={e => { e.stopPropagation(); e.preventDefault(); setOpen(o => !o); }}
        aria-label={aiOn ? `Assigned to Petal${agent ? `, handled by ${agent.name}` : ""}` : `Assigned to ${m?.name ?? "no one"}`}
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-[var(--os-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]"
      >
        {aiOn
          ? <span className="grid size-5 place-items-center rounded-[5px] bg-[var(--os-primary)] text-[var(--os-primary-fg)]"><PetalMark className="size-3" /></span>
          : <MemberAvatar memberId={memberId} size={20} />}
        <span className="text-[12.5px] font-medium text-[var(--os-ink)]">{aiOn ? "Petal" : (m?.name ?? "Unassigned")}</span>
        {aiOn && agent && <span className="text-[12px] text-[var(--os-ink-subtle)]">· {agent.name}</span>}
        <Icon icon={I.chevronDown} size={11} className="text-[var(--os-ink-subtle)]" />
      </button>

      {open && menuStyle && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          // portaled to <body>, outside .petal-os — re-scope so --os-* tokens resolve
          className="petal-os w-[236px] overflow-y-auto rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] p-1.5 shadow-[0_10px_34px_rgba(17,17,26,0.13)]"
        >
          {agent && (
            <>
              <div className="os-label px-2 pb-1 pt-0.5">Petal</div>
              <button
                onClick={e => { e.stopPropagation(); e.preventDefault(); setAiOn(true); setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--os-hover)]"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]"><PetalMark className="size-3.5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[var(--os-ink)]">Petal</span>
                  <span className="block truncate text-[11px] text-[var(--os-ink-subtle)]">Routes to {agent.name}</span>
                </span>
                {aiOn && <Icon icon={I.check} size={14} className="shrink-0 text-[var(--os-success)]" />}
              </button>
              <div className="mx-1 my-1 h-px bg-[var(--os-border)]" />
            </>
          )}
          <div className="os-label px-2 pb-1 pt-0.5">People</div>
          {firmMembers.filter(mm => mm.active).map(mm => {
            const sel = !aiOn && mm.id === memberId;
            return (
              <button
                key={mm.id}
                onClick={e => { e.stopPropagation(); e.preventDefault(); setAiOn(false); setMemberId(mm.id); setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--os-hover)]"
              >
                <MemberAvatar memberId={mm.id} size={24} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[var(--os-ink)]">{mm.name}</span>
                  <span className="block truncate text-[11px] text-[var(--os-ink-subtle)]">{roleMeta[mm.role].label}{mm.credential ? ` · ${mm.credential}` : ""}</span>
                </span>
                {sel && <Icon icon={I.check} size={14} className="shrink-0 text-[var(--os-success)]" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
