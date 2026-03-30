"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, Upload, Eye } from "lucide-react";
import { useState } from "react";

const stageMessages = [
  { stage: "Collecting Documents", key: "collecting", default: "We're waiting on a few documents from you. Please upload them through your portal to keep things moving." },
  { stage: "In Preparation", key: "preparation", default: "Antonio is preparing your return. You'll be notified when it's ready for review." },
  { stage: "Client Review", key: "review", default: "Your return is ready for review! Please check it over and let us know if you have any questions." },
  { stage: "Pay & Sign", key: "pay_sign", default: "Your return is ready! Please complete payment and sign Form 8879 to authorize filing." },
  { stage: "Filed", key: "filed", default: "Your return has been filed with the IRS. You'll receive confirmation once it's accepted." },
];

export default function PortalSettingsPage() {
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to Vazant Consulting's secure client portal. Upload your documents, track your return, and message Antonio directly.");
  const [portalMessaging, setPortalMessaging] = useState(true);
  const [messages, setMessages] = useState(stageMessages.map(s => ({ ...s, value: s.default })));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Client Portal</h3>
        <p className="text-sm text-muted-foreground">Customize what your clients see when they log into their portal.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Branding</CardTitle>
          <CardDescription>Your logo and firm name appear on the client portal header and emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 rounded-lg">
              <AvatarImage src="/images/avatars/01.png" />
              <AvatarFallback className="rounded-lg">VC</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Button size="sm" variant="outline"><Upload className="mr-1.5 size-3" /> Upload logo</Button>
              <p className="text-[11px] text-muted-foreground">Recommended: 200x200px, PNG or SVG</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Portal URL</label>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                portal.vazantconsulting.com
              </div>
              <Button size="sm" variant="outline"><Globe className="mr-1.5 size-3" /> Custom domain</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Welcome Message</CardTitle>
          <CardDescription>First thing clients see when they log in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3} className="resize-none" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Stage-Specific Messaging</CardTitle>
          <CardDescription>What clients see on their portal at each stage of the workflow.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {messages.map((msg, i) => (
            <div key={msg.key} className="rounded-xl border p-3">
              <div className="mb-1.5 text-xs font-semibold">{msg.stage}</div>
              <Textarea
                value={msg.value}
                onChange={(e) => {
                  const updated = [...messages];
                  updated[i] = { ...msg, value: e.target.value };
                  setMessages(updated);
                }}
                rows={2}
                className="resize-none text-xs"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Portal Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Client messaging</div>
              <p className="text-xs text-muted-foreground">Allow clients to message you directly through the portal.</p>
            </div>
            <Switch checked={portalMessaging} onCheckedChange={setPortalMessaging} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline"><Eye className="mr-1.5 size-3.5" /> Preview portal</Button>
        <Button>Save changes</Button>
      </div>
    </div>
  );
}
