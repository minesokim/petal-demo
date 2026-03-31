"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import {
  Check, Settings2, Unplug, RefreshCw, Clock, Mail
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  logo: string;
  status: "connected" | "available" | "coming_soon";
  connectedAs?: string;
  lastSync?: string;
  settingsUrl?: string;
  badge?: string;
}

const allIntegrations: Integration[] = [
  { id: "gcal", name: "Google Calendar", description: "Sync appointments and meeting links. Changes in either direction stay in sync.", logo: "/logos/google-calendar.svg", status: "connected", connectedAs: "antonio@vazantconsulting.com", lastSync: "2 min ago", settingsUrl: "https://calendar.google.com/calendar/r/settings" },
  { id: "stripe", name: "Stripe", description: "Collect deposits, send invoices, and process payments. Webhooks auto-update client records.", logo: "/logos/stripe.svg", status: "connected", connectedAs: "vazantconsulting", lastSync: "Just now", settingsUrl: "https://dashboard.stripe.com" },
  { id: "gmeet", name: "Google Meet", description: "Auto-generate meeting links for video appointments. Links attached to calendar events.", logo: "/logos/google-meet.svg", status: "connected", connectedAs: "Via Google Calendar", lastSync: "Auto", settingsUrl: "https://meet.google.com" },
  { id: "gmail", name: "Gmail", description: "Sync email threads with client communications. Emails appear alongside portal messages.", logo: "/logos/gmail.svg", status: "available", badge: "New" },
  { id: "zoom", name: "Zoom", description: "Video call links for appointments. Alternative to Google Meet for clients who prefer Zoom.", logo: "/logos/zoom.svg", status: "available" },
  { id: "quickbooks", name: "QuickBooks Online", description: "Accounting sync. Import P&L, balance sheets, and client financials directly.", logo: "/logos/quickbooks.svg", status: "available" },
  { id: "xero", name: "Xero", description: "Accounting sync for Xero users. Import financials and reconcile with tax prep.", logo: "/logos/xero.svg", status: "available" },
  { id: "square", name: "Square", description: "Accept in-person payments via Square terminal. Sync transactions with client billing.", logo: "/logos/square.png", status: "available" },
  { id: "olt", name: "OLT Tax Software", description: "Tax prep software sync. Auto-advance pipeline when returns are completed.", logo: "", status: "coming_soon" },
  { id: "irs", name: "IRS e-file (MeF)", description: "Direct e-filing after ERO signing. Submit returns without leaving Docket.", logo: "", status: "coming_soon" },
];

function IntegrationLogo({ src, name }: { src: string; name: string }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={28}
        height={28}
        className="size-7 object-contain"
      />
    );
  }
  // Fallback text abbreviation
  const abbr = name.includes("OLT") ? "OLT" : name.includes("IRS") ? "IRS" : name.slice(0, 2).toUpperCase();
  return (
    <div className="flex size-7 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
      {abbr}
    </div>
  );
}

export default function IntegrationsPage() {
  const [connected, setConnected] = useState<Set<string>>(new Set(["gcal", "stripe", "gmeet"]));
  const [connecting, setConnecting] = useState<string | null>(null);
  const [emailSync, setEmailSync] = useState(false);

  const handleConnect = (id: string) => {
    setConnecting(id);
    setTimeout(() => {
      setConnected(prev => new Set([...prev, id]));
      setConnecting(null);
    }, 1500);
  };

  const handleDisconnect = (id: string) => {
    setConnected(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  const connectedIntegrations = allIntegrations.filter(i => connected.has(i.id));
  const availableIntegrations = allIntegrations.filter(i => !connected.has(i.id) && i.status !== "coming_soon");
  const comingSoonIntegrations = allIntegrations.filter(i => i.status === "coming_soon");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Integrations</h3>
        <p className="text-sm text-muted-foreground">Connect your tools to streamline your practice.</p>
      </div>

      {/* Connected */}
      {connectedIntegrations.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connected ({connectedIntegrations.length})</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {connectedIntegrations.map(intg => (
              <Card key={intg.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                      <IntegrationLogo src={intg.logo} name={intg.name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{intg.name}</span>
                        <Badge variant="outline" className="text-[9px] h-4 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">
                          <Check className="mr-0.5 size-2.5" /> Connected
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{intg.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-2.5">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      {intg.connectedAs && <span>{intg.connectedAs}</span>}
                      {intg.lastSync && (
                        <span className="flex items-center gap-1"><RefreshCw className="size-2.5" /> {intg.lastSync}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {intg.settingsUrl && (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => window.open(intg.settingsUrl, "_blank")}>
                          <Settings2 className="size-3" /> Settings
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 text-muted-foreground hover:text-destructive" onClick={() => handleDisconnect(intg.id)}>
                        <Unplug className="size-3" /> Disconnect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available */}
      {availableIntegrations.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {availableIntegrations.map(intg => (
              <Card key={intg.id}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                    <IntegrationLogo src={intg.logo} name={intg.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{intg.name}</span>
                      {intg.badge && <Badge variant="secondary" className="text-[9px] h-4">{intg.badge}</Badge>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{intg.description}</p>
                    <Button size="sm" className="mt-3 h-7 text-xs" disabled={connecting === intg.id} onClick={() => handleConnect(intg.id)}>
                      {connecting === intg.id ? (
                        <><RefreshCw className="size-3 animate-spin" /> Connecting...</>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Email Sync Beta */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Mail className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Email Sync</span>
              <Badge variant="secondary" className="text-[9px] h-4">Beta</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Sync Gmail or Outlook emails with client message threads.</p>
          </div>
          <Switch checked={emailSync} onCheckedChange={setEmailSync} />
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coming Soon</h4>
        <div className="grid gap-3 md:grid-cols-2">
          {comingSoonIntegrations.map(intg => (
            <Card key={intg.id} className="opacity-50">
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                  <IntegrationLogo src={intg.logo} name={intg.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{intg.name}</span>
                    <Badge variant="outline" className="text-[9px] h-4 flex items-center gap-0.5">
                      <Clock className="size-2.5" /> Coming soon
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{intg.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
