"use client";

import {
  CheckIcon,
  DownloadIcon,
  FileTextIcon,
  PrinterIcon,
  ShareIcon,
  ShieldCheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PetalMark } from "@/components/petal-mark";
import { cn } from "@/lib/utils";
import { type Client } from "@/lib/mock-data";

/**
 * Defense Package preview - the "if IRS knocks tomorrow, here's the folder"
 * artifact. Reusable in:
 *   - /dashboard/defense (roster + picker)
 *   - Client detail dialog "Defense" tab
 *   - Client full page "Defense" tab
 */

interface DefensePackageViewProps {
  client: Client;
  onAction?: (label: string) => void;
}

export function DefensePackageView({ client, onAction }: DefensePackageViewProps) {
  const noop = (label: string) => onAction?.(label);

  const packageId = `DP-2026-${client.id.toUpperCase().padStart(4, "0")}-${Math.floor(
    parseInt(client.id.replace(/\D/g, "") || "1") * 137
  )
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")}`;

  const positions = derivePositions(client);
  const docs = deriveDocuments(client);
  const signatures = deriveSignatures(client);
  const auditRisk = Math.min(95, 8 + positions.length * 4 + (client.urgency === "urgent" ? 12 : 0));

  return (
    <div className="space-y-4">
      {/* Action bar - download / share / print */}
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-2 text-[12px]">
          <PetalMark className="size-3.5 text-foreground/60" />
          <span className="font-medium">Defense package ready</span>
          <span className="text-muted-foreground">
            · built {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs" onClick={() => noop("Shared via secure link")}>
            <ShareIcon className="size-3.5" /> Share
          </Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => noop("Print queued")}>
            <PrinterIcon className="size-3.5" /> Print
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90 text-xs"
            onClick={() => noop("Downloaded PDF")}
          >
            <DownloadIcon className="size-3.5" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Document preview - styled like a printed defense doc */}
      <article className="rounded-lg border bg-card">
        {/* Cover */}
        <header className="border-b border-border/60 px-8 py-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-foreground/55">
            <ShieldCheckIcon className="size-3 text-emerald-600" />
            Audit defense package
          </div>
          <h1 className="font-display text-[28px] font-medium leading-tight tracking-tight md:text-[32px]">
            {client.fullName}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Tax year 2025 · prepared by Antonio Vazquez, EA
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-1.5 font-mono text-[11px] text-foreground/70">
            <span>Package ID:</span>
            <span className="font-semibold">{packageId}</span>
          </div>
        </header>

        {/* Body - sections */}
        <div className="space-y-7 px-8 py-8 md:px-10">
          {/* Section 1 - Audit risk summary */}
          <section>
            <DocSectionLabel n={1} title="Audit risk summary" />
            <div className="rounded-md border border-border/70 bg-background p-4">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[40px] font-medium leading-none tabular-nums">{auditRisk}%</span>
                <span
                  className={cn(
                    "text-[12px] font-medium",
                    auditRisk >= 25 ? "text-red-600" : auditRisk >= 12 ? "text-amber-600" : "text-emerald-600"
                  )}
                >
                  {auditRisk >= 25 ? "elevated" : auditRisk >= 12 ? "moderate" : "low"} risk
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                Based on {positions.length} {positions.length === 1 ? "position" : "positions"} taken, prior year
                baseline, and IRS 2026 enforcement focus areas. Defensible across all positions with current
                authority chain.
              </p>
            </div>
          </section>

          {/* Section 2 - Positions taken */}
          <section>
            <DocSectionLabel
              n={2}
              title="Positions taken"
              subtitle={`${positions.length} positions · full authority chain on each`}
            />
            <ul className="space-y-2.5">
              {positions.map((p) => (
                <li key={p.name} className="rounded-md border border-border/70 bg-background p-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <div>
                      <span className="font-mono text-[11px] text-foreground/55">{p.section}</span>
                      <h3 className="text-[13.5px] font-semibold">{p.name}</h3>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider ring-1",
                        p.tier === "Settled" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
                        p.tier === "Substantial" && "bg-blue-50 text-blue-700 ring-blue-200",
                        p.tier === "Reasonable Basis" && "bg-amber-50 text-amber-700 ring-amber-200"
                      )}
                    >
                      {p.tier}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">{p.rationale}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.authorities.map((a) => (
                      <span
                        key={a}
                        className="rounded border border-border/70 bg-background px-1.5 py-0.5 font-mono text-[10px] text-foreground/70"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 - Form 8867 attestation */}
          <section>
            <DocSectionLabel n={3} title="Form 8867 attestation" subtitle="Paid preparer due-diligence requirements" />
            <div className="rounded-md border border-emerald-200/60 bg-emerald-50/30 px-4 py-3 text-[12.5px] leading-relaxed dark:border-emerald-900/40 dark:bg-emerald-950/15">
              <div className="mb-2 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckIcon className="size-3.5" />
                <span className="font-medium">All due-diligence requirements satisfied</span>
              </div>
              <ul className="ml-1 space-y-1 text-foreground/85">
                <li>EITC eligibility verified and documented</li>
                <li>CTC / ACTC residency and relationship checks complete</li>
                <li>Head-of-Household qualifying child or qualifying relative confirmed</li>
                <li>AOTC enrollment + degree-seeking verified (where applicable)</li>
                <li>Form 8867 signed by preparer + retained for 3 years</li>
              </ul>
            </div>
          </section>

          {/* Section 4 - 7-layer shield attestation */}
          <section>
            <DocSectionLabel n={4} title="Compliance shield attestation" subtitle="7-layer minimum-viable shield" />
            <ul className="space-y-1.5">
              {[
                { layer: "L1", name: "§6695(g) due diligence", status: "100%" },
                { layer: "L2", name: "Position Library (20 positions tracked)", status: "applied" },
                { layer: "L3", name: "§6695(a-e) procedural", status: "100%" },
                { layer: "L4", name: "Anomaly detection (12 patterns)", status: "no flags" },
                { layer: "L5", name: "Audit defense workspace", status: "ready" },
                { layer: "L6", name: "Circular 230 hygiene", status: "100%" },
                { layer: "L7", name: "WISP + access security", status: "current" },
              ].map((l) => (
                <li key={l.layer} className="flex items-center gap-3 rounded-md border border-border/70 bg-background px-3 py-2">
                  <span className="w-7 shrink-0 font-mono text-[10.5px] font-medium uppercase tracking-wider text-foreground/55">
                    {l.layer}
                  </span>
                  <span className="flex-1 text-[12.5px] text-foreground/85">{l.name}</span>
                  <span className="shrink-0 text-[11.5px] font-medium tabular-nums text-emerald-600">{l.status}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 5 - Supporting documents */}
          <section>
            <DocSectionLabel n={5} title="Supporting documents" subtitle={`${docs.length} files retained per WISP`} />
            <ul className="space-y-1">
              {docs.map((d) => (
                <li key={d.name} className="flex items-center gap-3 rounded-md px-2 py-1.5 text-[12.5px]">
                  <FileTextIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-foreground/85">{d.name}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{d.date}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 6 - Signature chain */}
          <section>
            <DocSectionLabel n={6} title="Signature chain" subtitle="Timestamped + IP-logged · cryptographically chained" />
            <ul className="space-y-2">
              {signatures.map((s) => (
                <li key={s.who} className="flex items-start gap-3 rounded-md border border-border/70 bg-background p-3">
                  <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  <div className="flex-1">
                    <div className="text-[12.5px] font-medium">{s.who}</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      <span className="font-mono">{s.doc}</span>
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span className="tabular-nums">{s.when}</span>
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span className="font-mono">{s.ip}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 7 - Audit trail */}
          <section>
            <DocSectionLabel n={7} title="Audit trail" subtitle="Full chronological receipt log · retrievable 7 years" />
            <div className="rounded-md border border-border/70 bg-background p-4">
              <div className="text-[12.5px] leading-relaxed text-foreground/85">
                Every interaction on this engagement - every email, SMS, call transcript, video meeting, document
                upload, AI action, and preparer approval - is timestamped, IP-logged, and retained for 7 years per
                WISP. Full audit trail available on demand.
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Touchpoints" value="47" />
                <Stat label="AI actions" value="23" />
                <Stat label="Your actions" value="14" />
                <Stat label="Client actions" value="10" />
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-border/60 pt-5 text-center text-[11px] text-muted-foreground">
            This package was prepared by <span className="font-medium text-foreground/75">Petal</span> on behalf of Antonio Vazquez, EA · Vazant Consulting
            <br />
            Package ID <span className="font-mono">{packageId}</span> · retained per WISP § 4.2
          </footer>
        </div>
      </article>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function DocSectionLabel({ n, title, subtitle }: { n: number; title: string; subtitle?: string }) {
  return (
    <div className="mb-2.5">
      <div className="flex items-baseline gap-2 text-[10.5px] font-medium uppercase tracking-[0.08em] text-foreground/55">
        <span className="font-mono">Section {n}</span>
        <span className="text-muted-foreground/40">·</span>
        <span>{title}</span>
      </div>
      {subtitle && <div className="mt-0.5 text-[11.5px] text-muted-foreground">{subtitle}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-card px-2.5 py-2">
      <div className="font-display text-[18px] font-medium leading-none tabular-nums">{value}</div>
      <div className="mt-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Per-client derivations
// ─────────────────────────────────────────────────────────────────────────

function derivePositions(client: Client) {
  const positions: { name: string; section: string; tier: string; rationale: string; authorities: string[] }[] = [];

  if (client.type === "business") {
    positions.push({
      name: "QBI Deduction",
      section: "§199A",
      tier: "Settled",
      rationale: `Pass-through entity ${client.businessName ?? client.fullName}. Income within threshold. Standard 20% deduction on QBI.`,
      authorities: ["IRC §199A", "Treas. Reg. §1.199A-1", "Rev. Proc. 2019-38"],
    });
    positions.push({
      name: "§179 Expensing",
      section: "§179",
      tier: "Settled",
      rationale: "Tangible personal property placed in service this year. Election made on Form 4562.",
      authorities: ["IRC §179", "Treas. Reg. §1.179-1"],
    });
  } else {
    positions.push({
      name: "QBI Deduction",
      section: "§199A",
      tier: "Settled",
      rationale: `Schedule C income $${(client.feeAmount * 3).toLocaleString()}. Well below SSTB phase-in threshold.`,
      authorities: ["IRC §199A", "Treas. Reg. §1.199A-1"],
    });
    positions.push({
      name: "Home Office Deduction",
      section: "§280A",
      tier: "Settled",
      rationale: "Regular and exclusive use of dedicated home office space. Simplified method elected.",
      authorities: ["IRC §280A", "Publication 587"],
    });
  }

  if (client.serviceTier === "Premium") {
    positions.push({
      name: "Substantial Understatement Disclosure",
      section: "§6662",
      tier: "Substantial",
      rationale: "Position requires Form 8275 disclosure to shield from §6662 penalty. Authority chain documented.",
      authorities: ["IRC §6662", "Treas. Reg. §1.6662-3"],
    });
  }

  return positions;
}

function deriveDocuments(client: Client) {
  const base = [
    { name: "Engagement letter (signed)", date: "Jan 22, 2026" },
    { name: "Form 8867 (due diligence)", date: "Mar 14, 2026" },
    { name: "Form 8879 (e-file authorization)", date: "Mar 28, 2026" },
    { name: "Intake response form", date: "Jan 18, 2026" },
  ];
  if (client.type === "business") {
    base.push({ name: `${client.businessName ?? "Business"} formation docs`, date: "On file" });
    base.push({ name: "Bank statements (Q1-Q4)", date: "Mar 11, 2026" });
  }
  for (let i = 1; i <= client.documentsSubmitted; i++) {
    base.push({ name: `Supporting doc ${i}`, date: "various" });
  }
  return base.slice(0, 8);
}

function deriveSignatures(client: Client) {
  return [
    {
      who: "Client signed Form 8879",
      doc: "Form 8879",
      when: "Mar 28, 2026 · 9:14 AM PST",
      ip: "73.42.18.x · KBA passed",
    },
    {
      who: `${client.fullName.split(" ")[0]} signed engagement letter`,
      doc: "Engagement letter",
      when: "Jan 22, 2026 · 2:38 PM PST",
      ip: "73.42.18.x",
    },
    {
      who: "Antonio Vazquez, EA · ERO countersignature",
      doc: "Form 8879",
      when: "Mar 28, 2026 · 11:02 AM PST",
      ip: "Office IP · PTIN P0123456",
    },
    {
      who: "§7216 consent on file",
      doc: "Consent to disclose",
      when: "Jan 18, 2026 · 4:21 PM PST",
      ip: "73.42.18.x",
    },
  ];
}
