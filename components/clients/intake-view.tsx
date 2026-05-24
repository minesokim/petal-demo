"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Clock, CheckCircle2, User, Briefcase, Home, DollarSign, Heart, Calendar } from "lucide-react";
import { INTAKE_DATA } from "@/lib/intake-data";

/**
 * Shared intake renderer — used by both the full-page client intake view and
 * the popup dialog's Intake tab. Keeps them visually + structurally in sync.
 *
 * The popup variant tightens padding slightly; everything else is identical.
 */
interface IntakeViewProps {
  clientId: string;
  clientFullName: string;
  /** "popup" tightens padding for the dialog's narrower columns. Default "page". */
  variant?: "page" | "popup";
}

function Section({
  icon: Icon, title, children, variant = "page",
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  variant?: "page" | "popup";
}) {
  return (
    <div className={variant === "popup" ? "rounded-xl border bg-card p-4" : "rounded-xl border bg-card p-5"}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2 last:border-0">
      <span className="text-muted-foreground text-sm shrink-0">{label}</span>
      <span className={`text-right text-sm font-medium truncate ${highlight ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}

export function IntakeView({ clientId, clientFullName, variant = "page" }: IntakeViewProps) {
  const intake = INTAKE_DATA[clientId];

  if (!intake) {
    return (
      <div className="py-12 text-center">
        <FileText className="text-muted-foreground/30 mx-auto mb-4 size-10" />
        <h3 className="text-sm font-semibold">No intake submitted</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {clientFullName} hasn&apos;t completed the intake questionnaire yet.
        </p>
        <div className="text-muted-foreground mt-3 flex items-center justify-center gap-2 text-xs">
          <Clock className="size-3" />
          <span>Intake link sent · Awaiting completion</span>
        </div>
      </div>
    );
  }

  const submitted = new Date(intake.submittedAt);
  // In popup mode columns are narrower, so we keep most sections single-column
  // by default. Side-by-side groups use a single breakpoint so the layout stays
  // simple within whatever container width we're rendered into.
  const gridClass = variant === "popup" ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 md:grid-cols-2";

  return (
    <div className={variant === "popup" ? "space-y-3" : "space-y-5"}>
      {/* Header — completed status + Export PDF */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Intake completed</span>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Submitted {submitted.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {submitted.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={(e) => {
            const btn = e.currentTarget;
            btn.textContent = "Exported!";
            btn.disabled = true;
            setTimeout(() => { btn.textContent = "Export PDF"; btn.disabled = false; }, 1500);
          }}
        >
          <Download className="size-3.5" />
          Export PDF
        </Button>
      </div>

      {/* Service + Personal */}
      <div className={gridClass}>
        <Section icon={Briefcase} title="Service & Filing" variant={variant}>
          <Row label="Service selected" value={intake.service} />
          <Row label="Filing status" value={intake.filing} />
          <Row label="State(s)" value={intake.states.join(", ")} />
          <Row label="Prior year" value={intake.priorYear} />
          <Row label="Deposit" value={`$${intake.depositAmount} paid`} highlight />
          <Row label="Appointment" value={intake.slot} />
        </Section>

        <Section icon={User} title="Personal Information" variant={variant}>
          <Row label="Full name" value={intake.personal.name} />
          <Row label="Date of birth" value={intake.personal.dob} />
          <Row label="SSN" value={intake.personal.ssn} />
          <Row label="Phone" value={intake.personal.phone} />
          <Row label="Email" value={intake.personal.email} />
          <Row label="Occupation" value={intake.personal.occupation} />
          <Row label="Address" value={intake.personal.address} />
        </Section>
      </div>

      {/* Spouse */}
      {intake.spouse && (
        <Section icon={Heart} title="Spouse Information" variant={variant}>
          <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-6">
            <Row label="Name" value={intake.spouse.name} />
            <Row label="Date of birth" value={intake.spouse.dob} />
            <Row label="SSN" value={intake.spouse.ssn} />
            <Row label="Occupation" value={intake.spouse.occupation} />
          </div>
        </Section>
      )}

      {/* Dependents */}
      {intake.dependents.length > 0 && (
        <Section icon={User} title={`Dependents (${intake.dependents.length})`} variant={variant}>
          {intake.dependents.map((dep, i) => (
            <div key={i} className={`${i > 0 ? "mt-4 border-t pt-4" : ""}`}>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">DEPENDENT {i + 1}</div>
              <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-6">
                <Row label="Name" value={dep.name} />
                <Row label="DOB" value={dep.dob} />
                <Row label="SSN" value={dep.ssn} />
                <Row label="Relationship" value={dep.relationship} />
                <Row label="Months in home" value={dep.months} />
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* Income / Deductions / Tax Q's */}
      <div className={gridClass}>
        <Section icon={DollarSign} title="Income Sources" variant={variant}>
          <div className="flex flex-wrap gap-2">
            {intake.income.map(inc => (
              <Badge key={inc} variant="secondary">{inc}</Badge>
            ))}
          </div>
          {intake.selfEmployment && (
            <div className="mt-4 border-t pt-3">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">SELF-EMPLOYMENT DETAILS</div>
              <Row label="Business name" value={intake.selfEmployment.business} />
              <Row label="Entity type" value={intake.selfEmployment.entity} />
              <Row label="Est. revenue" value={intake.selfEmployment.revenue} />
              <Row label="Home office" value={intake.selfEmployment.homeOffice ? "Yes" : "No"} />
              <Row label="Vehicle for business" value={intake.selfEmployment.vehicle ? "Yes" : "No"} />
            </div>
          )}
          {intake.rental && (
            <div className="mt-4 border-t pt-3">
              <div className="mb-2 text-xs font-semibold text-muted-foreground">RENTAL PROPERTY</div>
              <Row label="Address" value={intake.rental.address} />
              <Row label="Monthly rent" value={intake.rental.rent} />
              <Row label="Mortgage" value={intake.rental.mortgage} />
              <Row label="Year acquired" value={intake.rental.year} />
            </div>
          )}
        </Section>

        <div className={variant === "popup" ? "space-y-3" : "space-y-4"}>
          <Section icon={FileText} title="Tax Questions" variant={variant}>
            <div className="flex flex-wrap gap-2">
              {intake.taxQuestions.map(q => (
                <Badge key={q} variant="outline">{q}</Badge>
              ))}
            </div>
          </Section>

          <Section icon={Home} title="Deductions" variant={variant}>
            <div className="flex flex-wrap gap-2">
              {intake.deductions.map(d => (
                <Badge key={d} variant="outline">{d}</Badge>
              ))}
            </div>
          </Section>

          {intake.lifeEvents.length > 0 && (
            <Section icon={Calendar} title="Life Events (2025)" variant={variant}>
              <div className="flex flex-wrap gap-2">
                {intake.lifeEvents.map(e => (
                  <Badge key={e} variant="secondary">{e}</Badge>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Refund preference */}
      <Section icon={DollarSign} title="Refund Preference" variant={variant}>
        <Row label="Method" value={intake.refund} />
      </Section>

      {/* Legal agreements */}
      <div className={variant === "popup" ? "rounded-xl border bg-card p-4" : "rounded-xl border bg-card p-5"}>
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <h3 className="text-sm font-semibold">Legal Agreements</h3>
        </div>
        <div className="space-y-2">
          {[
            { name: "Engagement Letter", date: submitted.toLocaleDateString() },
            { name: "IRC §7216 Consent", date: submitted.toLocaleDateString() },
          ].map(doc => (
            <div key={doc.name} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                <span className="text-sm">{doc.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">Signed {doc.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
