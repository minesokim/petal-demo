"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Check, ExternalLink, Settings2, Unplug, RefreshCw, Clock, Mail
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  logo: React.ReactNode;
  status: "connected" | "available" | "coming_soon";
  connectedAs?: string;
  lastSync?: string;
  settingsUrl?: string;
  badge?: string;
}

// Inline SVG logos for real brands
const logos = {
  gcal: (
    <svg viewBox="0 0 24 24" className="size-6">
      <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="#fff"/>
      <path d="M6.947 18.316h-1.263a1.263 1.263 0 01-1.263-1.263V6.947" fill="#1A73E8"/>
      <path d="M18.316 18.316H6.947V5.684h12.632v11.369a1.263 1.263 0 01-1.263 1.263z" fill="#1A73E8" opacity=".1"/>
      <path d="M18.316 5.684V4.42a1.263 1.263 0 00-1.263-1.263H5.684a1.263 1.263 0 00-1.263 1.263v1.264h13.895z" fill="#4285F4"/>
      <rect x="4.421" y="5.684" width="15.158" height="12.632" rx="0" fill="#fff"/>
      <path d="M4.421 6.947h15.158v10.106a1.263 1.263 0 01-1.263 1.263H5.684a1.263 1.263 0 01-1.263-1.263V6.947z" fill="#4285F4" opacity=".08"/>
      <rect x="8" y="9" width="2.5" height="2" rx=".4" fill="#4285F4"/>
      <rect x="11" y="9" width="2.5" height="2" rx=".4" fill="#4285F4"/>
      <rect x="14" y="9" width="2.5" height="2" rx=".4" fill="#4285F4"/>
      <rect x="8" y="12" width="2.5" height="2" rx=".4" fill="#4285F4"/>
      <rect x="11" y="12" width="2.5" height="2" rx=".4" fill="#4285F4"/>
      <rect x="14" y="12" width="2.5" height="2" rx=".4" fill="#4285F4" opacity=".4"/>
      <rect x="8" y="15" width="2.5" height="2" rx=".4" fill="#4285F4" opacity=".4"/>
      <rect x="11" y="15" width="2.5" height="2" rx=".4" fill="#4285F4" opacity=".4"/>
    </svg>
  ),
  stripe: (
    <svg viewBox="0 0 24 24" className="size-6">
      <rect width="24" height="24" rx="4" fill="#635BFF"/>
      <path d="M11.2 9.6c0-.55.45-.76 1.19-.76.99 0 2.24.3 3.23.84V7.05a8.58 8.58 0 00-3.23-.6c-2.64 0-4.39 1.38-4.39 3.68 0 3.59 4.94 3.01 4.94 4.56 0 .65-.57.86-1.36.86-1.18 0-2.69-.48-3.88-1.14v3.48a9.86 9.86 0 003.88.82c2.7 0 4.55-1.34 4.55-3.68-.01-3.87-4.93-3.18-4.93-4.47z" fill="#fff"/>
    </svg>
  ),
  gmeet: (
    <svg viewBox="0 0 24 24" className="size-6">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#00897B"/>
      <path d="M15 8.5v2l2.5-2V15.5L15 13.5v2a1 1 0 01-1 1h-5a1 1 0 01-1-1v-7a1 1 0 011-1h5a1 1 0 011 1z" fill="#fff"/>
    </svg>
  ),
  gmail: (
    <svg viewBox="0 0 24 24" className="size-6">
      <path d="M20 4H4l8 6 8-6z" fill="#EA4335"/>
      <path d="M20 4v16H4V4l8 6 8-6z" fill="#FBBC04" opacity=".3"/>
      <path d="M4 20V4l8 6-8 14z" fill="#34A853" opacity=".8"/>
      <path d="M20 20V4l-8 6 8 14z" fill="#4285F4" opacity=".8"/>
      <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="#D93025" strokeWidth=".5" opacity=".3"/>
    </svg>
  ),
  zoom: (
    <svg viewBox="0 0 24 24" className="size-6">
      <rect width="24" height="24" rx="4" fill="#2D8CFF"/>
      <path d="M6 8.5a1.5 1.5 0 011.5-1.5h5a1.5 1.5 0 011.5 1.5v5.5l3.5-2.5v5l-3.5-2.5v1a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 016 15V8.5z" fill="#fff"/>
    </svg>
  ),
  quickbooks: (
    <svg viewBox="0 0 24 24" className="size-6">
      <circle cx="12" cy="12" r="10" fill="#2CA01C"/>
      <path d="M8 8v8h2v-3h2a3 3 0 000-6H8zm2 2h2a1 1 0 010 2h-2v-2zm6 6V8h-2v3h-1a3 3 0 000 6h3zm-2-2v-2h1a1 1 0 010 2h-1z" fill="#fff"/>
    </svg>
  ),
  xero: (
    <svg viewBox="0 0 24 24" className="size-6">
      <circle cx="12" cy="12" r="10" fill="#13B5EA"/>
      <path d="M8 8l4 4-4 4M16 8l-4 4 4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  olt: (
    <svg viewBox="0 0 24 24" className="size-6">
      <rect width="24" height="24" rx="4" fill="#1a1a1a"/>
      <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="system-ui">OLT</text>
    </svg>
  ),
  irs: (
    <svg viewBox="0 0 24 24" className="size-6">
      <rect width="24" height="24" rx="4" fill="#003366"/>
      <text x="12" y="16" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="system-ui">IRS</text>
    </svg>
  ),
};

const allIntegrations: Integration[] = [
  { id: "gcal", name: "Google Calendar", description: "Sync appointments and meeting links. Changes in either direction stay in sync.", logo: logos.gcal, status: "connected", connectedAs: "antonio@vazantconsulting.com", lastSync: "2 min ago", settingsUrl: "https://calendar.google.com/calendar/r/settings" },
  { id: "stripe", name: "Stripe", description: "Collect deposits, send invoices, and process payments. Webhooks auto-update client records.", logo: logos.stripe, status: "connected", connectedAs: "vazantconsulting", lastSync: "Just now", settingsUrl: "https://dashboard.stripe.com" },
  { id: "gmeet", name: "Google Meet", description: "Auto-generate meeting links for video appointments. Links attached to calendar events.", logo: logos.gmeet, status: "connected", connectedAs: "Via Google Calendar", lastSync: "Auto", settingsUrl: "https://meet.google.com" },
  { id: "gmail", name: "Gmail", description: "Sync email threads with client communications. Emails appear alongside portal messages.", logo: logos.gmail, status: "available", badge: "New" },
  { id: "zoom", name: "Zoom", description: "Video call links for appointments. Alternative to Google Meet for clients who prefer Zoom.", logo: logos.zoom, status: "available" },
  { id: "quickbooks", name: "QuickBooks Online", description: "Accounting sync. Import P&L, balance sheets, and client financials directly.", logo: logos.quickbooks, status: "available" },
  { id: "xero", name: "Xero", description: "Accounting sync for Xero users. Import financials and reconcile with tax prep.", logo: logos.xero, status: "available" },
  { id: "olt", name: "OLT Tax Software", description: "Tax prep software sync. Auto-advance pipeline when returns are completed.", logo: logos.olt, status: "coming_soon" },
  { id: "irs", name: "IRS e-file (MeF)", description: "Direct e-filing after ERO signing. Submit returns without leaving Docket.", logo: logos.irs, status: "coming_soon" },
];

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
                      {intg.logo}
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
                    {intg.logo}
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
          <div className="flex size-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
            <Mail className="size-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Email Sync</span>
              <Badge className="text-[9px] h-4 bg-amber-100 text-amber-800 border-amber-200">Beta</Badge>
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
                  {intg.logo}
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
