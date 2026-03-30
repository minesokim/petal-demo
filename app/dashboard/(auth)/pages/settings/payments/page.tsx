"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, CreditCard, ExternalLink } from "lucide-react";

export default function PaymentsSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [depositAmount, setDepositAmount] = useState("50");
  const [paymentTerms, setPaymentTerms] = useState("due_on_receipt");
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [autoReminder, setAutoReminder] = useState(true);
  const [reminderDays, setReminderDays] = useState("7");
  const [sendReceipt, setSendReceipt] = useState(true);
  const [refundPolicy, setRefundPolicy] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Payments</h3>
        <p className="text-sm text-muted-foreground">Configure how Docket handles deposits, invoicing, and payment reminders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Stripe Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#635BFF]/10">
                <CreditCard className="size-5 text-[#635BFF]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Stripe</span>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 text-[10px]"><Check className="mr-1 size-3" /> Connected</Badge>
                </div>
                <p className="text-xs text-muted-foreground">vazantconsulting &middot; Deposits and balance collection</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => window.open("https://dashboard.stripe.com", "_blank")}>
              Manage in Stripe <ExternalLink className="ml-1.5 size-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Deposit & Invoicing</CardTitle>
          <CardDescription>Configure default amounts and when invoices are generated.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Default Deposit Amount</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input className="pl-7" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Collected at intake. Can be overridden per client.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Payment Terms</label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_on_receipt">Due on receipt</SelectItem>
                  <SelectItem value="net_7">Net 7</SelectItem>
                  <SelectItem value="net_15">Net 15</SelectItem>
                  <SelectItem value="net_30">Net 30</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Auto-generate balance invoice</div>
                <p className="text-xs text-muted-foreground">Automatically create and send the remaining balance invoice when a return moves to &ldquo;Client Review&rdquo; stage.</p>
              </div>
              <Switch checked={autoInvoice} onCheckedChange={setAutoInvoice} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Send payment receipts</div>
                <p className="text-xs text-muted-foreground">Clients receive an automatic email receipt when payment is received.</p>
              </div>
              <Switch checked={sendReceipt} onCheckedChange={setSendReceipt} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Payment Reminders</CardTitle>
          <CardDescription>Automatically remind clients about unpaid invoices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Auto-send payment reminders</div>
              <p className="text-xs text-muted-foreground">Send a reminder after an invoice goes unpaid.</p>
            </div>
            <Switch checked={autoReminder} onCheckedChange={setAutoReminder} />
          </div>
          {autoReminder && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground">Send reminder after</span>
              <Input className="w-16 text-center text-xs" value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} />
              <span className="text-xs text-muted-foreground">days of unpaid invoice</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Refund Policy</CardTitle>
          <CardDescription>Optional. Displayed to clients during payment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea placeholder="e.g., Deposits are non-refundable. Remaining balance is due upon completion of return preparation." value={refundPolicy} onChange={(e) => setRefundPolicy(e.target.value)} rows={3} className="resize-none" />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} disabled={saved}>
          {saved ? <><Check className="size-3.5" /> Saved</> : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
