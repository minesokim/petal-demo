"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { ScopeToggle, type Scope } from "@/components/os/primitives";
import { MessagingPanel, type OnSend } from "@/components/os/messaging-panel";
import { ComposeModal } from "@/components/os/compose-modal";
import { CURRENT_USER_ID, type Thread } from "@/lib/fixtures/firm";
import { useFirmData } from "@/lib/client/firm-context";
import { assigneeOf, useAssignVersion } from "@/lib/assign-store";
import { sendClientSmsAction } from "@/app/os/clients/sms-actions";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

// SMS threads send for real through Twilio (same action as the client Messages tab); other
// channels keep the existing optimistic-only behavior.
const onSendFor = (t: Thread): OnSend | undefined =>
  t.channel === "sms" && t.householdId
    ? (body, attachments) => sendClientSmsAction({ householdId: t.householdId, body, attachments })
    : undefined;

export function InboxView() {
  const { threads } = useFirmData();
  const [scope, setScope] = useState<Scope>("firm");
  const [composeOpen, setComposeOpen] = useState(false);
  useAssignVersion(); // re-filter when a client is reassigned
  const scopeOk = (t: Thread) => scope === "firm" || assigneeOf(t.householdId) === CURRENT_USER_ID;
  const scoped = threads.filter(scopeOk);

  return (
    <div className="flex h-full flex-col">
      {/* Header - Compose is a ghost icon; the primary affordance lives in the composer ("Draft with Petal") */}
      <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-5 pt-6 pb-5 sm:px-8">
        <h1 className="os-display text-[24px] font-semibold text-[var(--os-ink)]">Inbox</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <ScopeToggle scope={scope} onChange={setScope} />
          <span className="mx-0.5 h-5 w-px bg-[var(--os-border)]" />
          <button title="Search" className={cn("grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}><Icon icon={I.search} size={15} /></button>
          <button onClick={() => setComposeOpen(true)} title="Compose" aria-label="Compose" className={cn("grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}><Icon icon={I.edit} size={15} /></button>
        </div>
      </div>

      <MessagingPanel threads={scoped} onSendFor={onSendFor} />

      <AnimatePresence>
        {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
