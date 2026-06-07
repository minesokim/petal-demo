"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { agents, skills, autonomyMeta, type Agent } from "@/lib/os-agents";
import { AgentAvatar, PetalLogo } from "@/components/os/primitives";
import { Icon, I } from "@/components/os/icon";

const COLS = "grid-cols-[minmax(180px,1.3fr)_minmax(220px,1.6fr)_70px_124px_104px_72px_96px]";

const BUILDER_TABS = [
  { key: "persona", label: "Persona", icon: I.persona },
  { key: "knowledge", label: "Knowledge", icon: I.knowledge },
  { key: "skills", label: "Skills", icon: I.skills },
  { key: "visibility", label: "Visibility", icon: I.eye },
] as const;
type BuilderTab = (typeof BUILDER_TABS)[number]["key"];

function agentId(id: string) {
  return "agt_" + id.replace(/^a-/, "");
}

/** quiet reliability metric — single neutral tone; color is reserved for status, not every row. */
function MetricBar({ pct }: { pct: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-9 overflow-hidden rounded-full bg-[var(--os-selected)]">
        <span className="block h-full rounded-full bg-[var(--os-ink-subtle)]" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-[12px] tabular-nums text-[var(--os-ink-muted)]">{pct}%</span>
    </span>
  );
}

function MetaPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-[var(--os-ink-subtle)]">{label}</span>
      <span className="text-[13px] tabular-nums text-[var(--os-ink)]">{value}</span>
    </div>
  );
}

function Builder({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const [tab, setTab] = useState<BuilderTab>("persona");
  const [copied, setCopied] = useState(false);
  const agentSkills = skills.filter(s => agent.skills.includes(s.id));

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-[var(--os-border)] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <AgentAvatar gradient={agent.gradient} icon={agent.glyph} size={28} bare />
          <h2 className="text-[15px] font-semibold os-display">{agent.name}</h2>
          <button
            onClick={() => { navigator.clipboard?.writeText(agentId(agent.id)); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
            className="group inline-flex items-center gap-1 rounded-md border border-[var(--os-border)] px-1.5 py-0.5 text-[11px] text-[var(--os-ink-subtle)] hover:text-[var(--os-ink-muted)]"
          >
            <span className="font-mono">{agentId(agent.id)}</span>
            {copied ? <Icon icon={I.check} size={12} className="text-[var(--os-success)]" /> : <Icon icon={I.copy} size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />}
          </button>
          <button onClick={onClose} className="ml-auto grid size-6 place-items-center rounded-md text-[var(--os-ink-subtle)] hover:bg-[var(--os-hover)]"><Icon icon={I.close} size={15} /></button>
        </div>
        <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--os-ink-muted)]">{agent.purpose}</p>
        {/* metadata strip — the one place autonomy color appears */}
        <div className="mt-3 flex items-end gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[var(--os-ink-subtle)]">Autonomy</span>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--os-ink)]">
              <span className={cn("size-1.5 rounded-full", autonomyMeta[agent.autonomy].dot)} />
              {autonomyMeta[agent.autonomy].label}
            </span>
          </div>
          <MetaPair label="Reliability" value={`${agent.pctAuto}% auto`} />
          <MetaPair label="Runs / week" value={`${agent.runsThisWeek}`} />
          <MetaPair label="Added" value={agent.created} />
        </div>
      </div>

      {/* Builder tabs (Sana) */}
      <div className="flex items-center gap-1 border-b border-[var(--os-border)] px-5">
        {BUILDER_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative flex items-center gap-1.5 px-2.5 py-2 text-[13px] transition-colors",
              tab === t.key ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]",
            )}
          >
            <Icon icon={t.icon} size={15} /> {t.label}
            {tab === t.key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--os-ink)]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-5">
        {tab === "persona" && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="os-label">Instructions</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--os-ink-subtle)]"><PetalMark className="size-3" /> Inherits Firm Constitution</span>
            </div>
            <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-bg-subtle)] p-3.5 text-[13px] leading-relaxed text-[var(--os-ink)]">
              {agent.persona}
            </div>
            <p className="mt-2 text-[11px] text-[var(--os-ink-subtle)]">Firm-wide policy is injected automatically. These instructions layer on top.</p>
          </>
        )}

        {tab === "knowledge" && (
          <>
            <div className="os-label mb-2">Context sources</div>
            <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
              {agent.knowledge.map((k, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 text-[13px]">
                  <Icon icon={I.knowledge} size={15} className="shrink-0 text-[var(--os-ink-subtle)]" />
                  <span className="text-[var(--os-ink)]">{k}</span>
                </div>
              ))}
            </div>
            {agent.connectorRules && (
              <>
                <div className="os-label mb-2 mt-5">Connector guardrails</div>
                <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
                  {agent.connectorRules.map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5 px-3 py-2.5">
                      <Icon icon={I.shield} size={15} className="mt-0.5 shrink-0 text-[var(--os-ink-subtle)]" />
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-[var(--os-ink)]">{c.service}</div>
                        <div className="text-[12px] text-[var(--os-ink-muted)]">{c.rule}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-[var(--os-ink-subtle)]">Read-only by default. Write scopes are granted per connector and apply on top of firm security rules.</p>
              </>
            )}
          </>
        )}

        {tab === "skills" && (
          <>
            <div className="os-label mb-2">Jobs this agent can run</div>
            <div className="divide-y divide-[var(--os-border)] rounded-lg border border-[var(--os-border)]">
              {agentSkills.map(s => (
                <div key={s.id} className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Icon icon={I.skills} size={15} className="shrink-0 text-[var(--os-ink-subtle)]" />
                    <span className="text-[13px] font-medium text-[var(--os-ink)]">{s.name}</span>
                    <span className="text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{s.version}</span>
                    <span className="ml-auto text-[11px] tabular-nums text-[var(--os-ink-subtle)]">{s.runsTotal} runs</span>
                  </div>
                  <p className="mt-1 pl-6 text-[12px] text-[var(--os-ink-muted)]">{s.output}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "visibility" && (
          <>
            <div className="os-label mb-2">Autonomy level</div>
            <div className="divide-y divide-[var(--os-border)] overflow-hidden rounded-lg border border-[var(--os-border)]">
              {(Object.keys(autonomyMeta) as Agent["autonomy"][]).map(level => {
                const m = autonomyMeta[level];
                const on = agent.autonomy === level;
                return (
                  <div key={level} className={cn("flex items-center gap-3 px-3 py-2.5", on && "bg-[var(--os-bg-subtle)]")}>
                    <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", on ? "border-[var(--os-ink)]" : "border-[var(--os-border-strong)]")}>
                      {on && <span className="size-2 rounded-full bg-[var(--os-ink)]" />}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] text-[var(--os-ink)]">{m.label}</div>
                      <div className="text-[12px] text-[var(--os-ink-subtle)]">{m.blurb}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="os-label mb-2 mt-5">Who can use this agent</div>
            <div className="rounded-lg border border-[var(--os-border)] px-3 py-2.5 text-[13px] text-[var(--os-ink)]">{agent.visibility}</div>
            <p className="mt-2 text-[11px] text-[var(--os-ink-subtle)]">Changes apply immediately. Output never touches client records until a human approves it.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const agent = agents.find(a => a.id === selected) || null;
  const open = !!agent;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--os-border)] px-8 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-[var(--os-ink)] os-display">Petal Agents</h1>
            <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">The agents that do your firm&apos;s work, with autonomy you control.</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.sort} size={15} /> Sort</button>
            <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.filter} size={15} /> Filter</button>
            <button className="grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><Icon icon={I.search} size={15} /></button>
            <button className="flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)]"><Icon icon={I.plus} size={15} /> New agent</button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {open ? (
          // Compact roster rail
          <div className="flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-[var(--os-border)]">
            {agents.map(a => (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={cn(
                  "flex items-center gap-2.5 border-b border-[var(--os-border)] px-3.5 py-2.5 text-left transition-colors",
                  a.id === selected ? "bg-[var(--os-selected)]" : "hover:bg-[var(--os-hover)]",
                )}
              >
                <AgentAvatar gradient={a.gradient} icon={a.glyph} size={26} bare />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-[var(--os-ink)]">{a.name}</div>
                  <div className="truncate text-[11px] text-[var(--os-ink-subtle)]">{autonomyMeta[a.autonomy].label} · {a.runsThisWeek}/wk</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // Dense table — color limited to the identity orb; the rest stays quiet
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] px-8 py-2", COLS)}>
              {["Agent", "What it does", "Skills", "Autonomy", "Reliability", "Runs", "Last active"].map((h, i) => (
                <div key={h} className={cn("os-label", i === 5 && "text-right")}>{h}</div>
              ))}
            </div>
            {agents.map(a => (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={cn("grid items-center gap-x-4 border-b border-[var(--os-border)] px-8 py-3 text-left transition-colors hover:bg-[var(--os-hover)]", COLS)}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <AgentAvatar gradient={a.gradient} icon={a.glyph} size={26} bare />
                  <span className="truncate text-[13px] font-medium text-[var(--os-ink)]">{a.name}</span>
                </div>
                <div className="truncate text-[12px] text-[var(--os-ink-muted)]">{a.purpose}</div>
                <div className="text-[12px] tabular-nums text-[var(--os-ink-muted)]">{a.skills.length}</div>
                <div className="flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
                  <span className={cn("size-1.5 shrink-0 rounded-full", autonomyMeta[a.autonomy].dot)} />
                  {autonomyMeta[a.autonomy].label}
                </div>
                <div><MetricBar pct={a.pctAuto} /></div>
                <div className="text-right text-[12px] font-medium tabular-nums text-[var(--os-ink)]">{a.runsThisWeek}</div>
                <div className="text-[12px] text-[var(--os-ink-subtle)]">{a.lastActive}</div>
              </button>
            ))}
            {/* connective-tissue footer */}
            <div className="mt-auto flex items-center justify-between border-t border-[var(--os-border)] px-8 py-2 text-[11px] text-[var(--os-ink-subtle)]">
              <span>{agents.length} agents</span>
              <span>Synced 2m ago</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {agent && (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 14 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex min-w-0 flex-1"
            >
              <Builder agent={agent} onClose={() => setSelected(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
