"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Check, X, AlertTriangle, FileText, Pen, Send, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type DocumentExtraction, type ExtractedField } from "@/lib/actions-mock-data";

type FieldStatus = "pending" | "approved" | "editing";
type ExtractionStatus = "review" | "approved" | "pushing" | "pushed";

export function DocumentExtractionView({ extraction }: { extraction: DocumentExtraction }) {
  const [fields, setFields] = useState(
    extraction.fields.map(f => ({ ...f, status: "pending" as FieldStatus, editValue: f.value }))
  );
  const [activeField, setActiveField] = useState<number | null>(null);
  const [status, setStatus] = useState<ExtractionStatus>("review");

  const allApproved = fields.every(f => f.status === "approved");
  const approvedCount = fields.filter(f => f.status === "approved").length;

  const approveField = (i: number) => {
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, status: "approved" } : f));
  };

  const startEdit = (i: number) => {
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, status: "editing" } : f));
  };

  const saveEdit = (i: number) => {
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, status: "approved", value: f.editValue } : f));
  };

  const cancelEdit = (i: number) => {
    setFields(prev => prev.map((f, idx) => idx === i ? { ...f, status: "pending", editValue: f.value } : f));
  };

  const approveAll = () => {
    setFields(prev => prev.map(f => ({ ...f, status: "approved" })));
  };

  const pushToOLT = () => {
    setStatus("pushing");
    setTimeout(() => setStatus("pushed"), 2000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="size-4" />
          {extraction.documentType} - Data Extraction
        </CardTitle>
        <CardAction>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{approvedCount}/{fields.length} fields approved</span>
            <Badge variant={extraction.overallConfidence >= 90 ? "default" : "secondary"} className="text-[10px]">
              {extraction.overallConfidence}% confidence
            </Badge>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Left: Document preview */}
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="text-muted-foreground mb-2 text-[10px] font-medium uppercase tracking-wider">Source document</div>
            <div className="space-y-1.5">
              {fields.map((f, i) => (
                <div
                  key={i}
                  onClick={() => setActiveField(activeField === i ? null : i)}
                  className={`cursor-pointer rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                    activeField === i ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/50"
                  }`}
                >
                  <span className="text-muted-foreground">{f.source}:</span>{" "}
                  <span className="font-mono">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Editable extracted fields */}
          <div className="space-y-2">
            <div className="text-muted-foreground mb-2 text-[10px] font-medium uppercase tracking-wider">Extracted data</div>
            {fields.map((f, i) => (
              <div
                key={i}
                className={`rounded-lg border p-2.5 transition-colors ${
                  activeField === i ? "border-primary" :
                  f.status === "approved" ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/10" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{f.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-semibold tabular-nums ${
                      f.confidence >= 90 ? "text-emerald-600" : "text-amber-600"
                    }`}>{f.confidence}%</span>
                    {f.status === "approved" && <Check className="size-3 text-emerald-500" />}
                  </div>
                </div>

                {f.status === "editing" ? (
                  <div className="mt-1.5">
                    <Input
                      value={f.editValue}
                      onChange={e => setFields(prev => prev.map((field, idx) => idx === i ? { ...field, editValue: e.target.value } : field))}
                      className="h-7 text-xs"
                    />
                    <div className="mt-1.5 flex gap-1">
                      <Button size="sm" className="h-6 text-[10px]" onClick={() => saveEdit(i)}><Check className="size-2.5" /> Save</Button>
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => cancelEdit(i)}><X className="size-2.5" /> Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-0.5 text-xs text-muted-foreground">{f.value}</div>
                    <Progress value={f.confidence} className="mt-1 h-1" indicatorColor={f.confidence >= 90 ? "bg-emerald-500" : "bg-amber-500"} />
                    {f.needsReview && f.status !== "approved" && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600">
                        <AlertTriangle className="size-2.5" /> Needs review
                      </div>
                    )}
                    {f.status === "pending" && (
                      <div className="mt-1.5 flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => approveField(i)}><Check className="size-2.5" /> Approve</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => startEdit(i)}><Pen className="size-2.5" /> Edit</Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        <AnimatePresence mode="wait">
          {status === "pushed" ? (
            <motion.div
              key="pushed"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border bg-emerald-50 p-4 dark:bg-emerald-950/20"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500">
                <Check className="size-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">Data pushed to OLT</div>
                <div className="text-xs text-muted-foreground">All {fields.length} fields transferred for {extraction.clientName}</div>
              </div>
            </motion.div>
          ) : status === "pushing" ? (
            <motion.div
              key="pushing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 py-2"
            >
              <Loader2 className="size-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Pushing data to OLT...</span>
            </motion.div>
          ) : (
            <motion.div key="actions" className="flex gap-2">
              {!allApproved && (
                <Button size="sm" variant="outline" onClick={approveAll}>
                  <Check className="size-3.5" /> Approve all fields
                </Button>
              )}
              <Button size="sm" onClick={pushToOLT} disabled={!allApproved}>
                <ArrowRight className="size-3.5" /> Push to OLT
              </Button>
              {!allApproved && (
                <span className="flex items-center text-xs text-muted-foreground">Approve all fields before pushing</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
