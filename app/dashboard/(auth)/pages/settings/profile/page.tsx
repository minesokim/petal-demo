"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";

export default function FirmProfilePage() {
  const [saved, setSaved] = useState(false);
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Firm Profile</h3>
        <p className="text-sm text-muted-foreground">Your firm information and credentials used across Petal.</p>
      </div>

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
            <div className="space-y-1">
              <label><Button size="sm" variant="outline" asChild><span>Change photo</span></Button><input type="file" accept="image/*" className="hidden" /></label>
              <p className="text-[11px] text-muted-foreground">Used on your portal and client emails</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-muted-foreground">Firm Name</label><Input defaultValue="Vazant Consulting" className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Preparer Name</label><Input defaultValue="Antonio Vazquez, EA" className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input defaultValue="antonio@vazantconsulting.com" className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Phone</label><Input defaultValue="(951) 555-0100" className="mt-1" /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tax Credentials</CardTitle>
          <CardDescription>Required for e-filing and ERO signing. Configure your ERO signature in E-Filing & ERO settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-muted-foreground">PTIN</label><Input defaultValue="P01234567" className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">EFIN</label><Input defaultValue="123456" className="mt-1" /></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saved}>
          {saved ? <><Check className="size-3.5" /> Saved</> : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
