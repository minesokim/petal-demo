"use client";

// Your team — Petal's named specialists, and the workbench for each. Left rail:
// the roster (specialists as headers, their capabilities indented beneath, each
// with its autonomy at a glance). Right: the selected capability's editor — one
// autonomy scale (Suggest / Draft / Act after window / Act & report), how it
// runs, variants, graduation, run history. The capability is the single place
// autonomy lives; the agent is on/off. You assign work on the task itself.

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { SkillPetal, TrustDial, TrustTierTag, StatusPill } from "@/components/os/primitives";
import { ProvenancePanel } from "@/components/os/provenance";
import { skills, householdById, type Skill, type SkillRun } from "@/lib/fixtures/firm";
import { runsOfSkill } from "@/lib/fixtures/derive";
import { skillCategoryMeta, trustTierMeta, type TrustTier } from "@/lib/fixtures/vocab";
import { agents, agentForSkill, type Agent } from "@/lib/fixtures/agents";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--os-accent)]";

function runCountLabel(n: number) {
  return `${n} ${n === 1 ? "run" : "runs"}`;
}

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

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={on}
      className={cn("relative h-[22px] w-9 shrink-0 rounded-full transition-colors", on ? "bg-[var(--os-brand)]" : "bg-[var(--os-border-strong)]", FOCUS)}
    >
      <span className={cn("absolute top-0.5 size-[18px] rounded-full bg-white shadow-sm transition-all", on ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

// ── Run history row: summary + startedAt + status, expandable to provenance ──
function RunRow({ run, by }: { run: SkillRun; by: string }) {
  const [open, setOpen] = useState(false);
  const household = householdById(run.householdId);
  return (
    <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-card)]">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={cn("flex w-full items-center gap-2.5 px-3 py-2 text-left", FOCUS)}
      >
        <StatusPill status={run.status} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-[var(--os-ink)]">{run.summary}</span>
          <span className="block truncate text-[11px] text-[var(--os-ink-subtle)]">
            {household?.name ? `${household.name} · ` : ""}{by}
          </span>
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{run.startedAt}</span>
        <Icon icon={I.chevronDown} size={13} className={cn("shrink-0 text-[var(--os-ink-muted)] transition-transform", !open && "-rotate-90")} />
      </button>
      {open && (
        <div className="border-t border-[var(--os-border)] p-2.5">
          <ProvenancePanel runId={run.id} defaultOpen />
        </div>
      )}
    </div>
  );
}

// ── Agent context strip: who owns the selected capability + on/off ──
function AgentHeader({ agent, on, onToggle }: { agent: Agent; on: boolean; onToggle: () => void }) {
  const Glyph = agent.icon;
  return (
    <div className={cn("border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-4 py-3 md:px-6", !on && "opacity-70")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--os-card)] text-[var(--os-ink-muted)]"><Glyph className="size-4" /></span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold text-[var(--os-ink)]">{agent.name}</span>
            <span className="rounded-full bg-[var(--os-selected)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--os-ink-muted)]">{agent.role}</span>
          </div>
          <div className="mt-0.5 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{agent.drafted} drafted · {agent.approved} approved this season</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11.5px] text-[var(--os-ink-subtle)]">{on ? "On duty" : "Off"}</span>
          <Toggle on={on} onChange={onToggle} />
        </div>
      </div>
    </div>
  );
}

// ── Detail pane: the capability editor ──────────────────────────
function SkillDetail({
  skill, tier, onTierChange, promoted, dismissed, onPromote, onKeepApproving,
}: {
  skill: Skill;
  tier: TrustTier;
  onTierChange: (t: TrustTier) => void;
  promoted: boolean;
  dismissed: boolean;
  onPromote: () => void;
  onKeepApproving: () => void;
}) {
  const runs = runsOfSkill(skill.id);
  const g = skill.graduation;
  const showBanner = !!g && !promoted && !dismissed && tier < g.promoteTo;
  const by = agentForSkill(skill.id)?.name ?? "Petal";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-[var(--os-border)] px-4 py-3.5 md:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <SkillPetal category={skill.category} size={28} />
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold os-display text-[var(--os-ink)]">{skill.name}</h2>
            <div className="text-[11px] text-[var(--os-ink-subtle)]">
              {skillCategoryMeta[skill.category].label} · {by}
            </div>
          </div>
          <span className="ml-auto inline-flex items-center rounded-full bg-[var(--os-selected)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--os-ink-muted)]">
            {trustTierMeta[tier].label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="max-w-[640px]">
          {/* Description */}
          <div className="border-l-2 border-[var(--os-border-strong)] pl-3.5">
            <p className="text-[14px] leading-relaxed text-[var(--os-ink)]">{skill.description}</p>
          </div>

          {/* Autonomy — the single governance scale, per capability */}
          <SectionLabel>Autonomy</SectionLabel>
          <TrustDial tier={tier} onChange={onTierChange} />
          <p className="mt-2.5 max-w-md text-[12.5px] leading-snug text-[var(--os-ink-muted)]">{trustTierMeta[tier].blurb}</p>

          {/* Facts */}
          <SectionLabel>Details</SectionLabel>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <Field label="Trigger">{skill.trigger}</Field>
            <Field label="Channels">{skill.channels.join(" · ")}</Field>
            <Field label="Tone">{skill.tone}</Field>
            <Field label="Escalation">{skill.escalation}</Field>
          </div>

          {/* Steps */}
          <SectionLabel>How it runs</SectionLabel>
          <div>
            {skill.steps.map((step, i) => {
              const last = i === skill.steps.length - 1;
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full border border-[var(--os-border-strong)] bg-white text-[10px] font-semibold tabular-nums text-[var(--os-ink-muted)]">
                      {i + 1}
                    </span>
                    {!last && <span className="my-1 w-px flex-1 bg-[var(--os-border)]" />}
                  </div>
                  <div className={cn("min-w-0 pt-0.5 text-[13px] leading-snug text-[var(--os-ink)]", !last && "pb-4")}>
                    {step}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Variants */}
          <SectionLabel>Variants</SectionLabel>
          <div className="overflow-hidden rounded-lg border border-[var(--os-border)]">
            {skill.variants ? (
              skill.variants.map((v, i) => {
                const household = v.householdId ? householdById(v.householdId) : undefined;
                return (
                  <div key={i} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--os-border)] px-3 py-2.5 last:border-b-0">
                    <span className="text-[13px] font-medium text-[var(--os-ink)]">{v.name}</span>
                    <span className="min-w-0 text-[12px] text-[var(--os-ink-muted)]">{v.delta}</span>
                    {household && (
                      <Link
                        href={`/os/clients/${household.id}`}
                        className={cn("ml-auto inline-flex shrink-0 items-center gap-1 text-[12px] text-[var(--os-link)] hover:underline", FOCUS)}
                      >
                        {household.name} <Icon icon={I.chevronRight} size={11} />
                      </Link>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2.5">
                <span className="text-[13px] font-medium text-[var(--os-ink)]">Firm default</span>
                <span className="text-[12px] text-[var(--os-ink-muted)]">
                  Applies to every client - fork a per-client variant from any client record.
                </span>
              </div>
            )}
          </div>

          {/* Graduation */}
          {g && showBanner && (
            <div className="mt-7 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-4 py-3.5">
              <div className="flex items-start gap-2">
                <PetalMark className="mt-0.5 size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
                <p className="text-[13px] leading-relaxed text-[var(--os-ink)]">{g.prompt}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={onPromote}
                  className={cn("flex h-7 items-center rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}
                >
                  Promote to {trustTierMeta[g.promoteTo].label}
                </button>
                <button
                  onClick={onKeepApproving}
                  className={cn("flex h-7 items-center rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}
                >
                  Keep approving
                </button>
              </div>
            </div>
          )}
          {g && promoted && (
            <div className="mt-7 flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-3 py-2 text-[12px] text-[var(--os-ink)]">
              <Icon icon={I.check} size={14} className="shrink-0 text-emerald-600" />
              {skill.name} promoted to {trustTierMeta[g.promoteTo].label} - acts after 24h unless you stop it
            </div>
          )}
          {g && dismissed && !promoted && (
            <div className="mt-7 flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] px-3 py-2 text-[12px] text-[var(--os-ink-muted)]">
              <Icon icon={I.check} size={14} className="shrink-0" />
              Keeping approval on every send - {skill.name} stays at {trustTierMeta[skill.trust].label}.
            </div>
          )}

          {/* Run history */}
          <SectionLabel>Run history · {runCountLabel(runs.length)}</SectionLabel>
          {runs.length > 0 ? (
            <div className="space-y-2">
              {runs.map(run => (
                <RunRow key={run.id} run={run} by={by} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--os-border-strong)] px-4 py-4 text-[12px] text-[var(--os-ink-muted)]">
              No runs yet - the first run will be logged here with its sources and reasoning.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Capability row in the rail ──
function CapRow({
  s, selected, tier, onSelect,
}: {
  s: Skill;
  selected: boolean;
  tier: TrustTier;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-current={selected || undefined}
      className={cn(
        "flex w-full items-start gap-2.5 py-2 pl-[46px] pr-3.5 text-left transition-colors",
        FOCUS,
        selected ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]",
      )}
    >
      <SkillPetal category={s.category} size={16} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-[var(--os-ink)]">{s.name}</span>
        <span className="mt-1 flex items-center gap-1.5">
          <TrustTierTag tier={tier} />
          <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{runCountLabel(runsOfSkill(s.id).length)}</span>
        </span>
      </span>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function AgentsPage() {
  const [selected, setSelected] = useState<string>(skills[0].id);
  const [tiers, setTiers] = useState<Record<string, TrustTier>>({});
  const [promoted, setPromoted] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [agentOn, setAgentOn] = useState(() => Object.fromEntries(agents.map(a => [a.id, a.on])) as Record<string, boolean>);

  const skill = skills.find(s => s.id === selected) ?? skills[0];
  const tierOf = (s: Skill): TrustTier => tiers[s.id] ?? s.trust;
  const owningAgent = agentForSkill(skill.id);

  const groups = agents
    .map(a => ({ agent: a, list: skills.filter(s => agentForSkill(s.id)?.id === a.id) }))
    .filter(g => g.list.length > 0);
  const unstaffed = skills.filter(s => !agentForSkill(s.id));
  const onCount = agents.filter(a => agentOn[a.id]).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-[var(--os-border)] px-4 pt-6 pb-5 md:px-8">
        <div className="mb-1 flex items-center gap-2">
          <PetalMark className="size-4 text-[var(--os-ink-muted)]" />
          <span className="os-label">Petal AI</span>
        </div>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--os-ink)] os-display">Your team</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-[var(--os-ink-muted)]">
          Petal's specialists and what each one runs. Open a capability to set how far it can go on
          its own and review its history. You assign work on the task itself.
        </p>
        <div className="mt-3 text-[12px] tabular-nums text-[var(--os-ink-subtle)]">{onCount} of {agents.length} on duty</div>
      </div>

      {/* Two panes: roster (left) / capability workbench (right) */}
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="max-h-[38vh] shrink-0 overflow-y-auto border-b border-[var(--os-border)] md:max-h-none md:w-[320px] md:border-b-0 md:border-r">
          {groups.map(({ agent: a, list }) => {
            const on = agentOn[a.id];
            const Glyph = a.icon;
            return (
              <div key={a.id} className="border-b border-[var(--os-border)] last:border-b-0">
                {/* specialist header */}
                <div className={cn("flex items-center gap-2.5 px-3.5 pt-3.5 pb-2.5", !on && "opacity-55")}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--os-bg-subtle)] text-[var(--os-ink-muted)]"><Glyph className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-[var(--os-ink)]">{a.name}</div>
                    <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{a.role}</div>
                  </div>
                  {!on && <span className="shrink-0 rounded-full bg-[var(--os-selected)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--os-ink-subtle)]">Off</span>}
                </div>
                {/* capabilities */}
                <div className={cn("pb-2", !on && "opacity-55")}>
                  {list.map(s => (
                    <CapRow key={s.id} s={s} selected={s.id === selected} tier={tierOf(s)} onSelect={() => setSelected(s.id)} />
                  ))}
                </div>
              </div>
            );
          })}
          {unstaffed.length > 0 && (
            <div className="pb-2">
              <div className="os-label px-3.5 pb-1.5 pt-3.5">Not staffed by a specialist</div>
              {unstaffed.map(s => (
                <CapRow key={s.id} s={s} selected={s.id === selected} tier={tierOf(s)} onSelect={() => setSelected(s.id)} />
              ))}
            </div>
          )}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {owningAgent && (
            <AgentHeader
              agent={owningAgent}
              on={agentOn[owningAgent.id]}
              onToggle={() => setAgentOn(prev => ({ ...prev, [owningAgent.id]: !prev[owningAgent.id] }))}
            />
          )}
          {/* keyed remount plays the enter only — no exit, so switching can't hang */}
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="flex min-h-0 min-w-0 flex-1"
          >
            <SkillDetail
              skill={skill}
              tier={tierOf(skill)}
              onTierChange={t => setTiers(prev => ({ ...prev, [skill.id]: t }))}
              promoted={!!promoted[skill.id]}
              dismissed={!!dismissed[skill.id]}
              onPromote={() => {
                const target = skill.graduation?.promoteTo;
                if (target == null) return;
                setTiers(prev => ({ ...prev, [skill.id]: target }));
                setPromoted(prev => ({ ...prev, [skill.id]: true }));
              }}
              onKeepApproving={() => setDismissed(prev => ({ ...prev, [skill.id]: true }))}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
