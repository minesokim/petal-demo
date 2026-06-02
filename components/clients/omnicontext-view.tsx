"use client";

import { useState } from "react";
import {
  ArrowRightIcon,
  BrainIcon,
  CalendarIcon,
  FileTextIcon,
  MailIcon,
  MessageSquareIcon,
  PhoneIcon,
  SearchIcon,
  SparklesIcon,
  TagIcon,
  UserIcon,
  VideoIcon,
} from "lucide-react";
import { Plus, Pen, ClipboardList, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PetalMark } from "@/components/petal-mark";
import { cn } from "@/lib/utils";
import { type Client } from "@/lib/mock-data";
import { IntakeView } from "@/components/clients/intake-view";
import { getClientNotes, type ClientNote } from "@/lib/documents-mock-data";

/**
 * OmniContext — the universal memory layer for a client.
 *
 * Pattern inspired by Ping: continuous capture of every interaction
 * (email, SMS, call, meeting, doc, AI analysis) into one searchable record
 * per client. Auto-extracts structured facts, surfaces "what I know" on
 * demand, and never forgets.
 *
 * Two sections:
 *   1. What I know — auto-extracted structured facts with source attribution
 *   2. Memory timeline — chronological stream of every interaction
 *
 * Lives as a "Memory" tab on the Client Detail (dialog + full page).
 */

interface OmniContextViewProps {
  client: Client;
  variant?: "popup" | "full";
}

export function OmniContextView({ client, variant = "popup" }: OmniContextViewProps) {
  const [query, setQuery] = useState("");
  const firstName = client.fullName.split(" ")[0];

  const facts = buildFactsForClient(client);

  return (
    <div
      className={cn(
        "space-y-6",
        variant === "popup" && "max-h-[calc(90vh-220px)] overflow-y-auto px-1"
      )}
    >
      {/* ── Header — branded OmniContext + ask-Petal-about-this-client ── */}
      <div className="rounded-xl border border-foreground/15 bg-card p-5">
        <div className="mb-3 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
          <BrainIcon className="size-3 text-foreground/60" />
          OmniContext · {firstName}
        </div>
        <h2 className="font-display text-[20px] font-medium leading-tight tracking-tight mb-2">
          Everything I know about {firstName}
        </h2>
        <p className="text-[13px] leading-relaxed text-foreground/80 mb-4">
          I continuously index every email, SMS, call transcript, video meeting, document, prior return, and AI analysis on
          this client. Ask me anything — I&apos;ll cite the source.
        </p>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask me about ${firstName} — "What did we discuss in March?" · "Has she mentioned crypto?"`}
            className="pl-9 bg-background"
          />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted-foreground">
          <span>Try:</span>
          {[
            "What changed since last year?",
            "Any open promises I made?",
            "Show me her income trajectory",
          ].map((p) => (
            <button
              key={p}
              onClick={() => setQuery(p)}
              className="rounded border border-border/60 bg-background px-1.5 py-0.5 text-[10px] text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ── What I know — auto-extracted facts ── */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
            What I know · {facts.length} facts
          </h3>
          <span className="text-[11px] text-muted-foreground">Auto-extracted · last sweep 4m ago</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {facts.map((fact) => (
            <FactCard key={fact.label} fact={fact} />
          ))}
        </div>
      </section>

      {/* ── Intake — the client's questionnaire responses ── */}
      <section>
        <div className="mb-3 flex items-center gap-1.5">
          <ClipboardList className="size-3 text-foreground/55" />
          <h3 className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
            Intake
          </h3>
        </div>
        <IntakeView clientId={client.id} clientFullName={client.fullName} variant="popup" />
      </section>

      {/* ── Notes — preparer's private notes ── */}
      <section>
        <div className="mb-3 flex items-center gap-1.5">
          <StickyNote className="size-3 text-foreground/55" />
          <h3 className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
            Notes
          </h3>
        </div>
        <MemoryNotes client={client} />
      </section>

      {/* ── Footer hint ── */}
      <div className="border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        Memory retained for 7 years per WISP · client may request export anytime
      </div>
    </div>
  );
}

// ── Notes block — read + add preparer notes (session-local for the demo) ──
export function MemoryNotes({ client }: { client: Client }) {
  const [notes, setNotes] = useState<ClientNote[]>(() => getClientNotes(client.id));
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const addNote = () => {
    if (!draft.trim()) return;
    const now = new Date().toISOString();
    setNotes((prev) => [
      { id: `note-${Date.now()}`, clientId: client.id, content: draft.trim(), createdAt: now, updatedAt: now },
      ...prev,
    ]);
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      {adding ? (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder={`Private note about ${client.fullName.split(" ")[0]}…`}
            className="text-[13px]"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-[11px]" onClick={addNote} disabled={!draft.trim()}>
              Save note
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-[11px]"
          onClick={() => setAdding(true)}
        >
          <Plus className="size-3" /> Add note
        </Button>
      )}

      {notes.length === 0 ? (
        <p className="py-3 text-center text-[12px] text-muted-foreground">No notes yet.</p>
      ) : (
        notes.map((note) => (
          <div key={note.id} className="rounded-lg border bg-card p-3">
            <p className="text-[13px] leading-relaxed text-foreground/90">{note.content}</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
              <Pen className="size-2.5" />
              {note.id.startsWith("seed-")
                ? "From intake"
                : new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Fact card
// ─────────────────────────────────────────────────────────────────────────

interface Fact {
  label: string;
  value: string;
  source: string;
  sourceDate: string;
  confidence: "high" | "medium" | "low";
}

export function FactCard({ fact }: { fact: Fact }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/55">
          {fact.label}
        </span>
        {fact.confidence !== "high" && (
          <span
            className={cn(
              "text-[10px] tabular-nums",
              fact.confidence === "medium" ? "text-amber-600" : "text-red-600"
            )}
          >
            {fact.confidence}
          </span>
        )}
      </div>
      <div className="mt-1 text-[13px] font-medium text-foreground/90">{fact.value}</div>
      <div className="mt-1.5 flex items-center gap-1 text-[10.5px] text-muted-foreground">
        <TagIcon className="size-2.5" />
        <span>{fact.source}</span>
        <span className="text-muted-foreground/40">·</span>
        <span className="tabular-nums">{fact.sourceDate}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────────────────────────────────

type EventKind = "email" | "sms" | "call" | "video" | "doc" | "ai" | "note";

interface TimelineEvent {
  kind: EventKind;
  title: string;
  preview?: string;
  time: string;
  agent?: string;
}

interface TimelineGroup {
  label: string;
  events: TimelineEvent[];
}

const KIND_ICONS: Record<EventKind, React.ComponentType<{ className?: string }>> = {
  email: MailIcon,
  sms: MessageSquareIcon,
  call: PhoneIcon,
  video: VideoIcon,
  doc: FileTextIcon,
  ai: SparklesIcon,
  note: UserIcon,
};

const KIND_LABELS: Record<EventKind, string> = {
  email: "Email",
  sms: "SMS",
  call: "Call",
  video: "Meeting",
  doc: "Document",
  ai: "AI action",
  note: "Note",
};

function TimelineGroup({ group }: { group: TimelineGroup }) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
        {group.label}
      </div>
      <ul className="space-y-1 rounded-lg border bg-card p-1">
        {group.events.map((e, i) => {
          const Icon = KIND_ICONS[e.kind];
          return (
            <li
              key={i}
              className="group flex items-start gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-muted/40"
            >
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded bg-foreground/[0.04]">
                <Icon className="size-3.5 text-muted-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 text-[12.5px]">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-foreground/55">
                    {KIND_LABELS[e.kind]}
                  </span>
                  {e.agent && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="font-mono text-[10px] text-foreground/55">{e.agent}</span>
                    </>
                  )}
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-[10.5px] tabular-nums text-muted-foreground">{e.time}</span>
                </div>
                <div className="mt-0.5 text-[12.5px] text-foreground/85">{e.title}</div>
                {e.preview && (
                  <div className="mt-0.5 line-clamp-1 text-[11.5px] italic text-muted-foreground">
                    &ldquo;{e.preview}&rdquo;
                  </div>
                )}
              </div>
              <ArrowRightIcon className="mt-1.5 size-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-foreground" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Data builders (mock — derived from client data + synthetic events)
// ─────────────────────────────────────────────────────────────────────────

export function buildFactsForClient(client: Client): Fact[] {
  const facts: Fact[] = [];

  // Filing status
  const filingLabel = {
    single: "Single",
    mfj: "Married Filing Jointly",
    mfs: "Married Filing Separately",
    hoh: "Head of Household",
    qw: "Qualifying Widow(er)",
  }[client.filingStatus] ?? client.filingStatus;
  facts.push({
    label: "Filing status",
    value: filingLabel,
    source: "Intake form",
    sourceDate: "Jan 18, 2026",
    confidence: "high",
  });

  // Client type
  facts.push({
    label: "Client type",
    value: client.type === "business" ? `Business${client.businessName ? ` · ${client.businessName}` : ""}` : "Individual",
    source: "Intake response",
    sourceDate: "Jan 18, 2026",
    confidence: "high",
  });

  // Service tier
  facts.push({
    label: "Service tier",
    value: `${client.serviceTier} · $${client.feeAmount}`,
    source: "Engagement letter",
    sourceDate: client.depositPaid ? "Signed Jan 22" : "Pending signature",
    confidence: "high",
  });

  // Income sources (synthesized)
  const incomeStr = client.type === "business"
    ? "Business income · K-1 distributions"
    : client.serviceTier === "Basic"
    ? "W-2"
    : "W-2 + 1099-NEC + investment income";
  facts.push({
    label: "Income sources",
    value: incomeStr,
    source: "Prior return + intake",
    sourceDate: "Confirmed Mar 14",
    confidence: "high",
  });

  // Dependents (synthesized based on filing status)
  facts.push({
    label: "Dependents",
    value: client.filingStatus === "hoh" || client.filingStatus === "mfj" ? "2 children" : "None",
    source: "Intake form",
    sourceDate: "Jan 18, 2026",
    confidence: "high",
  });

  // Prior year refund/balance (synthesized)
  const refund = Math.round((client.feeAmount + 200) * 3.2);
  facts.push({
    label: "Prior year (2024)",
    value: `Refund $${refund.toLocaleString()}`,
    source: "Prior return",
    sourceDate: "Filed Mar 28, 2025",
    confidence: "high",
  });

  // Documents
  facts.push({
    label: "Document progress",
    value: `${client.documentsSubmitted} of ${client.documentsRequired} received`,
    source: "Portal log",
    sourceDate: client.lastPortalLogin ? new Date(client.lastPortalLogin).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No activity",
    confidence: "high",
  });

  // Communication preference (synthesized)
  facts.push({
    label: "Preferred channel",
    value: client.type === "business" ? "Email" : "SMS",
    source: "Behavior pattern (last 6 months)",
    sourceDate: "Inferred",
    confidence: "medium",
  });

  // Notable life event (synthesized for some clients)
  if (client.notes && client.notes.length > 0) {
    facts.push({
      label: "Recent context",
      value: client.notes.length > 80 ? client.notes.slice(0, 80) + "…" : client.notes,
      source: "Preparer notes",
      sourceDate: "Updated this season",
      confidence: "high",
    });
  }

  // Referral source (synthesized for some)
  if (client.id === "c7" || client.id === "c15" || client.id === "c20") {
    facts.push({
      label: "Referral source",
      value: client.id === "c20" ? "Elena Mendez (existing client)" : "Existing-client network",
      source: "Intake form",
      sourceDate: "Jan 18, 2026",
      confidence: "high",
    });
  }

  return facts;
}

function buildTimelineForClient(client: Client): TimelineGroup[] {
  const firstName = client.fullName.split(" ")[0];

  return [
    {
      label: "Today",
      events: [
        {
          kind: "email",
          title: `${firstName} replied to your nudge`,
          preview: "Thanks for the reminder — I'll get the 1099 to you by Friday",
          time: "9:41 AM",
        },
        {
          kind: "ai",
          title: `discovery-agent flagged a §199A opportunity`,
          preview: "Income is well below threshold · estimated benefit $10,800",
          time: "8:14 AM",
          agent: "discovery-agent",
        },
      ],
    },
    {
      label: "Yesterday",
      events: [
        {
          kind: "doc",
          title: `TikTok_1099-NEC_2024.pdf uploaded`,
          time: "4:22 PM",
        },
        {
          kind: "sms",
          title: `${firstName} confirmed phone number`,
          preview: "Yes that's still my number, thanks!",
          time: "11:08 AM",
        },
        {
          kind: "ai",
          title: `triage-classifier surfaced 1099 mismatch`,
          preview: "Reported $4,320 but intake showed $2,300 · drafted clarification reply",
          time: "10:46 AM",
          agent: "triage-classifier",
        },
      ],
    },
    {
      label: "This week",
      events: [
        {
          kind: "call",
          title: `12-min call · discussed Q4 estimates`,
          preview: "She's worried about owing for the side hustle — I walked through safe-harbor numbers",
          time: "Tue 2:14 PM",
        },
        {
          kind: "email",
          title: `Engagement letter sent for countersignature`,
          time: "Mon 9:00 AM",
        },
        {
          kind: "ai",
          title: `memory-curator extracted "started TikTok partnership"`,
          preview: "From Mar 11 email · added to OmniContext",
          time: "Mon 8:32 AM",
          agent: "memory-curator",
        },
      ],
    },
    {
      label: "This month",
      events: [
        {
          kind: "video",
          title: `30-min intro call · Zoom transcript indexed`,
          preview: "Walked through prep process, fees, timeline. She's a first-year client.",
          time: "Mar 3",
        },
        {
          kind: "doc",
          title: `W-2 (Day job) · ID document · Bank statements (Q1) uploaded`,
          time: "Mar 1",
        },
        {
          kind: "note",
          title: `Preparer note: ${client.notes ?? "Add notes here"}`,
          time: "Feb 28",
        },
      ],
    },
  ];
}
