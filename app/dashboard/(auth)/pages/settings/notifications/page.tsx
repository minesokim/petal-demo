"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface NotifCategory {
  section: string;
  items: { key: string; label: string; desc: string; inApp: boolean; email: boolean; push: boolean }[];
}

const defaultNotifs: NotifCategory[] = [
  {
    section: "Client Activity",
    items: [
      { key: "doc_uploaded", label: "Client uploaded a document", desc: "When a client uploads a file to their portal", inApp: true, email: false, push: true },
      { key: "form_signed", label: "Client signed Form 8879", desc: "When a client completes their e-signature", inApp: true, email: true, push: true },
      { key: "portal_login", label: "Client logged into portal", desc: "When a client accesses their portal for the first time or after inactivity", inApp: true, email: false, push: false },
      { key: "client_message", label: "Client sent a message", desc: "When a client sends you a message through the portal", inApp: true, email: true, push: true },
    ],
  },
  {
    section: "Payments",
    items: [
      { key: "deposit_received", label: "Deposit received", desc: "When a client's deposit payment is processed", inApp: true, email: true, push: true },
      { key: "balance_paid", label: "Remaining balance paid", desc: "When the final balance is paid in full", inApp: true, email: true, push: true },
      { key: "payment_failed", label: "Payment failed or expired", desc: "When a payment attempt fails or an invoice expires", inApp: true, email: true, push: true },
    ],
  },
  {
    section: "Deadlines & Alerts",
    items: [
      { key: "filing_deadline", label: "Filing deadline approaching", desc: "Configurable: 30/14/7 days before April 15", inApp: true, email: true, push: false },
      { key: "client_at_risk", label: "Client at risk of missing deadline", desc: "Based on AI analysis of document completion and engagement", inApp: true, email: true, push: true },
      { key: "extension_deadline", label: "Extension deadline approaching", desc: "When an extension deadline is approaching for a client", inApp: true, email: true, push: false },
    ],
  },
  {
    section: "AI & Actions",
    items: [
      { key: "ai_draft", label: "New AI draft ready for review", desc: "When Petal generates a message draft for your approval", inApp: true, email: false, push: false },
      { key: "action_generated", label: "Action item generated", desc: "New intake, document complete, pipeline milestone, etc.", inApp: true, email: false, push: false },
      { key: "ai_insight", label: "AI insight flagged", desc: "Audit risk, revenue anomaly, compliance alert, etc.", inApp: true, email: true, push: false },
    ],
  },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(defaultNotifs);
  const [quietEnabled, setQuietEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState("20");
  const [quietEnd, setQuietEnd] = useState("8");

  const toggleChannel = (sectionIdx: number, itemIdx: number, channel: "inApp" | "email" | "push") => {
    setNotifs(prev => {
      const updated = [...prev];
      const section = { ...updated[sectionIdx] };
      const items = [...section.items];
      items[itemIdx] = { ...items[itemIdx], [channel]: !items[itemIdx][channel] };
      section.items = items;
      updated[sectionIdx] = section;
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Notifications</h3>
        <p className="text-sm text-muted-foreground">Choose what you get notified about and how.</p>
      </div>

      <div className="mb-2 flex items-center gap-6 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <div className="flex-1" />
        <div className="w-12 text-center">In-app</div>
        <div className="w-12 text-center">Email</div>
        <div className="w-12 text-center">Push</div>
      </div>

      {notifs.map((category, sIdx) => (
        <Card key={category.section}>
          <CardHeader className="pb-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category.section}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y pt-2">
            {category.items.map((item, iIdx) => (
              <div key={item.key} className="flex items-center gap-4 py-3 first:pt-1 last:pb-1">
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.label}</div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {(["inApp", "email", "push"] as const).map((channel) => (
                  <div key={channel} className="w-12 flex justify-center">
                    <button
                      onClick={() => toggleChannel(sIdx, iIdx, channel)}
                      className={`size-5 rounded-md border transition-colors ${
                        item[channel]
                          ? "border-primary bg-primary"
                          : "border-border bg-transparent hover:border-primary/40"
                      }`}
                    >
                      {item[channel] && (
                        <svg className="size-5 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quiet Hours</CardTitle>
          <CardDescription>Suppress non-urgent notifications outside work hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Switch checked={quietEnabled} onCheckedChange={setQuietEnabled} />
            {quietEnabled && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Silent between</span>
                <Select value={quietStart} onValueChange={setQuietStart}>
                  <SelectTrigger className="w-20 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">and</span>
                <Select value={quietEnd} onValueChange={setQuietEnd}>
                  <SelectTrigger className="w-20 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Save notifications</Button>
      </div>
    </div>
  );
}
