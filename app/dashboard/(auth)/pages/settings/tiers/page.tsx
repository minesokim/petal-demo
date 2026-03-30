"use client";

import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, DollarSign, X } from "lucide-react";
import { useState } from "react";

interface ServiceTier {
  id: string;
  name: string;
  description: string;
  price: string;
  includes: string[];
}

const defaultTiers: ServiceTier[] = [
  { id: "1", name: "Basic Individual", description: "Simple W-2 returns with standard deductions", price: "150", includes: ["Form 1040", "W-2 income", "Standard deduction", "State filing"] },
  { id: "2", name: "Standard Individual", description: "Complex returns with itemized deductions and schedules", price: "350", includes: ["Form 1040 + Schedules", "Itemized deductions", "Investment income (Sch D)", "Rental income (Sch E)", "State filing"] },
  { id: "3", name: "Business + Personal", description: "S-Corp, partnership, or sole proprietor with personal return", price: "500", includes: ["Form 1120S / 1065 / Schedule C", "K-1 preparation", "Personal 1040", "Estimated tax planning", "State filing (business + personal)"] },
  { id: "4", name: "Bookkeeping Monthly", description: "Monthly reconciliation and financial statements", price: "200", includes: ["Bank reconciliation", "Categorize transactions", "Monthly P&L", "Balance sheet", "QBO / Xero sync"] },
];

export default function ServiceTiersPage() {
  const [tiers, setTiers] = useState<ServiceTier[]>(defaultTiers);
  const [editingTier, setEditingTier] = useState<ServiceTier | null>(null);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [newInclude, setNewInclude] = useState("");

  const openTierDialog = (tier?: ServiceTier) => {
    setEditingTier(tier ? { ...tier, includes: [...tier.includes] } : { id: Date.now().toString(), name: "", description: "", price: "", includes: [] });
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
  };

  const addInclude = () => {
    if (!newInclude.trim() || !editingTier) return;
    setEditingTier({ ...editingTier, includes: [...editingTier.includes, newInclude.trim()] });
    setNewInclude("");
  };

  const removeInclude = (index: number) => {
    if (!editingTier) return;
    setEditingTier({ ...editingTier, includes: editingTier.includes.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Service Tiers</h3>
          <p className="text-sm text-muted-foreground">Configure your pricing packages. Assigned to clients during onboarding.</p>
        </div>
        <Button size="sm" onClick={() => openTierDialog()}><Plus className="mr-1.5 size-3.5" /> Add tier</Button>
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
                        <Badge key={i} variant="secondary" className="text-[10px] font-normal">{item}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="size-7" onClick={() => openTierDialog(tier)}><Pencil className="size-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => setTiers((p) => p.filter((t) => t.id !== tier.id))}><Trash2 className="size-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {tiers.length === 0 && (
          <Card><CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <DollarSign className="size-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">No service tiers configured</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => openTierDialog()}><Plus className="mr-1 size-3.5" /> Create your first tier</Button>
          </CardContent></Card>
        )}
      </div>

      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-base">{editingTier && tiers.find((t) => t.id === editingTier.id) ? "Edit Service Tier" : "New Service Tier"}</DialogTitle></DialogHeader>
          {editingTier && (
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-muted-foreground">Tier Name</label><Input className="mt-1" placeholder="e.g., Premium Business" value={editingTier.name} onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Description</label><Textarea className="mt-1 resize-none" rows={2} placeholder="Brief description" value={editingTier.description} onChange={(e) => setEditingTier({ ...editingTier, description: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Price ($)</label><Input className="mt-1" type="number" placeholder="350" value={editingTier.price} onChange={(e) => setEditingTier({ ...editingTier, price: e.target.value })} /></div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">What&apos;s Included</label>
                <div className="mt-1.5 space-y-1.5">
                  {editingTier.includes.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">{item}</div>
                      <Button size="icon" variant="ghost" className="size-6" onClick={() => removeInclude(i)}><X className="size-3" /></Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input className="text-xs" placeholder="e.g., Schedule C, State filing" value={newInclude} onChange={(e) => setNewInclude(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInclude())} />
                    <Button size="sm" variant="outline" onClick={addInclude}>Add</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" size="sm">Cancel</Button></DialogClose>
            <Button size="sm" onClick={saveTier}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
