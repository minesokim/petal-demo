"use client";

// 8879 e-sign loop UI — the interactive E-file authorization card on a return.
// Shows the signature lifecycle (Sent · Viewed · Signed · Filed) and the one
// next action: send the 8879, remind the client, or countersign to transmit.
// Drives off esign-store; falls back to the return's stage when no envelope exists.

import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { esignStore, useEsign, ESIGN_STEPS, esignRank, type EsignStatus } from "@/lib/esign-store";
import type { Stage } from "@/lib/fixtures/vocab";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

function FormChip({ form }: { form: string }) {
  return <span className="inline-flex shrink-0 items-center rounded border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--os-ink-muted)]">{form}</span>;
}

export function SignatureCard({
  engagementId, form, entityName, signerName, stage, onToast,
}: {
  engagementId: string;
  form: string;
  entityName: string;
  signerName: string;
  stage: Stage;
  onToast: (m: string) => void;
}) {
  useEsign(); // re-render as the envelope advances
  const envStatus = esignStore.statusOf(engagementId);
  const status: EsignStatus =
    envStatus ??
    (stage === "accepted" || stage === "e_filed" ? "completed" : stage === "pay_and_sign" ? "viewed" : "not_sent");
  const signer = esignStore.signerOf(engagementId) ?? signerName;
  const rank = esignRank(status);
  const href = `/os/returns/${engagementId}`;

  const send = () => { esignStore.send(engagementId, signer, href); onToast(`8879 sent to ${signer}`); };
  const remind = () => { esignStore.remind(engagementId); onToast(`Reminder sent to ${signer}`); };
  const countersign = () => { esignStore.countersign(engagementId); onToast("Countersigned · return transmitted"); };

  return (
    <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-3">
      {/* header row */}
      <div className="flex items-center gap-2">
        <FormChip form="8879" />
        <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{entityName} · {form}</span>
        {status === "completed" ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-[var(--os-success)]"><Icon icon={I.check} size={13} /> Transmitted</span>
        ) : status === "signed" ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]"><span className="size-1.5 rounded-full bg-emerald-500" /> Signed</span>
        ) : status === "not_sent" ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-subtle)]"><span className="size-1.5 rounded-full bg-[var(--os-border-strong)]" /> Not sent</span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]"><span className="size-1.5 rounded-full bg-amber-500" /> Out for signature</span>
        )}
      </div>

      {/* progress steps */}
      {status !== "not_sent" && (
        <div className="mt-3 flex items-center gap-1">
          {ESIGN_STEPS.map((step, i) => {
            const reached = rank >= esignRank(step.key);
            const current = rank === esignRank(step.key);
            return (
              <div key={step.key} className="flex flex-1 items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn("grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-semibold transition-colors", reached ? "bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "bg-[var(--os-selected)] text-[var(--os-ink-subtle)]")}>
                    {reached ? <Icon icon={I.check} size={9} /> : i + 1}
                  </span>
                  <span className={cn("text-[11px]", current ? "font-medium text-[var(--os-ink)]" : reached ? "text-[var(--os-ink-muted)]" : "text-[var(--os-ink-subtle)]")}>{step.label}</span>
                </div>
                {i < ESIGN_STEPS.length - 1 && <span className={cn("h-px flex-1", rank > esignRank(step.key) ? "bg-[var(--os-primary)]" : "bg-[var(--os-border)]")} />}
              </div>
            );
          })}
        </div>
      )}

      {/* the one next action */}
      <div className="mt-3 flex items-center gap-2">
        {status === "not_sent" && (
          <button onClick={send} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}>
            <Icon icon={I.send} size={13} /> Send 8879 for signature
          </button>
        )}
        {(status === "sent" || status === "viewed") && (
          <>
            <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--os-ink-muted)]">
              {status === "viewed" ? `${signer} opened it — awaiting signature` : `Waiting for ${signer} to open`}
            </span>
            <button onClick={remind} className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12.5px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", FOCUS)}>
              <Icon icon={I.mail} size={13} className="text-[var(--os-ink-muted)]" /> Send reminder
            </button>
          </>
        )}
        {status === "signed" && (
          <>
            <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--os-ink-muted)]">{signer} signed — your countersignature transmits it</span>
            <button onClick={countersign} className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12.5px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", FOCUS)}>
              <PetalMark className="size-3.5" /> Countersign &amp; transmit
            </button>
          </>
        )}
        {status === "completed" && (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--os-ink-muted)]">
            <span className="size-1.5 rounded-full bg-blue-500" /> Transmitted to the IRS — awaiting acknowledgement
          </span>
        )}
      </div>

      <p className="mt-2.5 flex items-start gap-1.5 text-[11.5px] text-[var(--os-ink-subtle)]">
        <PetalMark className="mt-0.5 size-3 shrink-0" /> Petal never transmits this return until its 8879 is signed and you&apos;ve approved it.
      </p>
    </div>
  );
}
