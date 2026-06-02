"use client";

import { useState } from "react";
import {
  ActivityIcon,
  ArrowRightIcon,
  BellIcon,
  BrainIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  FilterIcon,
  MailIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TrustTierChip, type TrustTier } from "@/components/trust-tier-badge";
import { PetalMark } from "@/components/petal-mark";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-notification";

// ═════════════════════════════════════════════════════════════════════════
// Page
// ═════════════════════════════════════════════════════════════════════════

export default function AutomationsPage() {
  const [draft, setDraft] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [agentsExpanded, setAgentsExpanded] = useState(false);
  const { showToast } = useToast();

  const handleCreate = () => {
    if (!draft.trim()) return;
    showToast("success", "Automation drafted", "I'll show you a preview before turning it on");
    setDraft("");
  };

  const totalAgentActions = AGENTS.reduce((sum, a) => sum + a.actionsToday, 0);
  const activeAutomations = USER_AUTOMATIONS.filter((a) => a.active).length;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* ── Header — title + one quiet line + a single create button.
            Modeled on Linear's rules page: calm, one focal list, lots of air. ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-tight md:text-[28px]">Automations</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            Rules that run in the background so you don&apos;t have to.
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="font-medium tabular-nums text-foreground/75">{activeAutomations}</span> active
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 bg-foreground text-background hover:bg-foreground/90"
          onClick={() => setBuilderOpen(true)}
        >
          <PlusIcon className="size-3.5" /> New automation
        </Button>
      </div>

      {/* ── Your rules — the one focal list. Each rule is a calm When / Then
            block (Linear-style), not a pill carnival. ── */}
      <div className="overflow-hidden rounded-xl border bg-card">
        {USER_AUTOMATIONS.map((rule, i) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            last={i === USER_AUTOMATIONS.length - 1}
            onToggle={() => showToast("success", rule.active ? "Paused" : "Activated", rule.when)}
          />
        ))}
      </div>

      {/* ── Running automatically — Petal's background workers, collapsed to a
            single quiet line. Expand to a compact list; tap any for the
            deep-dive sheet. Not five brochure cards. ── */}
      <div>
        <button
          onClick={() => setAgentsExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30"
        >
          <span className="flex min-w-0 items-center gap-2 text-[13px]">
            <PetalMark className="size-3.5 shrink-0 text-foreground/55" />
            <span className="font-medium text-foreground/85">Petal is handling {AGENTS.length} things automatically</span>
            <span className="hidden text-[12px] text-muted-foreground sm:inline">· {totalAgentActions} actions today</span>
          </span>
          <ChevronRightIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", agentsExpanded && "rotate-90")} />
        </button>
        {agentsExpanded && (
          <div className="mt-2 overflow-hidden rounded-xl border bg-card">
            {AGENTS.map((agent, i) => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30",
                  i !== AGENTS.length - 1 && "border-b border-border/40"
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground/[0.05]">
                  <agent.icon className="size-3.5 text-foreground/70" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-foreground/90">{agent.name}</span>
                  <span className="block truncate text-[11.5px] text-muted-foreground">{agent.role}</span>
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{agent.actionsToday} today</span>
                <ChevronRightIcon className="size-3.5 shrink-0 text-muted-foreground/40" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Builder — opens from "New automation". The plain-English composer
            lives here (not bolted to the top of the page), with templates as
            starting points. Modeled on Origin's Create-Rule sheet. ── */}
      <Sheet open={builderOpen} onOpenChange={setBuilderOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <div className="border-b px-5 py-4">
            <SheetTitle className="text-[15px] font-semibold">New automation</SheetTitle>
            <SheetDescription className="mt-0.5 text-[12px] text-muted-foreground">
              Describe it in plain English. Petal turns it into a rule you review before it runs.
            </SheetDescription>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. When a client uploads their last document, draft an engagement letter for ERO signing"
              rows={4}
              className="resize-none border-border/60 bg-background text-[13.5px] leading-relaxed"
            />
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-foreground/55">Or start from a template</div>
              <div className="space-y-1.5">
                {RECIPES.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setDraft(r.description)}
                    className="flex w-full items-start gap-2.5 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/30"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground/[0.05]">
                      <r.icon className="size-3.5 text-foreground/70" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] font-medium">{r.title}</span>
                      <span className="line-clamp-1 block text-[11px] text-muted-foreground">{r.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t px-5 py-3">
            <Button variant="outline" size="sm" onClick={() => setBuilderOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-foreground text-background hover:bg-foreground/90"
              disabled={!draft.trim()}
              onClick={() => {
                handleCreate();
                setBuilderOpen(false);
              }}
            >
              <SparklesIcon className="size-3.5" /> Draft automation
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Agent detail sheet — deep-dive on a background worker. ── */}
      <AgentDetailSheet
        agent={selectedAgent}
        onOpenChange={(open) => !open && setSelectedAgent(null)}
        onPause={(agent) =>
          showToast("success", `${agent.id} ${agent.status === "running" ? "paused" : "running"}`, "Coming soon")
        }
        onChangeTier={(agent) => showToast("success", `Tier for ${agent.id}`, "Coming soon")}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Agent detail sheet — opens when an agent card is clicked
// ═════════════════════════════════════════════════════════════════════════

function AgentDetailSheet({
  agent,
  onOpenChange,
  onPause,
  onChangeTier,
}: {
  agent: Agent | null;
  onOpenChange: (open: boolean) => void;
  onPause: (agent: Agent) => void;
  onChangeTier: (agent: Agent) => void;
}) {
  return (
    <Sheet open={!!agent} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {agent && (
          <>
            <SheetTitle className="sr-only">{agent.name}</SheetTitle>
            <SheetDescription className="sr-only">{agent.role}</SheetDescription>

            <div className="space-y-5 p-1">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05]">
                    <agent.icon className="size-5 text-foreground/70" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-foreground/55">
                      {agent.id}
                    </div>
                    <h2 className="font-display text-[22px] font-medium leading-tight tracking-tight">
                      {agent.name}
                    </h2>
                    <p className="text-[12.5px] text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <TrustTierChip tier={agent.defaultTier} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => onPause(agent)}
                  >
                    {agent.status === "running" ? (
                      <>
                        <PauseIcon className="size-3" /> Pause
                      </>
                    ) : (
                      <>
                        <PlayIcon className="size-3" /> Resume
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Description */}
              <p className="text-[13.5px] leading-relaxed text-foreground/85">{agent.description}</p>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-3 rounded-md bg-muted/40 p-3.5">
                <div>
                  <div className="font-display text-[20px] font-medium tabular-nums leading-none">
                    {agent.actionsToday}
                  </div>
                  <div className="mt-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">Today</div>
                </div>
                <div>
                  <div className="font-display text-[20px] font-medium tabular-nums leading-none">
                    {agent.actionsThisWeek}
                  </div>
                  <div className="mt-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">This week</div>
                </div>
                <div>
                  <div className="font-display text-[20px] font-medium tabular-nums leading-none">
                    {agent.successRate}%
                  </div>
                  <div className="mt-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">Accepted</div>
                </div>
              </div>

              {/* Capabilities */}
              <div>
                <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
                  What I can do
                </div>
                <ul className="grid gap-1.5">
                  {agent.capabilities.map((cap) => (
                    <li key={cap} className="flex items-start gap-2 text-[12.5px] leading-relaxed">
                      <CheckIcon className="mt-1 size-3 shrink-0 text-emerald-600" />
                      <span className="text-foreground/85">{cap}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations */}
              {agent.limitations.length > 0 && (
                <div>
                  <div className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
                    What I won&apos;t do
                  </div>
                  <ul className="space-y-1.5">
                    {agent.limitations.map((lim) => (
                      <li key={lim} className="flex items-start gap-2 text-[12.5px] leading-relaxed">
                        <span className="mt-[7px] size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                        <span className="text-muted-foreground">{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent activity */}
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
                    Recent activity
                  </div>
                  <span className="text-[11px] text-muted-foreground">Last 5 actions</span>
                </div>
                <ul className="divide-y divide-border/40 rounded-md border bg-background">
                  {agent.recentActivity.map((act, i) => (
                    <li key={i} className="flex items-center gap-3 px-3.5 py-2.5">
                      <ActivityIcon className="size-3 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-[12.5px] text-foreground/85">{act.what}</span>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{act.when}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Autonomy tier config */}
              <div className="rounded-md border border-border/70 bg-muted/30 px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[12.5px] font-medium">Autonomy tier</div>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      Running at <span className="font-medium text-foreground/80">{agent.defaultTier}</span> —
                      change to let me do more or less on my own.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onChangeTier(agent)}>
                    Change tier <ArrowRightIcon className="size-3" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Agent card
// ═════════════════════════════════════════════════════════════════════════

function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex h-full flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.05]">
          <agent.icon className="size-4 text-foreground/70" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[12.5px] font-semibold text-foreground/85">{agent.id}</span>
            <span
              className={cn(
                "size-1.5 rounded-full",
                agent.status === "running" ? "bg-emerald-500" : agent.status === "idle" ? "bg-muted-foreground/40" : "bg-amber-500"
              )}
              title={agent.status}
            />
          </div>
          <div className="text-[11px] text-muted-foreground">{agent.role}</div>
        </div>
        <TrustTierChip tier={agent.defaultTier} className="shrink-0" />
      </div>

      <p className="line-clamp-2 text-[12px] leading-relaxed text-foreground/75">{agent.description}</p>

      {/* Activity stats */}
      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border/40 pt-2.5 text-[10.5px]">
        <div>
          <div className="font-display text-[14px] font-medium tabular-nums leading-none">{agent.actionsToday}</div>
          <div className="text-muted-foreground">actions today</div>
        </div>
        <div>
          <div className="font-display text-[14px] font-medium tabular-nums leading-none">{agent.actionsThisWeek}</div>
          <div className="text-muted-foreground">this week</div>
        </div>
      </div>
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Automation row
// ═════════════════════════════════════════════════════════════════════════

function RuleRow({ rule, onToggle, last }: { rule: UserAutomation; onToggle: () => void; last?: boolean }) {
  const TriggerIcon = rule.triggerType === "schedule" ? ClockIcon : ZapIcon;
  // Autonomy as a calm, sentence-case phrase — not a loud all-caps chip.
  const tierLabel =
    rule.tier === "auto" ? "Runs automatically" : rule.tier === "asks" ? "Asks first" : "Drafts for review";
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/20",
        !last && "border-b border-border/50"
      )}
    >
      {/* When / Then — a calm two-line block (Linear-style), plain text with a
          small leading trigger icon. No colored blocks. */}
      <div className={cn("min-w-0 flex-1", !rule.active && "opacity-50")}>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2.5">
            <span className="w-10 shrink-0 text-[11.5px] font-medium text-muted-foreground">When</span>
            <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-foreground">
              <TriggerIcon className="size-3.5 shrink-0 text-muted-foreground/70" />
              {rule.when}
            </span>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="w-10 shrink-0 text-[11.5px] font-medium text-muted-foreground">Then</span>
            <span className="text-[13px] text-foreground/85">{rule.then}</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2 pl-[50px] text-[11px] text-muted-foreground">
          <span>{rule.category}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>last ran {rule.lastFired}</span>
          <span className="text-muted-foreground/40">·</span>
          <span>{tierLabel}</span>
        </div>
      </div>

      {/* Quiet on/off toggle */}
      <button
        onClick={onToggle}
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
          rule.active
            ? "border-emerald-500/40 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400"
            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
        )}
        title={rule.active ? "Pause" : "Activate"}
      >
        {rule.active ? <PauseIcon className="size-3.5" /> : <PlayIcon className="size-3.5" />}
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Data
// ═════════════════════════════════════════════════════════════════════════

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "running" | "idle" | "paused";
  actionsToday: number;
  actionsThisWeek: number;
  successRate: number;
  defaultTier: TrustTier;
  capabilities: string[];
  limitations: string[];
  recentActivity: { what: string; when: string }[];
}

const AGENTS: Agent[] = [
  {
    id: "triage-classifier",
    name: "Triage Classifier",
    role: "Surfaces issues that need your eyes",
    description:
      "I continuously scan every return, intake form, document upload, and incoming notice — flagging compliance gaps, calculation discrepancies, anomalies, and missing positions before they bite. Everything I flag becomes a Triage item with full context and a recommended next step.",
    icon: FilterIcon,
    status: "running",
    actionsToday: 47,
    actionsThisWeek: 312,
    successRate: 94,
    defaultTier: "drafts",
    capabilities: [
      "Cross-check returns against prior year (income, dependents, schedules)",
      "Detect 12 known anomaly patterns (1099-K w/o Sch C, hobby loss, etc.)",
      "Classify IRS notices (CP2000, CP504, LT11, etc.)",
      "Surface missing forms (8867, 8275, 8949) before submission",
      "Flag positions that need a substantial-authority disclosure",
      "Pre-fill due-diligence checklists",
    ],
    limitations: [
      "Won't take a position without preparer approval",
      "Won't transmit anything to the IRS without sign-off",
    ],
    recentActivity: [
      { what: "Flagged 1099-NEC mismatch on Priya Sharma's return", when: "12m ago" },
      { what: "Detected §199A opportunity for Marcus Chen", when: "34m ago" },
      { what: "Classified CP2000 notice for Carlos Fuentes", when: "1h ago" },
      { what: "Caught W-2 + Schedule C same-employer flag on James Wilson", when: "2h ago" },
      { what: "Pre-filled Form 8867 for 4 EITC returns", when: "this morning" },
    ],
  },
  {
    id: "inbox-drafter",
    name: "Inbox Drafter",
    role: "Writes replies in your voice",
    description:
      "I draft client emails, SMS replies, document-collection nudges, IRS notice responses, engagement letters, and post-meeting follow-ups — always pulling from real client state and your style. Every draft sits in your queue for approval before it goes out.",
    icon: MailIcon,
    status: "running",
    actionsToday: 23,
    actionsThisWeek: 148,
    successRate: 87,
    defaultTier: "drafts",
    capabilities: [
      "Draft replies pulled from actual client context (return status, recent activity)",
      "Match your tone (warm + professional, based on your prior messages)",
      "Generate IRS notice response drafts with cited authority",
      "Compose document-collection nudges with the specific docs needed",
      "Write engagement letters from your saved templates",
      "Draft post-meeting follow-ups from call transcripts",
    ],
    limitations: [
      "Never sends anything without your approval (drafts tier)",
      "Won't make legal commitments or quote prices outside your fee schedule",
    ],
    recentActivity: [
      { what: "Drafted reply to Sarah Mitchell · Q4 estimates question", when: "8m ago" },
      { what: "Wrote doc-collection nudge for Tyrone Mitchell", when: "22m ago" },
      { what: "Drafted CP2000 response for Carlos Fuentes", when: "1h ago" },
      { what: "Composed engagement letter for new intake (Fatima Al-Hassan)", when: "3h ago" },
      { what: "Wrote 6 Q1 estimate reminders", when: "this morning" },
    ],
  },
  {
    id: "discovery-agent",
    name: "Discovery Agent",
    role: "Finds money on the table",
    description:
      "I analyze every return against the 20-position Library, prior years, and current IRS guidance to surface missed deductions, credits, elections, and tax strategies. I won't take positions below the Reasonable Basis floor — if the authority's weak, I refuse and tell you why.",
    icon: SearchIcon,
    status: "running",
    actionsToday: 8,
    actionsThisWeek: 54,
    successRate: 91,
    defaultTier: "asks",
    capabilities: [
      "Cross-reference 20 named tax positions against client returns",
      "Surface §199A QBI, §179 expensing, bonus depreciation opportunities",
      "Compare prior-year positions for missed carryforwards",
      "Generate Form 8275 disclosure drafts when needed",
      "Model S-Corp vs LLC vs sole-prop scenarios",
      "Refuse positions below Reasonable Basis with explanation",
    ],
    limitations: [
      "Won't take a position without your explicit approval (asks tier)",
      "Won't compute final return numbers — that's the prep canvas's job",
      "Won't claim positions outside the Position Library without you adding them first",
    ],
    recentActivity: [
      { what: "Surfaced §179 opportunity ($3,800) for Marcus Chen", when: "1h ago" },
      { what: "Refused §469 real-estate-pro claim for Anthony Russo — hours undocumented", when: "2h ago" },
      { what: "Modeled S-Corp scenario for Miguel Sandoval (~$2,600/yr saving)", when: "this morning" },
      { what: "Flagged Roth conversion window for Sarah Mitchell", when: "yesterday" },
      { what: "Identified self-employed health insurance deduction for Mei-Lin Wu", when: "yesterday" },
    ],
  },
  {
    id: "memory-curator",
    name: "Memory Curator",
    role: "Remembers everything about every client",
    description:
      "I continuously index every email, call transcript, video meeting, document, prior return, and AI analysis into OmniContext — the per-client memory layer. I surface relevant memory when you need it, auto-extract structured facts (filing status, dependents, business changes), and never forget a single interaction.",
    icon: BrainIcon,
    status: "running",
    actionsToday: 132,
    actionsThisWeek: 891,
    successRate: 99,
    defaultTier: "auto",
    capabilities: [
      "Index every email, SMS, doc, call, and meeting transcript per client",
      "Extract structured facts from unstructured sources",
      "Surface 'I remember this' context when you open a client",
      "Detect life events from conversation (marriage, new business, dependents)",
      "Build the per-client audit trail used by Activity tab",
      "Power Ask Petal's practice-aware research answers",
    ],
    limitations: [
      "Reads only — doesn't initiate client communication",
      "Won't surface PII outside your authenticated session",
    ],
    recentActivity: [
      { what: "Indexed 12 new emails in Mendez thread", when: "4m ago" },
      { what: "Extracted 'new business: Sandoval LLC' fact for Miguel", when: "1h ago" },
      { what: "Linked Priya's referral source to Sarah Mitchell intake", when: "this morning" },
      { what: "Updated dependents fact for Carlos & Elena Mendez", when: "yesterday" },
      { what: "Detected 'on vacation' signal for Karen O'Brien — paused nudges", when: "2 days ago" },
    ],
  },
  {
    id: "nudge-agent",
    name: "Nudge Agent",
    role: "Proactive client outreach",
    description:
      "I schedule and send doc-collection reminders, Q-estimate nudges, signature follow-ups, and engagement check-ins on the right cadence — backing off when clients are responsive, escalating when they're not. I never spam.",
    icon: BellIcon,
    status: "idle",
    actionsToday: 37,
    actionsThisWeek: 218,
    successRate: 76,
    defaultTier: "drafts",
    capabilities: [
      "Schedule doc-collection reminders with adaptive cadence",
      "Send Q1/Q2/Q3/Q4 estimated payment nudges to applicable clients",
      "Follow up on unsigned 8879s and engagement letters",
      "Detect 'on vacation' / 'OOO' replies and pause outreach",
      "Escalate to phone-call recommendation after 3 unanswered SMS",
      "Stop entirely when client says 'stop' or unsubscribes",
    ],
    limitations: [
      "Won't send anything without your approval (drafts tier)",
      "Caps at one nudge per channel per 72 hours",
      "Stops automatically on negative sentiment or stop-words",
    ],
    recentActivity: [
      { what: "Scheduled Q1 reminders for 38 clients (sends Mar 1)", when: "5m ago" },
      { what: "Followed up with DeShawn Williams · 11 days silent", when: "1h ago" },
      { what: "Paused all nudges to Karen O'Brien ('on vacation' detected)", when: "yesterday" },
      { what: "Sent signature follow-up to James & Sofia Rodriguez", when: "yesterday" },
      { what: "Escalated Vladimir Petrov to call (no portal logins in 14d)", when: "2 days ago" },
    ],
  },
];

interface UserAutomation {
  id: string;
  when: string;
  then: string;
  triggerType: "event" | "schedule";
  category: string;
  tier: TrustTier;
  active: boolean;
  runCount: number;
  lastFired: string;
}

const USER_AUTOMATIONS: UserAutomation[] = [
  {
    id: "u1",
    when: "A client uploads their last document",
    then: "Draft an engagement letter for ERO signing",
    triggerType: "event",
    category: "Workflow",
    tier: "drafts",
    active: true,
    runCount: 12,
    lastFired: "2 hours ago",
  },
  {
    id: "u2",
    when: "March 1, every year",
    then: "Send Q1 estimated-payment reminders to all 1099 clients",
    triggerType: "schedule",
    category: "Client outreach",
    tier: "drafts",
    active: true,
    runCount: 38,
    lastFired: "Mar 1, 9:00 AM",
  },
  {
    id: "u3",
    when: "A 1099-K appears without a Schedule C",
    then: "Flag the return for review",
    triggerType: "event",
    category: "Compliance",
    tier: "asks",
    active: true,
    runCount: 4,
    lastFired: "Yesterday",
  },
  {
    id: "u4",
    when: "A bank transaction over $1,000 matches a prior pattern",
    then: "Auto-categorize it",
    triggerType: "event",
    category: "Bookkeeping",
    tier: "auto",
    active: true,
    runCount: 287,
    lastFired: "12 min ago",
  },
  {
    id: "u5",
    when: "A client replies “on vacation” or “out of office”",
    then: "Pause all nudges to that client",
    triggerType: "event",
    category: "Client outreach",
    tier: "auto",
    active: true,
    runCount: 6,
    lastFired: "Last week",
  },
  {
    id: "u6",
    when: "Every Sunday night",
    then: "Generate a Monday-morning brief for the week",
    triggerType: "schedule",
    category: "Practice",
    tier: "auto",
    active: false,
    runCount: 14,
    lastFired: "3 weeks ago",
  },
];

const SUGGESTED_PROMPTS = [
  "Remind clients with unpaid invoices weekly",
  "Flag returns with audit risk above 25%",
  "Draft a thank-you after every filed return",
];

interface Recipe {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const RECIPES: Recipe[] = [
  {
    id: "r1",
    title: "ERC defense pre-build",
    category: "Compliance",
    icon: ZapIcon,
    description: "When IRS announces an enforcement focus, auto-build defense packages for any client whose returns match the criteria.",
  },
  {
    id: "r2",
    title: "Q-estimate reminder cycle",
    category: "Client outreach",
    icon: ClockIcon,
    description: "Send personalized Q1/Q2/Q3/Q4 estimated payment reminders to applicable 1099 clients, two weeks before deadline.",
  },
  {
    id: "r3",
    title: "Engagement letter on signature",
    category: "Workflow",
    icon: MailIcon,
    description: "When a client signs Form 8879, automatically send the engagement-letter renewal for next year.",
  },
  {
    id: "r4",
    title: "Pre-call brief generator",
    category: "Meeting prep",
    icon: SparklesIcon,
    description: "30 minutes before every client meeting, generate a pre-call brief covering prior touchpoints, open issues, and recent activity.",
  },
  {
    id: "r5",
    title: "Margin alert",
    category: "Practice intelligence",
    icon: BellIcon,
    description: "When a client's effective hourly rate drops below your threshold, surface a price-increase template for your review.",
  },
  {
    id: "r6",
    title: "1099 reconciliation",
    category: "Compliance",
    icon: FilterIcon,
    description: "On Feb 1, scan every client's prior returns for 1099-NEC issuance gaps and pre-draft the missing 1099s.",
  },
];
