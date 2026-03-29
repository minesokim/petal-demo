"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Check, X, Plus, Clock, Mail, Globe, CreditCard,
  Calendar, FileText, Shield, Activity, Timer, ChevronRight
} from "lucide-react";
import { useState } from "react";

const integrations = [
  { name: "Google Calendar", description: "Sync appointments and meeting links", connected: true, icon: Calendar },
  { name: "Stripe", description: "Collect deposits and payments", connected: true, icon: CreditCard },
  { name: "Google Meet", description: "Video call links for appointments", connected: true, icon: Globe },
  { name: "Gmail", description: "Sync email with client communications", connected: false, icon: Mail, new: true },
  { name: "Xero", description: "Accounting and bookkeeping sync", connected: false, icon: FileText },
];

const auditLog = [
  { action: "Sent message to Priya Sharma", time: "10 min ago", type: "message" },
  { action: "Approved W-2 extraction for Marcus Chen", time: "25 min ago", type: "document" },
  { action: "Sent reminder to DeShawn Williams", time: "1 hour ago", type: "action" },
  { action: "Updated service tiers", time: "2 hours ago", type: "settings" },
  { action: "Filed return for Linda Nakamura", time: "Yesterday", type: "filing" },
  { action: "Processed 8879 signature for Rachel Goldstein", time: "Yesterday", type: "signature" },
  { action: "Generated invoice for Roberto Fuentes", time: "2 days ago", type: "billing" },
  { action: "Created engagement letter for Ashley Kim", time: "2 days ago", type: "document" },
];

export default function SettingsProfilePage() {
  const [aiDrafts, setAiDrafts] = useState(true);
  const [autoResponses, setAutoResponses] = useState(true);
  const [staleAlerts, setStaleAlerts] = useState(true);
  const [morningDigest, setMorningDigest] = useState(true);
  const [timeTracking, setTimeTracking] = useState(false);
  const [emailSync, setEmailSync] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your practice preferences</p>
      </div>

      <Tabs defaultValue="firm">
        <TabsList variant="line">
          <TabsTrigger value="firm">Firm Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="ai">AI Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="time">Time Tracking</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Firm Profile */}
        <TabsContent value="firm" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Firm Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarImage src="/images/avatars/01.png" />
                  <AvatarFallback>AV</AvatarFallback>
                </Avatar>
                <div>
                  <Button size="sm" variant="outline">Change photo</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-medium text-muted-foreground">Firm Name</label><Input defaultValue="Vazant Consulting" className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Preparer Name</label><Input defaultValue="Antonio Vazquez, EA" className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input defaultValue="antonio@vazantconsulting.com" className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Phone</label><Input defaultValue="(951) 555-0100" className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">PTIN</label><Input defaultValue="P01234567" className="mt-1" /></div>
                <div><label className="text-xs font-medium text-muted-foreground">EFIN</label><Input defaultValue="123456" className="mt-1" /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Service Tiers</CardTitle>
              <CardDescription>Configure your pricing tiers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Basic (1040)", price: "$150" },
                { name: "Standard (1040 + Schedules)", price: "$350" },
                { name: "Premium (Business + Personal)", price: "$500" },
              ].map((tier) => (
                <div key={tier.name} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="text-sm">{tier.name}</span>
                  <span className="font-display text-sm font-semibold tabular-nums">{tier.price}</span>
                </div>
              ))}
              <Button size="sm" variant="outline"><Plus className="size-3.5" /> Add tier</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-4 space-y-3">
          {integrations.map(intg => {
            const Icon = intg.icon;
            return (
              <Card key={intg.name}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{intg.name}</span>
                      {intg.new && <Badge variant="secondary" className="text-[10px]">New</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{intg.description}</p>
                  </div>
                  {intg.connected ? (
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700"><Check className="mr-1 size-3" /> Connected</Badge>
                  ) : (
                    <Button size="sm" variant="outline">Connect</Button>
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Mail className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Email Sync</span>
                  <Badge variant="secondary" className="text-[10px]">Beta</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Sync Gmail or Outlook emails with client communications. Emails appear in client message threads.</p>
              </div>
              <Switch checked={emailSync} onCheckedChange={setEmailSync} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Preferences */}
        <TabsContent value="ai" className="mt-4">
          <Card>
            <CardContent className="divide-y p-0">
              {[
                { label: "AI Draft Messages", desc: "Auto-draft responses to client messages for your review.", value: aiDrafts, setter: setAiDrafts },
                { label: "System Auto-Responses", desc: "Send instant system cards for common questions (status, documents, appointments).", value: autoResponses, setter: setAutoResponses },
                { label: "Stale Client Detection", desc: "Alert when clients haven't engaged for 7+ days.", value: staleAlerts, setter: setStaleAlerts },
                { label: "Morning Digest", desc: "Daily summary of pending actions at 7:00 AM.", value: morningDigest, setter: setMorningDigest },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.setter} />
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="mt-4 rounded-xl border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="size-4 text-primary" />
              <span className="text-sm font-semibold">AI Safety</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">AI never sends messages without your approval. All drafts appear in the Action Feed. Client data processed with zero retention.</p>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardContent className="divide-y p-0">
              {[
                { label: "New client message", desc: "Notify when a client sends a message", push: true, email: true },
                { label: "Document uploaded", desc: "Notify when a client uploads a document", push: true, email: false },
                { label: "Appointment reminder", desc: "30 minutes before scheduled appointments", push: true, email: true },
                { label: "Stale client alert", desc: "When a client hasn't engaged in 7+ days", push: true, email: false },
                { label: "Payment received", desc: "When a deposit or payment comes through", push: true, email: true },
                { label: "8879 signed", desc: "When a client signs Form 8879", push: true, email: true },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-semibold">{item.label}</div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.push ? "default" : "outline"} className="text-[10px]">Push</Badge>
                    <Badge variant={item.email ? "default" : "outline"} className="text-[10px]">Email</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Tracking */}
        <TabsContent value="time" className="mt-4 space-y-4">
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <div className="text-sm font-semibold">Enable Time Tracking</div>
                <p className="text-xs text-muted-foreground">Track time spent on each client for billing and productivity insights.</p>
              </div>
              <Switch checked={timeTracking} onCheckedChange={setTimeTracking} />
            </CardContent>
          </Card>
          {timeTracking && (
            <>
              <Card>
                <CardHeader><CardTitle className="text-sm">This Week</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { client: "Marcus Chen", time: "2h 15m", tasks: "Return prep, document review" },
                    { client: "David Park", time: "1h 45m", tasks: "S-Corp review, call prep" },
                    { client: "Roberto Fuentes", time: "1h 30m", tasks: "1120S preparation" },
                    { client: "Priya Sharma", time: "45m", tasks: "Document collection follow-up" },
                  ].map(entry => (
                    <div key={entry.client} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <div className="text-sm font-medium">{entry.client}</div>
                        <div className="text-xs text-muted-foreground">{entry.tasks}</div>
                      </div>
                      <div className="flex items-center gap-1 font-display text-sm tabular-nums">
                        <Timer className="size-3.5 text-muted-foreground" />
                        {entry.time}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="text-sm font-semibold">Total this week</div>
                    <p className="text-xs text-muted-foreground">Across 12 clients</p>
                  </div>
                  <div className="font-display text-2xl tabular-nums tracking-tight">6h 15m</div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Audit Trail */}
        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity Log</CardTitle>
              <CardDescription>Complete history of every action in your practice</CardDescription>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {auditLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                    <Activity className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{entry.action}</div>
                    <div className="text-xs text-muted-foreground">{entry.time}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{entry.type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
