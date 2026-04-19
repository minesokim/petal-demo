"use client";

import * as React from "react";
import { useIntakeStore } from "@/lib/portal/intake-store";
import {
  AvatarSlot,
  Body,
  Button,
  Eyebrow,
  Row,
  Screen,
  Stack
} from "@/components/portal/primitives";
import { Glyph } from "@/components/portal/screens/icons";
import type { PortalTab } from "./tab-bar";

/**
 * Post-login portal home — client dashboard.
 *
 * Per PRD §5.7: time-aware greeting, primary "next step" card,
 * action stack (pay remaining / sign 8879 / schedule), upcoming
 * meeting, return-progress stepper, Antonio's message if any.
 * No dollar amount for refund until filing accepted.
 */

export function ScreenHome({ onTab }: { onTab: (t: PortalTab) => void }) {
  const {
    firstName,
    appointment,
    legal,
    deposit
  } = useIntakeStore();

  const slotLabel = React.useMemo(() => {
    if (!appointment.slotIso) return null;
    return new Date(appointment.slotIso).toLocaleString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }, [appointment.slotIso]);

  const greeting = getGreeting();

  // Status markers for the 7-step return progress
  const steps = [
    { label: "Intake complete", done: true },
    { label: "Documents uploaded", done: true },
    { label: "Antonio reviews", done: false, active: true },
    { label: "Return prepared", done: false },
    { label: "Your review", done: false },
    { label: "Sign Form 8879", done: false },
    { label: "E-filed", done: false }
  ];

  return (
    <Screen>
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-8 pb-24">
          {/* Greeting */}
          <Stack gap={4}>
            <Eyebrow color="forest">{greeting}</Eyebrow>
            <h1
              className="font-serif text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 40',
                fontSynthesis: "none"
              }}>
              {firstName ? firstName : "Welcome"}
            </h1>
          </Stack>

          {/* Primary "next step" card */}
          <div className="mt-6 rounded-[18px] border border-portal-border bg-portal-card px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <Eyebrow color="forest">What happens next</Eyebrow>
            <div
              className="mt-2 font-serif text-[22px] font-medium leading-[1.25] tracking-[-0.015em] text-portal-ink text-balance"
              style={{
                fontVariationSettings: '"opsz" 32',
                fontSynthesis: "none"
              }}>
              Antonio is reviewing your return.
            </div>
            <Body size={13.5} className="mt-2 text-balance leading-[1.5]">
              You&apos;ll get a notification when it&apos;s ready for you to
              review. Estimated processing time: 3 to 5 business days.
            </Body>
          </div>

          {/* Action stack */}
          <Stack gap={10} className="mt-6">
            <ActionCard
              icon={<Glyph name="wallet" className="size-5" />}
              title="Pay remaining balance"
              sub={deposit.paid ? "Deposit received · $0 due now" : "$50 deposit pending"}
              status={deposit.paid ? "done" : "pending"}
              cta={deposit.paid ? undefined : "Pay now"}
              onClick={() => {}}
            />
            <ActionCard
              icon={<Glyph name="edit" className="size-5" />}
              title="Sign Form 8879"
              sub={
                legal.engagement.signed && legal.consent7216.signed
                  ? "Ready once return is prepared"
                  : "Complete intake first"
              }
              status="locked"
              onClick={() => onTab("signatures")}
            />
            <ActionCard
              icon={<Glyph name="calendar" className="size-5" />}
              title={slotLabel ? "Your appointment" : "Schedule an appointment"}
              sub={slotLabel ?? "No time chosen yet"}
              status={slotLabel ? "done" : "pending"}
              cta={slotLabel ? "Reschedule" : "Pick a time"}
              onClick={() => {}}
            />
          </Stack>

          {/* Message from Antonio */}
          <div className="mt-6 rounded-[16px] border border-portal-border bg-portal-bg-elev px-4 py-4">
            <Row gap={12} align="start">
              <AvatarSlot size={38} />
              <div className="min-w-0 flex-1">
                <Row gap={6} align="baseline" className="flex-wrap">
                  <span className="text-[13px] font-medium text-portal-ink">
                    Antonio Vazquez
                  </span>
                  <span className="text-[11px] text-portal-muted">
                    · 12 min ago
                  </span>
                </Row>
                <p
                  className="mt-1 text-[14.5px] leading-[1.5] text-portal-ink-soft italic tracking-[-0.003em]"
                  style={{
                    fontFamily: "var(--font-fraunces), Georgia, serif",
                    fontVariationSettings: '"opsz" 18',
                    fontSynthesis: "none"
                  }}>
                  &ldquo;Got your documents — looks complete. I&apos;ll have a
                  draft ready by end of week. Nothing for you to do right now
                  except wait.&rdquo;
                </p>
              </div>
            </Row>
          </div>

          {/* Progress stepper */}
          <div className="mt-6">
            <Eyebrow>Return progress</Eyebrow>
            <ol className="mt-3 space-y-2.5">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className={[
                      "mt-0.5 grid size-6 flex-shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors",
                      s.done
                        ? "bg-forest text-white"
                        : s.active
                          ? "border-2 border-forest bg-portal-card text-forest"
                          : "border border-portal-border bg-portal-card text-portal-muted"
                    ].join(" ")}>
                    {s.done ? (
                      <Glyph name="check" className="size-3.5" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={[
                      "text-[14px] leading-[1.45]",
                      s.done || s.active
                        ? "font-medium text-portal-ink"
                        : "text-portal-muted"
                    ].join(" ")}>
                    {s.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Subtle upsell */}
          <div className="mt-7 rounded-[14px] border border-dashed border-portal-border-soft px-4 py-4">
            <Eyebrow>Other ways Antonio can help</Eyebrow>
            <Stack gap={6} className="mt-2.5">
              <UpsellRow label="Bookkeeping" sub="Monthly clean books" />
              <UpsellRow label="Quarterly estimates" sub="Never surprised at filing" />
              <UpsellRow label="IRS representation" sub="If a notice shows up" />
            </Stack>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Late night";
}

function ActionCard({
  icon,
  title,
  sub,
  status,
  cta,
  onClick
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  status: "done" | "pending" | "locked";
  cta?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={[
        "flex items-center gap-3.5 rounded-[14px] border px-4 py-3.5 transition-colors",
        status === "locked"
          ? "border-portal-border-soft bg-portal-bg-elev"
          : "border-portal-border bg-portal-card"
      ].join(" ")}>
      <span
        className={[
          "grid size-10 flex-shrink-0 place-items-center rounded-xl",
          status === "done"
            ? "bg-forest-tint text-forest"
            : status === "locked"
              ? "bg-portal-border-soft text-portal-muted"
              : "bg-portal-bg-elev text-portal-ink-soft"
        ].join(" ")}>
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <div
          className={[
            "text-[14px] font-medium",
            status === "locked" ? "text-portal-muted" : "text-portal-ink"
          ].join(" ")}>
          {title}
        </div>
        <div className="text-[12px] text-portal-muted">{sub}</div>
      </div>
      {cta ? (
        <Button variant="secondary" size="sm" onClick={onClick}>
          {cta}
        </Button>
      ) : status === "done" ? (
        <span className="grid size-6 place-items-center rounded-full bg-forest text-white">
          <Glyph name="check" className="size-3.5" />
        </span>
      ) : status === "locked" ? (
        <Glyph name="lock" className="size-4 text-portal-muted" />
      ) : null}
    </div>
  );
}

function UpsellRow({ label, sub }: { label: string; sub: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 rounded-[10px] bg-portal-card px-3 py-2 text-left transition-colors hover:bg-portal-bg-elev">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-portal-ink">{label}</div>
        <div className="text-[11.5px] text-portal-muted">{sub}</div>
      </div>
      <Glyph name="chevronRight" className="size-3.5 text-portal-muted" />
    </button>
  );
}
