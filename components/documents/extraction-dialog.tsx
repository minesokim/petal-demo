"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check, X, AlertTriangle, Pen, ArrowRight,
  Loader2, FileText, Eye, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type DocumentExtraction, type ExtractedField } from "@/lib/actions-mock-data";
import { clients } from "@/lib/mock-data";

type FieldState = {
  field: ExtractedField;
  status: "pending" | "approved" | "editing";
  editValue: string;
};

type FlowState = "review" | "pushing" | "pushed";

// W-2 form box layout matching actual IRS form
const w2BoxLayout = [
  { box: "a", label: "Employee SSN", row: 0, col: 0, span: 1 },
  { box: "b", label: "Employer ID (EIN)", row: 0, col: 1, span: 1 },
  { box: "c", label: "Employer name & address", row: 1, col: 0, span: 2 },
  { box: "e", label: "Employee name", row: 2, col: 0, span: 1 },
  { box: "f", label: "Employee address", row: 2, col: 1, span: 1 },
  { box: "1", label: "Wages, tips, other compensation", row: 3, col: 0, span: 1 },
  { box: "2", label: "Federal income tax withheld", row: 3, col: 1, span: 1 },
  { box: "3", label: "Social security wages", row: 4, col: 0, span: 1 },
  { box: "4", label: "Social security tax withheld", row: 4, col: 1, span: 1 },
  { box: "5", label: "Medicare wages and tips", row: 5, col: 0, span: 1 },
  { box: "6", label: "Medicare tax withheld", row: 5, col: 1, span: 1 },
  { box: "16", label: "State wages, tips, etc.", row: 6, col: 0, span: 1 },
  { box: "17", label: "State income tax", row: 6, col: 1, span: 1 },
];

// 1099 form layout
const nec1099Layout = [
  { box: "header", label: "Payer name & address", row: 0, col: 0, span: 2 },
  { box: "payer_tin", label: "Payer TIN", row: 1, col: 0, span: 1 },
  { box: "recipient_tin", label: "Recipient TIN", row: 1, col: 1, span: 1 },
  { box: "1", label: "Nonemployee compensation", row: 2, col: 0, span: 1 },
  { box: "4", label: "Federal income tax withheld", row: 2, col: 1, span: 1 },
  { box: "5", label: "State tax withheld", row: 3, col: 0, span: 1 },
  { box: "6", label: "State/Payer state no.", row: 3, col: 1, span: 1 },
  { box: "7", label: "State income", row: 4, col: 0, span: 1 },
];

interface ExtractionDialogProps {
  extraction: DocumentExtraction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtractionDialog({ extraction, open, onOpenChange }: ExtractionDialogProps) {
  const [fields, setFields] = useState<FieldState[]>([]);
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);
  const [flowState, setFlowState] = useState<FlowState>("review");

  // Initialize fields when extraction changes
  const initFields = (ext: DocumentExtraction) => {
    setFields(ext.fields.map(f => ({ field: f, status: "pending", editValue: f.value })));
    setFlowState("review");
    setActiveFieldIndex(null);
  };

  if (!extraction) return null;

  // Init on first render or when extraction changes
  if (fields.length === 0 || fields[0].field.label !== extraction.fields[0]?.label) {
    initFields(extraction);
  }

  const client = clients.find(c => c.id === extraction.clientId);
  const approvedCount = fields.filter(f => f.status === "approved").length;
  const allApproved = approvedCount === fields.length;
  const needsReviewCount = fields.filter(f => f.field.needsReview && f.status === "pending").length;

  const formLayout = extraction.documentType === "W-2" ? w2BoxLayout : nec1099Layout;

  const approveField = (i: number) => {
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, status: "approved" } : f));
  };

  const startEdit = (i: number) => {
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, status: "editing" } : f));
  };

  const saveEdit = (i: number) => {
    setFields(prev => prev.map((f, idx) => idx === i ? {
      ...f,
      status: "approved",
      field: { ...f.field, value: f.editValue, confidence: 100, needsReview: false }
    } : f));
  };

  const cancelEdit = (i: number) => {
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, status: "pending", editValue: f.field.value } : f));
  };

  const approveAll = () => {
    setFields(prev => prev.map(f => ({ ...f, status: "approved" })));
  };

  const pushToOLT = () => {
    setFlowState("pushing");
    setTimeout(() => setFlowState("pushed"), 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setFields([]);
      setFlowState("review");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none sm:max-w-4xl [&>button]:hidden" style={{ maxHeight: "85vh" }}>
        {/* Container */}
        <div className="flex flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl" style={{ maxHeight: "85vh" }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                {client && <img src={client.avatar} alt={client.fullName} className="size-full rounded-full object-cover" />}
                <AvatarFallback>{extraction.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">{extraction.documentType} Data Extraction</h2>
                  <Badge variant="outline" className="text-[10px]">{extraction.clientName}</Badge>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">Auto-extracted</span>
                  <span>{approvedCount}/{fields.length} fields approved</span>
                  {needsReviewCount > 0 && (
                    <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="size-3" /> {needsReviewCount} needs review</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={extraction.overallConfidence >= 90 ? "default" : "secondary"}>
                {extraction.overallConfidence}% confidence
              </Badge>
              <Button variant="ghost" size="icon" className="size-8" onClick={handleClose}>
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-2 divide-x divide-border/50 min-h-0 flex-1 overflow-hidden">
            {/* Left: IRS Form Layout */}
            <div className="overflow-y-auto p-6">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {extraction.documentType === "W-2" ? "Form W-2 Wage and Tax Statement" : "Form 1099-NEC Nonemployee Compensation"}
                </span>
              </div>

              {/* Form grid mimicking actual IRS form */}
              <div className="rounded-xl border bg-background/60 p-1">
                {Array.from(new Set(formLayout.map(b => b.row))).map(row => (
                  <div key={row} className="flex gap-1">
                    {formLayout.filter(b => b.row === row).map((box, bi) => {
                      // Find matching extracted field
                      const fieldIndex = fields.findIndex(f =>
                        f.field.source.toLowerCase().includes(`box ${box.box}`) ||
                        f.field.source.toLowerCase().includes(`box ${box.label.split(" ")[0].toLowerCase()}`) ||
                        f.field.label.toLowerCase().includes(box.label.toLowerCase().split(",")[0])
                      );
                      const matchedField = fieldIndex >= 0 ? fields[fieldIndex] : null;
                      const isActive = activeFieldIndex === fieldIndex;

                      return (
                        <button
                          key={box.box}
                          onClick={() => fieldIndex >= 0 && setActiveFieldIndex(isActive ? null : fieldIndex)}
                          className={`flex-1 rounded-lg border p-2.5 text-left transition-all ${box.span === 2 ? "w-full" : ""} ${
                            isActive ? "border-primary bg-primary/5 ring-1 ring-primary/20" :
                            matchedField?.status === "approved" ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20" :
                            matchedField?.field.needsReview ? "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10" :
                            "hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                              Box {box.box}
                            </span>
                            {matchedField?.status === "approved" && <Check className="size-3 text-emerald-500" />}
                            {matchedField?.field.needsReview && matchedField.status === "pending" && <AlertTriangle className="size-3 text-amber-500" />}
                          </div>
                          <div className="mt-0.5 text-[10px] text-muted-foreground">{box.label}</div>
                          {matchedField && (
                            <div className="mt-1 font-mono text-sm font-medium">{matchedField.field.value}</div>
                          )}
                          {!matchedField && (
                            <div className="mt-1 text-xs italic text-muted-foreground/50">N/A</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Extracted fields with actions */}
            <div className="flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 pb-24">
                <div className="mb-3 flex items-center gap-2">
                  <Eye className="size-4 text-muted-foreground" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Extracted values</span>
                </div>

                <div className="space-y-2">
                  {fields.map((f, i) => (
                    <motion.div
                      key={i}
                      layout
                      className={`rounded-xl border p-3 transition-all ${
                        activeFieldIndex === i ? "border-primary ring-1 ring-primary/20" :
                        f.status === "approved" ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/10" :
                        f.field.needsReview ? "border-amber-200" : ""
                      }`}
                      onClick={() => setActiveFieldIndex(activeFieldIndex === i ? null : i)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{f.field.label}</span>
                          {f.status === "approved" && (
                            <Badge className="h-4 bg-emerald-100 px-1.5 text-[9px] text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Approved</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{f.field.source}</span>
                          <span className={`font-mono text-[11px] font-bold tabular-nums ${
                            f.field.confidence >= 90 ? "text-emerald-600" : "text-amber-600"
                          }`}>{f.field.confidence}%</span>
                        </div>
                      </div>

                      {f.status === "editing" ? (
                        <div className="mt-2">
                          <Input
                            value={f.editValue}
                            onChange={e => setFields(prev => prev.map((field, idx) => idx === i ? { ...field, editValue: e.target.value } : field))}
                            className="h-8 font-mono text-sm"
                            autoFocus
                          />
                          <div className="mt-2 flex gap-1.5">
                            <Button size="sm" className="h-7 text-[11px]" onClick={() => saveEdit(i)}><Check className="size-3" /> Save</Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => cancelEdit(i)}><X className="size-3" /> Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mt-1 font-mono text-sm">{f.field.value}</div>
                          <Progress value={f.field.confidence} className="mt-2 h-1" indicatorColor={f.field.confidence >= 90 ? "bg-emerald-500" : "bg-amber-500"} />
                          {f.field.needsReview && f.status === "pending" && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-600">
                              <AlertTriangle className="size-2.5" /> Low confidence - review recommended
                            </div>
                          )}
                          {f.status === "pending" && (
                            <div className="mt-2 flex gap-1.5">
                              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); approveField(i); }}>
                                <Check className="size-2.5" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); startEdit(i); }}>
                                <Pen className="size-2.5" /> Edit
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer actions */}
              <div className="border-t border-border/50 bg-background/60 px-6 py-4 backdrop-blur-sm">
                <AnimatePresence mode="wait">
                  {flowState === "pushed" ? (
                    <motion.div
                      key="pushed"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500">
                        <Check className="size-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Pushed to OLT</div>
                        <div className="text-xs text-muted-foreground">{fields.length} fields transferred for {extraction.clientName}</div>
                      </div>
                    </motion.div>
                  ) : flowState === "pushing" ? (
                    <motion.div
                      key="pushing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3"
                    >
                      <Loader2 className="size-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Pushing {fields.length} fields to OLT...</span>
                    </motion.div>
                  ) : (
                    <motion.div key="actions" className="flex items-center gap-2">
                      {!allApproved && (
                        <Button size="sm" variant="outline" onClick={approveAll}>
                          <Check className="size-3.5" /> Approve all
                        </Button>
                      )}
                      <Button size="sm" onClick={pushToOLT} disabled={!allApproved}>
                        <ArrowRight className="size-3.5" /> Push to OLT
                      </Button>
                      {!allApproved && (
                        <span className="text-[11px] text-muted-foreground">Approve all fields to push</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
