"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Check, X, Plus, Clock, Mail, Globe, CreditCard,
  Calendar, FileText, Shield, Activity, Timer, ChevronRight,
  Pencil, Trash2, DollarSign, Sun, Moon, Monitor
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";

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

interface ServiceTier {
  id: string;
  name: string;
  description: string;
  price: string;
  includes: string[];
}

const defaultTiers: ServiceTier[] = [
  {
    id: "1",
    name: "Basic Individual",
    description: "Simple W-2 returns with standard deductions",
    price: "150",
    includes: ["Form 1040", "W-2 income", "Standard deduction", "State filing"],
  },
  {
    id: "2",
    name: "Standard Individual",
    description: "Complex returns with itemized deductions and schedules",
    price: "350",
    includes: ["Form 1040 + Schedules", "Itemized deductions", "Investment income (Sch D)", "Rental income (Sch E)", "State filing"],
  },
  {
    id: "3",
    name: "Business + Personal",
    description: "S-Corp, partnership, or sole proprietor with personal return",
    price: "500",
    includes: ["Form 1120S / 1065 / Schedule C", "K-1 preparation", "Personal 1040", "Estimated tax planning", "State filing (business + personal)"],
  },
  {
    id: "4",
    name: "Bookkeeping Monthly",
    description: "Monthly reconciliation and financial statements",
    price: "200",
    includes: ["Bank reconciliation", "Categorize transactions", "Monthly P&L", "Balance sheet", "QBO / Xero sync"],
  },
];

export default function SettingsProfilePage() {
  const { theme, setTheme } = useTheme();
  const [aiDrafts, setAiDrafts] = useState(true);
  const [autoResponses, setAutoResponses] = useState(true);
  const [staleAlerts, setStaleAlerts] = useState(true);
  const [morningDigest, setMorningDigest] = useState(true);
  const [timeTracking, setTimeTracking] = useState(false);
  const [emailSync, setEmailSync] = useState(false);

  // Service tiers state
  const [tiers, setTiers] = useState<ServiceTier[]>(defaultTiers);
  const [editingTier, setEditingTier] = useState<ServiceTier | null>(null);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [newInclude, setNewInclude] = useState("");

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    newMessage: { push: true, email: true },
    docUploaded: { push: true, email: false },
    appointment: { push: true, email: true },
    staleClient: { push: true, email: false },
    paymentReceived: { push: true, email: true },
    formSigned: { push: true, email: true },
  });

  const openTierDialog = (tier?: ServiceTier) => {
    if (tier) {
      setEditingTier({ ...tier, includes: [...tier.includes] });
    } else {
      setEditingTier({
        id: Date.now().toString(),
        name: "",
        description: "",
        price: "",
        includes: [],
      });
    }
    setTierDialogOpen(true);
  };

  const saveTier = () => {
    if (!editingTier) return;
    setTiers((prev) => {
      const exists = prev.find((t) => t.id === editingTier.id);
      if (exists) return prev.map((t) => (t.id === editingTier.id ? editingTier : t));
      return [...prev, editingTier];
    });
    setTierDialogOpen(false);
    setEditingTier(null);
  };

  const deleteTier = (id: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const addInclude = () => {
    if (!newInclude.trim() || !editingTier) return;
    setEditingTier({ ...editingTier, includes: [...editingTier.includes, newInclude.trim()] });
    setNewInclude("");
  };

  const removeInclude = (index: number) => {
    if (!editingTier) return;
    setEditingTier({
      ...editingTier,
      includes: editingTier.includes.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your practice preferences</p>
      </div>

      <Tabs defaultValue="firm">
        <TabsList variant="line">
          <TabsTrigger value="firm">Firm Profile</TabsTrigger>
          <TabsTrigger value="tiers">Service Tiers</TabsTrigger>
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

          {/* Appearance — Dark Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Appearance</CardTitle>
              <CardDescription>Choose your preferred theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {[
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                      theme === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Tiers */}
        <TabsContent value="tiers" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Service Tiers</h3>
              <p className="text-xs text-muted-foreground">Configure your pricing packages. These are assigned to clients during onboarding.</p>
            </div>
            <Button size="sm" onClick={() => openTierDialog()}>
              <Plus className="mr-1 size-3.5" /> Add tier
            </Button>
          </div>

          <div className="space-y-3">
            {tiers.map((tier) => (
              <Card key={tier.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{tier.name}</span>
                        <span className="font-display text-sm font-bold tabular-nums text-primary">${tier.price}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{tier.description}</p>
                      {tier.includes.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {tier.includes.map((item, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => openTierDialog(tier)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => deleteTier(tier.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tiers.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <DollarSign className="size-8 text-muted-foreground/40" />
                <p className="mt-2 text-sm text-muted-foreground">No service tiers configured</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => openTierDialog()}>
                  <Plus className="mr-1 size-3.5" /> Create your first tier
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tier edit dialog */}
          <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base">
                  {editingTier && tiers.find((t) => t.id === editingTier.id) ? "Edit Service Tier" : "New Service Tier"}
                </DialogTitle>
              </DialogHeader>
              {editingTier && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Tier Name</label>
                    <Input
                      className="mt-1"
                      placeholder="e.g., Premium Business"
                      value={editingTier.name}
                      onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                    <Textarea
                      className="mt-1 resize-none"
                      rows={2}
                      placeholder="Brief description of what this tier covers"
                      value={editingTier.description}
                      onChange={(e) => setEditingTier({ ...editingTier, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Price ($)</label>
                    <Input
                      className="mt-1"
                      type="number"
                      placeholder="350"
                      value={editingTier.price}
                      onChange={(e) => setEditingTier({ ...editingTier, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">What's Included</label>
                    <div className="mt-1.5 space-y-1.5">
                      {editingTier.includes.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">{item}</div>
                          <Button size="icon" variant="ghost" className="size-6" onClick={() => removeInclude(i)}>
                            <X className="size-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          className="text-xs"
                          placeholder="e.g., Schedule C, State filing"
                          value={newInclude}
                          onChange={(e) => setNewInclude(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInclude())}
                        />
                        <Button size="sm" variant="outline" onClick={addInclude}>Add</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" size="sm">Cancel</Button>
                </DialogClose>
                <Button size="sm" onClick={saveTier}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                { key: "newMessage", label: "New client message", desc: "Notify when a client sends a message" },
                { key: "docUploaded", label: "Document uploaded", desc: "Notify when a client uploads a document" },
                { key: "appointment", label: "Appointment reminder", desc: "30 minutes before scheduled appointments" },
                { key: "staleClient", label: "Stale client alert", desc: "When a client hasn't engaged in 7+ days" },
                { key: "paymentReceived", label: "Payment received", desc: "When a deposit or payment comes through" },
                { key: "formSigned", label: "8879 signed", desc: "When a client signs Form 8879" },
              ].map(item => {
                const prefs = notifPrefs[item.key as keyof typeof notifPrefs];
                return (
                  <div key={item.key} className="flex items-center justify-between p-4">
                    <div>
                      <div className="text-sm font-semibold">{item.label}</div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setNotifPrefs(prev => ({
                          ...prev,
                          [item.key]: { ...prefs, push: !prefs.push }
                        }))}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-medium border transition-colors ${
                          prefs.push
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border hover:border-primary/30"
                        }`}
                      >
                        Push
                      </button>
                      <button
                        onClick={() => setNotifPrefs(prev => ({
                          ...prev,
                          [item.key]: { ...prefs, email: !prefs.email }
                        }))}
                        className={`rounded-md px-2 py-0.5 text-[10px] font-medium border transition-colors ${
                          prefs.email
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border hover:border-primary/30"
                        }`}
                      >
                        Email
                      </button>
                    </div>
                  </div>
                );
              })}
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
