"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";

interface Form8867Question {
  id: string;
  section: string;
  text: string;
}

const QUESTIONS: Form8867Question[] = [
  // Identity
  { id: "id-1", section: "Identity Verification", text: "Did you verify the taxpayer's identity using a government-issued photo ID or other acceptable documentation?" },
  { id: "id-2", section: "Identity Verification", text: "Did you verify the SSN/ITIN for the taxpayer and all dependents claimed?" },
  // Filing Status
  { id: "fs-1", section: "Filing Status", text: "Did you verify Head of Household status by confirming the qualifying person lived with the taxpayer for more than half the year?" },
  { id: "fs-2", section: "Filing Status", text: "Did you verify that the taxpayer provided more than half the cost of maintaining the household?" },
  // EITC
  { id: "eitc-1", section: "Earned Income Credit", text: "Did you verify that each qualifying child meets the age, relationship, and residency requirements?" },
  { id: "eitc-2", section: "Earned Income Credit", text: "Did you verify that the taxpayer's investment income does not exceed the EITC limit?" },
  { id: "eitc-3", section: "Earned Income Credit", text: "Did you verify all sources of earned income, including self-employment income?" },
  // CTC
  { id: "ctc-1", section: "Child Tax Credit", text: "Did you verify that each child claimed for CTC is under 17 at the end of the tax year?" },
  { id: "ctc-2", section: "Child Tax Credit", text: "Did you verify the child's citizenship or residency status?" },
  // Income
  { id: "inc-1", section: "Income Verification", text: "Did you verify all sources of income reported, including W-2s, 1099s, and self-employment?" },
  { id: "inc-2", section: "Income Verification", text: "Did the taxpayer provide all relevant financial information to the best of their knowledge?" },
  // Knowledge
  { id: "know-1", section: "Preparer Knowledge", text: "Did you make reasonable inquiries to determine the accuracy of the information provided?" },
  { id: "know-2", section: "Preparer Knowledge", text: "Did you document your inquiries and the taxpayer's responses?" },
];

interface Form8867DialogProps {
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function Form8867Dialog({ clientName, open, onOpenChange, onComplete }: Form8867DialogProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const progress = Math.round((checked.size / QUESTIONS.length) * 100);
  const isComplete = checked.size === QUESTIONS.length;

  // Group questions by section
  const sections = QUESTIONS.reduce<Record<string, Form8867Question[]>>((acc, q) => {
    if (!acc[q.section]) acc[q.section] = [];
    acc[q.section]!.push(q);
    return acc;
  }, {});

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] sm:max-w-[520px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-base">Form 8867 Due Diligence</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{clientName}</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {checked.size}/{QUESTIONS.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-1.5 mt-3" indicatorColor={isComplete ? "bg-emerald-500" : undefined} />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {Object.entries(sections).map(([sectionName, questions], si) => (
            <motion.div
              key={sectionName}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{sectionName}</span>
                {questions.every(q => checked.has(q.id)) && (
                  <Check className="size-3 text-emerald-500" />
                )}
              </div>
              <div className="space-y-3">
                {questions.map(q => (
                  <div key={q.id} className="rounded-lg border bg-card p-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox
                        checked={checked.has(q.id)}
                        onCheckedChange={() => toggle(q.id)}
                        className="mt-0.5"
                      />
                      <span className="text-sm leading-relaxed">{q.text}</span>
                    </label>
                    {checked.has(q.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <input
                          value={notes[q.id] || ""}
                          onChange={e => setNotes(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder="Notes (optional)"
                          className="mt-2 ml-7 w-[calc(100%-28px)] rounded-md border bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 shrink-0">
          {!isComplete && (
            <div className="flex items-center gap-2 mb-3 text-xs text-amber-600">
              <AlertTriangle className="size-3" />
              <span>{QUESTIONS.length - checked.size} items remaining</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Save Draft
            </Button>
            <Button
              className="flex-1"
              disabled={!isComplete}
              onClick={() => {
                onComplete();
                onOpenChange(false);
              }}
            >
              <Check className="size-3.5" /> Complete Due Diligence
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
