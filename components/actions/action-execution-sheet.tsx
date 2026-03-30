"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import TrackingTimeline, { type TimelineItem } from "@/components/ui/tracking-timeline";
import {
  Send, Check, X, Clock, FileText, Signature, Calendar,
  DollarSign, ArrowRight, AlertTriangle, Bell, ExternalLink,
  Loader2, Sparkles, CreditCard, Phone, Video
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { type FeedAction, type DemoState, calendarSlots, missingDocChecklists, escalationStates } from "@/lib/actions-mock-data";

interface ActionExecutionSheetProps {
  action: FeedAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActionExecutionSheet({ action, open, onOpenChange }: ActionExecutionSheetProps) {
  const [state, setState] = useState<DemoState>("idle");
  const [editDraft, setEditDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  if (!action) return null;

  const reset = () => {
    setState("idle");
    setIsEditing(false);
    setEditDraft("");
  };

  const handleProcess = () => {
    setState("processing");
    setTimeout(() => setState("complete"), 1500);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const renderDemo = () => {
    switch (action.type) {
      case "request_docs":
        return <DocumentRequestDemo action={action} state={state} onProcess={handleProcess} />;
      case "send_signature":
        return <SignatureDemo action={action} state={state} onProcess={handleProcess} />;
      case "schedule_appointment":
        return <ScheduleDemo action={action} state={state} onProcess={handleProcess} />;
      case "appointment_reminder":
        return <ReminderDemo action={action} state={state} onProcess={handleProcess} />;
      case "send_payment_link":
        return <PaymentDemo action={action} state={state} onProcess={handleProcess} />;
      case "advance_stage":
        return <StageAdvanceDemo action={action} state={state} onProcess={handleProcess} />;
      case "file_extension":
        return <ExtensionDemo action={action} state={state} onProcess={handleProcess} />;
      case "flag_review":
        return <FlagReviewDemo action={action} state={state} onProcess={handleProcess} />;
      case "escalate":
        return <EscalationDemo action={action} state={state} onProcess={handleProcess} />;
      case "portal_nudge":
      case "ero_signature":
        return <EroSignDemo action={action} state={state} onProcess={handleProcess} />;
        return <NudgeDemo action={action} state={state} onProcess={handleProcess} />;
      default:
        return <GenericDemo action={action} state={state} onProcess={handleProcess} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={action.clientAvatar} alt={action.clientName} />
              <AvatarFallback>{action.clientName.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-base">{action.title}</DialogTitle>
              <DialogDescription>{action.clientName}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-muted-foreground text-sm leading-relaxed">{action.description}</p>
        </div>

        <Separator className="my-4" />

        {/* AI Draft section if available */}
        {action.aiDraft && !isEditing && state === "idle" && (
          <div className="mb-4 rounded-xl border p-4">
            <div className="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase tracking-wider">Suggested message</div>
            <p className="text-muted-foreground text-sm leading-relaxed">{editDraft || action.aiDraft}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={handleProcess}><Send className="size-3.5" /> Send as Antonio</Button>
              <Button size="sm" variant="outline" onClick={() => { setEditDraft(action.aiDraft || ""); setIsEditing(true); }}><FileText className="size-3.5" /> Edit</Button>
            </div>
          </div>
        )}

        {/* Edit mode */}
        {isEditing && state === "idle" && (
          <div className="mb-4 rounded-xl border p-4">
            <div className="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase tracking-wider">Edit message</div>
            <Textarea value={editDraft} onChange={e => setEditDraft(e.target.value)} className="min-h-[100px] text-sm" />
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={() => { setIsEditing(false); handleProcess(); }}><Check className="size-3.5" /> Send</Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}><X className="size-3.5" /> Cancel</Button>
            </div>
          </div>
        )}

        {/* Processing state */}
        <AnimatePresence mode="wait">
          {state === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 py-6"
            >
              <motion.div
                className="size-5 rounded-full border-2 border-primary border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              <span className="text-muted-foreground text-sm">Processing...</span>
            </motion.div>
          )}

          {state === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border bg-emerald-50 p-4 dark:bg-emerald-950/20"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500">
                <Check className="size-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">Done</div>
                <div className="text-muted-foreground text-xs">Action completed for {action.clientName}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Type-specific demo content */}
        {state === "idle" && !action.aiDraft && renderDemo()}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// DEMO COMPONENTS (inline for now, can be extracted later)
// ============================================================

function DocumentRequestDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  const docs = missingDocChecklists[action.clientId] || [];
  return (
    <div className="space-y-3">
      <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Document checklist</div>
      {docs.map((doc, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <div className={`flex size-6 items-center justify-center rounded-full ${
            doc.status === "received" ? "bg-emerald-100 dark:bg-emerald-900/50" :
            doc.status === "partial" ? "bg-amber-100 dark:bg-amber-900/50" :
            "bg-red-100 dark:bg-red-900/50"
          }`}>
            {doc.status === "received" ? <Check className="size-3 text-emerald-600" /> :
             doc.status === "partial" ? <Clock className="size-3 text-amber-600" /> :
             <X className="size-3 text-red-600" />}
          </div>
          <span className="text-sm">{doc.doc}</span>
          <Badge variant="outline" className="ml-auto text-[10px]">{doc.status}</Badge>
        </div>
      ))}
      <Button className="w-full" onClick={onProcess}><Send className="size-3.5" /> Send checklist to portal</Button>
    </div>
  );
}

function SignatureDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  const paymentConfirmed = action.clientId !== "c4"; // DeShawn hasn't paid
  const [shook, setShook] = useState(false);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="text-sm font-semibold">Form 8879 - IRS e-file Signature Authorization</div>
        <div className="text-muted-foreground mt-1 text-xs">Electronic signature for {action.clientName}</div>
      </div>
      <div className="flex items-center justify-between rounded-xl border p-4">
        <span className="text-sm">Payment status</span>
        {paymentConfirmed ? (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Confirmed</Badge>
        ) : (
          <Badge variant="destructive">Payment Required</Badge>
        )}
      </div>
      <motion.div animate={shook ? { x: [0, -4, 4, -4, 4, 0] } : {}} transition={{ duration: 0.3 }}>
        <Button
          className="w-full"
          onClick={() => {
            if (paymentConfirmed) onProcess();
            else setShook(true);
            setTimeout(() => setShook(false), 400);
          }}
          disabled={!paymentConfirmed}
        >
          <Signature className="size-3.5" /> Send for signature
        </Button>
      </motion.div>
      {!paymentConfirmed && (
        <p className="text-center text-xs text-red-500">Payment must be collected before Form 8879 can be sent.</p>
      )}
    </div>
  );
}

function ScheduleDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Available time slots</div>
      {calendarSlots.map(slot => (
        <button
          key={slot.id}
          onClick={() => setSelected(slot.id)}
          className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected === slot.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Calendar className="text-muted-foreground size-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{slot.date} &middot; {slot.startTime} - {slot.endTime}</div>
            {slot.isAiSuggested && <div className="text-xs text-emerald-600">{slot.reason}</div>}
          </div>
          {slot.isAiSuggested && <Badge variant="outline" className="text-[10px]">Suggested</Badge>}
        </button>
      ))}
      <Button className="w-full" disabled={!selected} onClick={onProcess}>
        <Send className="size-3.5" /> Send invite
      </Button>
    </div>
  );
}

function ReminderDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="flex items-center gap-2">
          <Video className="text-muted-foreground size-4" />
          <div>
            <div className="text-sm font-semibold">Video Call - S-Corp Return Review</div>
            <div className="text-muted-foreground text-xs">Today, 2:00 - 3:00 PM &middot; Google Meet</div>
          </div>
        </div>
      </div>
      <Button className="w-full" onClick={onProcess}><Bell className="size-3.5" /> Send reminder now</Button>
    </div>
  );
}

function PaymentDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Amount due</span>
          <span className="font-display text-xl tracking-tight tabular-nums">$150.00</span>
        </div>
        <Separator className="my-3" />
        <div className="text-muted-foreground space-y-1 text-xs">
          <div className="flex justify-between"><span>Service</span><span>Basic Return (1040)</span></div>
          <div className="flex justify-between"><span>Deposit required</span><span>$50.00</span></div>
          <div className="flex justify-between"><span>Days overdue</span><span className="text-red-500">10 days</span></div>
        </div>
      </div>
      <Button className="w-full" onClick={onProcess}><CreditCard className="size-3.5" /> Generate Stripe payment link</Button>
    </div>
  );
}

function StageAdvanceDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  const stages = ["New Intake", "Collecting", "Ready to Prep", "In Preparation", "Client Review", "Pay & Sign", "Filed"];
  const currentIndex = 2; // ready_to_prep
  return (
    <div className="space-y-4">
      <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Pipeline advancement</div>
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <div key={s} className="flex flex-1 flex-col items-center gap-1">
            <div className={`flex size-6 items-center justify-center rounded-full text-[8px] font-bold ${
              i < currentIndex ? "bg-primary text-primary-foreground" :
              i === currentIndex ? "border-2 border-primary bg-primary/20" :
              i === currentIndex + 1 ? "border-2 border-dashed border-primary/50" :
              "bg-muted"
            }`}>
              {i < currentIndex ? <Check className="size-3" /> : i + 1}
            </div>
            <span className="text-center text-[8px] text-muted-foreground leading-tight">{s}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-3 text-center">
        <span className="text-sm"><strong>Docs Complete</strong> → <strong>In Prep</strong></span>
      </div>
      <Button className="w-full" onClick={onProcess}><ArrowRight className="size-3.5" /> Advance stage</Button>
    </div>
  );
}

function ExtensionDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="text-sm font-semibold">Form 4868 - Application for Extension</div>
        <div className="text-muted-foreground mt-1 text-xs">Extends filing deadline to October 15, 2026</div>
        <Separator className="my-3" />
        <div className="text-muted-foreground space-y-1 text-xs">
          <div className="flex justify-between"><span>Client</span><span>{action.clientName}</span></div>
          <div className="flex justify-between"><span>Filing status</span><span>Married Filing Jointly</span></div>
          <div className="flex justify-between"><span>Estimated tax liability</span><span>TBD</span></div>
        </div>
      </div>
      <Button className="w-full" onClick={onProcess}><FileText className="size-3.5" /> Prepare Form 4868</Button>
    </div>
  );
}

function FlagReviewDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="text-sm font-semibold">Return prepared and ready for your review</div>
        <div className="text-muted-foreground mt-2 space-y-1 text-xs">
          <div>{action.description}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={onProcess}><Check className="size-3.5" /> Start review</Button>
        <Button variant="outline" className="flex-1"><Clock className="size-3.5" /> Review later</Button>
      </div>
    </div>
  );
}

function EscalationDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  const esc = escalationStates.find(e => e.clientId === action.clientId);
  const levels: TimelineItem[] = [
    { id: 1, title: "Initial Reminder", date: esc?.history[0]?.date || "Pending", status: (esc?.currentLevel === "reminder" ? "in-progress" : esc ? "completed" : "pending") },
    { id: 2, title: "Urgent Follow-up", date: esc?.history[1]?.date || "Pending", status: (esc?.currentLevel === "urgent" ? "in-progress" : (esc?.attemptCount || 0) >= 2 ? "completed" : "pending") },
    { id: 3, title: "Schedule Call", date: "Pending", status: (esc?.currentLevel === "schedule_call" ? "in-progress" : "pending") },
    { id: 4, title: "Final Notice", date: "Pending", status: "pending" },
  ];
  return (
    <div className="space-y-4">
      <div className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Escalation timeline</div>
      <TrackingTimeline items={levels} />
      <div className="text-muted-foreground text-xs">{esc?.daysSinceLastActivity || 0} days since last client activity &middot; {esc?.attemptCount || 0} attempts made</div>
      <Button className="w-full" onClick={onProcess}><AlertTriangle className="size-3.5" /> Escalate to next level</Button>
    </div>
  );
}

function NudgeDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase tracking-wider">Portal engagement</div>
        <div className="text-muted-foreground space-y-1 text-xs">
          <div className="flex justify-between"><span>Last action</span><span>Intake link sent</span></div>
          <div className="flex justify-between"><span>Days since</span><span className="text-amber-500">2 days</span></div>
          <div className="flex justify-between"><span>Portal logins</span><span>Never</span></div>
        </div>
      </div>
      {action.aiDraft ? null : (
        <Button className="w-full" onClick={onProcess}><Send className="size-3.5" /> Send nudge</Button>
      )}
    </div>
  );
}

function GenericDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  return (
    <div className="space-y-4">
      <Button className="w-full" onClick={onProcess}><Check className="size-3.5" /> Execute action</Button>
    </div>
  );
}

function EroSignDemo({ action, state, onProcess }: { action: FeedAction; state: DemoState; onProcess: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {[
          { label: "Client payment received", done: true },
          { label: "Client signed Form 8879", done: true },
          { label: "ERO signature (you)", done: false },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-2.5">
            <div className={`flex size-5 items-center justify-center rounded-full ${step.done ? "bg-emerald-500" : "border-2 border-amber-400"}`}>
              {step.done && <Check className="size-3 text-white" />}
            </div>
            <span className="text-sm">{step.label}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />
          <span className="text-xs text-muted-foreground">I confirm I have reviewed this return and am signing as ERO under IRS regulations.</span>
        </label>
      </div>
      <Button className="w-full" disabled={!confirmed} onClick={onProcess}>Sign as ERO & file return</Button>
    </div>
  );
}
