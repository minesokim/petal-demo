"use client";

import * as React from "react";

import { useIntakeStore } from "@/lib/portal/intake-store";
import {
  AvatarSlot,
  BackButton,
  Body,
  Button,
  Eyebrow,
  FieldLabel,
  Footer,
  H1,
  Row,
  Screen,
  Stack
} from "@/components/portal/primitives";

/**
 * Auth screens — translated from design-references/client-portal/
 * components/intake-screens.jsx (Login + OTP + Welcome).
 *
 * Login captures a phone number, OTP verifies with a 6-digit code
 * (auto-focuses, supports paste, auto-submits when full), Welcome
 * introduces Antonio with a portrait tile + trust pills and launches
 * the intake. The tutorial overlay is handled in ./tutorial.tsx
 * because it's long enough to warrant its own module.
 */

/* ─────────────────────── Login ─────────────────────── */

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function ScreenLogin() {
  const { phone, setPhone, goNext } = useIntakeStore();
  const canContinue = phone.replace(/\D/g, "").length === 10;

  return (
    <Screen>
      <div className="flex min-h-full flex-col px-6 pt-[60px] pb-10">
        <Stack gap={28} className="flex-1">
          <AvatarSlot />

          <Stack gap={10}>
            <H1>
              Welcome to
              <br />
              <span className="italic">Vazant Consulting</span>
            </H1>
            <Body size={16}>
              Antonio will personally handle your return. Enter your phone
              number to get started.
            </Body>
          </Stack>

          <Stack gap={14}>
            <div>
              <FieldLabel>Phone number</FieldLabel>
              <input
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(555) 555-5555"
                inputMode="tel"
                autoComplete="tel"
                className="w-full rounded-[14px] border border-portal-border bg-portal-card px-[18px] py-4 text-[18px] tracking-[0.02em] text-portal-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-portal-muted focus:border-forest focus:shadow-[0_0_0_3px_var(--portal-forest-tint)]"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canContinue}
              onClick={goNext}>
              Send verification code
            </Button>

            <Row justify="center">
              <Eyebrow>Secure · Encrypted · IRS-compliant</Eyebrow>
            </Row>
          </Stack>
        </Stack>

        <div className="mt-10">
          <div className="rounded-[14px] border border-portal-border-soft bg-portal-bg-elev px-4 py-[14px] text-center text-[13px] leading-[1.5] text-portal-ink-soft">
            Need help? Text Antonio directly at
            <br />
            <span className="font-medium text-forest">(951) 555-0234</span>
          </div>
          <Footer />
        </div>
      </div>
    </Screen>
  );
}

/* ─────────────────────── OTP ─────────────────────── */

export function ScreenOtp() {
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
  const inputs = React.useRef<Array<HTMLInputElement | null>>([]);

  // Autofocus first input
  React.useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  // Resend countdown
  React.useEffect(() => {
    if (countdown <= 0) return;
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  const masked = React.useMemo(() => {
    const d = phone.replace(/\D/g, "");
    if (d.length < 4) return phone;
    return `(${d.slice(0, 3)}) •••-${d.slice(6, 10)}`;
  }, [phone]);

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
    inputs.current[nextIdx]?.focus();
    if (nextIdx < 5) inputs.current[nextIdx]?.select();

    if (next.every((x) => x)) {
      setVerifying(true);
      inputs.current[5]?.blur();
      // Simulate server verify → advance
      window.setTimeout(() => {
        verifyPhone();
        goNext();
      }, 1100);
    }
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        const next = [...digits];
        next[i - 1] = "";
        setDigits(next);
        inputs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      inputs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      e.preventDefault();
      inputs.current[i + 1]?.focus();
    }
  };

  return (
    <Screen>
      <div className="flex min-h-full flex-col px-6 pt-6 pb-10">
        <BackButton onClick={goPrev} />

        <Stack gap={32} className="mt-6 flex-1">
          <Stack gap={10}>
            <H1>Enter verification code</H1>
            <Body size={15}>
              We sent a 6-digit code to{" "}
              <span className="font-medium whitespace-nowrap text-portal-ink">
                {masked}
              </span>
            </Body>
          </Stack>

          <Row gap={8} justify="space-between">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                value={d}
                onChange={(e) => set(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className={[
                  "h-[58px] w-[46px] rounded-[12px] border bg-portal-card text-center text-[22px] font-medium text-portal-ink outline-none transition-[border-color,box-shadow] duration-150",
                  d
                    ? "border-forest shadow-[0_0_0_2px_var(--portal-forest-tint)]"
                    : "border-portal-border",
                  "focus:border-forest focus:shadow-[0_0_0_3px_var(--portal-forest-tint)]"
                ].join(" ")}
              />
            ))}
          </Row>

          <Stack gap={10}>
            {verifying ? (
              <div className="text-center text-[13px] text-forest-ink">
                Verifying…
              </div>
            ) : countdown > 0 ? (
              <div className="text-center text-[13px] text-portal-muted">
                Resend in{" "}
                <span className="tabular-nums">
                  {String(Math.floor(countdown / 60)).padStart(1, "0")}:
                  {String(countdown % 60).padStart(2, "0")}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCountdown(47);
                  setDigits(["", "", "", "", "", ""]);
                  inputs.current[0]?.focus();
                }}
                className="text-center text-[13px] font-medium text-forest transition-colors hover:text-forest-2">
                Resend code
              </button>
            )}
            <Row justify="center">
              <Eyebrow>Did not receive it? Contact Antonio directly.</Eyebrow>
            </Row>
          </Stack>
        </Stack>
      </div>
    </Screen>
  );
}

/* ─────────────────────── Welcome ─────────────────────── */

function TrustPill({
  icon,
  children
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-portal-border-soft bg-portal-bg-elev px-[11px] py-[5px] text-[11px] text-portal-ink-soft">
      {icon}
      {children}
    </span>
  );
}

function VideoPlaceholder() {
  return (
    <div
      className="relative w-full cursor-pointer overflow-hidden rounded-[14px] shadow-[0_8px_24px_rgba(12,31,21,0.18)]"
      style={{
        aspectRatio: "16/9",
        background:
          "linear-gradient(135deg, #1a3a26 0%, #0c1f15 70%, #050a07 100%)"
      }}>
      {/* Leafy highlight */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 25% 20%, rgba(120,180,140,0.12), transparent 55%)"
        }}
      />
      {/* Grain */}
      <div
        aria-hidden
        className="absolute inset-0 mix-blend-overlay"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 3px)"
        }}
      />
      {/* REC tag */}
      <div className="absolute top-3.5 left-4 flex items-center gap-2">
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-[#d94545] shadow-[0_0_0_3px_rgba(217,69,69,0.22)]"
        />
        <span
          className="text-[9.5px] font-medium uppercase tracking-[0.12em] text-white/75">
          REC · Antonio
        </span>
      </div>
      {/* Play */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5">
        <div className="grid size-[68px] place-items-center rounded-full border border-white/30 bg-white/15 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-md">
          <svg width="22" height="24" viewBox="0 0 22 24" className="ml-1">
            <path d="M2 2 L20 12 L2 22 Z" fill="#fff" />
          </svg>
        </div>
        <div className="text-center">
          <div
            className="mb-1 text-[17px] italic text-white tracking-[-0.01em]"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontVariationSettings: '"opsz" 18',
              fontSynthesis: "none"
            }}>
            A message from Antonio
          </div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-white/60">
            1:12 · Tap to play
          </div>
        </div>
      </div>
      {/* Scrubber stub */}
      <div className="absolute right-3.5 bottom-2.5 left-3.5 flex items-center gap-2">
        <span className="text-[9px] tracking-wider text-white/55">0:00</span>
        <span
          aria-hidden
          className="h-0.5 flex-1 rounded-full bg-white/20"
        />
        <span className="text-[9px] tracking-wider text-white/55">1:12</span>
      </div>
    </div>
  );
}

export function ScreenWelcome() {
  const { goNext } = useIntakeStore();
  const icProps = {
    width: 11,
    height: 11,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  return (
    <Screen>
      <div className="flex min-h-full flex-col px-6 pt-9 pb-7">
        <Stack gap={26} className="flex-1">
          <VideoPlaceholder />

          <Stack gap={14} className="text-center">
            <h2
              className="text-[26px] font-normal leading-[1.15] tracking-[-0.02em] text-portal-ink"
              style={{
                fontFamily: "var(--font-fraunces), Georgia, serif",
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Welcome to
              <br />
              <span className="italic">Vazant Consulting</span>
            </h2>
            <Body size={14.5} className="mx-auto max-w-[310px]">
              I&apos;m Antonio Vazquez, Enrolled Agent. Let&apos;s get your
              taxes handled. Answer a few questions — takes about 10 minutes.
            </Body>
          </Stack>

          <Row gap={6} justify="center" className="flex-wrap text-forest">
            <TrustPill
              icon={
                <svg {...icProps} viewBox="0 0 11 11">
                  <rect x="2" y="4.5" width="7" height="5" rx="0.8" />
                  <path d="M3.5 4.5V3a2 2 0 014 0v1.5" />
                </svg>
              }>
              AES-256 encrypted
            </TrustPill>
            <TrustPill
              icon={
                <svg {...icProps} viewBox="0 0 11 11">
                  <path d="M5.5 1l3 1.5v2.5c0 2-1.3 3.8-3 4.5-1.7-.7-3-2.5-3-4.5V2.5z" />
                  <path d="M4 5.5l1.2 1.2L7.5 4.2" />
                </svg>
              }>
              Enrolled Agent
            </TrustPill>
            <TrustPill
              icon={
                <svg {...icProps} viewBox="0 0 11 11">
                  <circle cx="5.5" cy="5.5" r="4" />
                  <path d="M5.5 3.5v2l1.5 1" />
                </svg>
              }>
              ~10 minutes
            </TrustPill>
          </Row>
        </Stack>

        <Stack gap={14} className="mt-7">
          <Button variant="primary" size="lg" fullWidth onClick={goNext}>
            Let&apos;s get started
          </Button>
          <Body
            size={11.5}
            className="mx-auto max-w-[320px] text-center text-portal-muted leading-[1.5]">
            We&apos;ll ask about your filing status, income sources, and
            dependents. Then you&apos;ll upload your documents and sign your
            engagement letter.
          </Body>
          <div className="pt-1 text-center">
            <Eyebrow>Your information is never shared or sold</Eyebrow>
          </div>
        </Stack>
      </div>
    </Screen>
  );
}
