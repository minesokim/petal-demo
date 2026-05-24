"use client";

import { useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Loader2, FileText, DollarSign, Shield } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type Client, stageLabels } from "@/lib/mock-data";

type SignState = "review" | "signing" | "signed";

interface EroSignatureDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function EroSignatureDialog({ client, open, onOpenChange, onComplete }: EroSignatureDialogProps) {
  const [state, setState] = useState<SignState>("review");
  const [checked, setChecked] = useState(false);

  if (!client) return null;

  const handleSign = () => {
    setState("signing");
    setTimeout(() => {
      setState("signed");
      // Fire confetti
      const colors = ["#ef4444", "#eab308", "#3b82f6", "#10b981", "#8b5cf6"];
      const slow = { gravity: 0.6, ticks: 300 };
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors, ...slow });
      setTimeout(() => {
        confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0 }, colors, ...slow });
        confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1 }, colors, ...slow });
      }, 400);
      // Call onComplete immediately when signed
      if (onComplete) onComplete();
    }, 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => { setState("review"); setChecked(false); }, 300);
  };

  // Sub-steps for Pay & Sign stage
  const subSteps = [
    { label: "Client payment received", done: true },
    { label: "Client signed Form 8879", done: true },
    { label: "ERO signature (you)", done: state === "signed" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-4" /> ERO Signature
          </DialogTitle>
          <DialogDescription>Sign as Electronic Return Originator to file</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {state === "review" && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Client info */}
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={client.avatar} alt={client.fullName} />
                  <AvatarFallback>{client.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-semibold">{client.fullName}</div>
                  <div className="text-xs text-muted-foreground">{client.businessName || client.serviceTier}</div>
                </div>
              </div>

              {/* Return summary */}
              <div className="rounded-xl border p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Filing status</span><span className="font-medium">{client.filingStatus.toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Service tier</span><span className="font-medium">{client.serviceTier} - ${client.feeAmount}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Documents</span><span className="font-medium">{client.documentsSubmitted}/{client.documentsRequired}</span></div>
              </div>

              {/* Pay & Sign sub-steps */}
              <div className="space-y-2">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Pay & Sign checklist</div>
                {subSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <div className={`flex size-5 items-center justify-center rounded-full ${step.done ? "bg-emerald-500" : "border-2 border-amber-400"}`}>
                      {step.done && <Check className="size-3 text-white" />}
                    </div>
                    <span className={`text-sm ${step.done ? "text-muted-foreground" : "font-medium"}`}>{step.label}</span>
                    {!step.done && <Badge variant="secondary" className="ml-auto text-[10px]">Pending</Badge>}
                  </div>
                ))}
              </div>

              <Separator />

              {/* ERO confirmation */}
              <div className="rounded-xl border p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
                  <div className="text-xs leading-relaxed text-muted-foreground">
                    I, <span className="font-semibold text-foreground">Antonio Vazquez, EA</span> (PTIN: P01234567), confirm I have reviewed this return, verified the information is complete and accurate, and am signing as the Electronic Return Originator under IRS regulations.
                  </div>
                </label>
              </div>

              <Button className="w-full" disabled={!checked} onClick={handleSign}>
                <Shield className="size-3.5" /> Sign & e-file
              </Button>
            </motion.div>
          )}

          {state === "signing" && (
            <motion.div key="signing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-10">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="mt-3 text-sm font-medium">Signing and filing...</p>
              <p className="text-xs text-muted-foreground">Submitting to IRS via e-file</p>
            </motion.div>
          )}

          {state === "signed" && (
            <motion.div key="signed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500 mb-4">
                <Check className="size-7 text-white" />
              </div>
              <div className="text-lg font-semibold">Return filed</div>
              <p className="mt-1 text-sm text-muted-foreground">{client.fullName}'s return has been submitted to the IRS.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 w-full">
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Confirmation</div>
                  <div className="font-mono text-sm font-medium mt-0.5">IRS-2026-{Math.random().toString(36).slice(2, 8).toUpperCase()}</div>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <div className="text-xs text-muted-foreground">Filed at</div>
                  <div className="text-sm font-medium mt-0.5">{new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Confirmation sent to both you and {client.fullName.split(" ")[0]}.</p>
              <Button className="mt-4" onClick={handleClose}>Done</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
