"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, X, Eye, FileText, Upload, Pencil, Check } from "lucide-react";
import { useState } from "react";

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
  name: string;
  description: string;
  lastUpdated: string;
  uploaded: boolean;
}

const defaultLegalDocs: LegalDoc[] = [
  { name: "Engagement Letter", description: "Defines scope of services, fees, and responsibilities. Auto-attached to every intake.", lastUpdated: "Mar 15, 2026", uploaded: true },
  { name: "7216 Consent Form", description: "Required IRS consent for sharing or disclosing tax return information.", lastUpdated: "Mar 15, 2026", uploaded: true },
  { name: "Privacy Policy", description: "How client data is collected, stored, and protected.", lastUpdated: "Jan 10, 2026", uploaded: true },
];

export default function TemplatesPage() {
  const [checklists, setChecklists] = useState(defaultChecklists);
  const [editingTier, setEditingTier] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");

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

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Legal Documents</h4>
          <Button size="sm" variant="outline"><Upload className="mr-1.5 size-3" /> Upload template</Button>
        </div>

        <div className="space-y-2">
          {defaultLegalDocs.map((doc) => (
            <Card key={doc.name}>
              <CardContent className="flex items-center gap-4 py-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <FileText className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{doc.name}</span>
                    {doc.uploaded && <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700"><Check className="mr-1 size-3" /> Uploaded</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Last updated {doc.lastUpdated}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost"><Eye className="size-3.5" /></Button>
                  <Button size="sm" variant="ghost"><Pencil className="size-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
