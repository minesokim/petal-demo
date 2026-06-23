"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { cn } from "@/lib/utils";
import { setFirmName, patchFirmSettings, seedGettingStartedTasksAction } from "./actions";
import { createClientAction } from "@/app/os/clients/actions";

const STEPS = ["Welcome", "Your firm", "Your team", "Connect", "First client", "Done"] as const;
type Kind = "individual" | "business" | "mixed";

const field =
  "w-full rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-3 py-2 text-[14px] text-[var(--os-ink)] transition-colors focus:border-[var(--os-border-strong)] focus:outline-none placeholder:text-[var(--os-ink-subtle)]";
const primary =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--os-primary)] px-4 text-[13px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.98] disabled:opacity-40";
const ghost =
  "inline-flex h-9 items-center justify-center rounded-md px-3 text-[13px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]";
const pill = (on: boolean) =>
  cn(
    "inline-flex h-8 items-center rounded-full border px-3.5 text-[12.5px] font-medium transition-colors",
    on
      ? "border-[var(--os-border-strong)] bg-[var(--os-selected)] text-[var(--os-ink)]"
      : "border-[var(--os-border)] text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]",
  );

const label = "mb-1.5 block text-[12px] font-medium text-[var(--os-ink-muted)]";

export function OnboardingFlow({ defaultFirmName }: { defaultFirmName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  // The household created in step 4, so step 6 can seed getting-started tasks against it.
  const [clientId, setClientId] = useState<string | null>(null);

  // step 2 — firm
  const [name, setName] = useState(defaultFirmName === "My Firm" ? "" : defaultFirmName);
  const [credential, setCredential] = useState("EA");
  const [size, setSize] = useState("Just me");
  // step 3 — team
  const [invites, setInvites] = useState("");
  // step 5 — first client
  const [cName, setCName] = useState("");
  const [cKind, setCKind] = useState<Kind>("individual");
  const [cEmail, setCEmail] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  async function saveFirm() {
    setBusy(true);
    await setFirmName(name, { credential, size });
    setBusy(false);
    next();
  }
  async function saveInvites() {
    setBusy(true);
    const emails = invites.split(/[\s,]+/).map((e) => e.trim()).filter(Boolean);
    if (emails.length) await patchFirmSettings({ invitedEmails: emails });
    setBusy(false);
    next();
  }
  async function addClient() {
    setBusy(true);
    if (cName.trim()) {
      // Pass the prospect's name as the contact so createPerson runs and the email
      // actually persists (without contactName, createClientAction skips the contact).
      const created = await createClientAction({
        name: cName.trim(),
        kind: cKind,
        serviceTier: "Standard",
        contactName: cName.trim(),
        contactEmail: cEmail.trim() || undefined,
      });
      if (created) setClientId(created.id);
    }
    setBusy(false);
    next();
  }
  async function finish() {
    setBusy(true);
    // Make step 5's promise true: seed the getting-started tasks (against the client
    // just added, or the firm's first household when that step was skipped).
    await seedGettingStartedTasksAction(clientId ?? undefined);
    await patchFirmSettings({ onboarded: true });
    router.push("/os");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-[460px]">
        {/* brand + progress */}
        <div className="mb-8 flex flex-col items-center gap-5">
          <PetalMark className="size-8" />
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-6 bg-[var(--os-ink)]" : i < step ? "w-1.5 bg-[var(--os-ink)]" : "w-1.5 bg-[var(--os-border)]",
                )}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {step === 0 && (
              <div className="text-center">
                <h1 className="os-display text-[26px] font-semibold text-[var(--os-ink)]">Welcome to Petal</h1>
                <p className="mx-auto mt-2 max-w-[340px] text-[14px] text-[var(--os-ink-muted)]">
                  Let's set up your practice. It takes about a minute, and you can change anything later.
                </p>
                <button onClick={next} className={cn(primary, "mt-7 px-5")}>
                  Get started <Icon icon={I.chevronRight} size={14} />
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="os-display text-[22px] font-semibold text-[var(--os-ink)]">About your practice</h2>
                <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">This names your firm and sets up your profile.</p>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className={label}>Firm name</label>
                    <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vazant Tax & Advisory" className={field} />
                  </div>
                  <div>
                    <label className={label}>Your credential</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["EA", "CPA", "Attorney", "Other"].map((c) => (
                        <button key={c} onClick={() => setCredential(c)} className={pill(credential === c)}>{c}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={label}>Firm size</label>
                    <select value={size} onChange={(e) => setSize(e.target.value)} className={field}>
                      {["Just me", "2 to 5", "6 to 20", "20+"].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <Footer onBack={back} onNext={saveFirm} nextLabel="Continue" busy={busy} disabled={!name.trim()} />
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="os-display text-[22px] font-semibold text-[var(--os-ink)]">Invite your team</h2>
                <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Add preparers or reviewers. They'll get access to your firm.</p>
                <div className="mt-6">
                  <label className={label}>Email addresses</label>
                  <textarea value={invites} onChange={(e) => setInvites(e.target.value)} rows={3} placeholder="sam@firm.com, alex@firm.com" className={cn(field, "resize-none")} />
                </div>
                <Footer onBack={back} onNext={saveInvites} nextLabel="Continue" busy={busy} onSkip={next} />
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="os-display text-[22px] font-semibold text-[var(--os-ink)]">Connect your tools</h2>
                <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Pull clients and documents in automatically. Connect any time from Apps.</p>
                <div className="mt-6 space-y-2">
                  {[
                    { name: "QuickBooks", sub: "Import clients & books" },
                    { name: "Gmail", sub: "Client threads & documents" },
                    { name: "Calendar", sub: "Deadlines & meetings" },
                  ].map((t) => (
                    <a key={t.name} href="/os/connections" className="flex items-center justify-between rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3.5 py-3 transition-colors hover:border-[var(--os-border-strong)] hover:bg-[var(--os-hover)]">
                      <div>
                        <div className="text-[13.5px] font-medium text-[var(--os-ink)]">{t.name}</div>
                        <div className="text-[12px] text-[var(--os-ink-subtle)]">{t.sub}</div>
                      </div>
                      <span className="text-[12.5px] font-medium text-[var(--os-ink-muted)]">Connect</span>
                    </a>
                  ))}
                </div>
                <Footer onBack={back} onNext={next} nextLabel="Continue" onSkip={next} />
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="os-display text-[22px] font-semibold text-[var(--os-ink)]">Add your first client</h2>
                <p className="mt-1 text-[13px] text-[var(--os-ink-muted)]">Or skip and import them later.</p>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className={label}>Client name</label>
                    <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g. Nguyen Household" className={field} />
                  </div>
                  <div>
                    <label className={label}>Type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["individual", "business", "mixed"] as Kind[]).map((k) => (
                        <button key={k} onClick={() => setCKind(k)} className={pill(cKind === k)}>
                          {k === "mixed" ? "Individual + business" : k[0].toUpperCase() + k.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={label}>Contact email <span className="font-normal text-[var(--os-ink-subtle)]">· optional</span></label>
                    <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="email@…" className={field} />
                  </div>
                </div>
                <Footer onBack={back} onNext={addClient} nextLabel={cName.trim() ? "Add client" : "Continue"} busy={busy} onSkip={next} />
              </div>
            )}

            {step === 5 && (
              <div className="text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--os-selected)]">
                  <Icon icon={I.check} size={22} className="text-[var(--os-ink)]" />
                </div>
                <h2 className="os-display mt-5 text-[24px] font-semibold text-[var(--os-ink)]">You're all set</h2>
                <p className="mx-auto mt-2 max-w-[340px] text-[14px] text-[var(--os-ink-muted)]">
                  Your practice is ready. Petal's set up a few getting-started tasks for you inside.
                </p>
                <button onClick={finish} disabled={busy} className={cn(primary, "mt-7 px-5")}>
                  Go to your practice <Icon icon={I.chevronRight} size={14} />
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Footer({
  onBack, onNext, nextLabel, busy, disabled, onSkip,
}: {
  onBack: () => void; onNext: () => void; nextLabel: string; busy?: boolean; disabled?: boolean; onSkip?: () => void;
}) {
  return (
    <div className="mt-7 flex items-center justify-between">
      <button onClick={onBack} className={ghost}>Back</button>
      <div className="flex items-center gap-1.5">
        {onSkip && <button onClick={onSkip} className={ghost}>I'll do this later</button>}
        <button onClick={onNext} disabled={busy || disabled} className={primary}>
          {busy ? "Saving…" : nextLabel}
        </button>
      </div>
    </div>
  );
}
