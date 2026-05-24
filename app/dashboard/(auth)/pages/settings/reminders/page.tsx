"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface ReminderConfig {
  key: string;
  label: string;
  description: string;
  days: string;
  enabled: boolean;
}

const defaultReminders: ReminderConfig[] = [
  { key: "intake", label: "Intake follow-up", description: "Days after sending intake before first automated reminder", days: "2", enabled: true },
  { key: "document", label: "Document reminder", description: "Days after requesting a document before flagging as overdue", days: "7", enabled: true },
  { key: "document_escalation", label: "Document escalation", description: "Days of no activity before escalating from reminder to urgent", days: "14", enabled: true },
  { key: "deposit", label: "Deposit reminder", description: "Days after sending deposit invoice before automated reminder", days: "5", enabled: true },
  { key: "client_review", label: "Client review nudge", description: "Days a client has been reviewing their return before suggesting follow-up", days: "3", enabled: true },
];

export default function RemindersPage() {
  const [reminders, setReminders] = useState(defaultReminders);
  const [frequency, setFrequency] = useState("5");
  const [maxReminders, setMaxReminders] = useState("3");
  const [quietStart, setQuietStart] = useState("20");
  const [quietEnd, setQuietEnd] = useState("8");
  const [quietEnabled, setQuietEnabled] = useState(true);

  const updateReminder = (key: string, field: keyof ReminderConfig, value: string | boolean) => {
    setReminders(prev => prev.map(r => r.key === key ? { ...r, [field]: value } : r));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Automated Reminders</h3>
        <p className="text-sm text-muted-foreground">Configure when Petal generates follow-ups and flags overdue items.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Reminder Triggers</CardTitle>
          <CardDescription>How long to wait before each type of automated reminder.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {reminders.map((reminder) => (
            <div key={reminder.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{reminder.label}</div>
                  <Switch
                    checked={reminder.enabled}
                    onCheckedChange={(v) => updateReminder(reminder.key, "enabled", v)}
                    className="scale-75"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{reminder.description}</p>
              </div>
              {reminder.enabled && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Input
                    className="w-14 text-center text-xs"
                    value={reminder.days}
                    onChange={(e) => updateReminder(reminder.key, "days", e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">days</span>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Reminder Frequency</CardTitle>
          <CardDescription>How often to re-remind after the initial reminder.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Re-remind every</span>
              <Input className="w-14 text-center text-xs" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
              <span className="text-xs text-muted-foreground">days</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">max</span>
              <Input className="w-14 text-center text-xs" value={maxReminders} onChange={(e) => setMaxReminders(e.target.value)} />
              <span className="text-xs text-muted-foreground">reminders before stopping</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quiet Hours</CardTitle>
          <CardDescription>Don&apos;t send automated reminders during these hours.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={quietEnabled} onCheckedChange={setQuietEnabled} />
              {quietEnabled && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">No reminders between</span>
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
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Save reminders</Button>
      </div>
    </div>
  );
}
