"use client";

/**
 * IntakeFlow — the client portal, rebuilt in the /os design language.
 *
 * Full happy path:
 *   Welcome → Verify (OTP) → Confirm email → Sign (engagement letter + §7216) →
 *   Upload (extract reveal) → About you · Family · Income · Side income ·
 *   Life changes · Deductions → Final review (refund reveal) → $50 deposit →
 *   Handoff → Case home.
 *
 * Mobile-first: a phone-width column on desktop, full-bleed on a phone.
 * Self-contained mockup driven by local step state. The signing step uses real
 * engagement-letter / §7216 documents (read + typed-name e-signature) rather
 * than simplified AI-disclosure cards — clients care that it fills itself in,
 * not how. Keyed remount per step plays the enter animation (no exit overlap).
 */

import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft, Check, ChevronDown, ChevronRight, Lock, Pencil, ShieldCheck, Upload,
  MessageCircle, CheckCircle2, Sparkles, Plus, FileText, X, PenLine,
  Clock, CreditCard, Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";

/* ── the household we're prefilling from (Chen, our exemplar) ── */
const D = {
  firm: "Vazant Tax",
  preparer: "Antonio Vazquez, EA",
  name: "Marcus Chen",
  first: "Marcus",
  phoneMasked: "(951) 555-•142",
  email: "marcus.chen@gmail.com",
  dob: "Mar 14, 1981",
  ssnMasked: "•••-••-3317",
  filing: "Married filing jointly",
  spouse: "Lin Chen",
  address: "1842 Camino Real, Riverside, CA 92504",
  employer: "Golden Dragon LLC",
  wages: "$58,000",
  fedWithheld: "$6,240",
  dependents: [
    { name: "Ethan Chen", rel: "Son", age: 13 },
    { name: "Maya Chen", rel: "Daughter", age: 10 },
  ],
  agi: "$71,240",
  refund: "$3,180",
  autoFilled: 78,
  cpa: "Antonio",
  deposit: 50,
  today: "Jun 19, 2026",
};

type Step =
  | "welcome" | "verify" | "email" | "sign" | "upload" | "about"
  | "family" | "income" | "side" | "life" | "deductions"
  | "review" | "deposit" | "done" | "case";

const ORDER: Step[] = [
  "welcome", "verify", "email", "sign", "upload", "about",
  "family", "income", "side", "life", "deductions",
  "review", "deposit", "done", "case",
];
// steps that show the top progress bar (the data-collection journey)
const JOURNEY: Step[] = [
  "verify", "email", "sign", "upload", "about",
  "family", "income", "side", "life", "deductions", "review", "deposit",
];

export function IntakeFlow() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const step = ORDER[idx];

  const go = (to: Step) => { setDir(ORDER.indexOf(to) > idx ? 1 : -1); setIdx(ORDER.indexOf(to)); };
  const next = () => { setDir(1); setIdx(i => Math.min(i + 1, ORDER.length - 1)); };
  const back = () => { setDir(-1); setIdx(i => Math.max(i - 1, 0)); };

  const jIdx = JOURNEY.indexOf(step);
  const inJourney = jIdx >= 0;

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center sm:p-6">
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[var(--os-canvas)] sm:h-[884px] sm:max-w-[420px] sm:rounded-[36px] sm:border sm:border-[var(--os-border-strong)] sm:shadow-[0_30px_90px_rgba(20,20,30,0.22)]">
        {inJourney && (
          <div className="flex items-center gap-3 px-5 pb-1 pt-5">
            <button onClick={back} aria-label="Back" className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]">
              <ArrowLeft className="size-[18px]" />
            </button>
            <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-[var(--os-selected)]">
              <motion.div className="h-full rounded-full bg-[var(--os-brand)]" initial={false}
                animate={{ width: `${((jIdx + 1) / JOURNEY.length) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
            </div>
            <span className="size-8 shrink-0" />
          </div>
        )}

        <div className="relative flex-1 overflow-hidden">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: dir * 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col"
          >
            {step === "welcome" && <Welcome onStart={next} />}
            {step === "verify" && <Verify onNext={next} />}
            {step === "email" && <ConfirmEmail onNext={next} />}
            {step === "sign" && <SignStep onNext={next} />}
            {step === "upload" && <UploadStep onNext={next} />}
            {step === "about" && <AboutYou onNext={next} />}
            {step === "family" && <Family onNext={next} />}
            {step === "income" && <Income onNext={next} />}
            {step === "side" && <SideIncome onNext={next} />}
            {step === "life" && <LifeChanges onNext={next} />}
            {step === "deductions" && <Deductions onNext={next} />}
            {step === "review" && <Review onNext={next} />}
            {step === "deposit" && <Deposit onNext={next} />}
            {step === "done" && <Done onNext={next} />}
            {step === "case" && <CaseHome onRestart={() => go("welcome")} />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── shared atoms ────────────────────────── */

function Screen({ children, cta, onCta, ctaDisabled, secondary, reassure = true }: {
  children: ReactNode; cta: string; onCta: () => void; ctaDisabled?: boolean; secondary?: ReactNode; reassure?: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 pb-4 pt-6">{children}</div>
      <div className="shrink-0 border-t border-[var(--os-border)] bg-[var(--os-canvas)]/80 px-6 pb-7 pt-3 backdrop-blur-sm">
        {reassure && (
          <p className="mb-2.5 flex items-center justify-center gap-1.5 text-[11.5px] text-[var(--os-ink-subtle)]">
            <Lock className="size-3" /> {D.cpa} reviews everything before it's filed.
          </p>
        )}
        <button onClick={onCta} disabled={ctaDisabled} className={cn(
          "h-12 w-full rounded-full text-[15px] font-medium text-[var(--os-primary-fg)] transition-all active:scale-[0.98]",
          ctaDisabled ? "cursor-not-allowed bg-[var(--os-ink-subtle)]/40" : "bg-[var(--os-primary)] hover:bg-[var(--os-primary-hover)]",
        )}>{cta}</button>
        {secondary && <div className="mt-3 text-center">{secondary}</div>}
      </div>
    </div>
  );
}

function Guide({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-2 px-0.5">
      <PetalMark className="mt-0.5 size-3.5 shrink-0 text-[var(--os-brand)]" />
      <p className="text-[12.5px] leading-snug text-[var(--os-ink-muted)]">{children}</p>
    </div>
  );
}

function ScreenTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-7 mt-3">
      <h1 className="text-[27px] font-semibold leading-[1.15] tracking-[-0.025em] text-[var(--os-ink)]">{children}</h1>
      {sub && <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--os-ink-muted)]">{sub}</p>}
    </div>
  );
}

function ConfirmRow({ label, value, note, flagged }: { label: string; value: string; note?: string; flagged?: boolean }) {
  return (
    <button className="group flex w-full items-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] px-4 py-3 text-left transition-colors hover:border-[var(--os-border-strong)]">
      <span className="min-w-0 flex-1">
        <span className="block text-[11.5px] text-[var(--os-ink-subtle)]">{label}</span>
        <span className="mt-0.5 block truncate text-[14.5px] text-[var(--os-ink)]">{value}</span>
        {note && <span className="mt-0.5 block text-[11.5px] text-[var(--os-ink-subtle)]">{note}</span>}
      </span>
      {flagged
        ? <span className="inline-flex shrink-0 items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Check</span>
        : <Check className="size-4 shrink-0 text-[var(--os-brand)]" />}
      <Pencil className="size-3.5 shrink-0 text-[var(--os-ink-subtle)] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function MultiChoice({ options, value, onChange }: { options: { id: string; label: string }[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-2.5">
      {options.map(o => {
        const on = value.includes(o.id);
        return (
          <button key={o.id} onClick={() => onChange(on ? value.filter(x => x !== o.id) : [...value, o.id])}
            className={cn("flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-[14.5px] transition-colors",
              on ? "border-[var(--os-brand)] bg-[var(--os-brand)]/[0.06] text-[var(--os-ink)]" : "border-[var(--os-border)] bg-[var(--os-surface)] text-[var(--os-ink-muted)] hover:border-[var(--os-border-strong)]")}>
            <span>{o.label}</span>
            {on && <Check className="size-[18px] shrink-0 text-[var(--os-brand)]" strokeWidth={2.5} />}
          </button>
        );
      })}
    </div>
  );
}

function GhostAdd({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--os-border-strong)] py-3 text-[13px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)]">
      <Plus className="size-4" /> {children}
    </button>
  );
}

/* ────────────────────────── screens ────────────────────────── */

function Welcome({ onStart }: { onStart: () => void }) {
  const bullets = [
    { icon: <PetalMark className="size-4 text-[var(--os-brand)]" />, tint: "bg-[var(--os-brand)]/10", text: <><b className="font-semibold text-[var(--os-ink)]">{D.autoFilled}% filled in</b> from your prior return</> },
    { icon: <Check className="size-4 text-[var(--os-ink-muted)]" />, tint: "bg-[var(--os-selected)]", text: <>Only <b className="font-semibold text-[var(--os-ink)]">~6 quick questions</b> to answer</> },
    { icon: <MessageCircle className="size-4 text-[var(--os-ink-muted)]" />, tint: "bg-[var(--os-selected)]", text: <><b className="font-semibold text-[var(--os-ink)]">{D.cpa}, your preparer</b>, on call the whole way</> },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 pt-12">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-[var(--os-brand)] text-white shadow-sm"><PetalMark className="size-5" /></span>
          <span className="text-[14px] font-medium text-[var(--os-ink)]">{D.firm}</span>
        </div>
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--os-ink)]">Taxes, done<br />the calm way.</h1>
        <p className="mt-4 max-w-[19rem] text-[15px] leading-relaxed text-[var(--os-ink-muted)]">
          Upload last year's return and we'll fill in most of it for you. You just check our work, one small question at a time.
        </p>
        <div className="mt-9 space-y-3.5">
          {bullets.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", b.tint)}>{b.icon}</span>
              <span className="text-[14px] leading-snug text-[var(--os-ink-muted)]">{b.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="shrink-0 px-6 pb-8 pt-3">
        <button onClick={onStart} className="h-12 w-full rounded-full bg-[var(--os-primary)] text-[15px] font-medium text-[var(--os-primary-fg)] transition-all hover:bg-[var(--os-primary-hover)] active:scale-[0.98]">Get started</button>
        <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[11.5px] text-[var(--os-ink-subtle)]"><ShieldCheck className="size-3.5" /> Bank-level encryption · SOC 2 certified</p>
      </div>
    </div>
  );
}

function Verify({ onNext }: { onNext: () => void }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const complete = code.every(c => c !== "");
  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setCode(prev => { const n = [...prev]; n[i] = d; return n; });
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };
  return (
    <Screen cta="Verify" onCta={onNext} ctaDisabled={!complete} reassure={false}>
      <ScreenTitle sub={<>We sent a 6-digit code to <b className="font-medium text-[var(--os-ink)]">{D.phoneMasked}</b>.</>}>Verify it's you</ScreenTitle>
      <div className="mt-2 flex justify-between gap-2">
        {code.map((c, i) => (
          <input key={i} ref={el => { refs.current[i] = el; }} value={c} onChange={e => setDigit(i, e.target.value)} onKeyDown={e => onKey(i, e)}
            inputMode="numeric" maxLength={1} autoFocus={i === 0}
            className={cn("h-14 w-12 rounded-xl border bg-[var(--os-surface)] text-center text-[22px] font-medium text-[var(--os-ink)] outline-none transition-colors",
              c ? "border-[var(--os-ink)]" : "border-[var(--os-border-strong)] focus:border-[var(--os-ink)]")} />
        ))}
      </div>
      <button className="mt-5 text-[13px] font-medium text-[var(--os-link)] hover:underline">Resend code</button>
      <p className="mt-6 flex items-start gap-1.5 text-[12px] leading-snug text-[var(--os-ink-subtle)]"><Lock className="mt-0.5 size-3 shrink-0" /> A code keeps your tax information yours. No passwords to remember.</p>
    </Screen>
  );
}

function ConfirmEmail({ onNext }: { onNext: () => void }) {
  const [email, setEmail] = useState(D.email);
  return (
    <Screen cta="Looks right" onCta={onNext} ctaDisabled={!email.includes("@")}>
      <ScreenTitle sub="This is where your return, updates, and signing links will go.">How should {D.cpa} reach you?</ScreenTitle>
      <Guide>{D.cpa} already had this on file from your last return, so just confirm it still works.</Guide>
      <label className="block text-[11.5px] font-medium text-[var(--os-ink-subtle)]">Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5 h-12 w-full rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] px-4 text-[15px] text-[var(--os-ink)] outline-none focus:border-[var(--os-ink)]" />
    </Screen>
  );
}

/* ── Sign: real engagement letter + §7216, read + typed-name e-signature ── */

const DOCS = {
  engagement: {
    title: "Engagement Letter",
    sub: "What Antonio will do, and the terms",
    body: [
      ["Tax Preparation Engagement", `${D.firm} · ${D.preparer} · Tax Year 2025`],
      ["Scope of services", "We will prepare your 2025 federal and California individual income tax returns from the information you provide. Our work is not an audit and is not designed to detect fraud or error."],
      ["Your responsibilities", "You agree to provide complete and accurate information, to keep the records that support your return, and to review the return before it is filed. You confirm the income, deductions, and credits you report are accurate to the best of your knowledge."],
      ["Our responsibilities", "We will prepare your return with professional care, keep your information confidential, and flag any positions that need your decision. A licensed preparer reviews every return before filing."],
      ["Fees and deposit", `A $${D.deposit} deposit is due today and is applied to your final preparation fee. The remaining balance is due before your return is filed. If you cancel or do not move forward, the deposit is non-refundable.`],
      ["Filing", "We file your return electronically once you have reviewed it and signed Form 8879 (e-file authorization)."],
      ["Term", "Either of us may end this engagement in writing. You remain responsible for fees for work completed."],
    ],
  },
  consent: {
    title: "Consent to use your information",
    sub: "Required by IRS §7216",
    body: [
      ["Consent to Use of Tax Return Information", "Internal Revenue Code §7216"],
      ["Why you're seeing this", "Federal law requires your consent before we use your tax return information for any purpose other than preparing your return."],
      ["What you authorize", `I authorize ${D.firm} to use the information I provide to prepare and file my 2025 federal and state income tax returns, to retain it to prepare future-year returns, and to contact me about my returns and appointments.`],
      ["What we won't do", `${D.firm} will not disclose your tax return information to anyone outside the firm without your separate written consent, except as permitted or required by law.`],
      ["Your rights", "This consent is valid for the engagement above. If you believe your information has been used or disclosed improperly, you may contact the Treasury Inspector General for Tax Administration (TIGTA)."],
    ],
  },
} as const;

function DocSheet({ docKey, onDone, onClose }: { docKey: keyof typeof DOCS; onDone: () => void; onClose: () => void }) {
  const doc = DOCS[docKey];
  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-20 flex flex-col bg-[var(--os-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-5 py-4">
        <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]"><X className="size-[18px]" /></button>
        <span className="text-[14px] font-medium text-[var(--os-ink)]">{doc.title}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {doc.body.map(([h, p], i) => (
          <div key={i} className={cn(i === 0 ? "mb-5" : "mb-4")}>
            <div className={cn(i === 0 ? "text-[17px] font-semibold tracking-[-0.01em] text-[var(--os-ink)]" : "text-[13px] font-semibold text-[var(--os-ink)]")}>{h}</div>
            <p className={cn("text-[var(--os-ink-muted)]", i === 0 ? "mt-0.5 text-[12.5px]" : "mt-1 text-[13px] leading-relaxed")}>{p}</p>
          </div>
        ))}
        <p className="mt-2 text-[11.5px] text-[var(--os-ink-subtle)]">By signing on the previous screen, you agree to the terms above.</p>
      </div>
      <div className="border-t border-[var(--os-border)] px-6 pb-7 pt-3">
        <button onClick={onDone} className="h-12 w-full rounded-full bg-[var(--os-primary)] text-[15px] font-medium text-[var(--os-primary-fg)]">I've read this</button>
      </div>
    </motion.div>
  );
}

function SignStep({ onNext }: { onNext: () => void }) {
  const [open, setOpen] = useState<keyof typeof DOCS | null>(null);
  const [read, setRead] = useState<Record<string, boolean>>({});
  const [sig, setSig] = useState("");
  const allRead = read.engagement && read.consent;
  const signed = allRead && sig.trim().length > 2;

  const cards: (keyof typeof DOCS)[] = ["engagement", "consent"];

  return (
    <>
      <Screen cta="Sign and continue" onCta={onNext} ctaDisabled={!signed} reassure={false}>
        <ScreenTitle sub="Two documents to read and sign before we start on your return. Standard for any preparer.">Let's make it official</ScreenTitle>

        <div className="space-y-2.5">
          {cards.map(k => (
            <button key={k} onClick={() => setOpen(k)} className="flex w-full items-center gap-3 rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)] px-4 py-3.5 text-left transition-colors hover:border-[var(--os-border-strong)]">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--os-selected)]"><FileText className="size-[18px] text-[var(--os-ink-muted)]" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-medium text-[var(--os-ink)]">{DOCS[k].title}</span>
                <span className="block truncate text-[12px] text-[var(--os-ink-subtle)]">{DOCS[k].sub}</span>
              </span>
              {read[k]
                ? <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-[var(--os-brand)]"><Check className="size-4" /> Read</span>
                : <ChevronRight className="size-4 shrink-0 text-[var(--os-ink-subtle)]" />}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="os-label mb-2 text-[11.5px] font-medium text-[var(--os-ink-subtle)]">Sign by typing your full legal name</div>
          <div className="rounded-2xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-4 pb-3 pt-3">
            <input value={sig} onChange={e => setSig(e.target.value)} placeholder={allRead ? D.name : "Read both documents first"} disabled={!allRead}
              className="w-full bg-transparent text-[20px] italic text-[var(--os-ink)] outline-none placeholder:text-[15px] placeholder:not-italic placeholder:text-[var(--os-ink-subtle)] disabled:opacity-60" style={{ fontFamily: "Georgia, serif" }} />
            <div className="mt-2 flex items-center gap-1.5 border-t border-[var(--os-border)] pt-2 text-[11px] text-[var(--os-ink-subtle)]">
              <PenLine className="size-3" /> {signed ? `Electronically signed · ${D.today}` : "Your e-signature applies to both documents"}
            </div>
          </div>
        </div>
      </Screen>

      <AnimatePresence>
        {open && (
          <DocSheet docKey={open} onClose={() => setOpen(null)} onDone={() => { setRead(r => ({ ...r, [open]: true })); setOpen(null); }} />
        )}
      </AnimatePresence>
    </>
  );
}

function UploadStep({ onNext }: { onNext: () => void }) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const found = [
    { label: "W-2 · " + D.employer, value: D.wages },
    { label: "Spouse", value: D.spouse },
    { label: "Dependents", value: D.dependents.map(d => d.name).join(", ") },
    { label: "Adjusted gross income", value: D.agi },
  ];
  if (phase === "done") {
    return (
      <Screen cta="Looks good, continue" onCta={onNext}>
        <ScreenTitle sub={<>I read your 2024 return and filled in <b className="font-medium text-[var(--os-ink)]">{D.autoFilled}%</b> of this year. Here's what I found.</>}>Nice, that's the hard part done</ScreenTitle>
        <div className="space-y-2">
          {found.map((f, i) => (
            <motion.div key={f.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
              className="flex items-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] px-4 py-3">
              <CheckCircle2 className="size-[18px] shrink-0 text-[var(--os-brand)]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11.5px] text-[var(--os-ink-subtle)]">{f.label}</span>
                <span className="block truncate text-[14px] text-[var(--os-ink)]">{f.value}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </Screen>
    );
  }
  return (
    <Screen cta={phase === "scanning" ? "Reading your return…" : "Upload 2024 return"} onCta={() => { setPhase("scanning"); setTimeout(() => setPhase("done"), 1600); }} ctaDisabled={phase === "scanning"}
      secondary={<button onClick={onNext} className="text-[12.5px] text-[var(--os-ink-subtle)] hover:underline">I don't have last year's return</button>}>
      <ScreenTitle sub="One upload and most of your return fills itself in. PDF, photo, or a file from your computer.">Let's start with last year</ScreenTitle>
      <Guide>I'll read your 2024 return so you don't have to retype a thing. Don't have it? Tap the link below and we'll do it by hand together.</Guide>
      <div className={cn("mt-1 grid place-items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
        phase === "scanning" ? "border-[var(--os-brand)] bg-[var(--os-brand)]/[0.04]" : "border-[var(--os-border-strong)] bg-[var(--os-surface)]")}>
        {phase === "scanning" ? (
          <>
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="mb-3"><Sparkles className="size-7 text-[var(--os-brand)]" /></motion.span>
            <span className="text-[13.5px] font-medium text-[var(--os-ink)]">Reading your 2024 return…</span>
          </>
        ) : (
          <>
            <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-[var(--os-selected)]"><Upload className="size-5 text-[var(--os-ink-muted)]" /></span>
            <span className="text-[13.5px] font-medium text-[var(--os-ink)]">Tap to upload your return</span>
            <span className="mt-1 text-[12px] text-[var(--os-ink-subtle)]">PDF, PNG, or JPG</span>
          </>
        )}
      </div>
    </Screen>
  );
}

function AboutYou({ onNext }: { onNext: () => void }) {
  return (
    <Screen cta="Looks right" onCta={onNext}>
      <ScreenTitle sub="Pulled from your last return. Tap anything to fix it.">About you</ScreenTitle>
      <Guide>You filed jointly with {D.spouse} last year, so I've set this year the same way. Change it if anything's different.</Guide>
      <div className="space-y-2.5">
        <ConfirmRow label="Legal name" value={D.name} />
        <ConfirmRow label="Date of birth" value={D.dob} />
        <ConfirmRow label="Social Security number" value={D.ssnMasked} />
        <ConfirmRow label="Filing status" value={D.filing} note={`Filed jointly with ${D.spouse} last year`} />
        <ConfirmRow label="Mailing address" value={D.address} />
      </div>
    </Screen>
  );
}

function Family({ onNext }: { onNext: () => void }) {
  return (
    <Screen cta="Looks right" onCta={onNext}>
      <ScreenTitle sub="The people on your return. Tap to edit, or add anyone new.">Your family</ScreenTitle>
      <Guide>You claimed {D.dependents.length} dependents last year. Confirm they're still with you this year.</Guide>
      <div className="space-y-2.5">
        <ConfirmRow label="Spouse" value={D.spouse} note="Filing jointly" />
        {D.dependents.map(dep => (
          <ConfirmRow key={dep.name} label={`Dependent · ${dep.rel}`} value={dep.name} note={`Age ${dep.age} · lived with you all year`} />
        ))}
      </div>
      <GhostAdd>Add a dependent</GhostAdd>
    </Screen>
  );
}

function Income({ onNext }: { onNext: () => void }) {
  return (
    <Screen cta="Looks right" onCta={onNext}>
      <ScreenTitle sub="What I pulled from your upload. Add anything that's missing.">Your income</ScreenTitle>
      <Guide>This came straight off your W-2. If you have more forms, add them and I'll read those too.</Guide>
      <div className="space-y-2.5">
        <ConfirmRow label={`W-2 · ${D.employer}`} value={`Wages ${D.wages}`} note={`Federal tax withheld ${D.fedWithheld}`} />
        <ConfirmRow label="Interest (1099-INT)" value="Chase · $128" />
      </div>
      <GhostAdd>Add another income form</GhostAdd>
    </Screen>
  );
}

function SideIncome({ onNext }: { onNext: () => void }) {
  const [v, setV] = useState<string[]>([]);
  return (
    <Screen cta={v.length ? "Add this income" : "I didn't have any"} onCta={onNext}>
      <ScreenTitle sub="Money earned outside a regular paycheck. Tap any that apply, or skip.">Any side income?</ScreenTitle>
      <Guide>Most people skip this. Only tap if you earned money on your own this year.</Guide>
      <MultiChoice value={v} onChange={setV} options={[
        { id: "rideshare", label: "Rideshare or delivery" },
        { id: "freelance", label: "Freelance or consulting" },
        { id: "shop", label: "Online shop (Etsy, eBay)" },
        { id: "other", label: "Something else" },
      ]} />
    </Screen>
  );
}

function LifeChanges({ onNext }: { onNext: () => void }) {
  const [v, setV] = useState<string[]>([]);
  return (
    <Screen cta="Continue" onCta={onNext}>
      <ScreenTitle sub="Tap anything that happened in 2025. These can change your refund.">Anything change this year?</ScreenTitle>
      <MultiChoice value={v} onChange={setV} options={[
        { id: "married", label: "Married or divorced" },
        { id: "baby", label: "New baby or dependent" },
        { id: "home", label: "Bought or sold a home" },
        { id: "moved", label: "Moved to another state" },
        { id: "business", label: "Started a business" },
        { id: "none", label: "None of these" },
      ]} />
    </Screen>
  );
}

function Deductions({ onNext }: { onNext: () => void }) {
  const [v, setV] = useState<string[]>(["mortgage", "charitable"]);
  return (
    <Screen cta="Continue" onCta={onNext}>
      <ScreenTitle sub="Things that can lower your bill. Tap any you had this year.">Let's lower your bill</ScreenTitle>
      <Guide>I pre-checked the ones from your last return. I'll ask for amounts later only if I need them.</Guide>
      <MultiChoice value={v} onChange={setV} options={[
        { id: "mortgage", label: "Mortgage interest" },
        { id: "charitable", label: "Charitable giving" },
        { id: "student", label: "Student loan interest" },
        { id: "medical", label: "Large medical expenses" },
        { id: "retirement", label: "Retirement contributions" },
      ]} />
    </Screen>
  );
}

function Review({ onNext }: { onNext: () => void }) {
  const [attest, setAttest] = useState(false);
  const rows = [
    ["Filing status", D.filing],
    ["Dependents", String(D.dependents.length)],
    ["Wages", D.wages],
    ["Deductions", "Mortgage interest, charitable giving"],
    ["Adjusted gross income", D.agi],
  ];
  return (
    <Screen cta="Continue" onCta={onNext} ctaDisabled={!attest}>
      <ScreenTitle sub="Here's where your return landed. Antonio reviews it next.">Your return, at a glance</ScreenTitle>

      <div className="rounded-2xl border border-[var(--os-brand)]/25 bg-[var(--os-brand)]/[0.06] p-5 text-center">
        <div className="text-[12px] text-[var(--os-ink-muted)]">Estimated federal refund</div>
        <div className="mt-1 text-[40px] font-semibold leading-none tracking-tight tabular-nums text-[var(--os-brand)]">{D.refund}</div>
        <div className="mt-2 text-[12px] text-[var(--os-ink-subtle)]">Filled in from last year, you confirmed the rest.</div>
      </div>

      <div className="mt-4 divide-y divide-[var(--os-border)] overflow-hidden rounded-2xl border border-[var(--os-border)]">
        {rows.map(([k, val]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-[12.5px] text-[var(--os-ink-muted)]">{k}</span>
            <span className="text-right text-[13.5px] font-medium text-[var(--os-ink)]">{val}</span>
          </div>
        ))}
      </div>

      <button onClick={() => setAttest(a => !a)} className="mt-4 flex w-full items-start gap-3 rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)] px-4 py-3.5 text-left">
        <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors", attest ? "border-[var(--os-brand)] bg-[var(--os-brand)]" : "border-[var(--os-border-strong)]")}>{attest && <Check className="size-3.5 text-white" strokeWidth={3} />}</span>
        <span className="text-[13px] leading-snug text-[var(--os-ink-muted)]">Everything here is true and complete to the best of my knowledge.</span>
      </button>
    </Screen>
  );
}

function Deposit({ onNext }: { onNext: () => void }) {
  return (
    <Screen cta={`Pay $${D.deposit} deposit`} onCta={onNext} reassure={false}>
      <ScreenTitle sub={`A $${D.deposit} deposit reserves your spot with ${D.cpa} and goes straight toward your final bill.`}>Reserve your spot</ScreenTitle>

      <div className="mb-5 flex items-center justify-between rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)] px-4 py-3.5">
        <span className="text-[13.5px] text-[var(--os-ink)]">Refundable deposit</span>
        <span className="text-[15px] font-semibold tabular-nums text-[var(--os-ink)]">${D.deposit}.00</span>
      </div>

      <div className="space-y-2.5">
        <div className="rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-4 py-3">
          <div className="text-[11px] text-[var(--os-ink-subtle)]">Card number</div>
          <div className="mt-0.5 flex items-center justify-between">
            <span className="text-[15px] tabular-nums text-[var(--os-ink)]">1234 5678 9012 3456</span>
            <CreditCard className="size-4 text-[var(--os-ink-subtle)]" />
          </div>
        </div>
        <div className="flex gap-2.5">
          {[["Expiry", "08 / 28"], ["CVC", "•••"], ["ZIP", "92504"]].map(([l, v]) => (
            <div key={l} className="flex-1 rounded-xl border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-4 py-3">
              <div className="text-[11px] text-[var(--os-ink-subtle)]">{l}</div>
              <div className="mt-0.5 text-[15px] tabular-nums text-[var(--os-ink)]">{v}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[12px] leading-snug text-[var(--os-ink-subtle)]">
        Applied to your final tax-prep fee. If you cancel or miss your appointment, the deposit is non-refundable.
      </p>
      <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-[var(--os-ink-subtle)]"><Lock className="size-3" /> Payments secured by Stripe</p>
    </Screen>
  );
}

function Done({ onNext }: { onNext: () => void }) {
  const steps = [
    { t: `${D.cpa} reviews your return`, d: "1 to 2 business days", done: false, now: true },
    { t: "You e-sign Form 8879", d: "We'll text you the link", done: false },
    { t: `${D.cpa} files your return`, d: "Federal and California", done: false },
    { t: "You get confirmation", d: "Usually within 24 hours of filing", done: false },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 pt-12">
        <span className="grid size-12 place-items-center rounded-2xl bg-[var(--os-brand)] text-white shadow-sm"><Check className="size-7" strokeWidth={2.5} /></span>
        <h1 className="mt-5 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-[var(--os-ink)]">You're all set, {D.first}.</h1>
        <p className="mt-2 max-w-[20rem] text-[14.5px] leading-relaxed text-[var(--os-ink-muted)]">
          {D.cpa} has everything he needs. He'll review your return and reach out if he has any questions.
        </p>

        <div className="mt-7 space-y-0">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", s.now ? "bg-[var(--os-brand)] text-white" : "border border-[var(--os-border-strong)] bg-[var(--os-surface)] text-[var(--os-ink-subtle)]")}>
                  {s.now ? <Clock className="size-3.5" /> : <span className="text-[11px] tabular-nums">{i + 1}</span>}
                </span>
                {i < steps.length - 1 && <span className="my-1 w-px flex-1 bg-[var(--os-border)]" />}
              </div>
              <div className="pb-5">
                <div className={cn("text-[14px] font-medium", s.now ? "text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}>{s.t}</div>
                <div className="text-[12px] text-[var(--os-ink-subtle)]">{s.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-1 flex items-center gap-2 rounded-xl bg-[var(--os-bg-subtle)] px-4 py-3 text-[12.5px] text-[var(--os-ink-muted)]">
          <Check className="size-4 shrink-0 text-[var(--os-brand)]" /> ${D.deposit} deposit paid, applied to your final bill.
        </div>
      </div>
      <div className="shrink-0 px-6 pb-8 pt-3">
        <button onClick={onNext} className="h-12 w-full rounded-full bg-[var(--os-primary)] text-[15px] font-medium text-[var(--os-primary-fg)] transition-all hover:bg-[var(--os-primary-hover)] active:scale-[0.98]">Go to my return</button>
      </div>
    </div>
  );
}

function CaseHome({ onRestart }: { onRestart: () => void }) {
  const [tab, setTab] = useState<"progress" | "docs" | "messages" | "sign">("progress");
  const tabs = [
    { id: "progress" as const, label: "Progress", icon: Clock },
    { id: "docs" as const, label: "Documents", icon: FileText },
    { id: "messages" as const, label: "Messages", icon: MessageCircle },
    { id: "sign" as const, label: "Sign", icon: PenLine },
  ];
  return (
    <div className="flex h-full flex-col">
      {/* case header */}
      <div className="flex items-center justify-between px-6 pb-3 pt-7">
        <div>
          <div className="text-[11px] text-[var(--os-ink-subtle)]">{D.firm}</div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--os-ink)]">Your 2025 return</h1>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--os-brand)]/10 px-2.5 py-1 text-[11.5px] font-medium text-[var(--os-brand)]">
          <span className="size-1.5 rounded-full bg-[var(--os-brand)]" /> In review
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-3">
        {tab === "progress" && (
          <div className="space-y-0">
            {[
              ["Intake submitted", "You finished and paid your deposit", true, false],
              [`${D.cpa} is reviewing`, "Started today", false, true],
              ["E-sign Form 8879", "Coming up next", false, false],
              ["Filed", "Federal and California", false, false],
            ].map(([t, d, done, now], i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full", done ? "bg-[var(--os-brand)] text-white" : now ? "bg-[var(--os-brand)]/15 text-[var(--os-brand)]" : "border border-[var(--os-border-strong)] text-[var(--os-ink-subtle)]")}>
                    {done ? <Check className="size-3.5" /> : now ? <Clock className="size-3.5" /> : <span className="text-[11px]">{i + 1}</span>}
                  </span>
                  {i < arr.length - 1 && <span className="my-1 w-px flex-1 bg-[var(--os-border)]" />}
                </div>
                <div className="pb-5">
                  <div className={cn("text-[14px] font-medium", done || now ? "text-[var(--os-ink)]" : "text-[var(--os-ink-muted)]")}>{t as string}</div>
                  <div className="text-[12px] text-[var(--os-ink-subtle)]">{d as string}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "docs" && (
          <div className="space-y-2.5 pt-1">
            {[["2024 return.pdf", "You uploaded"], ["Engagement letter.pdf", "Signed today"], ["§7216 consent.pdf", "Signed today"], ["2025 return", "Antonio is preparing"]].map(([n, s]) => (
              <div key={n} className="flex items-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] px-4 py-3">
                <FileText className="size-[18px] shrink-0 text-[var(--os-ink-subtle)]" />
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] text-[var(--os-ink)]">{n}</span><span className="block text-[11.5px] text-[var(--os-ink-subtle)]">{s}</span></span>
              </div>
            ))}
          </div>
        )}

        {tab === "messages" && (
          <div className="space-y-3 pt-1">
            <div className="flex gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[11px] font-medium text-[var(--os-ink-muted)]">AV</span>
              <div className="rounded-2xl rounded-tl-md bg-[var(--os-card)] px-3.5 py-2.5 text-[13.5px] leading-snug text-[var(--os-ink)]">
                Hi {D.first}, got everything, thanks for the quick upload. I'll have a first draft of your return back to you in a day or two.
                <div className="mt-1 text-[11px] text-[var(--os-ink-subtle)]">{D.cpa} · today</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-4 py-2.5">
              <input placeholder={`Message ${D.cpa}…`} className="flex-1 bg-transparent text-[13.5px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]" />
            </div>
          </div>
        )}

        {tab === "sign" && (
          <div className="pt-1">
            <div className="rounded-2xl border border-[var(--os-border)] bg-[var(--os-surface)] p-5 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-[var(--os-selected)]"><PenLine className="size-5 text-[var(--os-ink-muted)]" /></span>
              <div className="mt-3 text-[15px] font-medium text-[var(--os-ink)]">Form 8879 · not ready yet</div>
              <p className="mx-auto mt-1 max-w-[16rem] text-[12.5px] leading-snug text-[var(--os-ink-muted)]">
                Once {D.cpa} finishes your return, you'll sign your e-file authorization right here. We'll text you when it's ready.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* bottom tab bar */}
      <div className="grid shrink-0 grid-cols-4 border-t border-[var(--os-border)] bg-[var(--os-surface)] px-2 pb-6 pt-2">
        {tabs.map(t => {
          const on = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center gap-1 py-1">
              <t.icon className={cn("size-[20px]", on ? "text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)]")} />
              <span className={cn("text-[10.5px]", on ? "font-medium text-[var(--os-ink)]" : "text-[var(--os-ink-subtle)]")}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
