"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { skills, agents, type Skill } from "@/lib/os-agents";
import { AgentAvatar } from "@/components/os/primitives";
import { Icon, I } from "@/components/os/icon";

function agentName(id: string) {
  return agents.find(a => a.id === id)?.name || "Petal";
}
function agentGradient(id: string) {
  return agents.find(a => a.id === id)?.gradient || "from-slate-400 to-slate-500";
}
function agentGlyph(id: string) {
  return agents.find(a => a.id === id)?.glyph;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-[var(--os-ink-subtle)]">{label}</div>
      <div className="mt-0.5 text-[13px] text-[var(--os-ink)]">{children}</div>
    </div>
  );
}

function SkillDetail({ skill }: { skill: Skill }) {
  const ver = parseInt(skill.version.replace("v", "")) || 1;
  type FlowItem = { kind: "trigger" | "step" | "output"; label?: string; n?: number; title: string; detail?: string };
  const nodes: FlowItem[] = [
    { kind: "trigger", label: "Trigger", title: skill.trigger },
    ...skill.steps.map((s, i): FlowItem => ({ kind: "step", n: i + 1, title: s.title, detail: s.detail })),
    { kind: "output", label: "Output", title: skill.output },
  ];
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-[var(--os-border)] px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <AgentAvatar gradient={agentGradient(skill.ownerAgentId)} icon={agentGlyph(skill.ownerAgentId)} size={26} />
          <h2 className="text-[15px] font-semibold os-display">{skill.name}</h2>
          <span className="text-[12px] tabular-nums text-[var(--os-ink-subtle)]">{skill.version}</span>
          {skill.firmDistributed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"><Icon icon={I.clients} size={12} /> Firm-wide</span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            <button className="flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] transition-colors hover:bg-[var(--os-hover)]"><Icon icon={I.trigger} size={14} /> Run now</button>
            <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.edit} size={14} /> Edit skill</button>
          </div>
        </div>
        <p className="mt-1 text-[12px] text-[var(--os-ink-muted)]">{skill.purpose}</p>
      </div>

      {/* Body: main flow + metadata rail */}
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
          {/* Definition — lead, as a quiet blockquote (no boxy callout) */}
          <div className="border-l-2 border-[var(--os-border-strong)] pl-3.5">
            <p className="text-[14px] leading-relaxed text-[var(--os-ink)]">{skill.definition}</p>
          </div>

          {/* How it runs — connected timeline (the original idea, polished) */}
          <div className="os-label mb-2.5 mt-6">How it runs</div>
          <div className="max-w-[560px]">
            {nodes.map((node, i) => {
              const last = i === nodes.length - 1;
              const endpoint = node.kind !== "step";
              return (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {endpoint ? (
                      <span className={cn("relative grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br shadow-sm ring-1 ring-inset ring-white/20", node.kind === "trigger" ? "from-violet-500 to-indigo-500" : "from-emerald-500 to-teal-500")}>
                        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                        <Icon icon={node.kind === "trigger" ? I.trigger : I.output} size={11} className="relative text-white" />
                      </span>
                    ) : (
                      <span className="relative grid size-5 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 text-[10px] font-semibold tabular-nums text-white shadow-sm ring-1 ring-inset ring-white/20">
                        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                        <span className="relative">{node.n}</span>
                      </span>
                    )}
                    {!last && <span className="my-1 w-px flex-1 bg-[var(--os-border)]" />}
                  </div>
                  <div className={cn("min-w-0", last ? "pb-0" : "pb-4")}>
                    {node.label && <div className="mb-0.5 text-[10.5px] font-medium text-[var(--os-ink-subtle)]">{node.label}</div>}
                    <div className={cn("text-[13px] leading-snug text-[var(--os-ink)]", node.kind === "step" && "font-medium")}>{node.title}</div>
                    {node.detail && <div className="mt-0.5 text-[11.5px] leading-snug text-[var(--os-ink-muted)]">{node.detail}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metadata rail */}
        <aside className="w-[264px] shrink-0 overflow-y-auto border-l border-[var(--os-border)] px-4 py-5">
          <div className="os-label mb-3">Details</div>
          <div className="space-y-3">
            <Field label="Run by">
              <span className="inline-flex items-center gap-1.5">
                <AgentAvatar gradient={agentGradient(skill.ownerAgentId)} icon={agentGlyph(skill.ownerAgentId)} size={16} rounded={5} />
                {agentName(skill.ownerAgentId)}
              </span>
            </Field>
            <Field label="Total runs"><span className="tabular-nums">{skill.runsTotal.toLocaleString()}</span></Field>
            <Field label="Version"><span className="tabular-nums">{skill.version}</span></Field>
            <Field label="Distribution">{skill.firmDistributed ? "Firm-wide" : "Private"}</Field>
          </div>

          <div className="my-5 h-px bg-[var(--os-border)]" />

          <div className="os-label mb-3 flex items-center gap-1.5"><Icon icon={I.history} size={14} /> Version history</div>
          <div>
            {Array.from({ length: Math.min(3, ver) }).map((_, i, arr) => {
              const v = ver - i;
              return (
                <div key={v} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", i === 0 ? "bg-[var(--os-ink)]" : "bg-[var(--os-border-strong)]")} />
                    {i < arr.length - 1 && <div className="my-1 w-px flex-1 bg-[var(--os-border)]" />}
                  </div>
                  <div className={cn("min-w-0", i < arr.length - 1 ? "pb-3.5" : "")}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] leading-snug text-[var(--os-ink)]">{i === 0 ? "Refined the YoY flag threshold" : i === 1 ? "Tightened citation requirements" : "Initial firm version"}</span>
                      <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">v{v}</span>
                    </div>
                    <div className="text-[11px] text-[var(--os-ink-subtle)]">{i === 0 ? "From 3 notes · 2 weeks ago" : i === 1 ? "From 6 notes · last month" : "Initial publish"}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--os-ink-subtle)]">
            <Icon icon={I.sparkle} size={12} className="mt-0.5 shrink-0" />
            <span>Improved from {skill.improvedFrom} review notes. Every send-back you write sharpens this skill, firm-wide.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function SkillsPage() {
  const [selected, setSelected] = useState<string>(skills[0].id);
  const skill = skills.find(s => s.id === selected)!;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[var(--os-ink)] os-display">Skills</h1>
            <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Your firm&apos;s bookkeeping and tax skills, ready for Petal to run.</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.search} size={15} /></button>
            <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]"><Icon icon={I.plus} size={15} /> New skill</button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Skills list rail */}
        <div className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border)]">
          {skills.map(s => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={cn(
                "flex items-center gap-2.5 border-b border-[var(--os-border)] px-3.5 py-2.5 text-left transition-colors",
                s.id === selected ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]",
              )}
            >
              <AgentAvatar gradient={agentGradient(s.ownerAgentId)} icon={agentGlyph(s.ownerAgentId)} size={24} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{s.name}</div>
                <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{agentName(s.ownerAgentId)} · {s.runsTotal} runs</div>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{s.version}</span>
            </button>
          ))}
          <div className="mt-1 px-3.5 py-2">
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]">
              <PetalMark className="size-3.5" /> Turn a past run into a skill
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="flex min-w-0 flex-1"
          >
            <SkillDetail skill={skill} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
