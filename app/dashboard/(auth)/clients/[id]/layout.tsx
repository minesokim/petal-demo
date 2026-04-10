"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Building2, MoreHorizontal, Mail, Phone, FileText, Download, Trash2, UserX, ClipboardList } from "lucide-react";
import { clients, stageLabels } from "@/lib/mock-data";
import { getClientDocuments } from "@/lib/documents-mock-data";
import { useAIPanel } from "@/components/ai-panel";

export default function ClientDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const clientId = params.id as string;
  const client = clients.find(c => c.id === clientId);
  const { setClientContext } = useAIPanel();

  // Set AI panel client context when viewing this client
  useEffect(() => {
    if (client) {
      setClientContext({ clientId: client.id, clientName: client.fullName });
    }
    // Clear context when leaving client pages
    return () => {
      setClientContext(null);
    };
  }, [client?.id, client?.fullName, setClientContext]);

  if (!client) {
    return <div className="py-20 text-center text-muted-foreground">Client not found</div>;
  }

  const docCount = getClientDocuments(clientId).length;

  const tabs = [
    { label: "Overview", href: `/dashboard/clients/${clientId}/overview` },
    { label: "Intake", href: `/dashboard/clients/${clientId}/intake` },
    { label: `Documents`, href: `/dashboard/clients/${clientId}/documents`, badge: docCount },
    { label: "Messages", href: `/dashboard/clients/${clientId}/messages` },
    { label: "Activity", href: `/dashboard/clients/${clientId}/activity` },
    { label: "Notes", href: `/dashboard/clients/${clientId}/notes` },
  ];

  const activeTab = tabs.find(t => pathname.startsWith(t.href))?.href || tabs[0].href;

  return (
    <div className="space-y-0">
      {/* Back link */}
      <Link href="/dashboard/clients" className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors">
        <ArrowLeft className="size-3.5" /> Back to clients
      </Link>

      {/* Client header */}
      <div className="flex items-start justify-between py-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-14">
            <AvatarImage src={client.avatar} alt={client.fullName} />
            <AvatarFallback className="text-lg">{client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display">{client.fullName}</h1>
              {client.type === "business" && <Building2 className="size-4 text-muted-foreground" />}
            </div>
            <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-sm">
              {client.businessName && <span>{client.businessName}</span>}
              {client.businessName && <span>&middot;</span>}
              <span>{stageLabels[client.returnStage]}</span>
              <span>&middot;</span>
              <span>Client since 2025</span>
            </div>
            <div className="mt-2 flex gap-2">
              <Badge>{stageLabels[client.returnStage]}</Badge>
              <Badge variant="outline">{client.serviceTier}</Badge>
              <Badge variant="outline">${client.feeAmount}</Badge>
              {client.urgency === "urgent" && <Badge variant="destructive">Urgent</Badge>}
              {client.urgency === "high" && <Badge className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">High Priority</Badge>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2" id="client-header-actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
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


      {/* Sub-tabs — sticky */}
      <LayoutGroup>
        <div className="sticky top-0 z-20 bg-background relative flex gap-0.5 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border">
          {tabs.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative z-10 rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {activeTab === tab.href && (
                <motion.span
                  layoutId="active-client-tab"
                  className="absolute inset-0 rounded-t-md bg-muted"
                  transition={{ type: "spring", stiffness: 250, damping: 28, mass: 0.9 }}
                />
              )}
              <span className="relative z-10">
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">{tab.badge}</span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </LayoutGroup>

      {/* Tab content — animated on route change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pt-6"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
