"use client";

// Compose — a focused message composer modal for the Inbox. Unlike Gmail's
// kitchen-sink toolbar, the actions here are the ones a tax preparer actually
// reaches for: pick a channel, draft with Petal, attach or pull a client doc,
// drop in a saved template, request a signature or documents, and schedule.

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { useFirmData } from "@/lib/client/firm-context";
import { sendClientSmsAction } from "@/app/os/clients/sms-actions";
import { sendClientEmailAction } from "@/app/os/clients/email-actions";
import { FileSignature, Paperclip, FileText, LayoutTemplate, ListChecks, Clock } from "lucide-react";

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const initials = (n: string) => n.split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

const CHANNELS = [
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
  { key: "portal", label: "Portal" },
] as const;
type Channel = (typeof CHANNELS)[number]["key"];

export const TEMPLATES: { name: string; body: string }[] = [
  { name: "Documents needed", body: "Hi {name},\n\nWe're ready to move your return forward and just need a few items: your W-2s, any 1099s, and last year's return if you haven't sent it. You can upload them straight to the portal.\n\nThank you!" },
  { name: "Return ready to review", body: "Hi {name},\n\nYour return is prepared and ready for your review. I've posted it to the portal — take a look and let me know if anything looks off. Once you approve, I'll send the e-file authorization to sign.\n\nBest," },
  { name: "Payment reminder", body: "Hi {name},\n\nA friendly reminder that the balance on your engagement is due. You can pay securely through the portal. Let me know if you have any questions.\n\nThanks!" },
  { name: "Estimate reminder", body: "Hi {name},\n\nYour next quarterly estimated payment is coming up. I'll send the voucher and amount shortly so you have everything you need before the deadline.\n\nBest," },
];

/** small icon button for the composer toolbar */
function ToolButton({ icon: IconC, label, onClick, active }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick?: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn("grid size-8 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", active && "bg-[var(--os-selected)] text-[var(--os-ink)]", focusRing)}
    >
      <IconC className="size-[17px]" />
    </button>
  );
}

export function ComposeModal({ onClose }: { onClose: () => void }) {
  const { households } = useFirmData();
  const router = useRouter();
  const [to, setTo] = useState("");
  const [toId, setToId] = useState(""); // the resolved householdId (set when a client is picked)
  const [toOpen, setToOpen] = useState(false);
  const [channel, setChannel] = useState<Channel>("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstName = (to || "there").split(/\s|@/)[0];

  // The client to send to: an explicit pick, or an exact name typed into the To field.
  const resolvedId = toId || households.find(h => h.name.trim().toLowerCase() === to.trim().toLowerCase())?.id || "";
  const canSend = !!resolvedId && !!body.trim() && !sending && channel !== "portal";

  // Actually send (SMS via Twilio, email via Gmail). On success the inbox/threads refresh so the
  // brand-new conversation shows up; on failure we surface the reason and stay open.
  async function send() {
    if (!resolvedId || !body.trim() || sending) return;
    if (channel === "portal") { flash("Portal messaging isn't connected yet"); return; }
    setSending(true);
    try {
      const res = channel === "sms"
        ? await sendClientSmsAction({ householdId: resolvedId, body })
        : await sendClientEmailAction({ householdId: resolvedId, subject: subject.trim() || "Message from your tax preparer", body });
      if (res.ok) {
        flash(channel === "sms" ? "Text sent" : "Message sent");
        router.refresh();
        setTimeout(onClose, 500);
      } else {
        flash(res.error ? `Couldn't send: ${res.error}` : "Couldn't send");
      }
    } catch {
      flash("Couldn't send");
    } finally {
      setSending(false);
    }
  }

  const flash = (m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2000);
  };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function draftWithPetal() {
    setDrafting(true);
    setTimeout(() => {
      setBody(`Hi ${firstName},\n\nThanks for reaching out — I've got this. I'll review the details on your account and follow up with next steps shortly. In the meantime, let me know if anything's time-sensitive.\n\nBest,\nAntonio`);
      if (!subject && channel === "email") setSubject("Following up on your return");
      setDrafting(false);
      flash("Petal drafted a reply");
    }, 900);
  }

  function applyTemplate(t: typeof TEMPLATES[number]) {
    setBody(t.body.replaceAll("{name}", firstName));
    if (channel === "email" && !subject) setSubject(t.name);
    setTemplatesOpen(false);
  }

  const placeholder =
    channel === "sms" ? `Text ${firstName}…` : channel === "portal" ? "Write a portal message…" : "Write your message…";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.14 }}
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-[6px]"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={e => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="New message"
        className="flex max-h-[88vh] w-full max-w-[620px] flex-col overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-xl"
      >
        {/* header */}
        <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-5 py-3">
          <PetalMark className="size-3.5 text-[var(--os-ink-muted)]" />
          <h2 className="text-[13px] font-semibold text-[var(--os-ink)]">New message</h2>
          <button aria-label="Close" onClick={onClose} className={cn("ml-auto grid size-7 place-items-center rounded-md text-[var(--os-ink-subtle)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", focusRing)}>
            <Icon icon={I.close} size={15} />
          </button>
        </div>

        {/* To + channel */}
        <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-5 py-2.5">
          <span className="text-[12px] text-[var(--os-ink-muted)]">To</span>
          <div className="relative min-w-0 flex-1">
            <input
              value={to}
              onChange={e => { setTo(e.target.value); setToId(""); setToOpen(true); }}
              onFocus={() => setToOpen(true)}
              placeholder="Client name…"
              className="w-full bg-transparent text-[13px] text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
            />
            <AnimatePresence>
              {toOpen && (() => {
                const matches = households.filter(h => h.name.toLowerCase().includes(to.toLowerCase()));
                if (matches.length === 0) return null;
                return (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setToOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.14 }}
                      className="absolute left-0 top-[calc(100%+8px)] z-20 max-h-[260px] w-[300px] overflow-y-auto rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-[0_12px_34px_-8px_rgba(17,17,26,0.22)]"
                    >
                      {matches.map(h => (
                        <button key={h.id} onClick={() => { setTo(h.name); setToId(h.id); setToOpen(false); }} className={cn("flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--os-hover)]", focusRing)}>
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-selected)] text-[10px] font-medium text-[var(--os-ink-muted)]">{initials(h.name)}</span>
                          <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--os-ink)]">{h.name}</span>
                          <span className="shrink-0 text-[11px] text-[var(--os-ink-subtle)]">{h.serviceTier}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                );
              })()}
            </AnimatePresence>
          </div>
          <div className="flex shrink-0 items-center gap-0.5 rounded-lg bg-[var(--os-bg-subtle)] p-0.5">
            {CHANNELS.map(c => (
              <button
                key={c.key}
                onClick={() => setChannel(c.key)}
                className={cn("rounded-md px-2 py-1 text-[12px] transition-colors", channel === c.key ? "bg-[var(--os-surface)] font-medium text-[var(--os-ink)] shadow-[0_1px_2px_rgba(17,17,26,0.06)]" : "text-[var(--os-ink-muted)] hover:text-[var(--os-ink)]", focusRing)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* subject (email only) */}
        {channel === "email" && (
          <div className="border-b border-[var(--os-border)] px-5 py-2.5">
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full bg-transparent text-[13px] font-medium text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
            />
          </div>
        )}

        {/* body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={placeholder}
            rows={8}
            className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
          />
          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {attachments.map(a => (
                <span key={a} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-2 py-1 text-[11.5px] text-[var(--os-ink-muted)]">
                  <Icon icon={I.file} size={12} className="text-[var(--os-ink-subtle)]" />
                  <span className="max-w-[160px] truncate">{a}</span>
                  <button aria-label={`Remove ${a}`} onClick={() => setAttachments(p => p.filter(x => x !== a))} className="text-[var(--os-ink-subtle)] hover:text-[var(--os-ink)]"><Icon icon={I.close} size={11} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* footer toolbar */}
        <div className="flex items-center gap-1.5 border-t border-[var(--os-border)] px-4 py-2.5">
          {/* primary send + schedule */}
          <div className="flex items-center">
            <button
              onClick={send}
              disabled={!canSend}
              title={channel === "portal" ? "Portal messaging isn't connected yet" : !resolvedId ? "Pick a client" : undefined}
              className={cn("flex h-8 items-center gap-1.5 rounded-l-md bg-[var(--os-primary)] pl-3 pr-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.98] disabled:opacity-40", focusRing)}
            >
              <Icon icon={I.send} size={14} /> {sending ? "Sending…" : "Send"}
            </button>
            <button
              onClick={() => flash("Scheduled for tomorrow 8:00 AM")}
              aria-label="Schedule send"
              className={cn("grid h-8 w-7 place-items-center rounded-r-md border-l border-white/15 bg-[var(--os-primary)] text-[var(--os-primary-fg)] transition-opacity hover:opacity-90", focusRing)}
            >
              <Icon icon={I.chevronDown} size={13} />
            </button>
          </div>

          {/* Petal draft */}
          <button
            onClick={draftWithPetal}
            disabled={drafting}
            className={cn("ml-1 flex h-8 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", focusRing)}
          >
            <PetalMark className="size-3.5" /> {drafting ? "Drafting…" : "Draft with Petal"}
          </button>

          <span className="mx-0.5 h-5 w-px bg-[var(--os-border)]" />

          {/* the tax-firm toolkit */}
          <ToolButton icon={Paperclip} label="Attach file" onClick={() => setAttachments(p => [...new Set([...p, "scan_2025.pdf"])])} />
          <ToolButton icon={FileText} label="Insert client document" onClick={() => setAttachments(p => [...new Set([...p, "2025 Return - draft.pdf"])])} />
          <div className="relative">
            <ToolButton icon={LayoutTemplate} label="Templates" active={templatesOpen} onClick={() => setTemplatesOpen(o => !o)} />
            <AnimatePresence>
              {templatesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setTemplatesOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.14 }}
                    className="absolute bottom-[calc(100%+6px)] left-0 z-20 w-[244px] overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-[0_12px_34px_-8px_rgba(17,17,26,0.22)]"
                  >
                    <div className="px-2 py-1.5 text-[10.5px] font-medium tracking-wide text-[var(--os-ink-subtle)]">Saved templates</div>
                    {TEMPLATES.map(t => (
                      <button key={t.name} onClick={() => applyTemplate(t)} className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", focusRing)}>
                        <LayoutTemplate className="size-3.5 shrink-0 text-[var(--os-ink-subtle)]" /> {t.name}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <ToolButton icon={FileSignature} label="Request signature (8879)" onClick={() => flash("8879 attached for e-signature")} />
          <ToolButton icon={ListChecks} label="Request documents" onClick={() => flash("Document request attached")} />
          <ToolButton icon={Clock} label="Schedule send" onClick={() => flash("Scheduled for tomorrow 8:00 AM")} />
        </div>
      </motion.div>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 8, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 8, x: "-50%" }}
            transition={{ duration: 0.16 }}
            className="fixed bottom-6 left-1/2 z-[60] rounded-md bg-[var(--os-primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--os-primary-fg)] shadow-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
