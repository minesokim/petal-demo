"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { AgentAvatar, TierGlyph, TrustPill } from "@/components/os/primitives";
import { triage, trustMeta, tierMeta, TIER_ORDER, type TriageItem, type Tier } from "@/lib/os-triage";
import { households } from "@/lib/os-entities";
import { Detail, agentByName, initials } from "@/components/os/task-detail";

const MY_HIDS = new Set(households.filter(h => h.assignedTo === "u-antonio").map(h => h.id));


/* TierGlyph + TrustPill now live in components/os/primitives (shared across surfaces). */

/** ── Saved-view tabs + view mode (Linear) ─────────────────────
 *  To Do = the full workforce queue. Flags = the items Petal stopped on
 *  and needs your judgment (trust: "asks"). */
type TabKey = "todo" | "flags";
const TABS: { key: TabKey; label: string; match: (t: TriageItem) => boolean }[] = [
  { key: "todo", label: "To Do", match: () => true },
  { key: "flags", label: "Flags", match: t => t.trust === "asks" },
];
type ViewMode = "list" | "board";

/** Board card — Linear issue card: client + owning agent up top, title with
 *  the status glyph, trust + due along the bottom. */
function BoardCard({ t, active, onClick }: { t: TriageItem; active: boolean; onClick: () => void }) {
  const ag = agentByName(t.agent);
  const isDue = t.when.startsWith("Due");
  const tm = trustMeta[t.trust];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border bg-[var(--os-surface)] px-3 py-2.5 text-left transition-all hover:shadow-sm",
        active ? "border-[var(--os-border-strong)] ring-1 ring-[var(--os-border-strong)]" : "border-[var(--os-border)] hover:border-[var(--os-border-strong)]",
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="grid size-4 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[8px] font-semibold text-[var(--os-ink-muted)]">{initials(t.clientName)}</span>
        <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--os-ink-subtle)]">{t.clientName}</span>
        {ag && <AgentAvatar gradient={ag.gradient} size={16} bare />}
      </div>
      <div className="flex items-start gap-1.5">
        <span className="mt-[3px]"><TierGlyph tier={t.tier} /></span>
        <span className="line-clamp-2 text-[13px] leading-snug text-[var(--os-ink)]">{t.title}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--os-border)] px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--os-ink-muted)]">
          <span className={cn("size-1.5 rounded-full", tm.dot)} /> {tm.label}
        </span>
        <span className={cn("ml-auto shrink-0 tabular-nums text-[11px]", isDue ? "text-[var(--os-warning)]" : "text-[var(--os-ink-subtle)]")}>
          {isDue ? t.when.replace("Due ", "") : t.when}
        </span>
      </div>
    </button>
  );
}

/** Board column — tier header (glyph + label + count + add) over floating cards. */
function BoardColumn({ tier, items, selected, onSelect }: { tier: Tier; items: TriageItem[]; selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col">
      <div className="flex items-center gap-2 px-1 py-2">
        <TierGlyph tier={tier} />
        <span className="text-[13px] font-medium text-[var(--os-ink)]">{tierMeta[tier].label}</span>
        <span className="tabular-nums text-[12px] text-[var(--os-ink-subtle)]">{items.length}</span>
        <button className="ml-auto grid size-5 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)]"><Icon icon={I.plus} size={14} /></button>
      </div>
      <div className="flex flex-col gap-2 px-0.5 pb-4">
        {items.map(t => <BoardCard key={t.id} t={t} active={t.id === selected} onClick={() => onSelect(t.id)} />)}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tab, setTab] = useState<TabKey>("todo");
  const [view, setView] = useState<ViewMode>("list");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [selected, setSelected] = useState<string | null>(null);

  const visible = triage.filter(TABS.find(tb => tb.key === tab)!.match).filter(t => scope === "all" || MY_HIDS.has(t.householdId));
  const item = selected ? triage.find(t => t.id === selected) ?? null : null;
  const wide = !item;
  const groups = TIER_ORDER.map(tier => ({ tier, items: visible.filter(t => t.tier === tier) })).filter(g => g.items.length > 0);
  const reviewCount = triage.filter(t => t.tier === "right_now" || t.tier === "today").length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-8 py-3">
        <Icon icon={I.tasks} size={16} className="text-[var(--os-ink-muted)]" />
        <h1 className="text-[14px] font-semibold text-[var(--os-ink)] os-display">Tasks</h1>
      </div>
      {/* Tabs (To Do / Flags) + view toggle (List / Board) + search */}
      <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-8 py-1.5">
        {TABS.map(tb => {
          const on = tab === tb.key;
          const count = triage.filter(tb.match).filter(t => scope === "all" || MY_HIDS.has(t.householdId)).length;
          return (
            <button
              key={tb.key}
              onClick={() => { setTab(tb.key); setSelected(null); }}
              className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors", on ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]")}
            >
              {tb.label}
              <span className="tabular-nums text-[12px] text-[var(--os-ink-subtle)]">{count}</span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 rounded-md border border-[var(--os-border)] p-0.5">
            {(["mine", "all"] as const).map(s => (
              <button key={s} onClick={() => setScope(s)} className={cn("h-6 rounded px-2 text-[12px] transition-colors", scope === s ? "bg-[var(--os-selected)] font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]")}>{s === "mine" ? "Mine" : "All"}</button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 rounded-md border border-[var(--os-border)] p-0.5">
            <button onClick={() => setView("list")} aria-label="List view" className={cn("grid size-6 place-items-center rounded transition-colors", view === "list" ? "bg-[var(--os-selected)] text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]")}><Icon icon={I.viewList} size={14} /></button>
            <button onClick={() => setView("board")} aria-label="Board view" className={cn("grid size-6 place-items-center rounded transition-colors", view === "board" ? "bg-[var(--os-selected)] text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]")}><Icon icon={I.viewBoard} size={14} /></button>
          </div>
          <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.search} size={15} /></button>
          <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.filter} size={15} /></button>
          <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.sort} size={15} /></button>
        </div>
      </div>

      {/* ── LIST VIEW ── */}
      {view === "list" && (
        <div className="flex min-h-0 flex-1">
          {/* Grouped issue list (Linear) — narrows when a task is open */}
          <div className={cn("flex shrink-0 flex-col overflow-y-auto", item ? "w-[340px] border-r border-[var(--os-border)]" : "w-full")}>
            {groups.length === 0 ? (
              <div className="grid flex-1 place-items-center px-6 text-center text-[13px] text-[var(--os-ink-subtle)]">Nothing here.</div>
            ) : groups.map(g => (
              <div key={g.tier}>
                {/* group header */}
                <div className="flex items-center gap-2 bg-[var(--os-bg-subtle)] px-8 py-1.5">
                  <Icon icon={I.chevronDown} size={13} className="text-[var(--os-ink-subtle)]" />
                  <TierGlyph tier={g.tier} />
                  <span className="text-[13px] font-medium text-[var(--os-ink)]">{tierMeta[g.tier].label}</span>
                  <span className="text-[13px] tabular-nums text-[var(--os-ink-subtle)]">{g.items.length}</span>
                  <button className="ml-auto grid size-5 place-items-center rounded text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-selected)] hover:text-[var(--os-ink)]"><Icon icon={I.plus} size={14} /></button>
                </div>
                {/* rows */}
                {g.items.map(t => {
                  const ag = agentByName(t.agent);
                  const active = t.id === selected;
                  const isDue = t.when.startsWith("Due");
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t.id)}
                      className={cn("flex h-14 w-full items-center gap-2.5 px-8 text-left transition-colors", active ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]")}
                    >
                      <TierGlyph tier={t.tier} />
                      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{t.title}</span>
                      {wide ? (
                        <div className="flex shrink-0 items-center gap-2 text-[11px]">
                          <TrustPill trust={t.trust} />
                          <span className="hidden max-w-[160px] items-center gap-1.5 rounded-md border border-[var(--os-border)] px-1.5 py-0.5 text-[var(--os-ink-muted)] lg:inline-flex">
                            <span className="grid size-3.5 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[7px] font-semibold text-[var(--os-ink-muted)]">{initials(t.clientName)}</span>
                            <span className="truncate">{t.clientName}</span>
                          </span>
                          <span className={cn("w-14 shrink-0 text-right tabular-nums", isDue ? "text-[var(--os-warning)]" : "text-[var(--os-ink-subtle)]")}>{isDue ? t.when.replace("Due ", "") : t.when}</span>
                          {ag ? <AgentAvatar gradient={ag.gradient} size={18} bare /> : <span className="size-4 shrink-0 rounded-full bg-[var(--os-selected)]" />}
                        </div>
                      ) : (
                        <div className="flex shrink-0 items-center gap-2.5 text-[12px]">
                          <span className="tabular-nums text-[var(--os-ink-subtle)]">{t.when}</span>
                          {ag && <AgentAvatar gradient={ag.gradient} size={18} bare />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Detail — only when a task is selected */}
          {item && (
            <AnimatePresence mode="wait">
              <motion.div key={item.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.16, ease: "easeOut" }} className="flex min-w-0 flex-1">
                <Detail item={item} onClose={() => setSelected(null)} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* ── BOARD VIEW ── */}
      {view === "board" && (
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto px-3 py-3">
            {groups.length === 0 ? (
              <div className="grid flex-1 place-items-center px-6 text-center text-[13px] text-[var(--os-ink-subtle)]">Nothing here.</div>
            ) : groups.map(g => (
              <BoardColumn key={g.tier} tier={g.tier} items={g.items} selected={selected} onSelect={setSelected} />
            ))}
          </div>

          {/* Detail — slides in from the right; board reflows beside it */}
          <AnimatePresence>
            {item && (
              <motion.div key={item.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.18, ease: "easeOut" }} className="flex w-[600px] shrink-0 border-l border-[var(--os-border)] bg-[var(--os-surface)]">
                <Detail item={item} onClose={() => setSelected(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
