"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { PetalMark } from "@/components/petal-mark";
import { Icon, I } from "@/components/os/icon";
import { ProvenancePanel } from "@/components/os/provenance";
import { people, skillById, expectedDocs, type Thread, type Message } from "@/lib/fixtures/firm";

const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2);
const first = (name: string) => name.split(" ")[0];
function emailFor(author: string, from: Message["from"]) {
  if (from === "firm") return `${first(author).toLowerCase()}@vazantea.com`;
  return people.find(p => p.name === author)?.email ?? `${first(author).toLowerCase()}@gmail.com`;
}

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

/* ── quiet toast (the action keeps its name: "Approve & send" → "Approved & sent") ── */
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2400);
  };
  return { msg, show };
}

function Toast({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: 6, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 6, x: "-50%" }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="fixed bottom-5 left-1/2 z-50 rounded-md bg-[var(--os-primary)] px-3 py-1.5 text-[12px] font-medium text-[var(--os-primary-fg)] shadow-sm"
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Per-channel conversation + reply composer. Shared by the Inbox and the client record Messages tab.
 *  Renders as a flex-1 scrolling message area + a composer pinned beneath — drop it into a flex-col parent. */
/** A contextual reply Petal "drafts" for threads without a scripted one (session-only). */
function petalDraftFor(thread: Thread): string {
  const f = first(thread.clientName);
  if (thread.id === "th-fuentes")
    return `Hi ${f} — yes, both trucks qualify for 60% bonus depreciation in 2025 since they were placed in service this year. I've already factored that into the 1120S draft, so the moment you sign the 8879 we're clear to transmit. Happy to walk through the numbers on our call this afternoon. Best, Antonio`;
  return `Hi ${f} — thanks for reaching out. I've got this and will follow up with the details shortly. Let me know if anything's urgent in the meantime. Best, Antonio`;
}

export function ThreadConversation({ thread }: { thread: Thread }) {
  const [reply, setReply] = useState(thread.petalDraft?.text ?? "");
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [petalDrafted, setPetalDrafted] = useState(false);
  const [sent, setSent] = useState(false);
  const [extraMessages, setExtraMessages] = useState<Message[]>([]);
  const { msg, show } = useToast();

  // Reset everything when the thread switches (also resets on page reload).
  useEffect(() => {
    setReply(thread.petalDraft?.text ?? "");
    setAnswerRevealed(false);
    setPetalDrafted(false);
    setSent(false);
    setExtraMessages([]);
  }, [thread.id, thread.petalDraft?.text]);

  const draftSkillName = thread.petalDraft ? (skillById(thread.petalDraft.skillId)?.name ?? "Petal") : null;
  const extractionDoc = thread.extraction ? expectedDocs.find(d => d.id === thread.extraction!.docId) : undefined;
  /** a Petal draft is sitting in the composer, unedited-or-edited but un-sent */
  const draftLoaded = reply.trim().length > 0 && (!!thread.petalDraft || answerRevealed || petalDrafted);
  const allMessages = [...thread.messages, ...extraMessages];

  function revealAnswer() {
    if (!thread.petalCanAnswer) return;
    setAnswerRevealed(true);
    setReply(thread.petalCanAnswer.draft);
  }

  function draftWithPetal() {
    if (thread.petalCanAnswer && !answerRevealed) { revealAnswer(); return; }
    setReply(petalDraftFor(thread));
    setPetalDrafted(true);
    show("Petal drafted a reply");
  }

  /** append the composed reply into the conversation, then clear the composer */
  function postReply(toast: string) {
    const text = reply.trim();
    if (!text) return;
    setExtraMessages(m => [...m, { from: "firm", author: "Antonio Vazquez", text, time: "just now" }]);
    setReply("");
    setAnswerRevealed(false);
    setPetalDrafted(false);
    setSent(true);
    show(toast);
  }
  const approveAndSend = () => postReply("Approved & sent");
  const send = () => postReply("Sent");

  const composerPlaceholder =
    thread.channel === "email" ? `Reply to ${first(thread.clientName)}…`
    : thread.channel === "sms" ? `Text ${first(thread.clientName)}…`
    : thread.channel === "call" ? `Follow up with ${first(thread.clientName)}…`
    : "Reply in the portal…";

  return (
    <>
      {/* Conversation — rendered per channel */}
      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className={cn("mx-auto max-w-[640px]", thread.channel === "sms" ? "space-y-2.5" : thread.channel === "email" ? "space-y-0" : "space-y-5")}>
          {/* ── Call: transcript (speaker + line) ── */}
          {thread.channel === "call" && thread.transcript && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-[12px] text-[var(--os-ink-muted)]">
                <Icon icon={I.call} size={14} className="shrink-0" />
                <span className="font-medium text-[var(--os-ink)]">Call transcript</span>
                <span className="text-[var(--os-ink-subtle)]">· {thread.time}</span>
              </div>
              <div className="space-y-3">
                {thread.transcript.lines.map((l, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-[60px] shrink-0 pt-px text-right text-[11px] font-medium text-[var(--os-ink-muted)]">{l.speaker}</span>
                    <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-[var(--os-ink)]">{l.text}</p>
                  </div>
                ))}
              </div>
              {/* Follow-ups Petal pulled out of the call */}
              <div className="overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-card)]">
                <div className="flex items-center gap-2 border-b border-[var(--os-border)] px-3 py-2">
                  <PetalMark className="size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
                  <span className="text-[12px] font-medium text-[var(--os-ink)]">
                    Petal extracted {thread.transcript.followUps.length} follow-up{thread.transcript.followUps.length === 1 ? "" : "s"}
                  </span>
                </div>
                {thread.transcript.followUps.map(f => (
                  <Link
                    key={f.taskId}
                    href={`/os/tasks?task=${f.taskId}`}
                    className={cn("flex items-center gap-2 border-b border-[var(--os-border)] px-3 py-2 text-[13px] text-[var(--os-ink)] transition-colors last:border-b-0 hover:bg-[var(--os-hover)]", focusRing)}
                  >
                    <span className="min-w-0 flex-1 truncate">{f.label}</span>
                    <Icon icon={I.chevronRight} size={13} className="shrink-0 text-[var(--os-ink-subtle)]" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {allMessages.map((msg, i) => {
            // ── Email: full-width message blocks ──
            if (thread.channel === "email") {
              return (
                <div key={i} className="border-b border-[var(--os-border)] py-4 first:pt-0 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-medium", msg.from === "firm" ? "bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "bg-[var(--os-selected)] text-[var(--os-ink-muted)]")}>{initials(msg.author)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-[var(--os-ink)]">{msg.author}</span>
                        <span className="truncate font-mono text-[11px] text-[var(--os-ink-subtle)]">&lt;{emailFor(msg.author, msg.from)}&gt;</span>
                        <span className="ml-auto shrink-0 text-[11px] text-[var(--os-ink-subtle)]">{msg.time}</span>
                      </div>
                      <div className="text-[12px] text-[var(--os-ink-subtle)]">{msg.from === "firm" ? `to ${thread.clientName}` : "to me"}</div>
                      <p className="mt-2.5 whitespace-pre-line text-[13px] leading-relaxed text-[var(--os-ink)]">{msg.text}</p>
                    </div>
                  </div>
                </div>
              );
            }
            // ── SMS: aligned chat bubbles ──
            if (thread.channel === "sms") {
              const firm = msg.from === "firm";
              return (
                <div key={i} className={cn("flex", firm ? "justify-end" : "justify-start")}>
                  <div className="max-w-[76%]">
                    <div className={cn("px-3.5 py-2 text-[13px] leading-snug", firm ? "rounded-2xl rounded-br-md bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "rounded-2xl rounded-bl-md bg-[var(--os-selected)] text-[var(--os-ink)]")}>{msg.text}</div>
                    <div className={cn("mt-0.5 text-[11px] text-[var(--os-ink-subtle)]", firm && "text-right")}>{msg.time}</div>
                  </div>
                </div>
              );
            }
            // ── Portal: message thread ──
            return (
              <div key={i} className="flex gap-2.5">
                <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-medium", msg.from === "firm" ? "bg-[var(--os-primary)] text-[var(--os-primary-fg)]" : "bg-[var(--os-selected)] text-[var(--os-ink-muted)]")}>{initials(msg.author)}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="text-[13px] font-medium text-[var(--os-ink)]">{msg.author}</span>
                    <span className="text-[11px] text-[var(--os-ink-subtle)]">{msg.time}</span>
                  </div>
                  <div className="rounded-lg rounded-tl-sm bg-[var(--os-bg-subtle)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--os-ink)]">{msg.text}</div>
                </div>
              </div>
            );
          })}

          {/* ── Extraction moment: attachment row + what Petal filed from it ── */}
          {thread.extraction && (
            <div className="space-y-2 pt-4">
              <div className="flex items-center gap-2 rounded-md border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-2 text-[13px]">
                <Icon icon={I.attach} size={14} className="shrink-0 text-[var(--os-ink-muted)]" />
                <span className="min-w-0 truncate font-medium text-[var(--os-ink)]">{extractionDoc?.source ?? "Attachment"}</span>
                {extractionDoc?.when && <span className="ml-auto shrink-0 text-[11px] text-[var(--os-ink-subtle)]">received {extractionDoc.when}</span>}
              </div>
              <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-card)] p-3">
                <div className="flex items-start gap-2">
                  <PetalMark className="mt-0.5 size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] leading-relaxed text-[var(--os-ink)]">{thread.extraction.summary}</p>
                    <Link href="/os/documents" className={cn("mt-1 inline-flex items-center gap-1 text-[12px] text-[var(--os-accent)] hover:underline", focusRing)}>
                      Review in Documents <Icon icon={I.chevronRight} size={11} />
                    </Link>
                  </div>
                </div>
                <ProvenancePanel runId={thread.extraction.runId} className="mt-2.5" />
              </div>
            </div>
          )}

          {/* ── "Petal can answer" suggestion chip ── */}
          {thread.petalCanAnswer && !answerRevealed && (
            <div className="pt-3">
              <button
                onClick={revealAnswer}
                className={cn("inline-flex items-center gap-1.5 rounded-full border border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-2.5 py-1 text-[12px] font-medium text-[var(--os-ink)] transition-colors hover:bg-[var(--os-hover)]", focusRing)}
              >
                <PetalMark className="size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
                Petal can answer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="px-5 pb-4">
        <div className="mx-auto max-w-[640px]">
          {thread.petalDraft && !sent && (
            <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-1.5 text-[12px]">
              <PetalMark className="size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
              <span className="text-[var(--os-ink-muted)]"><span className="font-medium text-[var(--os-ink)]">{draftSkillName}</span> drafted this reply — review before sending.</span>
            </div>
          )}
          {thread.petalCanAnswer && answerRevealed && !sent && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-t-lg border border-b-0 border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-3 py-1.5 text-[12px]">
              <PetalMark className="size-3.5 shrink-0 text-[var(--os-ink-muted)]" />
              <span className="text-[var(--os-ink-muted)]"><span className="font-medium text-[var(--os-ink)]">Petal</span> drafted this answer — review before sending.</span>
              <Link href={`/os/tasks?task=${thread.petalCanAnswer.taskId}`} className={cn("ml-auto inline-flex items-center gap-1 text-[var(--os-accent)] hover:underline", focusRing)}>
                View task <Icon icon={I.chevronRight} size={11} />
              </Link>
            </div>
          )}
          <div className={cn("rounded-lg border border-[var(--os-border-strong)] bg-[var(--os-surface)] px-3 py-2.5 transition-shadow focus-within:shadow-sm", ((thread.petalDraft || (thread.petalCanAnswer && answerRevealed)) && !sent) && "rounded-t-none")}>
            {thread.channel === "email" && (
              <div className="mb-2 flex items-center gap-1.5 border-b border-[var(--os-border)] pb-2 text-[12px] text-[var(--os-ink-subtle)]">
                <span className="text-[var(--os-ink-muted)]">To</span>
                <span className="rounded bg-[var(--os-selected)] px-1.5 py-0.5 text-[12px] text-[var(--os-ink)]">{thread.clientName} <span className="font-mono text-[11px] text-[var(--os-ink-subtle)]">&lt;{emailFor(thread.clientName, "client")}&gt;</span></span>
              </div>
            )}
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              placeholder={composerPlaceholder}
              rows={thread.channel === "sms" ? 1 : 2}
              className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-[var(--os-ink)] placeholder:text-[var(--os-ink-subtle)] focus:outline-none"
            />
            <div className="mt-1 flex items-center gap-1.5">
              <button title="Attach" className={cn("grid size-7 place-items-center rounded-md text-[var(--os-ink-muted)] hover:bg-[var(--os-hover)]", focusRing)}><Icon icon={I.attach} size={15} /></button>
              {/* plain send is the quiet secondary; the primary is Petal-first */}
              <button
                onClick={send}
                disabled={!reply.trim()}
                className={cn("ml-auto flex h-7 items-center gap-1.5 rounded-md border border-[var(--os-border)] bg-[var(--os-surface)] px-2.5 text-[12px] text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)] disabled:opacity-30", focusRing)}
              >
                Send
              </button>
              {draftLoaded ? (
                <button
                  onClick={approveAndSend}
                  className={cn("flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", focusRing)}
                >
                  <Icon icon={I.send} size={14} /> Approve & send
                </button>
              ) : (
                <button
                  onClick={draftWithPetal}
                  className={cn("flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-3 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97]", focusRing)}
                >
                  <PetalMark className="size-3.5" /> Draft with Petal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast msg={msg} />
    </>
  );
}
