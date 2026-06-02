"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { memberInitials } from "@/lib/firm-mock-data";

export default function FirmProfilePage() {
  const [saved, setSaved] = useState(false);
  const { user, firm } = useSession();
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  // The owner-level fields (firm name, EIN) come from `firm`; the
  // preparer-level fields (preparer name, email) come from `user` so
  // switching personas shows that member's profile.
  const preparerName = user.credential ? `${user.fullName}, ${user.credential}` : user.fullName;

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
              {user.avatar && <AvatarImage src={user.avatar} alt={user.fullName} />}
              <AvatarFallback>{memberInitials(user)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <label><Button size="sm" variant="outline" asChild><span>Change photo</span></Button><input type="file" accept="image/*" className="hidden" /></label>
              <p className="text-[11px] text-muted-foreground">Used on your portal and client emails</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-muted-foreground">Firm Name</label><Input defaultValue={firm.name} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Preparer Name</label><Input defaultValue={preparerName} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input defaultValue={user.email} className="mt-1" /></div>
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
            <div>
              <label className="text-xs font-medium text-muted-foreground">PTIN</label>
              <Input
                key={`ptin-${user.id}`}
                defaultValue={user.ptin ?? ""}
                placeholder={user.ptin ? undefined : "Not assigned"}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">EFIN</label>
              <Input
                key={`efin-${user.id}`}
                defaultValue={user.efin ?? ""}
                placeholder={user.efin ? undefined : "Not assigned"}
                className="mt-1"
              />
            </div>
          </div>
          {!user.ptin && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              {user.role === "ai"
                ? "Petal doesn't sign returns — credentials aren't applicable."
                : "This role can't sign as ERO, so a PTIN isn't required."}
            </p>
          )}
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
