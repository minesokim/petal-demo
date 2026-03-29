"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Check, FileText, DollarSign, Shield, ChevronRight,
  Send, Loader2, ScrollText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type FlowStep = "tier" | "proposal" | "engagement" | "consent" | "complete";

const tiers = [
  { id: "basic", name: "Basic", price: 150, description: "Individual 1040 return", includes: ["Federal return", "State return", "E-filing", "Basic support"] },
  { id: "standard", name: "Standard", price: 350, description: "1040 with schedules (C, E, etc.)", includes: ["Everything in Basic", "Schedule C/E/SE", "Estimated payments", "Priority support"] },
  { id: "premium", name: "Premium", price: 500, description: "Business + personal returns", includes: ["Everything in Standard", "1120S or 1065", "Payroll review", "Year-round advisory"] },
];

interface ProposalDialogProps {
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProposalDialog({ clientName, open, onOpenChange }: ProposalDialogProps) {
  const [step, setStep] = useState<FlowStep>("tier");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [engagementScrolled, setEngagementScrolled] = useState(false);
  const [consentScrolled, setConsentScrolled] = useState(false);
  const [sending, setSending] = useState(false);

  const tier = tiers.find(t => t.id === selectedTier);
  const stepIndex = ["tier", "proposal", "engagement", "consent", "complete"].indexOf(step);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => { setStep("tier"); setSelectedTier(null); setEngagementScrolled(false); setConsentScrolled(false); }, 300);
  };

  const handleSendProposal = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setStep("engagement"); }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "tier" && "Select Service Tier"}
            {step === "proposal" && "Review Proposal"}
            {step === "engagement" && "Engagement Letter"}
            {step === "consent" && "IRC 7216 Consent"}
            {step === "complete" && "All Set"}
          </DialogTitle>
          <DialogDescription>
            {step === "tier" && `Choose a service tier for ${clientName}`}
            {step === "proposal" && `Proposal for ${clientName}`}
            {step === "engagement" && "Client must agree before proceeding"}
            {step === "consent" && "Required for third-party data processing"}
            {step === "complete" && `${clientName} is ready to begin`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex items-center gap-1">
          {["Tier", "Proposal", "Engagement", "7216", "Done"].map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1 rounded-full ${i <= stepIndex ? "bg-primary" : "bg-muted"}`} />
              <div className={`mt-1 text-center text-[9px] ${i <= stepIndex ? "text-foreground font-medium" : "text-muted-foreground"}`}>{label}</div>
            </div>
          ))}
        </div>

        <Separator />

        <AnimatePresence mode="wait">
          {/* Step 1: Tier Selection */}
          {step === "tier" && (
            <motion.div key="tier" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {tiers.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTier(t.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${selectedTier === t.id ? "border-primary ring-1 ring-primary/20" : "hover:bg-muted/50"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{t.name}</span>
                    <span className="font-display text-lg tabular-nums tracking-tight">${t.price}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.includes.map(item => (
                      <span key={item} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Check className="size-2.5 text-emerald-500" /> {item}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
              <Button className="w-full" disabled={!selectedTier} onClick={() => setStep("proposal")}>
                Continue <ChevronRight className="size-3.5" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Proposal Review */}
          {step === "proposal" && tier && (
            <motion.div key="proposal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <Card>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Service: {tier.name}</span>
                    <span className="font-display text-xl tabular-nums tracking-tight">${tier.price}</span>
                  </div>
                  <Separator />
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between"><span>Service fee</span><span>${tier.price}.00</span></div>
                    <div className="flex justify-between"><span>Deposit (due now)</span><span>$50.00</span></div>
                    <div className="flex justify-between"><span>Balance (due before 8879)</span><span>${tier.price - 50}.00</span></div>
                  </div>
                  <Separator />
                  <div className="text-xs text-muted-foreground">
                    <strong>Cancellation:</strong> Appointments cancelled more than 48 hours in advance receive a full refund. Late cancellations forfeit the deposit.
                  </div>
                </CardContent>
              </Card>
              <Button className="w-full" onClick={handleSendProposal} disabled={sending}>
                {sending ? <><Loader2 className="size-3.5 animate-spin" /> Sending...</> : <><Send className="size-3.5" /> Send proposal to {clientName}</>}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep("tier")}>Back</Button>
            </motion.div>
          )}

          {/* Step 3: Engagement Letter */}
          {step === "engagement" && (
            <motion.div key="engagement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                className="max-h-[300px] overflow-y-auto rounded-xl border p-4 text-xs leading-relaxed text-muted-foreground"
                onScroll={(e) => {
                  const el = e.target as HTMLElement;
                  if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setEngagementScrolled(true);
                }}
              >
                <h4 className="mb-2 text-sm font-semibold text-foreground">Engagement Letter</h4>
                <p className="mb-2"><strong>1. Scope of Service.</strong> The Preparer will prepare your individual income tax return (Form 1040) along with applicable schedules and forms based on the information you provide.</p>
                <p className="mb-2"><strong>2. Client Responsibilities.</strong> You are responsible for providing complete, accurate, and timely information including all income documents, expense records, and prior year returns.</p>
                <p className="mb-2"><strong>3. Fees and Payment.</strong> A non-refundable deposit of $50.00 is required to secure your appointment. The remaining balance is due before Form 8879 is released for signature.</p>
                <p className="mb-2"><strong>4. Cancellation Policy.</strong> Appointments cancelled more than 48 hours in advance receive a full refund. Late cancellations or no-shows forfeit the deposit.</p>
                <p className="mb-2"><strong>5. Confidentiality.</strong> Client information will be maintained in accordance with IRC Section 7216.</p>
                <p className="mb-2"><strong>6. Electronic Filing.</strong> By signing Form 8879, you authorize electronic filing. The Preparer will not file until you have reviewed, paid, and signed.</p>
                <p className="mb-2"><strong>7. Data Security.</strong> All data stored with AES-256 encryption at rest and TLS 1.2+ in transit. WISP maintained per IRS Publication 4557.</p>
                <p className="mb-2"><strong>8. Term.</strong> This engagement covers the 2025 tax year.</p>
                {!engagementScrolled && <p className="mt-4 text-center text-muted-foreground">↓ Scroll to bottom to continue</p>}
              </div>
              <Button className="mt-3 w-full" disabled={!engagementScrolled} onClick={() => setStep("consent")}>
                {engagementScrolled ? "I Agree - Continue" : "Scroll to bottom to agree"}
              </Button>
            </motion.div>
          )}

          {/* Step 4: 7216 Consent */}
          {step === "consent" && (
            <motion.div key="consent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                className="max-h-[300px] overflow-y-auto rounded-xl border p-4 text-xs leading-relaxed text-muted-foreground"
                onScroll={(e) => {
                  const el = e.target as HTMLElement;
                  if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setConsentScrolled(true);
                }}
              >
                <h4 className="mb-2 text-sm font-semibold text-foreground">IRC Section 7216 Consent</h4>
                <p className="mb-2"><strong>Authorized Uses.</strong> To prepare and file your federal and state returns for 2025. To communicate with taxing authorities on your behalf. To store and process your information using encrypted systems.</p>
                <p className="mb-2"><strong>Information Covered.</strong> Name, SSN, date of birth, address, income records, deduction records, financial accounts, employment info, dependent info, and all other necessary information.</p>
                <p className="mb-2"><strong>Duration.</strong> Effective from signature date until December 31, 2026, or until revoked in writing.</p>
                <p className="mb-2"><strong>Your Rights.</strong> You are not required to sign. Without consent, the Preparer cannot prepare your return. Information will not be disclosed to unidentified third parties.</p>
                <p className="mb-2"><strong>Penalties.</strong> Unauthorized use is a violation of IRC Section 7216, punishable as a misdemeanor with up to $1,000 in fines and one year imprisonment per violation.</p>
                <p className="mb-2 text-[10px]"><strong>TIGTA Notice:</strong> If you believe your tax return information has been disclosed or used improperly, you may contact the Treasury Inspector General for Tax Administration (TIGTA).</p>
                {!consentScrolled && <p className="mt-4 text-center text-muted-foreground">↓ Scroll to bottom to continue</p>}
              </div>
              <Button className="mt-3 w-full" disabled={!consentScrolled} onClick={() => setStep("complete")}>
                {consentScrolled ? "I Consent - Complete" : "Scroll to bottom to consent"}
              </Button>
            </motion.div>
          )}

          {/* Step 5: Complete */}
          {step === "complete" && (
            <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500 mb-4">
                <Check className="size-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Ready to go</h3>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Proposal sent, engagement letter signed, and 7216 consent collected for {clientName}. They can now begin uploading documents.
              </p>
              <Button className="mt-6" onClick={handleClose}>Done</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
