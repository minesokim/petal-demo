"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Check, ChevronRight, Building2, User, Calendar,
  CreditCard, FileText, DollarSign, Plus, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type OnboardingStep = "welcome" | "firm" | "tiers" | "calendar" | "templates" | "first_client" | "complete";

const steps: { key: OnboardingStep; label: string }[] = [
  { key: "welcome", label: "Welcome" },
  { key: "firm", label: "Firm" },
  { key: "tiers", label: "Pricing" },
  { key: "calendar", label: "Calendar" },
  { key: "templates", label: "Templates" },
  { key: "first_client", label: "First Client" },
  { key: "complete", label: "Done" },
];

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [connecting, setConnecting] = useState(false);
  const stepIndex = steps.findIndex(s => s.key === step);
  const progress = (stepIndex / (steps.length - 1)) * 100;

  const next = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < steps.length) setStep(steps[nextIdx].key);
  };

  const connectService = (callback: () => void) => {
    setConnecting(true);
    setTimeout(() => { setConnecting(false); callback(); }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        {/* Progress bar */}
        <Progress value={progress} className="h-1" />

        <AnimatePresence mode="wait">
          {/* Welcome */}
          {step === "welcome" && (
            <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6 text-center">
              <div className="font-display text-3xl font-bold tracking-tight">Welcome to Petal</div>
              <p className="mt-2 text-sm text-muted-foreground">Let's set up your practice in under 5 minutes.</p>
              <Button className="mt-6" onClick={next}>Get started <ChevronRight className="size-3.5" /></Button>
            </motion.div>
          )}

          {/* Firm Profile */}
          {step === "firm" && (
            <motion.div key="firm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Your firm</DialogTitle>
                <DialogDescription>Basic information about your practice</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><label className="text-xs font-medium text-muted-foreground">Firm Name</label><Input defaultValue="Vazant Consulting" className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Your Name</label><Input defaultValue="Antonio Vazquez, EA" className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium text-muted-foreground">PTIN</label><Input placeholder="P01234567" className="mt-1" /></div>
                  <div><label className="text-xs font-medium text-muted-foreground">Phone</label><Input placeholder="(951) 555-0100" className="mt-1" /></div>
                </div>
              </div>
              <Button className="w-full" onClick={next}>Continue <ChevronRight className="size-3.5" /></Button>
            </motion.div>
          )}

          {/* Service Tiers */}
          {step === "tiers" && (
            <motion.div key="tiers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Service tiers</DialogTitle>
                <DialogDescription>Set your pricing. You can change this anytime.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {[
                  { name: "Basic (1040)", price: "150" },
                  { name: "Standard (1040 + Schedules)", price: "350" },
                  { name: "Premium (Business + Personal)", price: "500" },
                ].map(tier => (
                  <div key={tier.name} className="flex items-center gap-3 rounded-xl border p-3">
                    <div className="flex-1 text-sm">{tier.name}</div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">$</span>
                      <Input defaultValue={tier.price} className="h-8 w-20 text-right font-display tabular-nums" />
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={next}>Continue <ChevronRight className="size-3.5" /></Button>
            </motion.div>
          )}

          {/* Connect Calendar */}
          {step === "calendar" && (
            <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Connect your calendar</DialogTitle>
                <DialogDescription>Sync appointments and generate meeting links</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <button onClick={() => connectService(next)} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50">
                  <Calendar className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Google Calendar</div>
                    <div className="text-xs text-muted-foreground">Sync appointments, send Google Meet links</div>
                  </div>
                  {connecting ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                </button>
                <button onClick={() => connectService(next)} className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-muted/50">
                  <CreditCard className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">Stripe</div>
                    <div className="text-xs text-muted-foreground">Collect deposits and payments</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              </div>
              <Button variant="ghost" className="w-full" onClick={next}>Skip for now</Button>
            </motion.div>
          )}

          {/* Templates */}
          {step === "templates" && (
            <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Upload templates</DialogTitle>
                <DialogDescription>Your engagement letter and consent forms</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-xl border border-dashed p-4">
                  <FileText className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Engagement Letter</div>
                    <div className="text-xs text-muted-foreground">Upload your template or use ours</div>
                  </div>
                  <Button size="sm" variant="outline">Upload</Button>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-dashed p-4">
                  <FileText className="size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">7216 Consent Form</div>
                    <div className="text-xs text-muted-foreground">Required for third-party processing</div>
                  </div>
                  <Button size="sm" variant="outline">Upload</Button>
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Don't have templates? We'll provide compliant defaults that you can customize later.</p>
              </div>
              <Button className="w-full" onClick={next}>Continue <ChevronRight className="size-3.5" /></Button>
            </motion.div>
          )}

          {/* First Client */}
          {step === "first_client" && (
            <motion.div key="first_client" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Add your first client</DialogTitle>
                <DialogDescription>Start with one client to see how it works</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div><label className="text-xs font-medium text-muted-foreground">Client Name</label><Input placeholder="e.g. Marcus Chen" className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input placeholder="marcus@email.com" className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Phone</label><Input placeholder="(555) 123-4567" className="mt-1" /></div>
              </div>
              <Button className="w-full" onClick={next}><Plus className="size-3.5" /> Add client and finish</Button>
              <Button variant="ghost" className="w-full" onClick={next}>Skip - I'll add clients later</Button>
            </motion.div>
          )}

          {/* Complete */}
          {step === "complete" && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500 mb-4">
                <Check className="size-7 text-white" />
              </div>
              <div className="font-display text-xl font-bold">You're all set</div>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                Your practice is ready. Send intake forms, collect documents, and let Petal handle the rest.
              </p>
              <Button className="mt-6" onClick={() => onOpenChange(false)}>Go to dashboard</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
