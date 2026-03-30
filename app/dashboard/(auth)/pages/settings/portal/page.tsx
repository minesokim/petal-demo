"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Globe, Upload, Eye, Video, Play, Pencil, Trash2, Plus } from "lucide-react";
import { useState } from "react";

const stageMessages = [
  { stage: "Collecting Documents", key: "collecting", default: "We're waiting on a few documents from you. Please upload them through your portal to keep things moving." },
  { stage: "In Preparation", key: "preparation", default: "Antonio is preparing your return. You'll be notified when it's ready for review." },
  { stage: "Client Review", key: "review", default: "Your return is ready for review! Please check it over and let us know if you have any questions." },
  { stage: "Pay & Sign", key: "pay_sign", default: "Your return is ready! Please complete payment and sign Form 8879 to authorize filing." },
  { stage: "Filed", key: "filed", default: "Your return has been filed with the IRS. You'll receive confirmation once it's accepted." },
];

interface WelcomeVideo {
  id: string;
  label: string;
  description: string;
  trigger: string;
  url: string;
  uploaded: boolean;
}

const defaultVideos: WelcomeVideo[] = [
  {
    id: "first_time",
    label: "First-Time Client",
    description: "Introduce yourself and walk new clients through how the portal works, what to expect, and how to upload their documents.",
    trigger: "Shown on first login after onboarding",
    url: "",
    uploaded: false,
  },
  {
    id: "returning",
    label: "Returning Client",
    description: "Welcome back message for clients who filed with you last year. Highlight what's new and what you'll need from them this season.",
    trigger: "Shown on first login of new tax season",
    url: "",
    uploaded: false,
  },
  {
    id: "docs_complete",
    label: "Documents Received",
    description: "Thank the client for submitting everything and let them know what happens next. Sets expectations for turnaround time.",
    trigger: "Shown when all required documents are received",
    url: "",
    uploaded: true,
  },
  {
    id: "return_ready",
    label: "Return Ready for Review",
    description: "Walk the client through how to review their return, what to look for, and how to ask questions before signing.",
    trigger: "Shown when return moves to Client Review stage",
    url: "",
    uploaded: false,
  },
  {
    id: "post_filing",
    label: "Post-Filing Thank You",
    description: "Thank the client, confirm their return is filed, explain refund timelines, and mention year-round services like bookkeeping or estimated taxes.",
    trigger: "Shown after return is filed and accepted",
    url: "",
    uploaded: false,
  },
];

export default function PortalSettingsPage() {
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to Vazant Consulting's secure client portal. Upload your documents, track your return, and message Antonio directly.");
  const [messages, setMessages] = useState(stageMessages.map(s => ({ ...s, value: s.default })));
  const [videos, setVideos] = useState(defaultVideos);

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
          <CardDescription>Text greeting shown on the portal homepage beneath your video.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} rows={3} className="resize-none" />
        </CardContent>
      </Card>

      {/* Welcome Videos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Welcome Videos</CardTitle>
          <CardDescription>
            Personal video messages shown to clients at key moments. Clients see your face, hear your voice, and feel the human touch that sets your practice apart.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {videos.map((video) => (
            <div key={video.id} className="rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${video.uploaded ? "bg-primary/10" : "bg-muted"}`}>
                  <Video className={`size-4 ${video.uploaded ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{video.label}</span>
                    {video.uploaded ? (
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700 text-[10px]">Uploaded</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Not uploaded</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{video.description}</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground/60">Trigger:</span>
                    <span className="text-[10px] text-muted-foreground">{video.trigger}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {video.uploaded ? (
                    <>
                      <Button size="icon" variant="ghost" className="size-7"><Play className="size-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="size-7"><Pencil className="size-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline">
                      <Upload className="mr-1.5 size-3" /> Upload
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="rounded-xl border border-dashed p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Videos should be 30-90 seconds. MP4 or MOV, max 100MB.
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground/60">
              Tip: Record with your phone in landscape. Clients appreciate seeing your face — it builds trust.
            </p>
          </div>
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

      <div className="flex justify-end gap-2">
        <Button variant="outline"><Eye className="mr-1.5 size-3.5" /> Preview portal</Button>
        <Button>Save changes</Button>
      </div>
    </div>
  );
}
