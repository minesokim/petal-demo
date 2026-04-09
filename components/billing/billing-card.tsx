"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Send, DollarSign } from "lucide-react";
import { getClientPaymentSummary, type Client } from "@/lib/mock-data";

export function BillingCard({ client }: { client: Client }) {
  const [sentBilling, setSentBilling] = useState<string | null>(null);
  const ps = getClientPaymentSummary(client.id);

  const events: { date: string; label: string; type: "paid" | "sent" | "pending" | "overdue" }[] = [];
  if (ps.deposit?.paidDate) events.push({ date: ps.deposit.paidDate, label: `Deposit paid — $${ps.deposit.amount}`, type: "paid" });
  if (ps.deposit?.sentDate && ps.deposit.status !== "paid") events.push({ date: ps.deposit.sentDate, label: `Deposit invoice sent — $${ps.deposit.amount}`, type: ps.deposit.status === "overdue" ? "overdue" : "sent" });
  if (ps.balance?.paidDate) events.push({ date: ps.balance.paidDate, label: `Balance paid — $${ps.balance.amount}`, type: "paid" });
  if (ps.balance?.sentDate && ps.balance.status !== "paid") events.push({ date: ps.balance.sentDate, label: `Balance invoice sent — $${ps.balance.amount}`, type: ps.balance.status === "overdue" ? "overdue" : "sent" });
  events.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold">{client.serviceTier} Return</div>
            <div className="text-xs text-muted-foreground">Total fee: ${client.feeAmount}</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold tabular-nums tracking-tight">${ps.totalPaid} <span className="text-sm font-normal text-muted-foreground">of ${ps.totalFee}</span></div>
            <div className={`text-xs font-medium ${ps.fullyPaid ? "text-emerald-600" : ps.hasOverdue ? "text-red-500" : "text-muted-foreground"}`}>
              {ps.fullyPaid ? "Paid in full" : ps.hasOverdue ? `$${ps.totalOwed} overdue` : `$${ps.totalOwed} remaining`}
            </div>
          </div>
        </div>
        <Progress value={(ps.totalPaid / ps.totalFee) * 100} className="h-2" indicatorColor={ps.fullyPaid ? "bg-emerald-500" : ps.hasOverdue ? "bg-red-500" : undefined} />
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Deposit</div>
            <div className="text-xs text-muted-foreground">${ps.deposit?.amount || 50}</div>
          </div>
          {ps.deposit?.status === "paid" ? (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Paid {ps.deposit.paidDate && new Date(ps.deposit.paidDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Badge>
          ) : ps.deposit?.status === "overdue" ? (
            <Badge variant="destructive">Overdue</Badge>
          ) : (
            <Badge variant="secondary">Pending</Badge>
          )}
        </div>
        {ps.balance && ps.balance.status !== "not_applicable" && (
          <div className="rounded-xl border p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Remaining Balance</div>
              <div className="text-xs text-muted-foreground">${ps.balance.amount}</div>
            </div>
            {ps.balance.status === "paid" ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Paid {ps.balance.paidDate && new Date(ps.balance.paidDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Badge>
            ) : ps.balance.status === "sent" ? (
              <Badge variant="secondary">Invoice sent</Badge>
            ) : (
              <Badge variant="outline">Not yet invoiced</Badge>
            )}
          </div>
        )}
      </div>

      {events.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">Payment Timeline</div>
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <div className={`size-2 shrink-0 rounded-full ${e.type === "paid" ? "bg-emerald-500" : e.type === "overdue" ? "bg-red-500" : "bg-muted-foreground/30"}`} />
              <span className="text-muted-foreground">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <span>{e.label}</span>
            </div>
          ))}
        </div>
      )}

      {!ps.fullyPaid && (
        <div className="flex gap-2">
          {ps.deposit?.status === "overdue" && (
            sentBilling === "reminder" ? (
              <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <Check className="size-3.5" /> Reminder sent
              </div>
            ) : (
              <Button size="sm" onClick={() => setSentBilling("reminder")}>
                <Send className="size-3.5" /> Send payment reminder
              </Button>
            )
          )}
          {ps.balance?.status === "pending" && (
            sentBilling === "invoice" ? (
              <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <Check className="size-3.5" /> Invoice sent
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setSentBilling("invoice")}>
                <DollarSign className="size-3.5" /> Send invoice
              </Button>
            )
          )}
          {ps.balance?.status === "sent" && (
            sentBilling === "resend" ? (
              <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 animate-in fade-in slide-in-from-bottom-1 duration-300">
                <Check className="size-3.5" /> Invoice resent
              </div>
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
