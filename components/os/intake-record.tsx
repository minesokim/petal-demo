"use client";

// Intake — merged into the Returns flow. Two scopes:
//  • household → a "Readiness" header above the client record's return cards
//    (filing profile + onboarding status + contacts)
//  • engagement → an "Organizer" card folded into the return record's Overview
//    (life-changes questionnaire + document progress + authorizations)
// Everything derives from lib/fixtures so the Park exemplar ties everywhere.

import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import {
  householdById, peopleOf, entitiesOf, engagementsOf, engagementById, entityById,
  docsOfEngagement,
} from "@/lib/fixtures/firm";

const kindLabel = { individual: "Individual", business: "Business", mixed: "Individual + business" } as const;
const initials = (n: string) => n.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

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

  /* ──────────────────── Household scope · "Readiness" ──────────────────── */
  const ppl = peopleOf(householdId);
  const ents = entitiesOf(householdId);
  const engs = engagementsOf(householdId);
  const indForm = ents.find(e => e.form === "1040");
  const filingType = indForm?.type ?? ents[0]?.type ?? kindLabel[h.kind];
  const forms = Array.from(new Set(ents.map(e => e.form))).join(" · ");
  const hasRefundBank = engs.some(e => e.refund);

  const checklist: { label: string; ok: boolean }[] = [
    { label: "Prior-year return", ok: true },
    { label: "Identity verified", ok: true },
    { label: `Engagement letter · ${h.since}`, ok: true },
    { label: "§7216 consent", ok: true },
    { label: "Form 8821", ok: h.has8821 },
    { label: "ACH on file", ok: hasRefundBank },
  ];
  const done = checklist.filter(c => c.ok).length;
  const allSet = done === checklist.length;

  const profile: [string, string][] = [
    ["Filing type", filingType],
    ["Resident", "CA · full-year"],
    ["In scope", forms],
    ["Client since", String(h.since)],
  ];

  return (
    <div className="rounded-xl border border-[var(--os-border)] bg-[var(--os-card)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <PetalMark className="size-4 text-[var(--os-ink-muted)]" />
        <h3 className="os-display text-[15px] text-[var(--os-ink)]">Intake &amp; readiness</h3>
        <span className={cn("ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
          allSet ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
          <span className={cn("size-1.5 rounded-full", allSet ? "bg-emerald-500" : "bg-amber-500")} />
          {allSet ? "All set" : `${done}/${checklist.length} complete`}
        </span>
      </div>

      {/* filing profile — quiet stat band */}
      <div className="grid grid-cols-2 gap-y-4 rounded-lg bg-[var(--os-bg-subtle)] px-4 py-3.5 sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[var(--os-border)]">
        {profile.map(([label, value], i) => (
          <div key={label} className={cn(i > 0 && "sm:pl-4", i < profile.length - 1 && "sm:pr-4")}>
            <div className="text-[11px] text-[var(--os-ink-subtle)]">{label}</div>
            <div className="mt-0.5 truncate text-[13px] font-medium text-[var(--os-ink)]">{value}</div>
          </div>
        ))}
      </div>

      {/* onboarding checklist — status pills */}
      <div className="mt-5">
        <SubLabel>Onboarding</SubLabel>
        <div className="flex flex-wrap gap-1.5">
          {checklist.map(c => <Pill key={c.label} label={c.label} ok={c.ok} />)}
        </div>
      </div>

      {/* contacts */}
      <div className="mt-5">
        <SubLabel>Contacts</SubLabel>
        <div className="flex flex-wrap gap-2">
          {ppl.map(p => (
            <div key={p.id} className="inline-flex items-center gap-2 rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] py-1.5 pl-1.5 pr-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(p.name)}</span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-[12.5px] font-medium text-[var(--os-ink)]">{p.name}</span>
                <span className="truncate text-[10.5px] text-[var(--os-ink-subtle)]">{p.role}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
