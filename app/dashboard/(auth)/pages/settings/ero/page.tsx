"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, FileSignature, ShieldCheck, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/lib/session-context";

export default function EroSettingsPage() {
  const { user } = useSession();
  const defaultSignature = user.credential ? `${user.fullName}, ${user.credential}` : user.fullName;
  const [eroConfirmed, setEroConfirmed] = useState(true);
  const [signatureName, setSignatureName] = useState(defaultSignature);
  const [verified, setVerified] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">E-Filing & ERO Setup</h3>
        <p className="text-sm text-muted-foreground">Configure your Electronic Return Originator credentials for Form 8879 signing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ERO Digital Signature</CardTitle>
          <CardDescription>This is how your signature appears on every Form 8879 you countersign.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Signature Name (as printed on 8879)</label>
            <Input className="mt-1" value={signatureName} onChange={(e) => setSignatureName(e.target.value)} />
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">Signature Preview</div>
            <div className="rounded-lg border bg-background px-6 py-4">
              <div className="font-serif text-xl italic text-foreground">{signatureName || "Your Name"}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Electronic Return Originator &middot; {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Credentials</CardTitle>
          <CardDescription>Your PTIN and EFIN are pulled from Firm Profile. Displayed here for verification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-3">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">PTIN</div>
              <div className="mt-1 font-mono text-sm font-semibold">{user.ptin ?? "—"}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">EFIN</div>
              <div className="mt-1 font-mono text-sm font-semibold">{user.efin ?? "—"}</div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-3">
            <div className="flex items-center gap-3">
              {verified ? (
                <div className="flex size-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                  <ShieldCheck className="size-4 text-emerald-600" />
                </div>
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
                  <AlertTriangle className="size-4 text-amber-600" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium">{verified ? "Credentials verified" : "Credentials not verified"}</div>
                <div className="text-[11px] text-muted-foreground">{verified ? "Last verified Mar 28, 2026" : "Verify your PTIN and EFIN to enable ERO signing"}</div>
              </div>
            </div>
            <Button size="sm" variant={verified ? "outline" : "default"} onClick={() => setVerified(true)}>
              {verified ? "Re-verify" : "Verify now"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ERO Authorization</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-start gap-3 cursor-pointer">
            <Switch checked={eroConfirmed} onCheckedChange={setEroConfirmed} className="mt-0.5" />
            <div>
              <div className="text-sm font-medium">I confirm I am authorized to act as ERO for Vazant Consulting</div>
              <div className="text-xs text-muted-foreground mt-0.5">This enables the one-tap ERO signing feature on client detail pages.</div>
            </div>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Signing Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border p-3 text-center">
              <div className="font-display text-2xl font-bold tabular-nums">3</div>
              <div className="text-[11px] text-muted-foreground">Returns signed<br />this season</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className="font-display text-2xl font-bold tabular-nums">2</div>
              <div className="text-[11px] text-muted-foreground">Awaiting ERO<br />signature</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className="text-sm font-semibold">Mar 27</div>
              <div className="text-[11px] text-muted-foreground">Last signature<br />date</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
