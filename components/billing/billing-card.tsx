"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Send } from "lucide-react";
import { getClientPaymentSummary, type Client } from "@/lib/mock-data";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function BillingCard({ client }: { client: Client }) {
  const [sentBilling, setSentBilling] = useState<string | null>(null);
  const ps = getClientPaymentSummary(client.id);
  const percent = ps.totalFee > 0 ? Math.round((ps.totalPaid / ps.totalFee) * 100) : 0;

  const events: { date: string; label: string; type: "paid" | "sent" | "pending" | "overdue" }[] = [];
  if (ps.deposit?.paidDate) events.push({ date: ps.deposit.paidDate, label: `Deposit paid — $${ps.deposit.amount}`, type: "paid" });
  if (ps.deposit?.sentDate && ps.deposit.status !== "paid") events.push({ date: ps.deposit.sentDate, label: `Deposit invoice sent — $${ps.deposit.amount}`, type: ps.deposit.status === "overdue" ? "overdue" : "sent" });
  if (ps.balance?.paidDate) events.push({ date: ps.balance.paidDate, label: `Balance paid — $${ps.balance.amount}`, type: "paid" });
  if (ps.balance?.sentDate && ps.balance.status !== "paid") events.push({ date: ps.balance.sentDate, label: `Balance invoice sent — $${ps.balance.amount}`, type: ps.balance.status === "overdue" ? "overdue" : "sent" });
  events.sort((a, b) => a.date.localeCompare(b.date));

  const remainingLabel = ps.fullyPaid
    ? "Paid in full"
    : ps.hasOverdue
      ? `$${ps.totalOwed} overdue`
      : `$${ps.totalOwed} remaining`;
  const remainingClass = ps.fullyPaid ? "text-emerald-600" : ps.hasOverdue ? "text-red-500" : "text-muted-foreground";
  const barClass = ps.fullyPaid ? "bg-emerald-500" : ps.hasOverdue ? "bg-red-500" : "bg-foreground/80";

  const showBalance = ps.balance && ps.balance.status !== "not_applicable";
  const showActions = !ps.fullyPaid && (
    ps.deposit?.status === "overdue" ||
    ps.balance?.status === "pending" ||
    ps.balance?.status === "sent"
  );

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Header — title + total */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{client.serviceTier} Return</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Total fee · ${ps.totalFee.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl leading-none tracking-tight tabular-nums">
              ${ps.totalPaid.toLocaleString()}
              <span className="ml-1 align-baseline text-[11px] font-sans font-normal text-muted-foreground">of ${ps.totalFee.toLocaleString()}</span>
            </div>
            <p className={`mt-1.5 text-[11px] font-medium ${remainingClass}`}>{remainingLabel}</p>
          </div>
        </div>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full transition-all ${barClass}`} style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Line items */}
      <div className="border-t border-border/40 px-5 py-3.5">
        <Line
          label="Deposit"
          amount={ps.deposit?.amount ?? 0}
          status={
            ps.deposit?.status === "paid" && ps.deposit.paidDate
              ? { text: `Paid ${formatDate(ps.deposit.paidDate)}`, tone: "positive" }
              : ps.deposit?.status === "overdue"
                ? { text: "Overdue", tone: "danger" }
                : { text: "Pending", tone: "muted" }
          }
        />
        {showBalance && ps.balance && (
          <Line
            label="Balance"
            amount={ps.balance.amount}
            status={
              ps.balance.status === "paid" && ps.balance.paidDate
                ? { text: `Paid ${formatDate(ps.balance.paidDate)}`, tone: "positive" }
                : ps.balance.status === "sent"
                  ? { text: "Invoice sent", tone: "muted" }
                  : { text: "Not invoiced", tone: "muted" }
            }
          />
        )}
      </div>

      {/* Activity timeline */}
      {events.length > 0 && (
        <div className="border-t border-border/40 px-5 py-3.5">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Activity</div>
          <div className="space-y-1.5">
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <div className={`size-1.5 shrink-0 rounded-full ${e.type === "paid" ? "bg-emerald-500" : e.type === "overdue" ? "bg-red-500" : "bg-muted-foreground/40"}`} />
                <span className="w-12 shrink-0 tabular-nums text-muted-foreground/70">{formatDate(e.date)}</span>
                <span className="text-foreground/80">{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2 border-t border-border/40 bg-muted/30 px-5 py-3">
          {ps.deposit?.status === "overdue" && (
            sentBilling === "reminder" ? (
              <SentChip text="Reminder sent" />
            ) : (
              <Button size="sm" onClick={() => setSentBilling("reminder")}>
                <Send className="size-3.5" /> Send payment reminder
              </Button>
            )
          )}
          {ps.balance?.status === "pending" && (
            sentBilling === "invoice" ? (
              <SentChip text="Invoice sent" />
            ) : (
              <Button size="sm" variant="outline" onClick={() => setSentBilling("invoice")}>
                <Send className="size-3.5" /> Send invoice
              </Button>
            )
          )}
          {ps.balance?.status === "sent" && (
            sentBilling === "resend" ? (
              <SentChip text="Invoice resent" />
            ) : (
              <Button size="sm" variant="outline" onClick={() => setSentBilling("resend")}>
                <Send className="size-3.5" /> Resend invoice
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function Line({ label, amount, status }: { label: string; amount: number; status: { text: string; tone: "positive" | "danger" | "muted" } }) {
  const toneClass =
    status.tone === "positive" ? "text-emerald-600"
      : status.tone === "danger" ? "text-red-500"
      : "text-muted-foreground";
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex items-baseline gap-2">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">${amount.toLocaleString()}</span>
      </div>
      <span className={`text-xs tabular-nums ${toneClass}`}>{status.text}</span>
    </div>
  );
}

function SentChip({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 duration-300 animate-in fade-in slide-in-from-bottom-1 dark:bg-emerald-950/20 dark:text-emerald-400">
      <Check className="size-3.5" /> {text}
    </div>
  );
}
