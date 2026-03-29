"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, X } from "lucide-react";
import { type MockDocument } from "@/lib/documents-mock-data";

// Mock document content based on type
const mockContent: Record<string, { title: string; sections: { label: string; value: string }[] }> = {
  w2: {
    title: "Form W-2 Wage and Tax Statement",
    sections: [
      { label: "Box a - Employee SSN", value: "XXX-XX-4521" },
      { label: "Box b - Employer ID (EIN)", value: "95-4832671" },
      { label: "Box c - Employer", value: "Golden Dragon LLC\n1234 Main St\nRiverside, CA 92501" },
      { label: "Box e - Employee", value: "Marcus Chen" },
      { label: "Box 1 - Wages, tips, other compensation", value: "$68,450.00" },
      { label: "Box 2 - Federal income tax withheld", value: "$12,340.00" },
      { label: "Box 3 - Social security wages", value: "$68,450.00" },
      { label: "Box 4 - Social security tax withheld", value: "$4,243.90" },
      { label: "Box 5 - Medicare wages and tips", value: "$68,450.00" },
      { label: "Box 6 - Medicare tax withheld", value: "$992.53" },
      { label: "Box 16 - State wages", value: "$68,450.00" },
      { label: "Box 17 - State income tax", value: "$3,422.50" },
    ],
  },
  "1099_nec": {
    title: "Form 1099-NEC Nonemployee Compensation",
    sections: [
      { label: "Payer", value: "TikTok Inc.\n5800 Bristol Parkway\nCulver City, CA 90230" },
      { label: "Payer TIN", value: "XX-XXX4782" },
      { label: "Recipient", value: "Priya Sharma\nSSN: XXX-XX-8901" },
      { label: "Box 1 - Nonemployee compensation", value: "$24,830.00" },
      { label: "Box 4 - Federal income tax withheld", value: "$0.00" },
      { label: "Box 5 - State tax withheld", value: "$1,241.50" },
    ],
  },
  expense: {
    title: "Business Expense Records",
    sections: [
      { label: "Business", value: "Golden Dragon LLC" },
      { label: "Period", value: "January - December 2025" },
      { label: "Total Revenue", value: "$291,000.00" },
      { label: "Cost of Goods Sold", value: "$116,400.00" },
      { label: "Gross Profit", value: "$174,600.00" },
      { label: "Operating Expenses", value: "$98,200.00" },
      { label: "  Rent", value: "$36,000.00" },
      { label: "  Utilities", value: "$8,400.00" },
      { label: "  Payroll", value: "$42,000.00" },
      { label: "  Insurance", value: "$6,800.00" },
      { label: "  Supplies", value: "$5,000.00" },
      { label: "Net Income", value: "$76,400.00" },
    ],
  },
  id: {
    title: "Photo Identification",
    sections: [
      { label: "Type", value: "Driver's License" },
      { label: "State", value: "California" },
      { label: "Name", value: "Marcus Chen" },
      { label: "DOB", value: "06/15/1985" },
      { label: "License No.", value: "D1234567" },
      { label: "Expiration", value: "06/15/2027" },
    ],
  },
  return: {
    title: "2025 Federal Tax Return (Form 1040)",
    sections: [
      { label: "Filing Status", value: "Married Filing Jointly" },
      { label: "Adjusted Gross Income (Line 11)", value: "$142,800.00" },
      { label: "Standard/Itemized Deductions", value: "$29,200.00 (Standard)" },
      { label: "Taxable Income (Line 15)", value: "$113,600.00" },
      { label: "Total Tax (Line 24)", value: "$18,432.00" },
      { label: "Total Payments (Line 33)", value: "$22,180.00" },
      { label: "Overpaid (Line 34)", value: "$3,748.00" },
      { label: "Refund (Line 35a)", value: "$3,748.00" },
      { label: "Schedules Attached", value: "Schedule C, Schedule SE" },
    ],
  },
  engagement: {
    title: "Engagement Letter 2025",
    sections: [
      { label: "Preparer", value: "Antonio Vazquez, EA\nVazant Consulting" },
      { label: "Client", value: "Marcus Chen" },
      { label: "Tax Year", value: "2025" },
      { label: "Scope", value: "Prepare individual income tax return (Form 1040) along with applicable schedules and forms." },
      { label: "Fee", value: "$500.00 (Premium tier)" },
      { label: "Deposit", value: "$50.00 (non-refundable, applied to total)" },
      { label: "Cancellation", value: "48 hours notice required for full refund" },
      { label: "Status", value: "Signed electronically on March 18, 2025" },
    ],
  },
  "7216": {
    title: "IRC Section 7216 Consent",
    sections: [
      { label: "Taxpayer", value: "Marcus Chen" },
      { label: "Preparer", value: "Antonio Vazquez, EA - Vazant Consulting" },
      { label: "Authorized Uses", value: "Prepare and file federal and state returns for 2025. Communicate with taxing authorities. Store and process information using encrypted systems." },
      { label: "Duration", value: "Effective until December 31, 2026 or until revoked in writing" },
      { label: "Status", value: "Signed electronically on March 18, 2025" },
    ],
  },
};

interface DocumentPreviewDialogProps {
  document: MockDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreviewDialog({ document: doc, open, onOpenChange }: DocumentPreviewDialogProps) {
  if (!doc) return null;

  const content = mockContent[doc.docType] || {
    title: doc.fileName,
    sections: [
      { label: "File", value: doc.fileName },
      { label: "Type", value: doc.docType },
      { label: "Uploaded by", value: doc.uploadedBy },
      { label: "Size", value: doc.fileSize },
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{content.title}</DialogTitle>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{doc.clientName}</span>
            <span>&middot;</span>
            <span>{doc.fileSize}</span>
            <span>&middot;</span>
            <span>{doc.uploadedBy === "client" ? "Client uploaded" : "Preparer uploaded"}</span>
            {doc.status && <Badge variant="outline" className="text-[10px]">{doc.status === "signed" ? "Signed" : "Ready for review"}</Badge>}
          </div>
        </DialogHeader>

        <div className="mt-2 rounded-xl border bg-muted/20 p-4">
          <div className="space-y-3">
            {content.sections.map((section, i) => (
              <div key={i}>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{section.label}</div>
                <div className="mt-0.5 whitespace-pre-line font-mono text-sm">{section.value}</div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-2" />

        <div className="flex gap-2">
          <Button size="sm" variant="outline"><Download className="size-3.5" /> Download</Button>
          <Button size="sm" variant="outline"><Printer className="size-3.5" /> Print</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
