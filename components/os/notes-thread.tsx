"use client";

// Notes rail comment thread — internal team collaboration on a record (client or
// return). Posting supports @mentions of teammates (autocomplete) and @Petal, which
// replies in-thread. Mentions of a teammate "notify" them (toast). Session-only.

import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { MemberAvatar } from "@/components/os/primitives";
import { firmMembers, isCurrentUser, CURRENT_USER_ID, memberById } from "@/lib/fixtures/firm";
import { commentsStore, useComments } from "@/lib/comments-store";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const firstName = (n: string) => n.split(" ")[0];

/** autocomplete targets: teammates (not you) + Petal */
const MENTIONS = [
  ...firmMembers.filter(m => !isCurrentUser(m.id)).map(m => ({ id: m.id, label: firstName(m.name), full: m.name })),
  { id: "petal", label: "Petal", full: "Petal" },
];
/** every recognizable @name (incl. you + Petal) — drives highlighting */
const ALL_NAMES = [...firmMembers.map(m => firstName(m.name)), "Petal"];
const isKnownMention = (token: string) => ALL_NAMES.some(n => n.toLowerCase() === token.toLowerCase());

/** render a comment body with @mentions highlighted */
function Body({ text }: { text: string }) {
  const parts = text.split(/(@\w+)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("@") && isKnownMention(p.slice(1)) ? (
          <span key={i} className="rounded bg-[var(--os-accent-soft)] px-0.5 font-medium text-[var(--os-accent)]">{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function authorName(authorId: string) {
  if (authorId === "petal") return "Petal";
  if (isCurrentUser(authorId)) return "You";
  return memberById(authorId)?.name ?? "Teammate";
}

export function NotesThread({ scopeId, scopeLabel, onToast }: { scopeId: string; scopeLabel: string; onToast?: (m: string) => void }) {
  const comments = useComments(scopeId);
  const [draft, setDraft] = useState("");
  const [menuQuery, setMenuQuery] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = useMemo(() => {
    if (menuQuery === null) return [];
    const q = menuQuery.toLowerCase();
    return MENTIONS.filter(m => m.label.toLowerCase().startsWith(q)).slice(0, 5);
  }, [menuQuery]);

  const onChange = (v: string) => {
    setDraft(v);
    const upto = v.slice(0, taRef.current?.selectionStart ?? v.length);
    const m = upto.match(/@(\w*)$/);
    setMenuQuery(m ? m[1] : null);
  };

  const pickMention = (label: string) => {
    const ta = taRef.current;
    const caret = ta?.selectionStart ?? draft.length;
    const before = draft.slice(0, caret).replace(/@(\w*)$/, `@${label} `);
    const after = draft.slice(caret);
    const next = before + after;
    setDraft(next);
    setMenuQuery(null);
    requestAnimationFrame(() => { ta?.focus(); const pos = before.length; ta?.setSelectionRange(pos, pos); });
  };

  const post = () => {
    const text = draft.trim();
    if (!text) return;
    commentsStore.add(scopeId, CURRENT_USER_ID, text);
    // notify mentioned teammates (outbound)
    const mentioned = MENTIONS.filter(m => m.id !== "petal" && new RegExp(`@${m.label}\\b`, "i").test(text));
    if (mentioned.length) onToast?.(`Notified ${mentioned.map(m => m.label).join(", ")}`);
    else if (/@petal\b/i.test(text)) onToast?.("Asked Petal");
    setDraft("");
    setMenuQuery(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* thread */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {comments.length === 0 ? (
          <div className="grid place-items-center py-10 text-center">
            <p className="text-[12.5px] text-[var(--os-ink-muted)]">No notes yet.</p>
            <p className="mt-0.5 text-[11.5px] text-[var(--os-ink-subtle)]">Leave a note or @mention a teammate.</p>
          </div>
        ) : (
          comments.map(c => {
            const petal = c.authorId === "petal";
            return (
              <div key={c.id} className="flex gap-2.5">
                {petal ? (
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--os-bg-subtle)] ring-1 ring-[var(--os-border)]"><PetalMark className="size-3.5" /></span>
                ) : (
                  <MemberAvatar memberId={c.authorId} size={24} className="mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn("text-[12.5px] font-semibold", petal ? "text-[var(--os-accent)]" : "text-[var(--os-ink)]")}>{authorName(c.authorId)}</span>
                    <span className="text-[11px] text-[var(--os-ink-subtle)]">{c.at}</span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--os-ink)]"><Body text={c.body} /></p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* composer */}
      <div className="relative border-t border-[var(--os-border)] p-3">
        {menuQuery !== null && suggestions.length > 0 && (
          <div className="absolute bottom-[calc(100%-2px)] left-3 z-20 w-[220px] overflow-hidden rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] p-1 shadow-[0_10px_34px_rgba(17,17,26,0.13)]">
            {suggestions.map(s => (
              <button
                key={s.id}
                onMouseDown={e => { e.preventDefault(); pickMention(s.label); }}
                className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-[var(--os-hover)]", FOCUS)}
              >
                {s.id === "petal" ? <span className="grid size-5 place-items-center rounded-full bg-[var(--os-bg-subtle)] ring-1 ring-[var(--os-border)]"><PetalMark className="size-3" /></span> : <MemberAvatar memberId={s.id} size={20} />}
                <span className="text-[12.5px] text-[var(--os-ink)]">{s.full}</span>
              </button>
            ))}
          </div>
        )}
        <div className="rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] transition-colors focus-within:border-[var(--os-border-strong)]">
          <textarea
            ref={taRef}
            value={draft}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); post(); } if (e.key === "Escape") setMenuQuery(null); }}
            rows={2}
            placeholder={`Note about ${scopeLabel}…  use @ to mention`}
            aria-label={`Add a note about ${scopeLabel}`}
            className="block w-full resize-none bg-transparent px-2.5 py-2 text-[13px] leading-relaxed text-[var(--os-ink)] outline-none placeholder:text-[var(--os-ink-subtle)]"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <span className="text-[11px] text-[var(--os-ink-subtle)]">⌘↵ to post</span>
            <button
              onClick={post}
              disabled={!draft.trim()}
              className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[var(--os-primary)] px-2.5 text-[12px] font-medium text-[var(--os-primary-fg)] transition-transform active:scale-[0.97] disabled:opacity-40"
            >
              <Icon icon={I.send} size={12} /> Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
