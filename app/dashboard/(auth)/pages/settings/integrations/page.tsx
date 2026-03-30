"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Check, Calendar, CreditCard, Globe, Mail, FileText,
  Video, Calculator, Building, ExternalLink
} from "lucide-react";
import { useState } from "react";
import { type LucideIcon } from "lucide-react";

interface Integration {
  name: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  status: "connected" | "available" | "coming_soon";
  badge?: string;
}

const integrations: Integration[] = [
  { name: "Google Calendar", description: "Sync appointments and meeting links. Changes in either direction stay in sync.", icon: Calendar, iconBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600", status: "connected" },
  { name: "Stripe", description: "Collect deposits, send invoices, and process payments. Webhooks auto-update client records.", icon: CreditCard, iconBg: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-600", status: "connected" },
  { name: "Google Meet", description: "Auto-generate meeting links for video appointments. Links attached to calendar events.", icon: Globe, iconBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-600", status: "connected" },
  { name: "Gmail", description: "Sync email threads with client communications. Emails appear alongside portal messages.", icon: Mail, iconBg: "bg-red-50 dark:bg-red-950/30", iconColor: "text-red-600", status: "available", badge: "New" },
  { name: "Zoom", description: "Video call links for appointments. Alternative to Google Meet for clients who prefer Zoom.", icon: Video, iconBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-600", status: "available" },
  { name: "QuickBooks", description: "Accounting and bookkeeping sync. Import P&L, balance sheets, and client financials.", icon: Calculator, iconBg: "bg-green-50 dark:bg-green-950/30", iconColor: "text-green-700", status: "available" },
  { name: "Xero", description: "Accounting and bookkeeping sync. Alternative to QuickBooks for Xero users.", icon: FileText, iconBg: "bg-sky-50 dark:bg-sky-950/30", iconColor: "text-sky-600", status: "available" },
];

const comingSoon: Integration[] = [
  { name: "OLT / Drake Tax", description: "Tax preparation software sync. Auto-advance pipeline when returns are completed in your tax software.", icon: Building, iconBg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-600", status: "coming_soon" },
  { name: "IRS e-file (MeF)", description: "Direct e-filing with the IRS after ERO signing. Submit returns without leaving Docket.", icon: Building, iconBg: "bg-slate-50 dark:bg-slate-950/30", iconColor: "text-slate-600", status: "coming_soon" },
];

export default function IntegrationsPage() {
  const [emailSync, setEmailSync] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Integrations</h3>
        <p className="text-sm text-muted-foreground">Connect your tools to streamline your practice.</p>
      </div>

      {/* Connected */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connected</h4>
        <div className="space-y-2">
          {integrations.filter(i => i.status === "connected").map((intg) => {
            const Icon = intg.icon;
            return (
              <Card key={intg.name}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`flex size-10 items-center justify-center rounded-xl ${intg.iconBg}`}>
                    <Icon className={`size-5 ${intg.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold">{intg.name}</span>
                    <p className="text-xs text-muted-foreground">{intg.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">
                      <Check className="mr-1 size-3" /> Connected
                    </Badge>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
                      Settings <ExternalLink className="ml-1 size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Available */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available</h4>
        <div className="space-y-2">
          {integrations.filter(i => i.status === "available").map((intg) => {
            const Icon = intg.icon;
            return (
              <Card key={intg.name}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`flex size-10 items-center justify-center rounded-xl ${intg.iconBg}`}>
                    <Icon className={`size-5 ${intg.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{intg.name}</span>
                      {intg.badge && <Badge variant="secondary" className="text-[10px]">{intg.badge}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{intg.description}</p>
                  </div>
                  <Button size="sm" variant="outline">Connect</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Email Sync (Beta) */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
            <Mail className="size-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Email Sync</span>
              <Badge className="text-[10px] bg-amber-100 text-amber-800 border-amber-200">Beta</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Sync Gmail or Outlook emails with client communications. Emails appear in client message threads alongside portal messages.</p>
          </div>
          <Switch checked={emailSync} onCheckedChange={setEmailSync} />
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coming Soon</h4>
        <div className="space-y-2">
          {comingSoon.map((intg) => {
            const Icon = intg.icon;
            return (
              <Card key={intg.name} className="opacity-60">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className={`flex size-10 items-center justify-center rounded-xl ${intg.iconBg}`}>
                    <Icon className={`size-5 ${intg.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{intg.name}</span>
                      <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{intg.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
