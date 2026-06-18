"use client";

// Intake — merged into the Returns flow. Two scopes:
//  • household → a full "Intake & readiness" record on the client page Intake tab
//    (filing profile + taxpayer/spouse identity + address + dependents + direct
//     deposit + income sources + deductions & credits + estimates + onboarding)
//  • engagement → an "Organizer" card folded into the return record's Overview
//    (life-changes questionnaire + document progress + authorizations)
// Identity-level fields are a faithful mockup: derived deterministically from a
// seed so they stay stable across renders (hydration-safe), with hand-tuned
// detail for the main exemplars. Everything structural derives from lib/fixtures.

import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import {
  householdById, peopleOf, entitiesOf, engagementsOf, engagementById, entityById,
  docsOfEngagement, type Person,
} from "@/lib/fixtures/firm";

const kindLabel = { individual: "Individual", business: "Business", mixed: "Individual + business" } as const;
const initials = (n: string) => n.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TAX_YEAR = 2025;

/** tiny deterministic PRNG seeded by a string — keeps the mockup stable. */
function rng(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const digits = (r: () => number, n: number) => Array.from({ length: n }, () => Math.floor(r() * 10)).join("");
const money = (n: number) => `$${n.toLocaleString()}`;

/** status pill — dot + label, green when satisfied / amber when pending */
function Pill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 py-1 text-[12px] text-[var(--os-ink)]">
      <span className={cn("size-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
      {label}
    </span>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <div className="os-label mb-2.5">{children}</div>;
}

/** a labelled field — small muted label over its value */
function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-[var(--os-ink-subtle)]">{label}</span>
      <span className={cn("text-[13px] text-[var(--os-ink)]", mono && "tabular-nums")}>{value}</span>
    </div>
  );
}

/** section heading with a hairline rule above it */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-[var(--os-border)] pt-4">
      <SubLabel>{title}</SubLabel>
      {children}
    </div>
  );
}

/** a yes / amount row used by deductions & credits */
function ItemRow({ label, value, on }: { label: string; value: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--os-border)] py-2 last:border-0">
      <span className="flex items-center gap-2 text-[12.5px] text-[var(--os-ink-muted)]">
        <span className={cn("size-1.5 shrink-0 rounded-full", on ? "bg-emerald-500" : "bg-[var(--os-border-strong)]")} />
        {label}
      </span>
      <span className={cn("shrink-0 text-right text-[12.5px] font-medium tabular-nums", on ? "text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)]")}>{value}</span>
    </div>
  );
}

/** organizer Q&A — life-changes questionnaire (tailored lightly by household story) */
function questionnaire(catchUp: string, isBusiness: boolean): { q: string; a: string; flag?: boolean }[] {
  const c = catchUp.toLowerCase();
  return [
    { q: "Change in marital status this year?", a: "No" },
    { q: "New or departing dependents?", a: c.includes("kids") ? "No change — dependents on file" : "No" },
    { q: "Bought, sold, or refinanced property?", a: c.includes("rental") ? "Yes — rental activity (Sch E)" : "No", flag: c.includes("rental") },
    { q: "Foreign accounts or assets (FBAR / 8938)?", a: "No" },
    { q: "Digital asset (crypto) transactions?", a: c.includes("brokerage") ? "Reviewing — 1099-B in collection" : "No", flag: c.includes("brokerage") },
    isBusiness
      ? { q: "Material change in business income or structure?", a: (c.includes("dropped") || c.includes("closed")) ? "Yes — confirmed by client" : "No material change", flag: c.includes("dropped") || c.includes("closed") }
      : { q: "Estimated tax payments this year?", a: c.includes("estimate") ? "Q2 flagged — follow-up sent" : "None reported", flag: c.includes("estimate") },
  ];
}

/* ── per-household hand-tuned detail (falls back to derived values) ── */
type Override = {
  occ?: Record<string, string>;
  address?: { street: string; city: string; zip: string; county: string };
  dependents?: { name: string; relation: string; dob: string; ssn4: string; months: number; credit: string }[];
  bank?: { name: string; type: string; routing: string; account: string };
};
const OVERRIDES: Record<string, Override> = {
  "h-chen": {
    occ: { "p-marcus": "Restaurant owner", "p-lin": "Office manager" },
    address: { street: "1842 Camino Real", city: "Riverside", zip: "92504", county: "Riverside" },
    dependents: [
      { name: "Ethan Chen", relation: "Son", dob: "Mar 2012", ssn4: "7781", months: 12, credit: "Child Tax Credit" },
      { name: "Maya Chen", relation: "Daughter", dob: "Aug 2015", ssn4: "7782", months: 12, credit: "Child Tax Credit" },
    ],
    bank: { name: "Chase", type: "Checking", routing: "6021", account: "4417" },
  },
  "h-williams": {
    occ: { "p-deshawn": "Warehouse supervisor" },
    dependents: [
      { name: "Jordan Williams", relation: "Son", dob: "Jun 2014", ssn4: "3390", months: 12, credit: "Child Tax Credit" },
      { name: "Aaliyah Williams", relation: "Daughter", dob: "Feb 2017", ssn4: "3391", months: 12, credit: "Child Tax Credit" },
    ],
  },
  "h-park": { occ: { "p-david": "Dentist", "p-grace": "Dental hygienist" } },
};

const CITIES = ["Riverside", "Corona", "Moreno Valley", "Rancho Cucamonga", "Pasadena", "Fontana"];
const STREETS = ["Magnolia Ave", "Mission Inn Ave", "Van Buren Blvd", "Arlington Ave", "Sierra Vista Dr", "Brockton Ave"];
const BANKS = ["Chase", "Bank of America", "Wells Fargo", "U.S. Bank", "Schools First FCU"];
const OCC_OWNER = ["Business owner", "Self-employed", "Managing member"];
const OCC_IND = ["Operations manager", "Registered nurse", "Account executive", "Electrician", "Project coordinator"];
const OCC_SPOUSE = ["Teacher", "Office manager", "Nurse", "Software engineer", "Administrator"];

function person(p: Person, ov: Override, isPrimary: boolean) {
  const r = rng(p.id);
  const occPool = ov.occ?.[p.id] ? [ov.occ[p.id]] : p.role === "Owner" || p.role === "Partner" ? OCC_OWNER : isPrimary ? OCC_IND : OCC_SPOUSE;
  const year = 1962 + Math.floor(r() * 33); // 1962–1994
  const dob = `${MONTHS[Math.floor(r() * 12)]} ${1 + Math.floor(r() * 27)}, ${year}`;
  return {
    name: p.name,
    role: p.role,
    ssn: `•••-••-${digits(r, 4)}`,
    dob: `${dob} · age ${2026 - year}`,
    occ: occPool[Math.floor(r() * occPool.length)],
    phone: p.phone,
    email: p.email,
    dl: `CA · D••••${digits(r, 4)} · exp ${2027 + Math.floor(r() * 3)}`,
  };
}

export function IntakeRecord({ householdId, engagementId }: { householdId: string; engagementId?: string }) {
  const h = householdById(householdId);
  if (!h) return null;
  const isBusiness = h.kind !== "individual";

  /* ──────────────────── Engagement scope · "Organizer" ──────────────────── */
  if (engagementId) {
    const eng = engagementById(engagementId);
    const ent = eng ? entityById(eng.entityId) : undefined;
    const docs = eng ? docsOfEngagement(eng.id) : [];
    const have = docs.filter(d => d.status === "have").length;
    const denom = docs.length || 1;
    const pct = Math.round((have / denom) * 100);
    const signed = eng && (eng.stage === "accepted" || eng.stage === "e_filed");
    const outForSig = eng?.stage === "pay_and_sign";
    const qs = questionnaire(h.catchUp, isBusiness);

    return (
      <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <PetalMark className="size-4 text-[var(--os-ink-muted)]" />
          <h3 className="os-display text-[15px] text-[var(--os-ink)]">Organizer</h3>
          <span className="ml-auto rounded-full bg-[var(--os-selected)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">TY{eng?.taxYear} · {ent?.type}</span>
        </div>

        {/* life-changes questionnaire — flagged answers carry weight */}
        <SubLabel>Life changes since last year</SubLabel>
        <div className="grid gap-x-6 gap-y-0 sm:grid-cols-2">
          {qs.map(({ q, a, flag }) => (
            <div key={q} className="flex items-start justify-between gap-3 border-b border-[var(--os-border)] py-2.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
              <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-[var(--os-ink-muted)]">{q}</span>
              <span className={cn("shrink-0 text-right text-[12.5px] font-medium", flag ? "text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)]")}>{a}</span>
            </div>
          ))}
        </div>

        {/* document progress */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <SubLabel>Documents</SubLabel>
            <span className="text-[12px] tabular-nums text-[var(--os-ink-muted)]">{have} of {docs.length} in hand</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--os-selected)]">
            <div className="h-full rounded-full bg-[var(--os-primary)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* authorizations */}
        <div className="mt-5">
          <SubLabel>Authorizations</SubLabel>
          <div className="flex flex-wrap gap-1.5">
            <Pill label={`Engagement letter · ${h.since}`} ok />
            <Pill label="§7216 consent" ok />
            <Pill label={`8879 · ${signed ? "signed" : outForSig ? "out for signature" : "not generated"}`} ok={!!signed} />
          </div>
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-[12px] text-[var(--os-ink-subtle)]">
          <PetalMark className="mt-0.5 size-3 shrink-0" /> Petal pre-fills the organizer from the prior-year return and portal intake — confirm before prep.
        </p>
      </div>
    );
  }

  /* ──────────────────── Household scope · "Intake & readiness" ──────────────────── */
  const ppl = peopleOf(householdId);
  const ents = entitiesOf(householdId);
  const engs = engagementsOf(householdId);
  const ov = OVERRIDES[householdId] ?? {};
  const r = rng(householdId);

  const indForm = ents.find(e => e.form === "1040");
  const filingTypeRaw = indForm?.type ?? ents[0]?.type ?? kindLabel[h.kind];
  const spousePerson = ppl.find(p => p.role === "Spouse");
  const filingStatus = /mfj/i.test(filingTypeRaw) ? "Married filing jointly"
    : /hoh/i.test(filingTypeRaw) ? "Head of household"
    : spousePerson ? "Married filing jointly" : "Single";
  const forms = Array.from(new Set(ents.map(e => e.form))).join(" · ");
  const hasRefundBank = engs.some(e => e.refund);

  // identity
  const primaryPerson = ppl.find(p => p.role === "Taxpayer" || p.role === "Owner" || p.role === "Partner") ?? ppl[0];
  const secondPerson = spousePerson ?? (ppl[0]?.role === "Partner" ? ppl[1] : undefined);
  const others = ppl.filter(p => p !== primaryPerson && p !== secondPerson);
  const taxpayer = primaryPerson ? person(primaryPerson, ov, true) : null;
  const spouse = secondPerson ? person(secondPerson, ov, false) : null;

  // address
  const addr = ov.address ?? {
    street: `${100 + Math.floor(r() * 8900)} ${STREETS[Math.floor(r() * STREETS.length)]}`,
    city: CITIES[Math.floor(r() * CITIES.length)],
    zip: `9${digits(r, 4)}`,
    county: "Riverside",
  };

  // dependents
  const cu = h.catchUp.toLowerCase();
  const dependents = ov.dependents ?? (cu.includes("kids") ? [
    { name: `${primaryPerson?.name.split(" ").slice(-1)[0] ?? "Child"} (minor)`, relation: "Dependent", dob: "—", ssn4: digits(r, 4), months: 12, credit: "Child Tax Credit" },
  ] : []);

  // direct deposit
  const bank = ov.bank ?? { name: BANKS[Math.floor(r() * BANKS.length)], type: r() > 0.4 ? "Checking" : "Savings", routing: digits(r, 4), account: digits(r, 4) };

  // income sources expected this year
  type Src = { label: string; detail: string; status: "received" | "expected" | "review" };
  const srcSeen = new Set<string>();
  const income: Src[] = [];
  const addSrc = (s: Src) => { if (!srcSeen.has(s.label)) { srcSeen.add(s.label); income.push(s); } };
  if (h.kind !== "business") addSrc({ label: "W-2 wages", detail: spouse ? "Both spouses" : "Taxpayer", status: "received" });
  ents.forEach(e => {
    if (e.form === "1120S" || e.form === "1065") addSrc({ label: `Schedule K-1 · ${e.name}`, detail: e.type, status: "expected" });
    if (e.form === "Sch C" || /sole prop|sch c/i.test(e.type)) addSrc({ label: `Schedule C · ${e.name}`, detail: "Self-employment", status: "received" });
    if (e.form === "Sch E" || /rental/i.test(e.type)) addSrc({ label: `Schedule E · ${e.name}`, detail: "Rental real estate", status: "received" });
  });
  if (cu.includes("brokerage")) addSrc({ label: "1099-B · brokerage", detail: "Capital gains & losses", status: "review" });
  addSrc({ label: "1099-INT / 1099-DIV", detail: "Interest & dividends", status: "received" });

  // deductions & credits
  const itemizes = ents.some(e => /rental/i.test(e.type)) || cu.includes("rental") || h.serviceTier === "Premium";
  const deductions: { label: string; value: string; on: boolean }[] = itemizes ? [
    { label: "Mortgage interest (1098)", value: money(8000 + Math.floor(r() * 14000)), on: true },
    { label: "State & local taxes (SALT, capped)", value: "$10,000", on: true },
    { label: "Charitable contributions", value: money(1500 + Math.floor(r() * 6000)), on: true },
    { label: "Medical expenses", value: r() > 0.6 ? money(3000 + Math.floor(r() * 5000)) : "Below threshold", on: r() > 0.6 },
  ] : [
    { label: "Deduction method", value: "Standard deduction", on: true },
    { label: "Educator expenses", value: r() > 0.7 ? "$300" : "—", on: r() > 0.7 },
    { label: "Student loan interest", value: r() > 0.5 ? money(600 + Math.floor(r() * 1900)) : "—", on: r() > 0.5 },
  ];
  const credits: { label: string; value: string; on: boolean }[] = [
    { label: "Child Tax Credit", value: dependents.length ? `${dependents.length} qualifying` : "—", on: dependents.length > 0 },
    { label: "Child & dependent care", value: dependents.length && r() > 0.5 ? money(1200 + Math.floor(r() * 2400)) : "—", on: dependents.length > 0 && r() > 0.5 },
    { label: "Education (1098-T)", value: r() > 0.7 ? "1 student" : "—", on: r() > 0.7 },
    { label: "Retirement contributions (IRA / 401k)", value: money(3000 + Math.floor(r() * 4000)), on: true },
    { label: "HSA contribution", value: r() > 0.6 ? money(2000 + Math.floor(r() * 2300)) : "—", on: r() > 0.6 },
  ];

  // estimated payments
  const paysEstimates = isBusiness || ents.some(e => /sole prop|sch c|rental/i.test(e.type)) || cu.includes("estimate");
  const estBase = 1200 + Math.floor(r() * 3000);
  const estimates = paysEstimates
    ? [
        { q: "Q1 · Apr 15", amt: money(estBase), paid: true },
        { q: "Q2 · Jun 16", amt: money(estBase), paid: !cu.includes("missed") },
        { q: "Q3 · Sep 15", amt: money(estBase), paid: false, upcoming: true },
        { q: "Q4 · Jan 15", amt: money(estBase), paid: false, upcoming: true },
      ]
    : null;

  // onboarding checklist
  const checklist: { label: string; ok: boolean }[] = [
    { label: "Prior-year return", ok: true },
    { label: "Identity verified", ok: true },
    { label: `Engagement letter · ${h.since}`, ok: true },
    { label: "§7216 consent", ok: true },
    { label: "Form 8821", ok: h.has8821 },
    { label: "ACH on file", ok: hasRefundBank || !!ov.bank },
  ];
  const done = checklist.filter(c => c.ok).length;
  const allSet = done === checklist.length;

  const profile: [string, string][] = [
    ["Filing status", filingStatus],
    ["Tax year", String(TAX_YEAR)],
    ["Residency", "CA · full-year"],
    ["In scope", forms],
  ];

  return (
    <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] p-5">
      <div className="mb-1 flex items-center gap-2">
        <PetalMark className="size-4 text-[var(--os-ink-muted)]" />
        <h3 className="os-display text-[15px] text-[var(--os-ink)]">Intake &amp; readiness</h3>
        <span className={cn("ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
          allSet ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
          <span className={cn("size-1.5 rounded-full", allSet ? "bg-emerald-500" : "bg-amber-500")} />
          {allSet ? "All set" : `${done}/${checklist.length} complete`}
        </span>
      </div>
      <p className="mb-4 flex items-center gap-1.5 text-[11.5px] text-[var(--os-ink-subtle)]">
        <PetalMark className="size-3 shrink-0" /> Submitted via client portal · pre-filled from the prior-year return — confirm before prep.
      </p>

      {/* filing profile — quiet stat band */}
      <div className="grid grid-cols-2 gap-y-4 rounded-lg bg-[var(--os-bg-subtle)] px-4 py-3.5 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[var(--os-border)]">
        {profile.map(([label, value], i) => (
          <div key={label} className={cn(i > 0 && "sm:pl-4", i < profile.length - 1 && "sm:pr-4")}>
            <div className="text-[11px] text-[var(--os-ink-subtle)]">{label}</div>
            <div className="mt-0.5 truncate text-[13px] font-medium text-[var(--os-ink)]">{value}</div>
          </div>
        ))}
      </div>

      {/* taxpayer */}
      {taxpayer && (
        <Section title={spouse ? "Taxpayer" : "Taxpayer details"}>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label="Legal name" value={taxpayer.name} />
            <Field label="Occupation" value={taxpayer.occ} />
            <Field label="SSN" value={taxpayer.ssn} mono />
            <Field label="Date of birth" value={taxpayer.dob} mono />
            <Field label="Phone" value={taxpayer.phone} mono />
            <Field label="Email" value={taxpayer.email} />
            <Field label="Driver's license" value={taxpayer.dl} mono />
            <Field label="ID verified" value="Yes · portal upload" />
          </div>
        </Section>
      )}

      {/* spouse */}
      {spouse && (
        <Section title={secondPerson?.role === "Partner" ? "Co-owner" : "Spouse"}>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label="Legal name" value={spouse.name} />
            <Field label="Occupation" value={spouse.occ} />
            <Field label="SSN" value={spouse.ssn} mono />
            <Field label="Date of birth" value={spouse.dob} mono />
            <Field label="Phone" value={spouse.phone} mono />
            <Field label="Email" value={spouse.email} />
          </div>
        </Section>
      )}

      {/* mailing address */}
      <Section title="Mailing address">
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Field label="Street" value={addr.street} />
          <Field label="City, state, ZIP" value={`${addr.city}, CA ${addr.zip}`} />
          <Field label="County" value={addr.county} />
          <Field label="Same as prior year" value="Yes" />
        </div>
      </Section>

      {/* dependents */}
      <Section title="Dependents">
        {dependents.length === 0 ? (
          <p className="text-[12.5px] text-[var(--os-ink-subtle)]">None claimed.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[var(--os-border)]">
            <div className="grid grid-cols-[minmax(0,1.4fr)_90px_88px_minmax(0,1fr)] gap-x-3 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-2 text-[11px] font-medium text-[var(--os-ink-subtle)]">
              <span>Name</span><span>Born</span><span>SSN</span><span>Credit</span>
            </div>
            {dependents.map(d => (
              <div key={d.name} className="grid grid-cols-[minmax(0,1.4fr)_90px_88px_minmax(0,1fr)] gap-x-3 border-b border-[var(--os-border)] px-3 py-2.5 text-[12.5px] last:border-0">
                <span className="min-w-0">
                  <span className="block truncate text-[var(--os-ink)]">{d.name}</span>
                  <span className="block truncate text-[11px] text-[var(--os-ink-subtle)]">{d.relation} · {d.months} mo. in home</span>
                </span>
                <span className="tabular-nums text-[var(--os-ink-muted)]">{d.dob}</span>
                <span className="tabular-nums text-[var(--os-ink-muted)]">•••-••-{d.ssn4}</span>
                <span className="truncate text-[var(--os-ink-muted)]">{d.credit}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* direct deposit */}
      <Section title="Direct deposit">
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Field label="Bank" value={bank.name} />
          <Field label="Account type" value={bank.type} />
          <Field label="Routing" value={`•••••${bank.routing}`} mono />
          <Field label="Account" value={`••••${bank.account}`} mono />
        </div>
        <p className="mt-2.5 text-[11.5px] text-[var(--os-ink-subtle)]">Applied to refund and any balance due.</p>
      </Section>

      {/* income sources */}
      <Section title="Income this year">
        <div className="space-y-0">
          {income.map(s => (
            <div key={s.label} className="flex items-center gap-3 border-b border-[var(--os-border)] py-2.5 last:border-0">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-[var(--os-ink)]">{s.label}</span>
                <span className="block truncate text-[11px] text-[var(--os-ink-subtle)]">{s.detail}</span>
              </span>
              <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                s.status === "received" ? "bg-emerald-50 text-emerald-700"
                : s.status === "review" ? "bg-amber-50 text-amber-700"
                : "bg-[var(--os-selected)] text-[var(--os-ink-muted)]")}>
                <span className={cn("size-1.5 rounded-full", s.status === "received" ? "bg-emerald-500" : s.status === "review" ? "bg-amber-500" : "bg-[var(--os-border-strong)]")} />
                {s.status === "received" ? "Received" : s.status === "review" ? "In review" : "Expected"}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* deductions & credits */}
      <Section title="Deductions & credits">
        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <div className="mb-0.5 text-[11px] text-[var(--os-ink-subtle)]">Deductions</div>
            {deductions.map(d => <ItemRow key={d.label} label={d.label} value={d.value} on={d.on} />)}
          </div>
          <div>
            <div className="mb-0.5 mt-4 text-[11px] text-[var(--os-ink-subtle)] sm:mt-0">Credits</div>
            {credits.map(c => <ItemRow key={c.label} label={c.label} value={c.value} on={c.on} />)}
          </div>
        </div>
      </Section>

      {/* estimated payments */}
      <Section title="Estimated payments">
        {estimates ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {estimates.map(e => (
              <div key={e.q} className="rounded-lg border border-[var(--os-border)] px-3 py-2.5">
                <div className="text-[11px] text-[var(--os-ink-subtle)]">{e.q}</div>
                <div className="mt-0.5 text-[13px] font-medium tabular-nums text-[var(--os-ink)]">{e.amt}</div>
                <div className={cn("mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium",
                  e.paid ? "text-emerald-700" : (e as { upcoming?: boolean }).upcoming ? "text-[var(--os-ink-subtle)]" : "text-amber-700")}>
                  <span className={cn("size-1.5 rounded-full", e.paid ? "bg-emerald-500" : (e as { upcoming?: boolean }).upcoming ? "bg-[var(--os-border-strong)]" : "bg-amber-500")} />
                  {e.paid ? "Paid" : (e as { upcoming?: boolean }).upcoming ? "Upcoming" : "Missed"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-[var(--os-ink-subtle)]">Not required — covered by W-2 withholding.</p>
        )}
      </Section>

      {/* onboarding & authorizations */}
      <Section title="Onboarding & authorizations">
        <div className="flex flex-wrap gap-1.5">
          {checklist.map(c => <Pill key={c.label} label={c.label} ok={c.ok} />)}
        </div>
      </Section>

      {/* additional contacts (bookkeeper / partners beyond taxpayer & spouse) */}
      {others.length > 0 && (
        <Section title="Also on file">
          <div className="flex flex-wrap gap-2">
            {others.map(p => (
              <div key={p.id} className="inline-flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] py-1.5 pl-1.5 pr-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(p.name)}</span>
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-[12.5px] font-medium text-[var(--os-ink)]">{p.name}</span>
                  <span className="truncate text-[10.5px] text-[var(--os-ink-subtle)]">{p.role}</span>
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
