"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  ArrowRightIcon,
  BarChart3Icon,
  CalendarIcon,
  FileTextIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  MailIcon,
  MessageSquareIcon,
  PhoneIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { PetalMark } from "@/components/petal-mark";
import { clients } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast-notification";

/**
 * Petal command palette — the OS substrate move for "compose-first navigation."
 *
 * Cmd+K (or Ctrl+K on Windows) opens a Raycast-style overlay. Antonio types
 * what he wants and four buckets of results appear:
 *
 *   - Navigate  — jump to any page or any client
 *   - Compose   — draft a reply / extension / nudge for a client
 *   - Query     — ask Petal a practice-level question
 *   - Recents   — the last few things you did
 *
 * This shifts the primary action surface from sidebar-click to type-to-do.
 * Sidebar nav becomes the fallback for newer users.
 */

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  run: () => void;
};

export function PetalCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  // Cmd+K / Ctrl+K binding
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );
  const stub = useCallback(
    (label: string) => {
      close();
      showToast("success", label, "Coming soon");
    },
    [close, showToast]
  );

  // ─── Navigate actions ─────────────────────────────────────────────────
  const navActions: Action[] = [
    { id: "nav-overview",  label: "Overview",         icon: HomeIcon,          run: () => go("/dashboard/default") },
    { id: "nav-triage",    label: "Triage",           icon: InboxIcon,         hint: "14 pending", run: () => go("/dashboard/triage") },
    { id: "nav-clients",   label: "Clients",          icon: UsersIcon,         run: () => go("/dashboard/clients") },
    { id: "nav-calendar",  label: "Calendar",         icon: CalendarIcon,      run: () => go("/dashboard/apps/calendar") },
    { id: "nav-messages",  label: "Messages",         icon: MessageSquareIcon, hint: "4 unread", run: () => go("/dashboard/apps/chat") },
    { id: "nav-documents", label: "Documents",        icon: FolderIcon,        run: () => go("/dashboard/documents") },
    { id: "nav-analytics", label: "Analytics",        icon: BarChart3Icon,     run: () => go("/dashboard/analytics") },
    { id: "nav-settings",  label: "Settings",         icon: SettingsIcon,      run: () => go("/dashboard/pages/settings/profile") },
  ];

  // ─── Compose actions ──────────────────────────────────────────────────
  const composeActions: Action[] = [
    { id: "compose-reply",       label: "Draft reply to a client",         icon: MailIcon,        run: () => stub("Drafting reply") },
    { id: "compose-nudge",       label: "Send doc-collection nudge",       icon: MailIcon,        run: () => stub("Nudge drafted") },
    { id: "compose-extension",   label: "File Form 4868 extension",        icon: FileTextIcon,    run: () => stub("Extension drafted") },
    { id: "compose-engagement",  label: "Draft engagement letter",         icon: FileTextIcon,    run: () => stub("Engagement letter drafted") },
    { id: "compose-call",        label: "Schedule a client call",          icon: PhoneIcon,       run: () => stub("Scheduling call") },
    { id: "compose-meeting-brief", label: "Generate pre-meeting brief",    icon: FileTextIcon,    run: () => stub("Brief drafted") },
    { id: "compose-defense",     label: "Build audit defense package",     icon: ShieldCheckIcon, run: () => stub("Building defense package") },
  ];

  // ─── Query actions ────────────────────────────────────────────────────
  const queryActions: Action[] = [
    { id: "query-pace",          label: "How's my season pace?",            icon: SearchIcon, run: () => stub("Asking Petal") },
    { id: "query-unpaid",        label: "Who hasn't paid this month?",      icon: SearchIcon, run: () => stub("Asking Petal") },
    { id: "query-stuck",         label: "Who's stuck collecting docs?",     icon: SearchIcon, run: () => stub("Asking Petal") },
    { id: "query-margin",        label: "What's my margin per client?",     icon: SearchIcon, run: () => stub("Asking Petal") },
    { id: "query-overdue",       label: "Which returns are overdue?",       icon: SearchIcon, run: () => stub("Asking Petal") },
    { id: "query-q1-revenue",    label: "What's my Q1 revenue?",            icon: SearchIcon, run: () => stub("Asking Petal") },
    { id: "query-audit-risk",    label: "Which returns have audit risk?",   icon: SearchIcon, run: () => stub("Asking Petal") },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="max-w-2xl">
      <CommandInput placeholder="Type a command or search…  (try 'draft reply' or 'who hasn't paid')" />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>
          <div className="py-6 text-center">
            <PetalMark className="mx-auto size-6 text-foreground/40" />
            <div className="mt-2 text-[13px] text-muted-foreground">No matches. I can still help — try asking a question.</div>
          </div>
        </CommandEmpty>

        {/* ── Navigate ─────────────────────────────────────────────── */}
        <CommandGroup heading="Navigate">
          {navActions.map((a) => (
            <CommandItem key={a.id} value={`navigate ${a.label}`} onSelect={a.run}>
              <a.icon className="size-4 text-muted-foreground" />
              <span>{a.label}</span>
              {a.hint && <span className="ml-auto text-[10.5px] tabular-nums text-muted-foreground">{a.hint}</span>}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* ── Compose / take action ────────────────────────────────── */}
        <CommandGroup heading="Compose">
          {composeActions.map((a) => (
            <CommandItem key={a.id} value={`compose ${a.label}`} onSelect={a.run}>
              <a.icon className="size-4 text-muted-foreground" />
              <span>{a.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* ── Query Petal ──────────────────────────────────────────── */}
        <CommandGroup heading="Ask Petal">
          {queryActions.map((a) => (
            <CommandItem key={a.id} value={`ask ${a.label}`} onSelect={a.run}>
              <a.icon className="size-4 text-muted-foreground" />
              <span className="text-foreground/80">{a.label}</span>
              <PetalMark className="ml-auto size-3 text-foreground/40" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* ── Jump to a specific client (slice the roster) ─────────── */}
        <CommandGroup heading="Clients">
          {clients.slice(0, 12).map((c) => (
            <CommandItem
              key={c.id}
              value={`client ${c.fullName} ${c.businessName ?? ""}`}
              onSelect={() => go(`/dashboard/clients/${c.id}/overview`)}
            >
              <UsersIcon className="size-4 text-muted-foreground" />
              <span>{c.fullName}</span>
              {c.businessName && (
                <span className="text-[11px] text-muted-foreground">· {c.businessName}</span>
              )}
              <ArrowRightIcon className="ml-auto size-3 text-muted-foreground/40" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      {/* Footer with keyboard hints */}
      <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-[10.5px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            <kbd className="rounded border border-border/60 bg-background px-1 py-px font-mono text-[9.5px]">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="rounded border border-border/60 bg-background px-1 py-px font-mono text-[9.5px]">↵</kbd> select
          </span>
          <span>
            <kbd className="rounded border border-border/60 bg-background px-1 py-px font-mono text-[9.5px]">esc</kbd> close
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <PetalMark className="size-3 text-foreground/50" />
          <span>Petal</span>
        </div>
      </div>
    </CommandDialog>
  );
}
