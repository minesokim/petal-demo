"use client";

import * as React from "react";

import type { PortalTheme } from "../theme";
import {
  AvatarSlot,
  Body,
  Button,
  H1,
  Row,
  Screen,
  Stack
} from "../primitives";
import { Footer } from "../intake-chrome";
import { useIntakeStore } from "@/lib/portal/intake-store";

/**
 * Auth screens — 1:1 port of
 * design-references/client-portal/components/intake-screens.jsx
 * (ScreenLogin, ScreenOTP). Inline styles preserved from the
 * reference; `onNext`/`onBack` wired to the decision tree store.
 */

/* ─── 1. Login ─── */

export function ScreenLogin({ t }: { t: PortalTheme }) {
  const { phone, setPhone, goNext } = useIntakeStore();

  const format = (v: string): string => {
    const d = v.replace(/\D/g, "").slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };

  return (
    <Screen t={t}>
      <div
        style={{
          padding: "60px 24px 40px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%"
        }}>
        <Stack gap={28} style={{ flex: 1 }}>
          <AvatarSlot t={t} size={72} />
          <Stack gap={10}>
            <H1 t={t}>
              Welcome to<br />Vazant Consulting
            </H1>
            <Body t={t} size={16}>
              Antonio will personally handle your return. Enter your phone
              number to get started.
            </Body>
          </Stack>

          <Stack gap={14}>
            <div>
              <div
                style={{
                  fontFamily: t.mono,
                  fontSize: 10,
                  color: t.muted,
                  letterSpacing: 1.2,
                  marginBottom: 8
                }}>
                PHONE NUMBER
              </div>
              <input
                value={phone}
                onChange={(e) => setPhone(format(e.target.value))}
                placeholder="(555) 555-5555"
                inputMode="tel"
                autoComplete="tel"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "16px 18px",
                  fontSize: 18,
                  fontFamily: t.sans,
                  background: t.card,
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius,
                  color: t.ink,
                  outline: "none",
                  letterSpacing: 0.2
                }}
              />
            </div>
            <Button
              t={t}
              onClick={goNext}
              disabled={phone.length < 14}
              style={{ width: "100%", padding: "16px 22px", fontSize: 16 }}>
              Send verification code
            </Button>
            <Row justify="center" gap={10}>
              <span
                style={{
                  fontFamily: t.mono,
                  fontSize: 10,
                  color: t.muted,
                  letterSpacing: 1
                }}>
                SECURE · ENCRYPTED · IRS-COMPLIANT
              </span>
            </Row>
          </Stack>
        </Stack>

        <div style={{ marginTop: 40 }}>
          <div
            style={{
              padding: "14px 16px",
              background: t.bgElev,
              borderRadius: t.radius,
              border: `1px solid ${t.borderSoft}`,
              fontSize: 13,
              color: t.inkSoft,
              textAlign: "center",
              lineHeight: 1.5
            }}>
            Need help? Text Antonio directly at<br />
            <span style={{ color: t.rust, fontWeight: 500 }}>
              (951) 555-0234
            </span>
          </div>
          <Footer t={t} />
        </div>
      </div>
    </Screen>
  );
}

/* ─── 2. OTP ─── */

export function ScreenOTP({ t }: { t: PortalTheme }) {
  const { phone, verifyPhone, goNext, goPrev } = useIntakeStore();
  const [digits, setDigits] = React.useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    ""
  ]);
  const [countdown, setCountdown] = React.useState(47);
  const [verifying, setVerifying] = React.useState(false);
  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  // Masked phone for display
  const masked = React.useMemo(() => {
    const d = phone.replace(/\D/g, "");
    if (d.length < 10) return phone || "(951) •••-•234";
    return `(${d.slice(0, 3)}) •••-•${d.slice(7)}`;
  }, [phone]);

  React.useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  const set = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length === 0) {
      const next = [...digits];
      next[i] = "";
      setDigits(next);
      return;
    }
    const next = [...digits];
    for (let k = 0; k < clean.length && i + k < 6; k++) {
      next[i + k] = clean[k];
    }
    setDigits(next);

    const nextIdx = Math.min(i + clean.length, 5);
    inputRefs.current[nextIdx]?.focus();
    if (nextIdx < 5) inputRefs.current[nextIdx]?.select?.();

    if (next.every((x) => x)) {
      setVerifying(true);
      inputRefs.current[5]?.blur();
      window.setTimeout(() => {
        verifyPhone();
        goNext();
      }, 1200);
    }
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        const next = [...digits];
        next[i - 1] = "";
        setDigits(next);
        inputRefs.current[i - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputRefs.current[i - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && i < 5) {
      inputRefs.current[i + 1]?.focus();
      e.preventDefault();
    }
  };

  return (
    <Screen t={t}>
      <div
        style={{
          padding: "24px 24px 40px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%"
        }}>
        <button
          onClick={goPrev}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: t.inkSoft,
            fontSize: 14,
            padding: 8,
            marginLeft: -8,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: t.sans
          }}>
          <svg width="8" height="13" viewBox="0 0 8 13" fill="none">
            <path
              d="M7 1L1 6.5L7 12"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          Back
        </button>

        <Stack gap={32} style={{ flex: 1, marginTop: 24 }}>
          <Stack gap={10}>
            <H1 t={t}>Enter verification code</H1>
            <Body t={t} size={15}>
              We sent a 6-digit code to{" "}
              <span
                style={{
                  fontFamily: t.mono,
                  color: t.ink,
                  whiteSpace: "nowrap"
                }}>
                {masked}
              </span>
            </Body>
          </Stack>

          <Row gap={8} justify="space-between">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                value={d}
                onChange={(e) => set(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                style={{
                  width: 48,
                  height: 62,
                  textAlign: "center",
                  fontSize: 26,
                  fontFamily: t.mono,
                  fontWeight: 500,
                  background: d ? t.tintAccent : t.card,
                  border: `1.5px solid ${d ? t.rust : t.border}`,
                  borderRadius: t.radius,
                  color: t.ink,
                  outline: "none",
                  transition: "all 0.15s",
                  caretColor: t.rust
                }}
              />
            ))}
          </Row>

          {verifying ? (
            <Row gap={10} justify="center">
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: `2px solid ${t.border}`,
                  borderTopColor: t.rust,
                  borderRadius: "50%",
                  animation: "portal-spin 0.9s linear infinite"
                }}
              />
              <Body t={t} size={14} muted>
                Verifying…
              </Body>
            </Row>
          ) : (
            <Row justify="center">
              <Body t={t} size={13} muted>
                Didn&apos;t get it?{" "}
                {countdown > 0 ? (
                  <span
                    style={{ fontFamily: t.mono, color: t.muted }}>
                    Resend in 0:{String(countdown).padStart(2, "0")}
                  </span>
                ) : (
                  <span
                    onClick={() => {
                      setCountdown(47);
                      setDigits(["", "", "", "", "", ""]);
                      inputRefs.current[0]?.focus();
                    }}
                    style={{ color: t.rust, cursor: "pointer", fontWeight: 500 }}>
                    Resend
                  </span>
                )}
              </Body>
            </Row>
          )}
        </Stack>

        <Footer t={t} />
      </div>
      <style>{`@keyframes portal-spin { to { transform: rotate(360deg); } }`}</style>
    </Screen>
  );
}
