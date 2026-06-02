"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Download, Send, FileText, Pen } from "lucide-react";
import { type Client } from "@/lib/mock-data";
import { useToast } from "@/components/ui/toast-notification";
import { motion } from "motion/react";
import { getFirmOwner, memberSignatureLine } from "@/lib/firm-mock-data";
import { useSession } from "@/lib/session-context";

const filingStatusLabels: Record<string, string> = {
  single: "Single",
  mfj: "Married Filing Jointly",
  mfs: "Married Filing Separately",
  hoh: "Head of Household",
  qw: "Qualifying Widow(er)",
};

const tierDescriptions: Record<string, string> = {
  Basic: "Individual tax return preparation (Form 1040) with standard deductions and W-2 income.",
  Standard: "Individual tax return preparation (Form 1040) including itemized deductions, investment income, and up to 2 Schedule C businesses.",
  Premium: "Comprehensive tax return preparation including complex business entities (Schedule C, S-Corp, Partnership), rental properties (Schedule E), and multi-state filing.",
  Complex: "Full-service tax preparation for complex situations including multiple businesses, international income, trust/estate returns, and year-round advisory.",
};

interface EngagementLetterDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EngagementLetterDialog({ client, open, onOpenChange }: EngagementLetterDialogProps) {
  const [sent, setSent] = useState(false);
  const { showToast } = useToast();
  const { firm } = useSession();
  // Engagement letters are legally binding firm documents. They show the
  // firm owner's name on the letterhead and signature, not whichever
  // member happened to draft/send them. (The "sender" identity gets
  // captured in the audit trail separately.)
  const owner = getFirmOwner();
  const ownerSignature = memberSignatureLine(owner);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const depositAmount = 50;
  const balanceAmount = client.feeAmount - depositAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="size-4 text-muted-foreground" />
            <div>
              <h2 className="text-sm font-semibold">Engagement Letter</h2>
              <p className="text-xs text-muted-foreground">{client.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Download className="size-3" /> Download PDF
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
              <span className="text-lg leading-none">&times;</span>
            </Button>
          </div>
        </div>

        {/* Letter content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Letterhead */}
            <div>
              <h1 className="font-display text-lg tracking-tight">{firm.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{ownerSignature}{owner.ptin ? ` · PTIN: ${owner.ptin}` : ""}</p>
              <p className="text-xs text-muted-foreground">1234 Business Ave, Montclair, CA 91763</p>
            </div>

            <div className="text-xs text-muted-foreground">{today}</div>

            <div className="text-sm">
              <p className="font-medium">{client.fullName}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{client.email}</p>
            </div>

            <Separator />

            <div>
              <h2 className="text-sm font-semibold mb-2">Engagement Agreement for Tax Preparation Services</h2>
              <p className="text-sm leading-relaxed text-foreground/80">
                Dear {client.fullName.split(" ")[0]},
              </p>
              <p className="text-sm leading-relaxed text-foreground/80 mt-2">
                Thank you for choosing {firm.name} for your {new Date().getFullYear() - 1} tax preparation. This letter confirms the terms of our engagement.
              </p>
            </div>

            {/* Scope */}
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scope of Services</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Service Tier</span>
                  <p className="font-medium">{client.serviceTier} Return</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Filing Status</span>
                  <p className="font-medium">{filingStatusLabels[client.filingStatus] || client.filingStatus}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Tax Year</span>
                  <p className="font-medium">{new Date().getFullYear() - 1}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Return Type</span>
                  <p className="font-medium">{client.type === "business" ? `Business (${client.businessName})` : "Individual (1040)"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                {tierDescriptions[client.serviceTier] || tierDescriptions.Standard}
              </p>
            </div>

            {/* Fee Schedule */}
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fee Schedule</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total fee</span>
                <span className="text-sm font-bold tabular-nums">${client.feeAmount}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs">Deposit (due at signing)</span>
                <span className="text-xs tabular-nums">${depositAmount}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs">Balance (due before filing)</span>
                <span className="text-xs tabular-nums">${balanceAmount}</span>
              </div>
            </div>

            {/* 7216 Consent */}
            <div className="rounded-lg border p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">IRC Section 7216 Consent</h3>
              <p className="text-xs leading-relaxed text-foreground/70">
                By signing below, you consent to {firm.name}&apos;s use of your tax return information for the purpose of preparing your current year return, providing tax advisory services, and communicating with the IRS or state tax agencies on your behalf. This consent is valid for the duration of this engagement and may be revoked in writing at any time. Your information will not be shared with third parties except as required by law or with your explicit written consent.
              </p>
            </div>

            {/* Signature lines */}
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div>
                <div className="border-b border-foreground/20 pb-1 mb-1">
                  <span className="text-xs text-muted-foreground">Client Signature</span>
                </div>
                <p className="text-xs text-muted-foreground">{client.fullName}</p>
                <p className="text-xs text-muted-foreground">Date: _______________</p>
              </div>
              <div>
                <div className="border-b border-foreground/20 pb-1 mb-1">
                  <span className="text-xs text-muted-foreground">Preparer Signature</span>
                </div>
                <p className="text-xs text-muted-foreground">{ownerSignature}</p>
                <p className="text-xs text-muted-foreground">Date: {today}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 shrink-0">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {sent ? (
              <div className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                <Check className="size-3.5" /> Sent for signature
              </div>
            ) : (
              <Button
                className="flex-1"
                onClick={() => {
                  setSent(true);
                  showToast("success", "Engagement letter sent", `Sent to ${client.fullName} for signature`);
                }}
              >
                <Send className="size-3.5" /> Send for Signature
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
