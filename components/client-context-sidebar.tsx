"use client";

import { Mail, Phone, Calendar, FileText, DollarSign, Building2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { stageLabels } from "@/lib/mock-data";
import { getClientDocuments } from "@/lib/documents-mock-data";
import type { Client } from "@/lib/mock-data";

const filingStatusLabels: Record<string, string> = {
  single: "Single",
  mfj: "Married Filing Jointly",
  mfs: "Married Filing Separately",
  hoh: "Head of Household",
  qw: "Qualifying Widow(er)",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] text-foreground">{value}</span>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      </div>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  );
}

export function ClientContextSidebar({ client }: { client: Client }) {
  const docs = getClientDocuments(client.id);
  const docPercent = client.documentsRequired > 0
    ? Math.round((client.documentsSubmitted / client.documentsRequired) * 100)
    : 0;

  return (
    <div className="h-full overflow-y-auto px-5 py-4 [scrollbar-width:thin]">
      {/* Top status block */}
      <div className="pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{stageLabels[client.returnStage]}</Badge>
          <Badge variant="outline">{client.serviceTier}</Badge>
        </div>
        {client.notes && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground italic">
            {client.notes}
          </p>
        )}
      </div>

      <div className="divide-y divide-border">
        <Section icon={Mail} title="Contact">
          <Row label="Email" value={<a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>} />
          <Row label="Phone" value={client.phone || "—"} />
          {client.type === "business" && client.businessName && (
            <Row label="Business" value={client.businessName} />
          )}
        </Section>

        <Section icon={FileText} title="Return">
          <Row label="Filing status" value={filingStatusLabels[client.filingStatus] ?? client.filingStatus} />
          <Row label="Stage" value={stageLabels[client.returnStage]} />
          <Row label="Type" value={client.type === "business" ? "Business" : "Individual"} />
          {client.urgency !== "normal" && (
            <Row label="Urgency" value={<span className="capitalize">{client.urgency}</span>} />
          )}
        </Section>

        <Section icon={DollarSign} title="Billing">
          <Row label="Fee" value={`$${client.feeAmount.toLocaleString()}`} />
          <Row label="Deposit" value={client.depositPaid ? <span className="text-positive">Paid</span> : <span className="text-rust">Pending</span>} />
        </Section>

        <Section icon={FileText} title="Documents">
          <Row label="Submitted" value={`${client.documentsSubmitted} of ${client.documentsRequired}`} />
          <Row label="Progress" value={`${docPercent}%`} />
          <div className="pt-1.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-foreground/70 transition-all" style={{ width: `${docPercent}%` }} />
            </div>
          </div>
        </Section>

        <Section icon={Clock} title="Activity">
          <Row label="Last activity" value={client.lastActivity} />
          <Row label="Last portal login" value={client.lastPortalLogin ?? "Never"} />
          {client.scheduledCall && <Row label="Scheduled call" value={client.scheduledCall} />}
          {client.returnSentDate && <Row label="Return sent" value={client.returnSentDate} />}
        </Section>
      </div>
    </div>
  );
}
