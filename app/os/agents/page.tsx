"use client";

// Your team — Petal's named specialists and the workbench for each, now fully
// authorable. Left rail: roster (specialists as headers, capabilities beneath,
// + add capability, + new specialist). Right: the selected capability's editor —
// one autonomy scale (Suggest / Draft / Act after window / Act & report), plus
// every field editable (Edit toggles the form). All in-memory: edits reset on
// reload (no backend yet). You assign work on the task itself.

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { TrustDial, TrustTierTag, StatusPill } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { skills, householdById, type Skill, type SkillRun } from "@/lib/fixtures/firm";
import { runsOfSkill } from "@/lib/fixtures/derive";
import { skillCategoryMeta, trustTierMeta, SKILL_CATEGORY_ORDER, type TrustTier, type SkillCategory } from "@/lib/fixtures/vocab";
import { agents, agentForSkill } from "@/lib/fixtures/agents";
import {
  FileSearch, ClipboardCheck, Landmark, CalendarClock, MessagesSquare,
  Sparkles, Bot, Users, Workflow, Network, Cpu, Briefcase,
  FileText, Send, BookOpen, Phone, Newspaper,
  Pencil, Plus, Trash2, X, Check, ChevronDown, ChevronRight,
  type LucideIcon,
} from "lucide-react";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]";
const inputCls = "w-full rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-1.5 text-[13px] text-[var(--os-ink)] outline-none transition-colors focus:border-[var(--os-border-strong)]";

// Icons a specialist can wear (picked when adding/editing one).
const AGENT_ICONS: Record<string, LucideIcon> = {
  doc: FileSearch, review: ClipboardCheck, irs: Landmark, calendar: CalendarClock,
  message: MessagesSquare, sparkles: Sparkles, bot: Bot, users: Users,
  workflow: Workflow, network: Network, cpu: Cpu, briefcase: Briefcase,
};
const ICON_KEYS = Object.keys(AGENT_ICONS);
const iconKeyOf = (ic: LucideIcon) => ICON_KEYS.find(k => AGENT_ICONS[k] === ic) ?? "sparkles";

// Capabilities carry the firm's category color — the one place the workbench gets
// hue. Structure (specialists, controls) stays monochrome so color reads as "type
// of work," not decoration.
const CAT_ICON: Record<SkillCategory, LucideIcon> = {
  prep_filing: FileText, signatures_chase: Send, books: BookOpen,
  meetings_calls: Phone, briefs: Newspaper, estimates_deadlines: CalendarClock,
};
// Capability glyph is monochrome — color now lives on the specialist (below).
function CapGlyph({ category, size = 28 }: { category: SkillCategory; size?: number }) {
  const Ic = CAT_ICON[category];
  return (
    <span className="grid shrink-0 place-items-center rounded-lg bg-[var(--os-bg-subtle)] text-[var(--os-ink-muted)]" style={{ width: size, height: size }}>
      <Ic size={Math.round(size * 0.52)} />
    </span>
  );
}

// Each specialist carries a hue — the one place the roster gets color.
const AGENT_HUE: Record<string, { tile: string; icon: string; dot: string }> = {
  violet:  { tile: "bg-violet-50",  icon: "text-violet-600",  dot: "bg-violet-500" },
  blue:    { tile: "bg-blue-50",    icon: "text-blue-600",    dot: "bg-blue-500" },
  emerald: { tile: "bg-emerald-50", icon: "text-emerald-600", dot: "bg-emerald-500" },
  amber:   { tile: "bg-amber-50",   icon: "text-amber-600",   dot: "bg-amber-500" },
  rose:    { tile: "bg-rose-50",    icon: "text-rose-600",    dot: "bg-rose-500" },
  cyan:    { tile: "bg-cyan-50",    icon: "text-cyan-600",    dot: "bg-cyan-500" },
  indigo:  { tile: "bg-indigo-50",  icon: "text-indigo-600",  dot: "bg-indigo-500" },
  orange:  { tile: "bg-orange-50",  icon: "text-orange-600",  dot: "bg-orange-500" },
};
const HUE_KEYS = Object.keys(AGENT_HUE);
const AGENT_HUE_INIT: Record<string, string> = { "doc-chase": "orange", "prep-review": "violet", "irs-desk": "blue", "deadlines": "amber", "client-comms": "rose" };
function AgentGlyph({ hue, icon: Glyph, size = 32 }: { hue: string; icon: LucideIcon; size?: number }) {
  const c = AGENT_HUE[hue] ?? AGENT_HUE.violet;
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-lg", c.tile)} style={{ width: size, height: size }}>
      <Glyph size={Math.round(size * 0.5)} className={c.icon} />
    </span>
  );
}

type LocalAgent = { id: string; name: string; role: string; blurb: string; iconKey: string; hue: string; on: boolean; drafted: number; approved: number };
type LocalCap = Skill & { agentId: string | null };

const genId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
function blankCap(agentId: string | null): LocalCap {
  return {
    id: genId("sk"), name: "New capability", category: "prep_filing", trust: 1,
    description: "", trigger: "", steps: [""], channels: [], tone: "", escalation: "",
    agentId,
  };
}
function blankAgent(): LocalAgent {
  return { id: genId("ag"), name: "", role: "", blurb: "", iconKey: "sparkles", hue: "cyan", on: true, drafted: 0, approved: 0 };
}

function runCountLabel(n: number) { return `${n} ${n === 1 ? "run" : "runs"}`; }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-[var(--os-ink-subtle)]">{label}</div>
      <div className="mt-0.5 text-[13px] leading-snug text-[var(--os-ink)]">{children}</div>
    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="os-label mb-2.5 mt-7">{children}</div>;
}
function LField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="os-label">{label}</span><div className="mt-1.5">{children}</div></label>;
}
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} role="switch" aria-checked={on}
      className={cn("relative h-[22px] w-9 shrink-0 rounded-full transition-colors", on ? "bg-[var(--os-brand)]" : "bg-[var(--os-border-strong)]", FOCUS)}>
      <span className={cn("absolute top-0.5 size-[18px] rounded-full bg-white shadow-sm transition-all", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}
function PrimaryBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.98]", FOCUS)}>{children}</button>;
}
function GhostBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-3 text-[12.5px] font-medium transition-colors hover:bg-[var(--os-hover)]", danger ? "text-[var(--os-danger)]" : "text-[var(--os-ink)]", FOCUS)}>{children}</button>;
}

// ── Run history row ──
function RunRow({ run, by }: { run: SkillRun; by: string }) {
  const [open, setOpen] = useState(false);
  const household = householdById(run.householdId);
  return (
    <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-card)]">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} className={cn("flex w-full items-center gap-2.5 px-3 py-2 text-left", FOCUS)}>
        <StatusPill status={run.status} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-[var(--os-ink)]">{run.summary}</span>
          <span className="block truncate text-[11px] text-[var(--os-ink-subtle)]">{household?.name ? `${household.name} · ` : ""}{by}</span>
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{run.startedAt}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-[var(--os-ink-muted)] transition-transform", !open && "-rotate-90")} />
      </button>
      {open && <div className="border-t border-[var(--os-border)] p-2.5"><ProvenancePanel runId={run.id} defaultOpen /></div>}
    </div>
  );
}

// ── Agent context strip ──
function AgentHeader({ agent, onToggle, onEdit }: { agent: LocalAgent; onToggle: () => void; onEdit: () => void }) {
  const Glyph = AGENT_ICONS[agent.iconKey] ?? Sparkles;
  return (
    <div className={cn("flex items-center gap-2.5 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-6 py-2.5", !agent.on && "opacity-70")}>
      <AgentGlyph hue={agent.hue} icon={Glyph} size={22} />
      <span className="text-[12.5px] font-semibold text-[var(--os-ink)]">{agent.name || "Untitled specialist"}</span>
      {agent.role && <span className="hidden text-[12px] text-[var(--os-ink-subtle)] sm:inline">{agent.role}</span>}
      <button onClick={onEdit} aria-label="Edit specialist" className={cn("rounded p-1 text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}><Pencil className="size-3" /></button>
      <div className="ml-auto flex items-center gap-3 text-[11.5px] text-[var(--os-ink-subtle)]">
        <span className="hidden tabular-nums sm:inline">{agent.drafted} drafted · {agent.approved} approved</span>
        <span className="hidden h-3.5 w-px bg-[var(--os-border)] sm:block" />
        <span>{agent.on ? "On duty" : "Off"}</span>
        <Toggle on={agent.on} onChange={onToggle} />
      </div>
    </div>
  );
}

// ── Capability — read view ──
function CapView({
  cap, by, onTrust, promoted, dismissed, onPromote, onKeepApproving, onEdit,
}: {
  cap: LocalCap; by: string; onTrust: (t: TrustTier) => void;
  promoted: boolean; dismissed: boolean; onPromote: () => void; onKeepApproving: () => void; onEdit: () => void;
}) {
  const runs = runsOfSkill(cap.id);
  const g = cap.graduation;
  const showBanner = !!g && !promoted && !dismissed && cap.trust < g.promoteTo;
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-[var(--os-border)] px-6 py-3.5">
        <div className="flex items-center gap-3.5">
          <CapGlyph category={cap.category} size={38} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[16px] font-semibold leading-tight os-display text-[var(--os-ink)]">{cap.name}</h2>
            <div className="mt-0.5 text-[12px] text-[var(--os-ink-subtle)]">{skillCategoryMeta[cap.category].label}</div>
          </div>
          <button onClick={onEdit} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}><Pencil className="size-3.5" /> Edit</button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="max-w-[680px]">
          <div className="os-label mb-2">Autonomy</div>
          <TrustDial tier={cap.trust} onChange={onTrust} />
          <p className="mt-2.5 text-[12.5px] leading-snug text-[var(--os-ink-muted)]">{trustTierMeta[cap.trust].blurb}</p>

          {cap.description
            ? <div className="mt-7 border-l-2 border-[var(--os-border-strong)] pl-3.5"><p className="text-[14px] leading-relaxed text-[var(--os-ink)]">{cap.description}</p></div>
            : <p className="mt-7 text-[13px] italic text-[var(--os-ink-subtle)]">No description yet. Hit Edit to add one.</p>}

          <SectionLabel>Details</SectionLabel>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Trigger">{cap.trigger || <span className="text-[var(--os-ink-subtle)]">—</span>}</Field>
            <Field label="Channels">{cap.channels.length ? cap.channels.join(" · ") : <span className="text-[var(--os-ink-subtle)]">—</span>}</Field>
            <Field label="Tone">{cap.tone || <span className="text-[var(--os-ink-subtle)]">—</span>}</Field>
            <Field label="Escalation">{cap.escalation || <span className="text-[var(--os-ink-subtle)]">—</span>}</Field>
          </div>

          <SectionLabel>How it runs</SectionLabel>
          {cap.steps.filter(Boolean).length ? (
            <div>
              {cap.steps.filter(Boolean).map((step, i, arr) => {
                const last = i === arr.length - 1;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full border border-[var(--os-border-strong)] bg-white text-[10px] font-semibold tabular-nums text-[var(--os-ink-muted)]">{i + 1}</span>
                      {!last && <span className="my-1 w-px flex-1 bg-[var(--os-border)]" />}
                    </div>
                    <div className={cn("min-w-0 pt-0.5 text-[13px] leading-snug text-[var(--os-ink)]", !last && "pb-4")}>{step}</div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-[13px] italic text-[var(--os-ink-subtle)]">No steps yet.</p>}

          {cap.variants && (
            <>
              <SectionLabel>Variants</SectionLabel>
              <div className="overflow-hidden rounded-lg border border-[var(--os-border)]">
                {cap.variants.map((v, i) => {
                  const household = v.householdId ? householdById(v.householdId) : undefined;
                  return (
                    <div key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--os-border)] px-3 py-2.5 last:border-b-0">
                      <span className="text-[13px] font-medium text-[var(--os-ink)]">{v.name}</span>
                      <span className="min-w-0 text-[12px] text-[var(--os-ink-muted)]">{v.delta}</span>
                      {household && <Link href={`/os/clients/${household.id}`} className={cn("ml-auto inline-flex shrink-0 items-center gap-1 text-[12px] text-[var(--os-link)] hover:underline", FOCUS)}>{household.name} <ChevronRight className="size-3" /></Link>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {g && showBanner && (
            <div className="mt-7 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-4 py-3.5">
              <div className="flex items-start gap-2"><PetalMark className="mt-0.5 size-3.5 shrink-0 text-[var(--os-ink-muted)]" /><p className="text-[13px] leading-relaxed text-[var(--os-ink)]">{g.prompt}</p></div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <PrimaryBtn onClick={onPromote}>Promote to {trustTierMeta[g.promoteTo].label}</PrimaryBtn>
                <GhostBtn onClick={onKeepApproving}>Keep approving</GhostBtn>
              </div>
            </div>
          )}
          {g && promoted && <div className="mt-7 flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-3 py-2 text-[12px] text-[var(--os-ink)]"><Check className="size-3.5 shrink-0 text-emerald-600" />{cap.name} promoted to {trustTierMeta[g.promoteTo].label} - acts after 24h unless you stop it</div>}
          {g && dismissed && !promoted && <div className="mt-7 flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-3 py-2 text-[12px] text-[var(--os-ink-muted)]"><Check className="size-3.5 shrink-0" />Keeping approval on every send.</div>}

          <SectionLabel>Run history · {runCountLabel(runs.length)}</SectionLabel>
          {runs.length > 0
            ? <div className="space-y-2">{runs.map(run => <RunRow key={run.id} run={run} by={by} />)}</div>
            : <div className="rounded-lg border border-dashed border-[var(--os-border-strong)] px-4 py-4 text-[12px] text-[var(--os-ink-muted)]">No runs yet - the first run will be logged here with its sources and reasoning.</div>}
        </div>
      </div>
    </div>
  );
}

// ── Capability — edit form ──
function CapEditor({ draft, set, onSave, onCancel, onDelete }: { draft: LocalCap; set: (d: LocalCap) => void; onSave: () => void; onCancel: () => void; onDelete: () => void }) {
  const upd = (patch: Partial<LocalCap>) => set({ ...draft, ...patch });
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2.5 border-b border-[var(--os-border)] px-4 py-3 md:px-6">
        <CapGlyph category={draft.category} size={32} />
        <input value={draft.name} onChange={e => upd({ name: e.target.value })} placeholder="Capability name"
          className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]" />
        <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
        <PrimaryBtn onClick={onSave}><Check className="size-3.5" /> Save</PrimaryBtn>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="max-w-[640px] space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <LField label="Category">
              <select value={draft.category} onChange={e => upd({ category: e.target.value as SkillCategory })} className={inputCls}>
                {SKILL_CATEGORY_ORDER.map(c => <option key={c} value={c}>{skillCategoryMeta[c].label}</option>)}
              </select>
            </LField>
            <LField label="Autonomy">
              <div><TrustDial tier={draft.trust} onChange={t => upd({ trust: t })} /></div>
            </LField>
          </div>
          <LField label="Description"><textarea value={draft.description} onChange={e => upd({ description: e.target.value })} rows={3} className={inputCls} placeholder="What this capability does." /></LField>
          <div className="grid gap-4 sm:grid-cols-2">
            <LField label="Trigger"><input value={draft.trigger} onChange={e => upd({ trigger: e.target.value })} className={inputCls} placeholder="When it runs." /></LField>
            <LField label="Channels (comma-separated)"><input value={draft.channels.join(", ")} onChange={e => upd({ channels: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })} className={inputCls} placeholder="Email, SMS, Portal" /></LField>
            <LField label="Tone"><input value={draft.tone} onChange={e => upd({ tone: e.target.value })} className={inputCls} /></LField>
            <LField label="Escalation"><input value={draft.escalation} onChange={e => upd({ escalation: e.target.value })} className={inputCls} /></LField>
          </div>
          <LField label="How it runs">
            <div className="space-y-2">
              {draft.steps.map((st, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full border border-[var(--os-border-strong)] bg-white text-[10px] font-semibold tabular-nums text-[var(--os-ink-muted)]">{i + 1}</span>
                  <input value={st} onChange={e => { const steps = [...draft.steps]; steps[i] = e.target.value; upd({ steps }); }} className={inputCls} />
                  <button onClick={() => upd({ steps: draft.steps.filter((_, j) => j !== i) })} aria-label="Remove step" className={cn("rounded p-1 text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)] hover:text-[var(--os-danger)]", FOCUS)}><Trash2 className="size-3.5" /></button>
                </div>
              ))}
              <button onClick={() => upd({ steps: [...draft.steps, ""] })} className={cn("inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--os-link)] hover:underline", FOCUS)}><Plus className="size-3.5" /> Add step</button>
            </div>
          </LField>
          <div className="flex items-center border-t border-[var(--os-border)] pt-4">
            <GhostBtn onClick={onDelete} danger><Trash2 className="size-3.5" /> Delete capability</GhostBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add / edit specialist (modal) ──
function AgentForm({ draft, set, isNew, onSave, onCancel, onDelete }: { draft: LocalAgent; set: (a: LocalAgent) => void; isNew: boolean; onSave: () => void; onCancel: () => void; onDelete: () => void }) {
  const upd = (patch: Partial<LocalAgent>) => set({ ...draft, ...patch });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div className="w-full max-w-[440px] rounded-2xl border border-[var(--os-border)] bg-[var(--os-card)] p-5 shadow-[0_24px_60px_rgba(17,17,26,0.22)]" onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[var(--os-ink)]">{isNew ? "New specialist" : "Edit specialist"}</h3>
          <button onClick={onCancel} aria-label="Close" className={cn("rounded p-1 text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}><X className="size-4" /></button>
        </div>
        <div className="space-y-4">
          <LField label="Name"><input value={draft.name} onChange={e => upd({ name: e.target.value })} className={inputCls} placeholder="e.g. Doc Chase" /></LField>
          <LField label="Role"><input value={draft.role} onChange={e => upd({ role: e.target.value })} className={inputCls} placeholder="e.g. The collector" /></LField>
          <LField label="What it does"><textarea value={draft.blurb} onChange={e => upd({ blurb: e.target.value })} rows={3} className={inputCls} placeholder="One or two sentences in the firm's words." /></LField>
          <LField label="Icon">
            <div className="flex flex-wrap gap-1.5">
              {ICON_KEYS.map(k => { const Ic = AGENT_ICONS[k]; const on = draft.iconKey === k; return (
                <button key={k} onClick={() => upd({ iconKey: k })} aria-label={k} className={cn("grid size-9 place-items-center rounded-lg border transition-colors", FOCUS, on ? "border-[var(--os-primary)] bg-[var(--os-selected)] text-[var(--os-ink)]" : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]")}><Ic className="size-4" /></button>
              ); })}
            </div>
          </LField>
          <LField label="Color">
            <div className="flex flex-wrap gap-2">
              {HUE_KEYS.map(h => { const c = AGENT_HUE[h]; const on = draft.hue === h; return (
                <button key={h} onClick={() => upd({ hue: h })} aria-label={h} className={cn("grid size-7 place-items-center rounded-full", FOCUS)}>
                  <span className={cn("size-5 rounded-full ring-2 ring-offset-2 ring-offset-[var(--os-card)] transition-all", c.dot, on ? "ring-[var(--os-ink)]" : "ring-transparent")} />
                </button>
              ); })}
            </div>
          </LField>
        </div>
        <div className="mt-5 flex items-center gap-2">
          <PrimaryBtn onClick={onSave}><Check className="size-3.5" /> Save</PrimaryBtn>
          <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
          {!isNew && <span className="ml-auto"><GhostBtn onClick={onDelete} danger><Trash2 className="size-3.5" /> Delete</GhostBtn></span>}
        </div>
      </div>
    </div>
  );
}

// ── Rail capability row ──
function CapRow({ cap, selected, onSelect }: { cap: LocalCap; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} aria-current={selected || undefined}
      className={cn("flex w-full items-start gap-2.5 py-2 pl-[42px] pr-3.5 text-left transition-colors", FOCUS, selected ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]")}>
      <CapGlyph category={cap.category} size={22} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[var(--os-ink)]">{cap.name}</span>
        <span className="mt-1 flex items-center gap-1.5">
          <TrustTierTag tier={cap.trust} />
          <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{runCountLabel(runsOfSkill(cap.id).length)}</span>
        </span>
      </span>
    </button>
  );
}

function AddRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-1.5 py-1.5 pl-[46px] pr-3.5 text-left text-[12px] font-medium text-[var(--os-ink-subtle)] transition-colors hover:text-[var(--os-ink)]", FOCUS)}>
      <Plus className="size-3.5" /> {label}
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function AgentsPage() {
  const [agentList, setAgentList] = useState<LocalAgent[]>(() =>
    agents.map((a, i) => ({ id: a.id, name: a.name, role: a.role, blurb: a.blurb, iconKey: iconKeyOf(a.icon), hue: AGENT_HUE_INIT[a.id] ?? HUE_KEYS[i % HUE_KEYS.length], on: a.on, drafted: a.drafted, approved: a.approved })),
  );
  const [capList, setCapList] = useState<LocalCap[]>(() => skills.map(s => ({ ...s, agentId: agentForSkill(s.id)?.id ?? null })));
  const [selected, setSelected] = useState<string>(skills[0].id);
  const [promoted, setPromoted] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<LocalCap | null>(null);
  const [agentDraft, setAgentDraft] = useState<{ form: LocalAgent; isNew: boolean } | null>(null);

  const cap = capList.find(c => c.id === selected) ?? capList[0] ?? null;
  const owner = cap ? agentList.find(a => a.id === cap.agentId) ?? null : null;

  const updateCap = (id: string, patch: Partial<LocalCap>) => setCapList(p => p.map(c => c.id === id ? { ...c, ...patch } : c));
  const deleteCap = (id: string) => {
    setCapList(p => {
      const next = p.filter(c => c.id !== id);
      if (id === selected) setSelected(next[0]?.id ?? "");
      return next;
    });
    setDraft(null);
  };
  const addCap = (agentId: string | null) => {
    const c = blankCap(agentId);
    setCapList(p => [...p, c]);
    setSelected(c.id);
    setDraft(c);
  };
  const saveAgent = () => {
    if (!agentDraft) return;
    const { form, isNew } = agentDraft;
    setAgentList(p => isNew ? [...p, form] : p.map(a => a.id === form.id ? form : a));
    setAgentDraft(null);
  };
  const deleteAgent = (id: string) => {
    setAgentList(p => p.filter(a => a.id !== id));
    setCapList(p => p.map(c => c.agentId === id ? { ...c, agentId: null } : c));
    setAgentDraft(null);
  };

  const unstaffed = capList.filter(c => !c.agentId);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--os-border)] px-8 pt-5 pb-4">
        <h1 className="text-[24px] font-semibold text-[var(--os-ink)] os-display">Your team</h1>
        <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Build and tune Petal's specialists.</p>
      </div>

      {/* Two panes */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex max-h-[42vh] shrink-0 flex-col overflow-y-auto border-b border-[var(--os-border)] md:max-h-none md:w-[320px] md:border-b-0 md:border-r">
          <div className="flex-1">
            {agentList.map(a => {
              const Glyph = AGENT_ICONS[a.iconKey] ?? Sparkles;
              const list = capList.filter(c => c.agentId === a.id);
              return (
                <div key={a.id} className="border-b border-[var(--os-border)]">
                  <div className={cn("flex items-center gap-2.5 px-3.5 pt-3.5 pb-2.5", !a.on && "opacity-55")}>
                    <AgentGlyph hue={a.hue} icon={Glyph} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-[var(--os-ink)]">{a.name || "Untitled specialist"}</div>
                      <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{a.role || "No role"}</div>
                    </div>
                    <button onClick={() => setAgentDraft({ form: { ...a }, isNew: false })} aria-label={`Edit ${a.name}`} className={cn("shrink-0 rounded p-1 text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}><Pencil className="size-3.5" /></button>
                  </div>
                  <div className={cn("pb-1.5", !a.on && "opacity-55")}>
                    {list.map(c => <CapRow key={c.id} cap={c} selected={c.id === selected} onSelect={() => { setSelected(c.id); setDraft(null); }} />)}
                    <AddRow label="Add capability" onClick={() => addCap(a.id)} />
                  </div>
                </div>
              );
            })}
            {unstaffed.length > 0 && (
              <div className="border-b border-[var(--os-border)]">
                <div className="os-label px-3.5 pb-1.5 pt-3.5">Not staffed by a specialist</div>
                <div className="pb-1.5">
                  {unstaffed.map(c => <CapRow key={c.id} cap={c} selected={c.id === selected} onSelect={() => { setSelected(c.id); setDraft(null); }} />)}
                </div>
              </div>
            )}
          </div>
          <div className="sticky bottom-0 border-t border-[var(--os-border)] bg-[var(--os-canvas)] p-2.5">
            <button onClick={() => setAgentDraft({ form: blankAgent(), isNew: true })} className={cn("flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--os-border-strong)] py-2 text-[12.5px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}><Plus className="size-4" /> New specialist</button>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!cap ? (
            <div className="grid flex-1 place-items-center p-8 text-center text-[13px] text-[var(--os-ink-subtle)]">No capability selected. Add one from a specialist on the left.</div>
          ) : (
            <>
              {owner && !draft && <AgentHeader agent={owner} onToggle={() => setAgentList(p => p.map(a => a.id === owner.id ? { ...a, on: !a.on } : a))} onEdit={() => setAgentDraft({ form: { ...owner }, isNew: false })} />}
              <motion.div key={(draft ? "edit-" : "view-") + cap.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, ease: "easeOut" }} className="flex min-h-0 min-w-0 flex-1">
                {draft && draft.id === cap.id ? (
                  <CapEditor
                    draft={draft}
                    set={setDraft}
                    onSave={() => { updateCap(draft.id, draft); setDraft(null); }}
                    onCancel={() => setDraft(null)}
                    onDelete={() => deleteCap(draft.id)}
                  />
                ) : (
                  <CapView
                    cap={cap}
                    by={owner?.name || "Petal"}
                    onTrust={t => updateCap(cap.id, { trust: t })}
                    promoted={!!promoted[cap.id]}
                    dismissed={!!dismissed[cap.id]}
                    onPromote={() => { const target = cap.graduation?.promoteTo; if (target == null) return; updateCap(cap.id, { trust: target }); setPromoted(p => ({ ...p, [cap.id]: true })); }}
                    onKeepApproving={() => setDismissed(p => ({ ...p, [cap.id]: true }))}
                    onEdit={() => setDraft({ ...cap })}
                  />
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {agentDraft && (
        <AgentForm
          draft={agentDraft.form}
          set={form => setAgentDraft({ ...agentDraft, form })}
          isNew={agentDraft.isNew}
          onSave={saveAgent}
          onCancel={() => setAgentDraft(null)}
          onDelete={() => deleteAgent(agentDraft.form.id)}
        />
      )}
    </div>
  );
}
