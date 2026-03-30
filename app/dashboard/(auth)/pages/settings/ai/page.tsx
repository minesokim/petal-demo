"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, MessageSquare } from "lucide-react";
import { useState } from "react";

const insightTypes = [
  { key: "audit_risk", label: "Audit Risk Flags", desc: "Flag returns with elevated audit probability" },
  { key: "deadline_warnings", label: "Deadline Warnings", desc: "Alert approaching filing and extension deadlines" },
  { key: "revenue_anomalies", label: "Revenue Anomalies", desc: "Year-over-year income change detection" },
  { key: "extension_likelihood", label: "Extension Likelihood", desc: "Predict which clients may need extensions" },
  { key: "due_diligence", label: "Due Diligence Reminders", desc: "Form 8867 and EITC compliance checks" },
  { key: "qbi_calcs", label: "QBI Calculations", desc: "Section 199A qualified business income estimates" },
  { key: "deduction_mining", label: "Missed Deductions", desc: "Suggest deductions the client may be missing" },
];

export default function AIPreferencesPage() {
  const [tone, setTone] = useState<"professional" | "friendly">("friendly");
  const [autoDraft, setAutoDraft] = useState(true);
  const [nudgeDays, setNudgeDays] = useState("3");
  const [personality, setPersonality] = useState("Direct, warm, and concise. Use first names. Keep it conversational but professional.");
  const [insights, setInsights] = useState<Record<string, boolean>>(
    Object.fromEntries(insightTypes.map(t => [t.key, true]))
  );

  const sampleMessage = tone === "professional"
    ? "Dear Marcus, I wanted to follow up regarding your outstanding documents. We're still awaiting your 1099-B and investment statements to proceed with your return preparation. Please upload these at your earliest convenience."
    : "Hey Marcus! Just checking in — we're still waiting on your 1099-B and investment statements to get your return going. When you get a chance, upload them through your portal and we'll take it from there.";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">AI Preferences</h3>
        <p className="text-sm text-muted-foreground">Configure how Docket&apos;s AI generates drafts, surfaces insights, and communicates.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Draft Message Tone</CardTitle>
          <CardDescription>How AI-drafted messages sound when sent to your clients.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {(["professional", "friendly"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition-all ${
                  tone === t ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2">
              <MessageSquare className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Preview</span>
            </div>
            <p className="text-xs leading-relaxed">{sampleMessage}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Auto-Draft Behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Auto-generate follow-up drafts</div>
              <p className="text-xs text-muted-foreground">Docket drafts messages for stale or unresponsive clients automatically.</p>
            </div>
            <Switch checked={autoDraft} onCheckedChange={setAutoDraft} />
          </div>
          {autoDraft && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3">
              <span className="text-xs text-muted-foreground">Generate nudge draft after</span>
              <Input className="w-16 text-center text-xs" value={nudgeDays} onChange={(e) => setNudgeDays(e.target.value)} />
              <span className="text-xs text-muted-foreground">days of inactivity</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Insights</CardTitle>
          <CardDescription>Choose which proactive insights Docket surfaces on client detail pages.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {insightTypes.map((insight) => (
            <div key={insight.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <div className="text-sm font-medium">{insight.label}</div>
                <p className="text-xs text-muted-foreground">{insight.desc}</p>
              </div>
              <Switch
                checked={insights[insight.key]}
                onCheckedChange={(v) => setInsights(prev => ({ ...prev, [insight.key]: v }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Docket Personality</CardTitle>
          <CardDescription>Describe how Docket should communicate. This sets the tone for Ask Docket and all AI-generated content.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={personality} onChange={(e) => setPersonality(e.target.value)} rows={3} className="resize-none text-sm" />
        </CardContent>
      </Card>

      <div className="rounded-xl border p-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="size-4 text-primary" />
          <span className="text-sm font-semibold">AI Safety</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">AI never sends messages without your approval. All drafts appear in your Action Feed for review. AI suggestions are clearly labeled and never modify tax data directly. Client data is processed with zero retention.</p>
      </div>

      <div className="flex justify-end">
        <Button>Save preferences</Button>
      </div>
    </div>
  );
}
