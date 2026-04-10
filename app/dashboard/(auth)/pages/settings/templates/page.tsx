"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, X, Eye, FileText, Pencil, Check, Download } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/toast-notification";

interface ChecklistTemplate {
  tier: string;
  items: string[];
}

const defaultChecklists: ChecklistTemplate[] = [
  { tier: "Basic Individual", items: ["W-2", "Government-issued ID", "SSN card or ITIN", "Prior year return"] },
  { tier: "Standard Individual", items: ["W-2", "1099-NEC / 1099-MISC", "1099-INT / 1099-DIV", "1098 (Mortgage interest)", "Government-issued ID", "SSN card or ITIN", "Prior year return", "Investment statements (1099-B)"] },
  { tier: "Business + Personal", items: ["W-2 (personal)", "1099-NEC / 1099-MISC", "Business P&L / income statement", "Business expense receipts", "1120S / 1065 prior year", "K-1 forms", "Equipment / asset list", "Mileage log", "Payroll reports", "Government-issued ID", "Prior year return (personal)", "Prior year return (business)"] },
];

interface LegalDoc {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
}

const legalDocs: LegalDoc[] = [
  { id: "engagement", name: "Engagement Letter", description: "Defines scope of services, fees, and responsibilities. Auto-attached to every intake.", lastUpdated: "Mar 15, 2026" },
  { id: "7216", name: "7216 Consent Form", description: "Required IRS consent for sharing or disclosing tax return information.", lastUpdated: "Mar 15, 2026" },
  { id: "privacy", name: "Privacy Policy", description: "How client data is collected, stored, and protected.", lastUpdated: "Jan 10, 2026" },
];

// ── Document content matching portal text ──
function EngagementLetterContent() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-lg tracking-tight">Vazant Tax Consulting</h1>
        <p className="text-[10px] text-muted-foreground">Antonio Vazquez, EA · Montclair, CA 91763</p>
      </div>
      <Separator />
      <h2 className="text-sm font-semibold">Engagement Letter — Tax Preparation Services</h2>
      <p className="text-xs text-foreground/80 leading-relaxed">Dear [Client Name],</p>
      <p className="text-xs text-foreground/80 leading-relaxed">This letter confirms the terms of our engagement for the preparation of your 2025 federal and applicable state income tax returns. This engagement is limited to the preparation of income tax returns based on information you provide.</p>
      <p className="text-xs text-foreground/80 leading-relaxed"><strong>Scope of Services:</strong> We will prepare your 2025 Form 1040 U.S. Individual Income Tax Return and applicable schedules based on the information you provide. We will not audit or otherwise verify the data you submit, although we may ask for clarification or additional documentation.</p>
      <p className="text-xs text-foreground/80 leading-relaxed"><strong>Client Responsibilities:</strong> You are responsible for providing all information required for the preparation of complete and accurate returns. You should retain all documents that support your income, deductions, and credits.</p>
      <p className="text-xs text-foreground/80 leading-relaxed"><strong>Fees:</strong> Our fee for the [Service Tier] service is [Fee Amount]. A deposit of $50.00 is required at the time of engagement, with the remaining balance due upon completion.</p>
      <Separator />
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="border-b border-foreground/20 pb-1 mb-1"><span className="text-xs text-muted-foreground">Client Signature</span></div>
          <p className="text-xs text-muted-foreground">[Client Name]</p>
          <p className="text-xs text-muted-foreground">Date: _______________</p>
        </div>
        <div>
          <div className="border-b border-foreground/20 pb-1 mb-1"><span className="text-xs text-muted-foreground">Preparer Signature</span></div>
          <p className="text-xs text-muted-foreground">Antonio Vazquez, EA</p>
          <p className="text-xs text-muted-foreground">Date: _______________</p>
        </div>
      </div>
    </div>
  );
}

function ConsentFormContent() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-bold uppercase tracking-wider">Consent for Disclosure of Tax Return Information</h2>
        <p className="text-[10px] text-muted-foreground">Pursuant to Internal Revenue Code Section 7216</p>
      </div>
      <Separator />
      <p className="text-xs text-foreground/80 leading-relaxed">Federal law requires this consent form be provided to you. Unless authorized by law, we cannot disclose your tax return information to third parties for purposes other than the preparation and filing of your tax return without your consent.</p>
      <p className="text-xs text-foreground/80 leading-relaxed">You are not required to complete this form. If you choose not to complete this form, it will not affect our ability to prepare your tax return.</p>
      <p className="text-xs text-foreground/80 leading-relaxed"><strong>I, [Client Name],</strong> hereby authorize Antonio Vazquez, EA (Vazant Tax Consulting) to disclose my tax return information as necessary for the purpose of tax return preparation and related tax advisory services for the 2025 tax year.</p>
      <p className="text-xs text-foreground/80 leading-relaxed">This consent is valid for one year from the date signed below and may be revoked at any time by notifying the tax preparer in writing.</p>
      <Separator />
      <div>
        <div className="border-b border-foreground/20 pb-1 mb-1"><span className="text-xs text-muted-foreground">Client Signature</span></div>
        <p className="text-xs text-muted-foreground">[Client Name]</p>
        <p className="text-xs text-muted-foreground">Date: _______________</p>
      </div>
    </div>
  );
}

function PrivacyPolicyContent() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h1 className="font-display text-lg tracking-tight">Vazant Tax Consulting</h1>
        <h2 className="text-sm font-semibold">Privacy Policy</h2>
      </div>
      <Separator />
      <p className="text-xs text-foreground/80 leading-relaxed"><strong>Information We Collect:</strong> We collect personal information necessary for tax preparation, including but not limited to: names, Social Security Numbers, dates of birth, income information, and financial records. This information is provided directly by you through our client portal or in-person meetings.</p>
      <p className="text-xs text-foreground/80 leading-relaxed"><strong>How We Use Your Information:</strong> Your information is used solely for the purpose of preparing and filing your tax returns, providing tax advisory services, and communicating with the IRS or state tax agencies on your behalf.</p>
      <p className="text-xs text-foreground/80 leading-relaxed"><strong>Data Security:</strong> We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All data is encrypted in transit and at rest.</p>
      <p className="text-xs text-foreground/80 leading-relaxed"><strong>Data Retention:</strong> We retain your tax records for a minimum of 7 years as required by IRS regulations. After this period, records are securely destroyed.</p>
      <p className="text-xs text-foreground/80 leading-relaxed"><strong>Your Rights:</strong> You have the right to access, correct, or request deletion of your personal information at any time by contacting us directly.</p>
      <Separator />
      <p className="text-[10px] text-muted-foreground">Last updated: January 10, 2026 · Vazant Tax Consulting · Montclair, CA</p>
    </div>
  );
}

const docContent: Record<string, React.ReactNode> = {
  engagement: <EngagementLetterContent />,
  "7216": <ConsentFormContent />,
  privacy: <PrivacyPolicyContent />,
};

// ── Document Viewer Dialog ──
function TemplateViewerDialog({ doc, open, onOpenChange }: { doc: LegalDoc; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { showToast } = useToast();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex !h-[85vh] !w-[700px] !max-w-[700px] flex-col gap-0 overflow-hidden p-0" showCloseButton={false}>
        <div className="flex items-center justify-between border-b px-5 py-2.5 shrink-0">
          <h2 className="text-sm font-semibold">{doc.name}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => showToast("info", "Edit mode", "Template editing coming soon")}>
              <Pencil className="size-3" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => showToast("success", "Downloading", `${doc.name} PDF`)}>
              <Download className="size-3" /> Download
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-muted/10">
          <div className="mx-auto max-w-lg my-6 bg-white rounded-lg shadow-sm border p-8">
            {docContent[doc.id]}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TemplatesPage() {
  const [checklists, setChecklists] = useState(defaultChecklists);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");
  const [viewingDoc, setViewingDoc] = useState<LegalDoc | null>(null);

  const addItem = (tierName: string) => {
    if (!newItem.trim()) return;
    setChecklists(prev => prev.map(c => c.tier === tierName ? { ...c, items: [...c.items, newItem.trim()] } : c));
    setNewItem("");
  };

  const removeItem = (tierName: string, index: number) => {
    setChecklists(prev => prev.map(c => c.tier === tierName ? { ...c, items: c.items.filter((_, i) => i !== index) } : c));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Templates</h3>
        <p className="text-sm text-muted-foreground">Default document checklists and legal documents applied to new clients.</p>
      </div>

      {/* Document Checklists */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Document Checklists</h4>
          <p className="text-xs text-muted-foreground">Auto-generated when a client is assigned a tier</p>
        </div>
        <div className="space-y-3">
          {checklists.map((checklist) => (
            <Card key={checklist.tier}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{checklist.tier}</span>
                    <Badge variant="secondary" className="text-[10px]">{checklist.items.length} items</Badge>
                  </div>
                  <Button size="sm" variant="ghost" className="size-7" onClick={() => setEditingTier(editingTier === checklist.tier ? null : checklist.tier)}>
                    {editingTier === checklist.tier ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {checklist.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px] font-normal">{item}</Badge>
                      {editingTier === checklist.tier && (
                        <button onClick={() => removeItem(checklist.tier, i)} className="text-muted-foreground hover:text-destructive">
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {editingTier === checklist.tier && (
                  <div className="mt-3 flex gap-2">
                    <Input className="text-xs" placeholder="Add checklist item..." value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(checklist.tier))} />
                    <Button size="sm" variant="outline" onClick={() => addItem(checklist.tier)}>Add</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Legal Documents */}
      <div>
        <div className="mb-3">
          <h4 className="text-sm font-semibold">Legal Documents</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Auto-attached during client intake. Same documents shown in the client portal.</p>
        </div>
        <div className="space-y-2">
          {legalDocs.map((doc) => (
            <Card key={doc.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => setViewingDoc(doc)}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{doc.name}</span>
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700"><Check className="mr-1 size-3" /> Active</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Last updated {doc.lastUpdated}</p>
                </div>
                <Eye className="size-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Document Viewer */}
      {viewingDoc && (
        <TemplateViewerDialog doc={viewingDoc} open={!!viewingDoc} onOpenChange={(o) => !o && setViewingDoc(null)} />
      )}
    </div>
  );
}
