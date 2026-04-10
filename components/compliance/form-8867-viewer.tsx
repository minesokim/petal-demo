"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, X, Pen, Check } from "lucide-react";
import { Form8867Dialog } from "./form-8867-dialog";

interface Form8867ViewerProps {
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// The 13 questions with mock completed answers
const COMPLETED_ANSWERS: { section: string; question: string; answer: string; notes?: string }[] = [
  { section: "Identity Verification", question: "Taxpayer identity verified via government-issued photo ID?", answer: "Yes", notes: "Verified via driver's license uploaded to portal" },
  { section: "Identity Verification", question: "SSN/ITIN verified for taxpayer and all dependents?", answer: "Yes", notes: "SSN verified against intake form submission" },
  { section: "Filing Status", question: "HOH status verified — qualifying person lived with taxpayer for more than half the year?", answer: "Yes" },
  { section: "Filing Status", question: "Taxpayer provided more than half the cost of maintaining the household?", answer: "Yes" },
  { section: "Earned Income Credit", question: "Each qualifying child meets age, relationship, and residency requirements?", answer: "Yes" },
  { section: "Earned Income Credit", question: "Taxpayer's investment income does not exceed the EITC limit?", answer: "Yes" },
  { section: "Earned Income Credit", question: "All sources of earned income verified, including self-employment?", answer: "Yes", notes: "W-2 from Amazon warehouse confirmed as sole income source" },
  { section: "Child Tax Credit", question: "Each child claimed for CTC is under 17 at the end of the tax year?", answer: "Yes" },
  { section: "Child Tax Credit", question: "Child's citizenship or residency status verified?", answer: "Yes" },
  { section: "Income Verification", question: "All sources of income reported verified?", answer: "Yes", notes: "Single W-2, no additional 1099s or unreported income" },
  { section: "Income Verification", question: "Taxpayer provided all relevant financial information?", answer: "Yes" },
  { section: "Preparer Knowledge", question: "Reasonable inquiries made to determine accuracy of information?", answer: "Yes" },
  { section: "Preparer Knowledge", question: "Inquiries and taxpayer responses documented?", answer: "Yes" },
];

export function Form8867Viewer({ clientName, open, onOpenChange }: Form8867ViewerProps) {
  const [editOpen, setEditOpen] = useState(false);
  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  // Group by section
  const sections = COMPLETED_ANSWERS.reduce<Record<string, typeof COMPLETED_ANSWERS>>((acc, a) => {
    if (!acc[a.section]) acc[a.section] = [];
    acc[a.section]!.push(a);
    return acc;
  }, {});

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex !h-[85vh] !w-[700px] !max-w-[700px] flex-col gap-0 overflow-hidden p-0" showCloseButton={false}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-3 shrink-0">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[10px]">8867</Badge>
              <h2 className="text-sm font-semibold">Form 8867 Due Diligence Checklist</h2>
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Complete</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditOpen(true)}>
                <Pen className="size-3" /> Edit
              </Button>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                <Download className="size-3" /> Download
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Form content — styled like a printed document */}
          <div className="flex-1 overflow-y-auto bg-muted/10">
            <div className="mx-auto max-w-lg my-6 bg-white rounded-lg shadow-sm border p-8 space-y-6">
              {/* Form header */}
              <div className="text-center space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Department of the Treasury — Internal Revenue Service</div>
                <h1 className="text-lg font-bold">Form 8867</h1>
                <p className="text-xs text-muted-foreground">Paid Preparer's Due Diligence Checklist</p>
                <p className="text-xs text-muted-foreground">For Returns Claiming EITC, CTC/ACTC/ODC, AOTC, and/or HOH Filing Status</p>
              </div>

              <Separator />

              {/* Preparer & taxpayer info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Taxpayer</div>
                  <div className="font-medium">{clientName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Preparer</div>
                  <div className="font-medium">Antonio Vazquez, EA</div>
                  <div className="text-muted-foreground">PTIN: P01234567</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tax Year</div>
                  <div className="font-medium">2025</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Date Completed</div>
                  <div className="font-medium">{today}</div>
                </div>
              </div>

              <Separator />

              {/* Questions by section */}
              {Object.entries(sections).map(([sectionName, questions], si) => (
                <div key={sectionName}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Part {si + 1}: {sectionName}
                  </h3>
                  <div className="space-y-3">
                    {questions.map((q, qi) => (
                      <div key={qi} className="flex items-start gap-3">
                        <div className="mt-0.5 flex size-5 items-center justify-center rounded border border-emerald-300 bg-emerald-50 shrink-0">
                          <Check className="size-3 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs leading-relaxed">{q.question}</p>
                          {q.notes && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 italic">Note: {q.notes}</p>
                          )}
                        </div>
                        <span className="text-xs font-medium text-emerald-600 shrink-0">{q.answer}</span>
                      </div>
                    ))}
                  </div>
                  {si < Object.keys(sections).length - 1 && <Separator className="mt-4" />}
                </div>
              ))}

              {/* Signature */}
              <Separator />
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preparer Declaration</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  I have complied with the due diligence requirements under Treasury Regulations section 1.6695-2 for each credit and/or Head of Household filing status checked above.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="border-b border-foreground/20 pb-1 mb-1">
                      <span className="text-xs font-medium">Antonio Vazquez, EA</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Preparer Signature</span>
                  </div>
                  <div>
                    <div className="border-b border-foreground/20 pb-1 mb-1">
                      <span className="text-xs font-medium">{today}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Date</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit questionnaire */}
      <Form8867Dialog
        clientName={clientName}
        open={editOpen}
        onOpenChange={setEditOpen}
        onComplete={() => {}}
        readOnly
      />
    </>
  );
}
