"use client";

import { useParams } from "next/navigation";
import { clients } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Clock, CheckCircle2, User, Briefcase, Home, DollarSign, Heart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock intake responses per client (keyed by client ID)
const INTAKE_DATA: Record<string, {
  submittedAt: string;
  service: string;
  filing: string;
  spouse?: { name: string; dob: string; ssn: string; occupation: string };
  personal: { name: string; dob: string; ssn: string; phone: string; email: string; occupation: string; address: string };
  states: string[];
  priorYear: string;
  dependents: { name: string; dob: string; ssn: string; relationship: string; months: string }[];
  income: string[];
  selfEmployment?: { business: string; entity: string; revenue: string; homeOffice: boolean; vehicle: boolean };
  rental?: { address: string; rent: string; mortgage: string; year: string };
  taxQuestions: string[];
  deductions: string[];
  refund: string;
  lifeEvents: string[];
  depositAmount: number;
  slot: string;
}> = {
  c1: { // James & Sofia Rodriguez
    submittedAt: "2026-03-20T10:30:00",
    service: "Complex Return",
    filing: "Married Filing Jointly",
    spouse: { name: "Sofia Rodriguez", dob: "06/15/1988", ssn: "***-**-4521", occupation: "Teacher" },
    personal: { name: "James Rodriguez", dob: "03/22/1985", ssn: "***-**-7832", phone: "(626) 555-0192", email: "james.rod@email.com", occupation: "Project Manager", address: "2341 Maple Ave, Montclair, CA 91763" },
    states: ["California"],
    priorYear: "Filed with Antonio last year",
    dependents: [
      { name: "Isabella Rodriguez", dob: "08/12/2018", ssn: "***-**-9012", relationship: "Daughter", months: "12" },
      { name: "Lucas Rodriguez", dob: "11/03/2020", ssn: "***-**-3456", relationship: "Son", months: "12" },
    ],
    income: ["W-2 Employee", "Investments / Crypto"],
    taxQuestions: ["Estimated tax payments", "HSA contributions"],
    deductions: ["Mortgage interest", "Childcare expenses", "Charitable donations"],
    refund: "Direct deposit",
    lifeEvents: [],
    depositAmount: 50,
    slot: "Mon, Mar 24 · 9:00 AM · Phone",
  },
  c2: { // Priya Sharma
    submittedAt: "2026-03-22T14:15:00",
    service: "Complex Return",
    filing: "Single",
    personal: { name: "Priya Sharma", dob: "09/14/1997", ssn: "***-**-6789", phone: "(951) 555-0198", email: "priya.sharma@outlook.com", occupation: "Content Creator", address: "445 Palm Dr #204, Riverside, CA 92501" },
    states: ["California"],
    priorYear: "First time filing (was on parents' return)",
    dependents: [],
    income: ["Self-Employed / 1099", "Investments / Crypto"],
    selfEmployment: { business: "Priya Creates LLC", entity: "LLC", revenue: "$85,000", homeOffice: true, vehicle: false },
    taxQuestions: ["First time filing independently", "Crypto trades"],
    deductions: ["Home office", "Business expenses"],
    refund: "Direct deposit",
    lifeEvents: ["Started a business"],
    depositAmount: 50,
    slot: "Sat, Mar 29 · 1:00 PM · Phone",
  },
  c14: { // Aisha Johnson
    submittedAt: "2026-03-18T09:45:00",
    service: "Standard Return",
    filing: "Single",
    personal: { name: "Aisha Johnson", dob: "04/28/1991", ssn: "***-**-2345", phone: "(626) 555-0189", email: "aisha.j@outlook.com", occupation: "Registered Nurse", address: "1120 Valley Blvd, Montclair, CA 91763" },
    states: ["California"],
    priorYear: "Filed with H&R Block",
    dependents: [],
    income: ["W-2 Employee", "Self-Employed / 1099"],
    selfEmployment: { business: "Aisha's Scrubs (Etsy)", entity: "Sole Proprietor", revenue: "$12,400", homeOffice: true, vehicle: false },
    taxQuestions: ["Side hustle taxes", "Can I deduct my nursing license renewal?"],
    deductions: ["Student loan interest", "Business expenses"],
    refund: "Direct deposit",
    lifeEvents: [],
    depositAmount: 50,
    slot: "Tue, Mar 19 · 10:00 AM · Video",
  },
  c3: { // Tyrone Mitchell
    submittedAt: "2026-03-15T11:20:00",
    service: "Standard Return",
    filing: "Single",
    personal: { name: "Tyrone Mitchell", dob: "07/09/1989", ssn: "***-**-8901", phone: "(323) 555-0177", email: "tyrone.m@gmail.com", occupation: "Rideshare Driver", address: "890 Central Ave, Los Angeles, CA 90012" },
    states: ["California"],
    priorYear: "Filed with Antonio last year (extended)",
    dependents: [
      { name: "Jaylen Mitchell", dob: "02/14/2015", ssn: "***-**-5678", relationship: "Son", months: "6" },
    ],
    income: ["Self-Employed / 1099"],
    selfEmployment: { business: "Self (Uber/Lyft)", entity: "Sole Proprietor", revenue: "$52,000", homeOffice: false, vehicle: true },
    taxQuestions: ["Mileage deduction", "Quarterly estimated taxes"],
    deductions: ["Vehicle expenses"],
    refund: "Direct deposit",
    lifeEvents: ["Divorced"],
    depositAmount: 50,
    slot: "Thu, Mar 20 · 2:00 PM · Phone",
  },
};

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-muted-foreground size-4" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between border-b py-2 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={`text-right text-sm font-medium ${highlight ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}

export default function IntakePage() {
  const params = useParams();
  const clientId = params.id as string;
  const client = clients.find(c => c.id === clientId);
  const intake = INTAKE_DATA[clientId];

  if (!client) return <div className="text-muted-foreground py-10 text-center">Client not found</div>;

  if (!intake) {
    return (
      <div className="py-16 text-center">
        <FileText className="text-muted-foreground/30 mx-auto mb-4 size-12" />
        <h3 className="text-lg font-semibold">No intake submitted</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {client.fullName} hasn&apos;t completed the intake questionnaire yet.
        </p>
        <div className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-xs">
          <Clock className="size-3" />
          <span>Intake link sent · Awaiting completion</span>
        </div>
      </div>
    );
  }

  const submitted = new Date(intake.submittedAt);

  return (
    <div className="space-y-5">
      {/* Header */}
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
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="size-3.5" />
          Export PDF
        </Button>
      </div>

      {/* Service + Filing */}
      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={Briefcase} title="Service & Filing">
          <Row label="Service selected" value={intake.service} />
          <Row label="Filing status" value={intake.filing} />
          <Row label="State(s)" value={intake.states.join(", ")} />
          <Row label="Prior year" value={intake.priorYear} />
          <Row label="Deposit" value={`$${intake.depositAmount} paid`} highlight />
          <Row label="Appointment" value={intake.slot} />
        </Section>

        <Section icon={User} title="Personal Information">
          <Row label="Full name" value={intake.personal.name} />
          <Row label="Date of birth" value={intake.personal.dob} />
          <Row label="SSN" value={intake.personal.ssn} />
          <Row label="Phone" value={intake.personal.phone} />
          <Row label="Email" value={intake.personal.email} />
          <Row label="Occupation" value={intake.personal.occupation} />
          <Row label="Address" value={intake.personal.address} />
        </Section>
      </div>

      {/* Spouse (if MFJ) */}
      {intake.spouse && (
        <Section icon={Heart} title="Spouse Information">
          <div className="grid gap-0 md:grid-cols-2 md:gap-x-8">
            <Row label="Name" value={intake.spouse.name} />
            <Row label="Date of birth" value={intake.spouse.dob} />
            <Row label="SSN" value={intake.spouse.ssn} />
            <Row label="Occupation" value={intake.spouse.occupation} />
          </div>
        </Section>
      )}

      {/* Dependents */}
      {intake.dependents.length > 0 && (
        <Section icon={User} title={`Dependents (${intake.dependents.length})`}>
          {intake.dependents.map((dep, i) => (
            <div key={i} className={`${i > 0 ? "mt-4 border-t pt-4" : ""}`}>
              <div className="mb-1 text-xs font-semibold text-muted-foreground">DEPENDENT {i + 1}</div>
              <div className="grid gap-0 md:grid-cols-2 md:gap-x-8">
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

      {/* Income */}
      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={DollarSign} title="Income Sources">
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

        <div className="space-y-4">
          <Section icon={FileText} title="Tax Questions">
            <div className="flex flex-wrap gap-2">
              {intake.taxQuestions.map(q => (
                <Badge key={q} variant="outline">{q}</Badge>
              ))}
            </div>
          </Section>

          <Section icon={Home} title="Deductions">
            <div className="flex flex-wrap gap-2">
              {intake.deductions.map(d => (
                <Badge key={d} variant="outline">{d}</Badge>
              ))}
            </div>
          </Section>

          {intake.lifeEvents.length > 0 && (
            <Section icon={Calendar} title="Life Events (2025)">
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
      <Section icon={DollarSign} title="Refund Preference">
        <Row label="Method" value={intake.refund} />
      </Section>

      {/* Legal agreements */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <h3 className="text-sm font-semibold">Legal Agreements</h3>
        </div>
        <div className="space-y-2">
          {[
            { name: "Engagement Letter", date: submitted.toLocaleDateString() },
            { name: "IRC §7216 Consent", date: submitted.toLocaleDateString() },
          ].map(doc => (
            <div key={doc.name} className="flex items-center justify-between rounded-lg border px-4 py-2.5">
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
