"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, MoreHorizontal } from "lucide-react";
import { clients, stageLabels } from "@/lib/mock-data";
import { getClientDocuments } from "@/lib/documents-mock-data";

export default function ClientDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const clientId = params.id as string;
  const client = clients.find(c => c.id === clientId);

  if (!client) {
    return <div className="py-20 text-center text-muted-foreground">Client not found</div>;
  }

  const docCount = getClientDocuments(clientId).length;

  const tabs = [
    { label: "Overview", href: `/dashboard/clients/${clientId}/overview` },
    { label: `Documents`, href: `/dashboard/clients/${clientId}/documents`, badge: docCount },
    { label: "Messages", href: `/dashboard/clients/${clientId}/messages` },
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
              <h1 className="text-xl font-bold">{client.fullName}</h1>
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
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0 border-b">
        {tabs.map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.href
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="text-muted-foreground ml-1.5 text-xs">{tab.badge}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-6">
        {children}
      </div>
    </div>
  );
}
