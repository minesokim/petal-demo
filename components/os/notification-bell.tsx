"use client";

// Notification center — the bell in the sidebar. Unread badge, a popover inbox of
// @mentions / approvals / assignments / syncs; clicking one marks it read and deep-
// links to the record. Session-only (notifications-store).

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Icon, I } from "@/components/os/icon";
import { PetalMark } from "@/components/petal-mark";
import { MemberAvatar } from "@/components/os/primitives";
import { notificationsStore, useNotifications, type NotifKind } from "@/lib/notifications-store";

const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

const KIND_GLYPH: Record<NotifKind, typeof I.check> = {
  mention: I.send,
  approval: I.check,
  sync: I.history,
  assignment: I.clients,
};

export function NotificationBell() {
  const router = useRouter();
  const notifs = useNotifications();
  const unread = notifs.filter(n => !n.read).length;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const onClick = (id: string, href?: string) => {
    notificationsStore.markRead(id);
    setOpen(false);
    if (href) router.push(href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className={cn("relative grid size-7 shrink-0 place-items-center rounded-md text-[var(--os-ink-muted)] transition-colors hover:bg-black/[0.05] hover:text-[var(--os-ink)]", FOCUS)}
      >
        <Bell className="size-[17px]" strokeWidth={1.6} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[var(--os-accent)] px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-[var(--os-shell)]">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+6px)] z-40 w-[330px] overflow-hidden rounded-xl border border-[var(--os-border)] bg-[var(--os-surface)] shadow-[0_12px_40px_-8px_rgba(17,17,26,0.28)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--os-border)] px-3 py-2.5">
              <span className="text-[13px] font-semibold text-[var(--os-ink)]">Notifications</span>
              {unread > 0 && (
                <button onClick={() => notificationsStore.markAllRead()} className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-[var(--os-ink-muted)] transition-colors hover:bg-[var(--os-hover)] hover:text-[var(--os-ink)]", FOCUS)}>
                  <CheckCheck className="size-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto py-1">
              {notifs.length === 0 ? (
                <p className="px-3 py-8 text-center text-[12.5px] text-[var(--os-ink-muted)]">You're all caught up.</p>
              ) : (
                notifs.map(n => (
                  <button
                    key={n.id}
                    onClick={() => onClick(n.id, n.href)}
                    className={cn("flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--os-hover)]", FOCUS)}
                  >
                    {/* actor avatar, or a kind glyph for system/Petal items */}
                    {n.actorId ? (
                      <MemberAvatar memberId={n.actorId} size={28} className="mt-0.5 shrink-0" />
                    ) : (
                      <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", n.kind === "approval" ? "bg-[var(--os-bg-subtle)] ring-1 ring-[var(--os-border)]" : "bg-[var(--os-selected)]")}>
                        {n.kind === "approval" ? <PetalMark className="size-3.5" /> : <Icon icon={KIND_GLYPH[n.kind]} size={13} className="text-[var(--os-ink-muted)]" />}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("min-w-0 flex-1 truncate text-[12.5px]", n.read ? "font-medium text-[var(--os-ink-muted)]" : "font-semibold text-[var(--os-ink)]")}>{n.title}</span>
                        <span className="shrink-0 text-[10.5px] text-[var(--os-ink-subtle)]">{n.at}</span>
                        {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-[var(--os-accent)]" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[var(--os-ink-muted)]">{n.body}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
