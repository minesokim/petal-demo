"use client";

import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ChevronRight, ChevronLeft, FileCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  saveForm8867Completion,
  defaultAnswers,
  type Form8867Answers,
  type YesNo,
} from "@/lib/form-8867-store";

interface Form8867DialogProps {
  clientName: string;
  clientId?: string;
  /** Last 4 of the taxpayer's TIN — written into the filled IRS PDF. Defaults to "1234" for mock. */
  clientTINLast4?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

/**
 * Multi-step Form 8867 (Paid Preparer's Due Diligence Checklist) — guided
 * questionnaire whose answers map **1:1** to the IRS PDF fields (see
 * `lib/fill-form-8867.ts`). Question numbering matches the real IRS form
 * (Rev. November 2024):
 *
 *   Part I    — Due Diligence (Q1, Q2, Q3, Q4 + Q4a/b, Q5 + docs, Q6, Q7 + Q7a, Q8)
 *   Part II   — EIC (Q9a, Q9b, Q9c)              — only if EITC claimed
 *   Part III  — CTC/ACTC/ODC (Q10, Q11, Q12)     — only if CTC claimed
 *   Part IV   — AOTC (Q13)                        — only if AOTC claimed
 *   Part V    — HOH (Q14)                         — only if HOH filing
 *   Part VI   — Certification (Q15)              — always
 *
 * Submitting saves a `Form8867Completion` to the local store, which the
 * viewer then renders against the real IRS PDF via pdf-lib.
 *
 * Reference: https://www.irs.gov/pub/irs-pdf/f8867.pdf
 */
export function Form8867Dialog({
  clientName,
  clientId,
  clientTINLast4 = "1234",
  open,
  onOpenChange,
  onComplete,
}: Form8867DialogProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Form8867Answers>(defaultAnswers);

  // Step list is dynamic — Part II/III/IV/V only included for claimed credits
  const steps = useMemo(() => {
    const list: { id: string; title: string; part: string }[] = [
      { id: "scope", title: "Applicable credits", part: "Scope" },
      { id: "part-i", title: "Due diligence requirements", part: "Part I" },
    ];
    if (answers.applicableCredits.eitc) list.push({ id: "part-ii", title: "EIC questions", part: "Part II" });
    if (answers.applicableCredits.ctc) list.push({ id: "part-iii", title: "CTC / ACTC / ODC questions", part: "Part III" });
    if (answers.applicableCredits.aotc) list.push({ id: "part-iv", title: "AOTC question", part: "Part IV" });
    if (answers.applicableCredits.hoh) list.push({ id: "part-v", title: "HOH question", part: "Part V" });
    list.push({ id: "part-vi", title: "Certification & signature", part: "Part VI" });
    return list;
  }, [answers.applicableCredits]);

  const currentStep = steps[step];
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const update = <K extends keyof Form8867Answers>(key: K, value: Form8867Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Validation per step
  const canAdvance = useMemo(() => {
    if (!currentStep) return false;
    switch (currentStep.id) {
      case "scope": {
        const c = answers.applicableCredits;
        return c.eitc || c.ctc || c.aotc || c.hoh;
      }
      case "part-i": {
        // Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8 always required
        const required: YesNo[] = [
          answers.q1, answers.q2, answers.q3, answers.q4,
          answers.q5, answers.q6, answers.q7, answers.q8,
        ];
        if (!required.every((a) => a !== null)) return false;
        // Q4a + Q4b only required if Q4 = Yes
        if (answers.q4 === "yes" && (answers.q4a === null || answers.q4b === null)) return false;
        // Q7a only required if Q7 = Yes
        if (answers.q7 === "yes" && answers.q7a === null) return false;
        return true;
      }
      case "part-ii":
        return [answers.q9a, answers.q9b, answers.q9c].every((a) => a !== null);
      case "part-iii":
        return [answers.q10, answers.q11, answers.q12].every((a) => a !== null);
      case "part-iv":
        return answers.q13 !== null;
      case "part-v":
        return answers.q14 !== null;
      case "part-vi":
        return (
          answers.q15 === "yes" &&
          answers.preparerName.trim() !== "" &&
          answers.signatureDate !== ""
        );
      default:
        return false;
    }
  }, [currentStep, answers]);

  const isLastStep = step === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      if (clientId) {
        saveForm8867Completion({
          clientId,
          clientName,
          clientTINLast4,
          completedAt: new Date().toISOString(),
          answers,
        });
      }
      onComplete();
      onOpenChange(false);
      // Reset for next open
      setTimeout(() => {
        setStep(0);
        setAnswers(defaultAnswers());
      }, 300);
    } else {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[600px] sm:max-w-[600px] flex flex-col p-0">
        {/* ── Header ── */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base">Form 8867 · Due Diligence Checklist</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {clientName} · Tax year {answers.taxYear}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px] font-mono">
              {currentStep?.part}
            </Badge>
          </div>
          {/* Step indicator */}
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{currentStep?.title}</span>
              <span className="tabular-nums">Step {step + 1} of {steps.length}</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </SheetHeader>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep?.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              {currentStep?.id === "scope" && <ScopeStep answers={answers} update={update} />}
              {currentStep?.id === "part-i" && <PartIStep answers={answers} update={update} />}
              {currentStep?.id === "part-ii" && <PartIIStep answers={answers} update={update} />}
              {currentStep?.id === "part-iii" && <PartIIIStep answers={answers} update={update} />}
              {currentStep?.id === "part-iv" && <PartIVStep answers={answers} update={update} />}
              {currentStep?.id === "part-v" && <PartVStep answers={answers} update={update} />}
              {currentStep?.id === "part-vi" && <PartVIStep answers={answers} update={update} clientName={clientName} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer nav ── */}
        <div className="border-t px-6 py-4 shrink-0 bg-background">
          {!canAdvance && step > 0 && (
            <div className="flex items-center gap-2 mb-3 text-[11px] text-amber-600">
              <AlertTriangle className="size-3" />
              <span>Answer all required questions to continue</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={step === 0 ? () => onOpenChange(false) : handleBack}
            >
              {step === 0 ? <><X className="size-3.5" /> Cancel</> : <><ChevronLeft className="size-3.5" /> Back</>}
            </Button>
            <Button
              className="flex-1 gap-1.5"
              disabled={!canAdvance}
              onClick={handleNext}
            >
              {isLastStep ? (
                <><FileCheck className="size-3.5" /> Sign & file Form 8867</>
              ) : (
                <>Continue <ChevronRight className="size-3.5" /></>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Shared helpers ───

function YesNoRow({
  number, label, sublabel, value, onChange, allowNA = false, indent = false,
}: {
  number?: string;
  label: string;
  sublabel?: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  allowNA?: boolean;
  indent?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-3.5", indent && "ml-5 border-l-2 border-l-foreground/10")}>
      <div className="flex items-start gap-2.5">
        {number && (
          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-foreground/5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {number}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] leading-relaxed">{label}</div>
          {sublabel && <div className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</div>}
        </div>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        {(["yes", "no", ...(allowNA ? ["na"] : [])] as YesNo[]).map((opt) => {
          const isSelected = value === opt;
          return (
            <button
              key={opt as string}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                "flex-1 rounded-md border px-3 py-1.5 text-[12px] font-medium transition-all",
                isSelected
                  ? opt === "yes"
                    ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : opt === "no"
                      ? "border-red-500/40 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                      : "border-muted-foreground/40 bg-muted text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/40"
              )}
            >
              {opt === "yes" ? "Yes" : opt === "no" ? "No" : "N/A"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 0 — Scope (applicable credits) ───
function ScopeStep({ answers, update }: { answers: Form8867Answers; update: <K extends keyof Form8867Answers>(k: K, v: Form8867Answers[K]) => void }) {
  const c = answers.applicableCredits;
  const set = (key: keyof typeof c, val: boolean) => {
    update("applicableCredits", { ...c, [key]: val });
  };
  const items: { key: keyof typeof c; label: string; sub: string }[] = [
    { key: "eitc", label: "EIC (Earned Income Tax Credit)", sub: "Schedule EIC required" },
    { key: "ctc", label: "CTC / ACTC / ODC", sub: "Child Tax Credit, Additional CTC, Other Dependent Credit" },
    { key: "aotc", label: "AOTC", sub: "American Opportunity Tax Credit (Form 8863)" },
    { key: "hoh", label: "Head of Household", sub: "Filing status" },
  ];
  return (
    <>
      <div>
        <h3 className="text-sm font-semibold">Which credits or filing status does this return claim?</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Form 8867 is required if any apply. Each adds a section of due-diligence questions.
        </p>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.key}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3.5 transition-colors",
              c[item.key] ? "border-foreground/30 bg-muted/30" : "hover:bg-muted/20"
            )}
          >
            <Checkbox
              checked={c[item.key]}
              onCheckedChange={(v) => set(item.key, !!v)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium">{item.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{item.sub}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="rounded-lg border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/15 p-3 text-[11px] text-amber-800 dark:text-amber-300">
        <strong className="font-semibold">$600+ per failure</strong> per IRC § 6695(g) (inflation-adjusted) — for each return claiming one of these credits or HOH status without a completed Form 8867.
      </div>
    </>
  );
}

// ─── Step 1 — Part I (always required) ───
function PartIStep({ answers, update }: { answers: Form8867Answers; update: <K extends keyof Form8867Answers>(k: K, v: Form8867Answers[K]) => void }) {
  return (
    <>
      <SectionIntro
        title="Part I — Due Diligence Requirements"
        body="To be completed by preparer based on information provided by the taxpayer and information reasonably known."
      />
      <YesNoRow
        number="1"
        label="Did you complete the return based on information for the applicable tax year provided by the taxpayer or reasonably obtained by you?"
        value={answers.q1}
        onChange={(v) => update("q1", v)}
      />
      <YesNoRow
        number="2"
        label="If credits are claimed on the return, did you complete the applicable EIC and/or CTC/ACTC/ODC worksheets found in the Form 1040 (or 8863) instructions, or your own equivalent, and all related forms and schedules for each credit claimed?"
        value={answers.q2}
        onChange={(v) => update("q2", v)}
        allowNA
      />
      <YesNoRow
        number="3"
        label="Did you satisfy the knowledge requirement? To meet this requirement, you must do BOTH of the following:"
        sublabel="• Interview the taxpayer, ask questions, and contemporaneously document the taxpayer's responses; AND • Review information to determine that the taxpayer is eligible to claim the credit(s) and/or HOH filing status."
        value={answers.q3}
        onChange={(v) => update("q3", v)}
      />
      <YesNoRow
        number="4"
        label="Did any information provided by the taxpayer or a third party for use in preparing the return, or information reasonably known to you, appear to be incorrect, incomplete, or inconsistent?"
        sublabel='If "Yes," answer questions 4a and 4b. If "No," go to question 5.'
        value={answers.q4}
        onChange={(v) => update("q4", v)}
      />
      {answers.q4 === "yes" && (
        <>
          <YesNoRow
            number="4a"
            label="Did you make reasonable inquiries to determine the correct, complete, and consistent information?"
            value={answers.q4a}
            onChange={(v) => update("q4a", v)}
            indent
          />
          <YesNoRow
            number="4b"
            label="Did you contemporaneously document your inquiries?"
            sublabel="Documentation should include the questions you asked, whom you asked, when you asked, the information that was provided, and the impact the information had on your preparation of the return."
            value={answers.q4b}
            onChange={(v) => update("q4b", v)}
            indent
          />
        </>
      )}
      <YesNoRow
        number="5"
        label="Did you satisfy the record retention requirement?"
        sublabel="You must keep your inquiries doc (4b), a copy of this Form 8867, a copy of applicable worksheets, a record of how/when/from whom info was obtained, and copies of any documents the taxpayer provided that you relied on — for 3 years."
        value={answers.q5}
        onChange={(v) => update("q5", v)}
      />
      <div className="rounded-lg border bg-card p-3.5 space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          List those documents provided by the taxpayer, if any, that you relied on
        </label>
        <Textarea
          value={answers.q5Documents}
          onChange={(e) => update("q5Documents", e.target.value)}
          placeholder="e.g. Driver's license, W-2, 1099-NEC, Schedule C records, school transcript, …"
          className="min-h-[70px] text-[12px]"
        />
      </div>
      <YesNoRow
        number="6"
        label="Did you ask the taxpayer whether he/she could provide documentation to substantiate eligibility for, and the amount of, the credit(s) and/or HOH filing status if his/her return is selected for audit?"
        value={answers.q6}
        onChange={(v) => update("q6", v)}
      />
      <YesNoRow
        number="7"
        label="Did you ask the taxpayer if any of these credits were disallowed or reduced in a previous year?"
        sublabel="If disallowed/reduced, go to 7a; if not, go to 8."
        value={answers.q7}
        onChange={(v) => update("q7", v)}
        allowNA
      />
      {answers.q7 === "yes" && (
        <YesNoRow
          number="7a"
          label="Did you complete the required recertification Form 8862?"
          value={answers.q7a}
          onChange={(v) => update("q7a", v)}
          allowNA
          indent
        />
      )}
      <YesNoRow
        number="8"
        label="If the taxpayer is reporting self-employment income, did you ask questions to prepare a complete and correct Schedule C (Form 1040)?"
        value={answers.q8}
        onChange={(v) => update("q8", v)}
        allowNA
      />
    </>
  );
}

// ─── Step — Part II — EIC ───
function PartIIStep({ answers, update }: { answers: Form8867Answers; update: <K extends keyof Form8867Answers>(k: K, v: Form8867Answers[K]) => void }) {
  return (
    <>
      <SectionIntro
        title="Part II — Due Diligence Questions for Returns Claiming EIC"
        body="Complete for returns claiming the Earned Income Credit."
      />
      <YesNoRow
        number="9a"
        label="Have you determined that the taxpayer is eligible to claim the EIC for the number of qualifying children claimed, or is eligible to claim the EIC without a qualifying child?"
        sublabel="If claiming EIC without a qualifying child, go to question 10 (skip 9b–9c)."
        value={answers.q9a}
        onChange={(v) => update("q9a", v)}
      />
      <YesNoRow
        number="9b"
        label="Did you ask the taxpayer if the child lived with the taxpayer for over half of the year, even if the taxpayer has supported the child the entire year?"
        value={answers.q9b}
        onChange={(v) => update("q9b", v)}
      />
      <YesNoRow
        number="9c"
        label="Did you explain to the taxpayer the rules about claiming the EIC when a child is the qualifying child of more than one person (tiebreaker rules)?"
        value={answers.q9c}
        onChange={(v) => update("q9c", v)}
        allowNA
      />
    </>
  );
}

// ─── Step — Part III — CTC / ACTC / ODC ───
function PartIIIStep({ answers, update }: { answers: Form8867Answers; update: <K extends keyof Form8867Answers>(k: K, v: Form8867Answers[K]) => void }) {
  return (
    <>
      <SectionIntro
        title="Part III — Due Diligence Questions for Returns Claiming CTC / ACTC / ODC"
        body="Complete for returns claiming the Child Tax Credit, Additional CTC, or Credit for Other Dependents."
      />
      <YesNoRow
        number="10"
        label="Have you determined that each qualifying person for the CTC/ACTC/ODC is the taxpayer's dependent who is a citizen, national, or resident of the United States?"
        value={answers.q10}
        onChange={(v) => update("q10", v)}
      />
      <YesNoRow
        number="11"
        label="Did you explain to the taxpayer that he/she may not claim the CTC/ACTC if the child has not lived with the taxpayer for over half of the year, even if the taxpayer has supported the child — unless the child's custodial parent has released a claim to exemption for the child?"
        value={answers.q11}
        onChange={(v) => update("q11", v)}
        allowNA
      />
      <YesNoRow
        number="12"
        label="Did you explain to the taxpayer the rules about claiming the CTC/ACTC/ODC for a child of divorced or separated parents (or parents who live apart), including any requirement to attach a Form 8332 or similar statement to the return?"
        value={answers.q12}
        onChange={(v) => update("q12", v)}
        allowNA
      />
    </>
  );
}

// ─── Step — Part IV — AOTC ───
function PartIVStep({ answers, update }: { answers: Form8867Answers; update: <K extends keyof Form8867Answers>(k: K, v: Form8867Answers[K]) => void }) {
  return (
    <>
      <SectionIntro
        title="Part IV — Due Diligence Questions for Returns Claiming AOTC"
        body="Complete for returns claiming the American Opportunity Tax Credit."
      />
      <YesNoRow
        number="13"
        label="Did the taxpayer provide substantiation for the credit, such as a Form 1098-T and/or receipts for the qualified tuition and related expenses for the claimed AOTC?"
        value={answers.q13}
        onChange={(v) => update("q13", v)}
      />
    </>
  );
}

// ─── Step — Part V — HOH ───
function PartVStep({ answers, update }: { answers: Form8867Answers; update: <K extends keyof Form8867Answers>(k: K, v: Form8867Answers[K]) => void }) {
  return (
    <>
      <SectionIntro
        title="Part V — Due Diligence Questions for Claiming HOH"
        body="Complete for returns with Head of Household filing status."
      />
      <YesNoRow
        number="14"
        label="Have you determined that the taxpayer was unmarried or considered unmarried on the last day of the tax year and provided more than half of the cost of keeping up a home for the year for a qualifying person?"
        value={answers.q14}
        onChange={(v) => update("q14", v)}
      />
    </>
  );
}

// ─── Step — Part VI — Certification & signature ───
function PartVIStep({
  answers, update, clientName,
}: {
  answers: Form8867Answers;
  update: <K extends keyof Form8867Answers>(k: K, v: Form8867Answers[K]) => void;
  clientName: string;
}) {
  // Default today's date if not set
  if (!answers.signatureDate) {
    setTimeout(() => update("signatureDate", new Date().toISOString().slice(0, 10)), 0);
  }
  return (
    <>
      <SectionIntro
        title="Part VI — Eligibility Certification"
        body="By signing below, you certify that you have complied with all due diligence requirements set forth in Treasury Regulations § 1.6695-2."
      />

      <div className="rounded-lg border bg-muted/20 p-4 space-y-2.5 text-[12px] leading-relaxed text-foreground/80">
        <p>You will have complied with all due diligence requirements if you:</p>
        <ul className="space-y-1.5 pl-1">
          <li className="flex gap-2"><span className="text-foreground/40">A.</span> Interviewed the taxpayer, asked adequate questions, contemporaneously documented responses, reviewed adequate information, and recognized any information that appeared incorrect, inconsistent, or incomplete.</li>
          <li className="flex gap-2"><span className="text-foreground/40">B.</span> Completed this Form 8867 truthfully and accurately for each applicable credit and HOH filing status.</li>
          <li className="flex gap-2"><span className="text-foreground/40">C.</span> Submitted this Form 8867 in the manner required.</li>
          <li className="flex gap-2"><span className="text-foreground/40">D.</span> Kept all five required records (this checklist, worksheets, documents relied on, record of inquiries, copy of return) for 3 years.</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preparer name</label>
          <Input
            value={answers.preparerName}
            onChange={(e) => update("preparerName", e.target.value)}
            className="mt-1.5 text-[13px]"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">PTIN</label>
          <Input
            value={answers.preparerPTIN}
            onChange={(e) => update("preparerPTIN", e.target.value)}
            className="mt-1.5 text-[13px] font-mono"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tax year</label>
          <Input
            value={answers.taxYear}
            onChange={(e) => update("taxYear", e.target.value)}
            className="mt-1.5 text-[13px]"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Signature date</label>
          <Input
            type="date"
            value={answers.signatureDate}
            onChange={(e) => update("signatureDate", e.target.value)}
            className="mt-1.5 text-[13px]"
          />
        </div>
      </div>

      {/* Q15 — the actual IRS certification question, rendered as a prominent
          confirmation box that maps to q15 = "yes" / "no". */}
      <label className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors",
        answers.q15 === "yes"
          ? "border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/15"
          : "border-dashed border-border hover:bg-muted/20"
      )}>
        <Checkbox
          checked={answers.q15 === "yes"}
          onCheckedChange={(v) => update("q15", v ? "yes" : null)}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium leading-snug">
            <span className="inline-flex size-5 mr-1.5 items-center justify-center rounded bg-foreground/5 text-[10px] font-semibold tabular-nums text-muted-foreground align-middle">15</span>
            I certify that all answers on this Form 8867 are, to the best of my knowledge, true, correct, and complete — for {clientName}&apos;s return.
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            This electronic signature has the same effect as a physical signature on the IRS Form 8867 PDF.
          </div>
        </div>
      </label>
    </>
  );
}

function SectionIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-b border-border/40 pb-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
