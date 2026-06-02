"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, MoreHorizontal, Mail, Phone, FileText, Download, UserX, ClipboardList, LayoutGrid, ShieldCheck, MessageSquare, BookOpen, StickyNote, Activity as ActivityIcon, PanelRightClose } from "lucide-react";
import { clients, stageLabels, stageChipStyles } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { AttentionChip, buildAttentionItems } from "@/components/insights";
import { getTrackingBadgesForClient } from "@/lib/insights-mock-data";
import { getClientDocuments } from "@/lib/documents-mock-data";
import { useAIPanel } from "@/components/ai-panel";
import { getUnreadCountForClient } from "@/lib/comms-mock-data";
import { UpcomingCallBanner } from "@/components/upcoming-call-banner";
import { PetalMark } from "@/components/petal-mark";
import { ClientAskPetal } from "@/components/client-ask-petal";
import { useToast } from "@/components/ui/toast-notification";
import { setPrepWorkspaceOpen } from "@/lib/prep-workspace-store";

export default function ClientDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const clientId = params.id as string;
  const client = clients.find(c => c.id === clientId);
  const { setClientContext } = useAIPanel();
  const { showToast } = useToast();
  const router = useRouter();
  const [petalOpen, setPetalOpen] = useState(false);

  // Set AI panel client context when viewing this client
  useEffect(() => {
    if (client) {
      setClientContext({ clientId: client.id, clientName: client.fullName });
    }
    return () => {
      setClientContext(null);
    };
  }, [client?.id, client?.fullName, setClientContext]);

  if (!client) {
    return <div className="py-20 text-center text-muted-foreground">Client not found</div>;
  }

  const docCount = getClientDocuments(clientId).length;
  const unreadMessages = getUnreadCountForClient(clientId);

  type Section = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: number; notification?: number };

  // 9 sections condensed to 5 primaries + a "More" overflow. Ask Petal is no
  // longer a section — it's a companion pane you summon beside any section.
  const primary: Section[] = [
    { label: "Overview", href: `/dashboard/clients/${clientId}/overview`, icon: LayoutGrid },
    { label: "Intake", href: `/dashboard/clients/${clientId}/intake`, icon: ClipboardList },
    { label: "Documents", href: `/dashboard/clients/${clientId}/documents`, icon: FileText, badge: docCount },
    { label: "Compliance", href: `/dashboard/clients/${clientId}/defense`, icon: ShieldCheck },
    { label: "Messages", href: `/dashboard/clients/${clientId}/messages`, icon: MessageSquare, notification: unreadMessages },
    { label: "Notes", href: `/dashboard/clients/${clientId}/notes`, icon: StickyNote },
  ];
  const more: Section[] = [
    { label: "Knowledge", href: `/dashboard/clients/${clientId}/context`, icon: BookOpen },
    { label: "Activity", href: `/dashboard/clients/${clientId}/activity`, icon: ActivityIcon },
  ];

  const allSections = [...primary, ...more];
  const activeHref = allSections.find(s => pathname.startsWith(s.href))?.href || primary[0].href;
  const moreActive = more.some(s => s.href === activeHref);

  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col">
      {/* ── COMMAND BAR — single slim row ── */}
      <div className="flex items-center gap-2.5 py-1.5">
        <Avatar className="size-7 shrink-0">
          <AvatarImage src={client.avatar} alt={client.fullName} />
          <AvatarFallback className="text-[10px]">{client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
        </Avatar>
        <h1 className="truncate text-[15px] font-semibold tracking-tight">{client.fullName}</h1>
        {client.type === "business" && <Building2 className="size-3.5 shrink-0 text-muted-foreground" />}
        <span className={cn("ml-1 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none", stageChipStyles[client.returnStage])}>
          {stageLabels[client.returnStage]}
        </span>
        <span className="hidden text-[12px] leading-none text-muted-foreground sm:inline">{client.serviceTier} · ${client.feeAmount}</span>
        <AttentionChip size="md" items={buildAttentionItems({ urgency: client.urgency, badges: getTrackingBadgesForClient(client.id) })} />

        <div className="ml-auto flex items-center gap-1.5" id="client-header-actions">
          {client.returnStage === "in_preparation" && (
            <Button
              className="h-7 gap-1.5 bg-blue-600 px-3 text-[11px] text-white hover:bg-blue-700"
              onClick={() => {
                setPrepWorkspaceOpen(true); // instant open via store; no navigation latency
                if (!pathname.endsWith("/overview")) router.push(`/dashboard/clients/${clientId}/overview`);
              }}
            >
              <ClipboardList className="size-3.5" />
              Prep Workspace
            </Button>
          )}
          <Button
            variant={petalOpen ? "secondary" : "outline"}
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-[11px]"
            onClick={() => setPetalOpen(v => !v)}
            aria-pressed={petalOpen}
          >
            <PetalMark className="size-3.5" />
            Ask Petal
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem><Mail className="mr-2 size-3.5" /> Send message</DropdownMenuItem>
              <DropdownMenuItem><Phone className="mr-2 size-3.5" /> Schedule call</DropdownMenuItem>
              <DropdownMenuItem><FileText className="mr-2 size-3.5" /> Request documents</DropdownMenuItem>
              <DropdownMenuItem><Download className="mr-2 size-3.5" /> Export client data</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive"><UserX className="mr-2 size-3.5" /> Archive client</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── SECTION NAV — condensed, underline indicator ── */}
      <LayoutGroup>
        <div className="relative flex items-center gap-0.5 overflow-x-auto mobile-scroll-tabs md:overflow-visible before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border">
          {primary.map(s => (
            <SectionTab key={s.href} section={s} active={activeHref === s.href} />
          ))}

          {/* More overflow — keeps Intake / Activity / Notes reachable without bloating the row */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "relative z-10 inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors",
                  moreActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                More
                <MoreHorizontal className="size-3.5" />
                {moreActive && (
                  <motion.span layoutId="active-client-tab" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-foreground" transition={{ type: "spring", stiffness: 320, damping: 30 }} />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {more.map(s => (
                <DropdownMenuItem key={s.href} asChild>
                  <Link href={s.href} className="cursor-pointer">
                    <s.icon className="mr-2 size-3.5" /> {s.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </LayoutGroup>

      {/* Sticky meeting banner — visible across every client section when a call is scheduled */}
      <div className="sticky top-0 z-20 -mx-4 bg-background/95 px-4 pt-3 backdrop-blur-md md:-mx-6 md:px-6 [&:has(>div:empty)]:hidden">
        <UpcomingCallBanner clientId={clientId} clientName={client.fullName} />
      </div>

      {/* ── WORKSPACE — primary pane + optional Ask Petal companion pane ── */}
      <div className="flex min-h-0 flex-1 gap-4 pt-3">
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {petalOpen && (
            <motion.aside
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 420 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="sticky top-3 hidden h-[calc(100vh-150px)] shrink-0 overflow-hidden lg:block"
            >
              <div className="flex h-full w-[420px] flex-col rounded-xl border border-border/70 bg-card">
                <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium">
                    <PetalMark className="size-3.5 text-foreground" />
                    Ask Petal
                  </div>
                  <Button variant="ghost" size="icon" className="size-6" onClick={() => setPetalOpen(false)} title="Close pane">
                    <PanelRightClose className="size-3.5" />
                  </Button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <ClientAskPetal
                    client={client}
                    compact
                    hideInsight
                    onInsightFlag={(title) => showToast("success", "Flagged for review", `${title} added to your flags`)}
                  />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SectionTab({ section, active }: { section: { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: number; notification?: number }; active: boolean }) {
  const Icon = section.icon;
  return (
    <Link
      href={section.href}
      className={cn(
        "relative z-10 inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-[13px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
      {section.label}
      {section.badge !== undefined && section.badge > 0 && (
        <span className="text-[11px] tabular-nums text-muted-foreground">{section.badge}</span>
      )}
      {section.notification !== undefined && section.notification > 0 && (
        <span
          className="flex size-[15px] items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold leading-none text-white tabular-nums"
          aria-label={`${section.notification} unread`}
        >
          {section.notification > 9 ? "9+" : section.notification}
        </span>
      )}
      {active && (
        <motion.span layoutId="active-client-tab" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-foreground" transition={{ type: "spring", stiffness: 320, damping: 30 }} />
      )}
    </Link>
  );
}
