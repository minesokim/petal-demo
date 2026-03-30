"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ScrollText, FileSignature, ArrowRightLeft, MessageSquare, CreditCard, Shield } from "lucide-react";

const auditCategories = [
  { icon: FileSignature, label: "8879 Signatures", desc: "When each form was signed by client and ERO" },
  { icon: ArrowRightLeft, label: "Pipeline Changes", desc: "Every stage transition with actor and timestamp" },
  { icon: MessageSquare, label: "Client Communications", desc: "Messages sent and received" },
  { icon: CreditCard, label: "Payment Events", desc: "Deposits, invoices, and payment receipts" },
  { icon: Shield, label: "Document Access", desc: "Who viewed, uploaded, or downloaded documents" },
];

export default function AuditTrailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Audit Trail</h3>
        <p className="text-sm text-muted-foreground">Complete history of every action in your practice. Essential for IRS compliance.</p>
      </div>

      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <ScrollText className="size-6 text-muted-foreground" />
            </div>
            <h4 className="mt-4 text-base font-semibold">Coming Soon</h4>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
              A chronological, filterable log of every significant action in your practice. Designed for IRS compliance and peace of mind.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 w-full max-w-md">
              {auditCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.label} className="flex items-center gap-3 rounded-xl border p-3 text-left">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="text-xs font-medium">{cat.label}</div>
                      <div className="text-[11px] text-muted-foreground">{cat.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
