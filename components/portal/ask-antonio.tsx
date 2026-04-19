"use client";

import * as React from "react";

import type { PortalTheme } from "./theme";
import { AvatarSlot } from "./primitives";

/**
 * Ask Antonio bar + chat modal — 1:1 port of
 * design-references/client-portal/components/intake-screens.jsx
 * (L1576–1811, the persistent "Not sure? Ask Antonio" widget and
 * the bottom-sheet chat modal that opens from it).
 *
 * The bar is meant to be rendered at the bottom of every intake
 * screen just above the BottomBar; the chat modal is mounted once
 * globally (by PortalApp) and opens on the custom
 * `ask-antonio:open` window event that the bar dispatches.
 */

/* ─── Persistent bar ─── */

export function AskAntonioBar({
  t,
  onMessage
}: {
  t: PortalTheme;
  onMessage?: () => void;
}) {
  const handleClick = () => {
    if (onMessage) onMessage();
    try {
      window.dispatchEvent(new CustomEvent("ask-antonio:open"));
    } catch {
      /* noop in SSR or restricted contexts */
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: t.card,
        border: `1px solid ${t.border}`,
        borderRadius: 999,
        padding: "6px 8px 6px 10px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 4px 12px rgba(60, 40, 28, 0.04)",
        cursor: "pointer"
      }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <AvatarSlot t={t} size={30} label="A" />
        <div
          style={{
            position: "absolute",
            bottom: -1,
            right: -1,
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "#4a8f5f",
            border: `2px solid ${t.card}`
          }}
        />
      </div>
      <span style={{ flex: 1, fontSize: 12.5, color: t.inkSoft }}>
        Not sure? Ask Antonio
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        style={{
          padding: "6px 14px",
          fontSize: 12,
          fontWeight: 500,
          background: t.rust,
          color: "#fff",
          border: "none",
          borderRadius: 999,
          cursor: "pointer",
          fontFamily: t.sans
        }}>
        Message
      </button>
    </div>
  );
}

/* ─── Chat bottom-sheet modal ─── */

type ChatMessage = { from: "a" | "u"; text: string; time: string };

function formatTime(d: Date): string {
  const h12 = ((d.getHours() + 11) % 12) + 1;
  const mm = String(d.getMinutes()).padStart(2, "0");
  const period = d.getHours() >= 12 ? "PM" : "AM";
  return `${h12}:${mm} ${period}`;
}

export function AskAntonioChat({ t }: { t: PortalTheme }) {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    { from: "a", text: "Hey — I'm here. What can I help with?", time: "2:14 PM" }
  ]);
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("ask-antonio:open", onOpen as EventListener);
    return () =>
      window.removeEventListener("ask-antonio:open", onOpen as EventListener);
  }, []);

  React.useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = () => {
    const msg = input.trim();
    if (!msg) return;
    const time = formatTime(new Date());
    setMessages((m) => [...m, { from: "u", text: msg, time }]);
    setInput("");
    // Simulated reply from Antonio
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: "a",
          text: "Got it. Give me a few minutes — I'll come back with specifics.",
          time
        }
      ]);
    }, 1400);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(32, 22, 16, 0.42)",
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        animation: "portal-fade-in 160ms ease-out"
      }}
      onClick={() => setOpen(false)}>
      <style>{`
        @keyframes portal-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes portal-slide-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          height: "78%",
          background: t.bg,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          display: "flex",
          flexDirection: "column",
          animation: "portal-slide-up 220ms cubic-bezier(.2,.8,.2,1)",
          overflow: "hidden",
          boxShadow: "0 -12px 40px rgba(20,10,0,0.18)"
        }}>
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 0" }}>
          <div style={{ width: 40, height: 4, background: t.border, borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div
          style={{
            padding: "14px 18px 14px",
            borderBottom: `1px solid ${t.borderSoft}`,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
          <div style={{ position: "relative" }}>
            <AvatarSlot t={t} size={40} label="A" />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: "#4a8f5f",
                border: `2px solid ${t.bg}`
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 500,
                color: t.ink,
                letterSpacing: -0.1
              }}>
              Antonio Vazquez, EA
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: "#4a8f5f",
                fontFamily: t.mono,
                letterSpacing: 0.3
              }}>
              ● Online · typically replies within an hour
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "none",
              background: t.bgElev,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke={t.inkSoft}
              strokeWidth="1.6"
              strokeLinecap="round">
              <path d="M3 3l6 6M9 3l-6 6" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 18px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.from === "u" ? "flex-end" : "flex-start",
                gap: 3
              }}>
              <div
                style={{
                  maxWidth: "80%",
                  padding: "10px 14px",
                  borderRadius:
                    m.from === "u" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.from === "u" ? t.rust : t.card,
                  color: m.from === "u" ? "#fff" : t.ink,
                  border: m.from === "u" ? "none" : `1px solid ${t.border}`,
                  fontSize: 14,
                  lineHeight: 1.4,
                  fontFamily: t.sans
                }}>
                {m.text}
              </div>
              <div
                style={{
                  fontFamily: t.mono,
                  fontSize: 9.5,
                  color: t.muted,
                  letterSpacing: 0.4,
                  padding: "0 4px"
                }}>
                {m.time}
              </div>
            </div>
          ))}
        </div>

        {/* Composer */}
        <div
          style={{
            padding: "12px 14px 18px",
            borderTop: `1px solid ${t.borderSoft}`,
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            background: t.bg
          }}>
          <div
            style={{
              flex: 1,
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: 20,
              padding: "8px 14px",
              display: "flex",
              alignItems: "center"
            }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Type your question…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 14,
                fontFamily: t.sans,
                color: t.ink
              }}
            />
          </div>
          <button
            onClick={send}
            disabled={!input.trim()}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: input.trim() ? t.rust : t.border,
              border: "none",
              cursor: input.trim() ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 120ms"
            }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M3 8l10-5-5 10-1.5-4.5L3 8z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
