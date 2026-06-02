"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  CheckCircle2Icon,
  CircleIcon,
  ExternalLinkIcon,
  PlusIcon,
  RadioIcon,
  SearchIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-notification";

// ─────────────────────────────────────────────────────────────────────────
// Apps page — the OS positioning made visible.
// Petal is the central hub; this page shows every tool that flows through.
// ─────────────────────────────────────────────────────────────────────────

type AppStatus = "connected" | "available" | "coming_soon";

interface ConnectedApp {
  id: string;
  name: string;
  category: AppCategory;
  status: AppStatus;
  description: string;
  /** Public-asset path to logo image, OR initials fallback */
  logo?: string;
  initials?: string;
  /** When connected: read+write, last-sync info */
  sync?: {
    direction: "read" | "write" | "read_write";
    lastSync: string;
    recordsToday?: string;
  };
  /** Whether Petal can do meaningful work without this app connected */
  recommended?: boolean;
}

type AppCategory =
  | "tax_software"
  | "bookkeeping"
  | "communication"
  | "payments"
  | "documents"
  | "ai_models"
  | "calendar";

const CATEGORY_LABELS: Record<AppCategory, string> = {
  tax_software: "Tax software",
  bookkeeping: "Bookkeeping",
  communication: "Communication",
  payments: "Payments",
  documents: "Documents + Signatures",
  ai_models: "AI models",
  calendar: "Calendar",
};

const APPS: ConnectedApp[] = [
  // ── Tax software ──────────────────────────────────────────────────
  {
    id: "olt",
    name: "OLT (OnLine Taxes)",
    category: "tax_software",
    status: "connected",
    description: "Tax preparation. No public API — Petal connects via secure session bridge.",
    initials: "OLT",
    sync: { direction: "read_write", lastSync: "2 min ago", recordsToday: "47 returns synced" },
    recommended: true,
  },
  {
    id: "drake",
    name: "Drake Tax",
    category: "tax_software",
    status: "available",
    description: "Drake Software integration for prep + e-file. Read-only sync in v1.",
    logo: "/integrations/drake.png",
  },
  {
    id: "taxdome",
    name: "TaxDome",
    category: "tax_software",
    status: "available",
    description: "Practice management + client portal. Bi-directional engagement sync.",
    logo: "/integrations/taxdome.png",
  },
  {
    id: "irs",
    name: "IRS Solutions",
    category: "tax_software",
    status: "available",
    description: "Tax resolution — 2848/8821, transcripts, OIC, IAN monitoring.",
    logo: "/integrations/irs.png",
  },
  {
    id: "taxact",
    name: "TaxAct Professional",
    category: "tax_software",
    status: "coming_soon",
    description: "Alternative prep software for small firms.",
    initials: "TA",
  },

  // ── Bookkeeping ──────────────────────────────────────────────────
  {
    id: "xero",
    name: "Xero",
    category: "bookkeeping",
    status: "connected",
    description: "Real-time books for client revenue, AR aging, margin calculations.",
    logo: "/integrations/xero.png",
    sync: { direction: "read_write", lastSync: "6 min ago", recordsToday: "142 transactions categorized" },
    recommended: true,
  },
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    category: "bookkeeping",
    status: "available",
    description: "QBO sync for clients on the Intuit stack.",
    logo: "/integrations/quickbooks.png",
  },

  // ── Communication ────────────────────────────────────────────────
  {
    id: "gmail",
    name: "Gmail",
    category: "communication",
    status: "connected",
    description: "Inbox unification + AI-drafted replies in your voice.",
    initials: "G",
    sync: { direction: "read_write", lastSync: "1 min ago", recordsToday: "84 emails indexed" },
    recommended: true,
  },
  {
    id: "twilio",
    name: "Twilio SMS",
    category: "communication",
    status: "connected",
    description: "Outbound SMS reminders + transactional notifications.",
    initials: "T",
    sync: { direction: "write", lastSync: "12 min ago", recordsToday: "23 messages sent" },
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "communication",
    status: "available",
    description: "Auto-record + transcribe client calls into OmniContext memory.",
    initials: "Z",
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    status: "available",
    description: "Internal team coordination + Petal-channel notifications.",
    initials: "S",
  },

  // ── Payments ─────────────────────────────────────────────────────
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    status: "connected",
    description: "Card payments + Stripe Identity KYC for 8879 e-signing.",
    initials: "S",
    sync: { direction: "read_write", lastSync: "4 min ago", recordsToday: "$2,840 processed" },
  },
  {
    id: "plaid",
    name: "Plaid",
    category: "payments",
    status: "available",
    description: "Bank-account linking for client statement ingestion.",
    logo: "/integrations/plaid.png",
  },

  // ── Documents + Signatures ───────────────────────────────────────
  {
    id: "docusign",
    name: "DocuSign",
    category: "documents",
    status: "connected",
    description: "E-signature flow for Form 8879, engagement letters, 2848 POA.",
    logo: "/integrations/docusign.png",
    sync: { direction: "read_write", lastSync: "18 min ago", recordsToday: "6 envelopes sent" },
  },
  {
    id: "gdrive",
    name: "Google Drive",
    category: "documents",
    status: "available",
    description: "Document storage sync. Pull supporting docs into client folders.",
    initials: "GD",
  },

  // ── Calendar ─────────────────────────────────────────────────────
  {
    id: "google_calendar",
    name: "Google Calendar",
    category: "calendar",
    status: "connected",
    description: "Client meetings + Petal-generated pre-call briefs.",
    initials: "GC",
    sync: { direction: "read_write", lastSync: "9 min ago" },
  },
  {
    id: "outlook",
    name: "Outlook Calendar",
    category: "calendar",
    status: "available",
    description: "Microsoft 365 calendar sync.",
    initials: "O",
  },

  // ── AI models ────────────────────────────────────────────────────
  {
    id: "anthropic",
    name: "Anthropic Claude",
    category: "ai_models",
    status: "connected",
    description: "Primary reasoning model. Powers triage-classifier + inbox-drafter + discovery-agent.",
    initials: "A",
    sync: { direction: "read_write", lastSync: "Just now", recordsToday: "247 calls · $0.42 spend" },
    recommended: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    category: "ai_models",
    status: "available",
    description: "Fallback model + specialized tasks (vision, embeddings).",
    initials: "O",
  },
];

const CATEGORY_ORDER: AppCategory[] = [
  "tax_software",
  "bookkeeping",
  "communication",
  "documents",
  "payments",
  "calendar",
  "ai_models",
];

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────

export default function AppsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppStatus | "all">("all");
  const { showToast } = useToast();

  const filtered = useMemo(() => {
    return APPS.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, statusFilter]);

  const grouped = useMemo(() => {
    const byCategory = new Map<AppCategory, ConnectedApp[]>();
    for (const cat of CATEGORY_ORDER) byCategory.set(cat, []);
    for (const app of filtered) {
      byCategory.get(app.category)?.push(app);
    }
    return byCategory;
  }, [filtered]);

  const connectedCount = APPS.filter((a) => a.status === "connected").length;
  const availableCount = APPS.filter((a) => a.status === "available").length;
  const comingSoonCount = APPS.filter((a) => a.status === "coming_soon").length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight md:text-4xl">Apps</h1>
          <p className="mt-1.5 text-[13px] text-muted-foreground">
            <span className="font-medium text-foreground/80 tabular-nums">{connectedCount}</span> connected
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="tabular-nums">{availableCount}</span> available
            <span className="mx-1.5 text-muted-foreground/40">·</span>
            <span className="tabular-nums">{comingSoonCount}</span> coming soon
          </p>
        </div>
        <Button
          size="sm"
          className="bg-foreground text-background hover:bg-foreground/90"
          onClick={() => showToast("success", "Request integration", "Coming soon")}
        >
          <PlusIcon className="size-3.5" /> Request integration
        </Button>
      </div>

      {/* ── Search + filter ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-md flex-1">
          <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search integrations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
        <div className="inline-flex items-center rounded-lg border border-border/60 bg-muted/50 p-1">
          {(["all", "connected", "available", "coming_soon"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12px] font-medium transition-all",
                statusFilter === s
                  ? "bg-background text-foreground shadow-sm ring-1 ring-foreground/[0.06]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "All" : s === "coming_soon" ? "Coming soon" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grouped grids ── */}
      <div className="space-y-8">
        {CATEGORY_ORDER.map((cat) => {
          const apps = grouped.get(cat) ?? [];
          if (apps.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {apps.map((app) => (
                  <AppCard key={app.id} app={app} onClick={() => showToast("success", app.name, app.status === "connected" ? "Opening details" : "Coming soon")} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
        <span>I&apos;m the bridge between every tool in your stack — even when the work happens elsewhere.</span>
        <span>{APPS.length} integrations · last refresh just now</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────────────────

function AppCard({ app, onClick }: { app: ConnectedApp; onClick: () => void }) {
  const statusStyles = {
    connected: { dot: "bg-emerald-500", label: "Connected", text: "text-emerald-700 dark:text-emerald-400" },
    available: { dot: "bg-muted-foreground/40", label: "Available", text: "text-muted-foreground" },
    coming_soon: { dot: "bg-amber-500", label: "Coming soon", text: "text-amber-700 dark:text-amber-400" },
  }[app.status];

  return (
    <button
      onClick={onClick}
      className="group flex h-full flex-col gap-3 rounded-lg border bg-card p-4 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {/* Logo */}
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] overflow-hidden">
          {app.logo ? (
            <Image src={app.logo} alt={app.name} width={32} height={32} className="size-8 object-contain" />
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/65">{app.initials}</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="truncate text-[13.5px] font-semibold">{app.name}</span>
            {app.recommended && (
              <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50/40 px-1.5 py-px text-[9.5px] font-medium uppercase tracking-wider text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                Recommended
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", statusStyles.dot)} />
            <span className={cn("text-[10.5px] font-medium uppercase tracking-wider", statusStyles.text)}>
              {statusStyles.label}
            </span>
            {app.sync && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-[10.5px] text-muted-foreground">{app.sync.lastSync}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="line-clamp-2 text-[12px] leading-relaxed text-foreground/75">{app.description}</p>

      {/* Sync stats — only when connected */}
      {app.sync && (
        <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-2.5 text-[10.5px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <RadioIcon className="size-3" />
            <span>
              {app.sync.direction === "read" && "Read-only"}
              {app.sync.direction === "write" && "Write-only"}
              {app.sync.direction === "read_write" && "Read + write"}
            </span>
          </div>
          {app.sync.recordsToday && (
            <span className="text-muted-foreground">{app.sync.recordsToday}</span>
          )}
        </div>
      )}

      {/* Available CTA */}
      {app.status === "available" && (
        <div className="mt-auto flex items-center gap-1 border-t border-border/40 pt-2.5 text-[11px] font-medium text-foreground/70 group-hover:text-foreground">
          <PlusIcon className="size-3" /> Connect
        </div>
      )}

      {/* Coming soon */}
      {app.status === "coming_soon" && (
        <div className="mt-auto flex items-center gap-1 border-t border-border/40 pt-2.5 text-[11px] text-muted-foreground/70">
          <CircleIcon className="size-3" /> Notify me
        </div>
      )}
    </button>
  );
}
