"use client";

import * as React from "react";

import { useIntakeStore } from "@/lib/portal/intake-store";
import {
  AntonioNote,
  AvatarSlot,
  Body,
  BottomBar,
  Button,
  Eyebrow,
  FieldLabel,
  IntakeHeader,
  OptionRow,
  Row,
  Screen,
  Stack,
  TextField
} from "@/components/portal/primitives";
import type { AppointmentFormat } from "@/lib/portal/intake-types";
import { Glyph } from "./icons";

/* ─────────────────────── Engagement letter ─────────────────────── */

export function ScreenEngagement() {
  const { firstName, lastName, legal, signEngagement, goNext, goPrev } =
    useIntakeStore();
  const [typed, setTyped] = React.useState("");
  const [scrolledToEnd, setScrolledToEnd] = React.useState(false);

  const fullName = `${firstName} ${lastName}`.trim();
  const canSign =
    typed.trim().toLowerCase() === fullName.toLowerCase() &&
    scrolledToEnd &&
    !legal.engagement.signed;

  const onBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setScrolledToEnd(true);
    }
  };

  const handleSign = () => {
    signEngagement();
    goNext();
  };

  return (
    <Screen>
      <IntakeHeader label="Engagement letter" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-col gap-3 px-6 pt-5 pb-3">
          <Eyebrow color="forest">Document A of B</Eyebrow>
          <h1
            className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
            style={{
              fontVariationSettings: '"opsz" 36',
              fontSynthesis: "none"
            }}>
            Engagement letter
          </h1>
        </div>

        <div
          className="mx-6 mb-4 flex-1 overflow-y-auto rounded-[14px] border border-portal-border bg-portal-card px-5 py-4 text-[13px] leading-[1.6] text-portal-ink-soft"
          onScroll={onBodyScroll}>
          <p className="mb-3 font-medium text-portal-ink">
            Agreement between Vazant Consulting (&ldquo;Preparer&rdquo;) and{" "}
            {fullName || "you"} (&ldquo;Client&rdquo;)
          </p>
          <p className="mb-3">
            This engagement letter confirms the terms under which Antonio
            Vazquez, Enrolled Agent, will prepare Client&apos;s 2024 federal
            and state income tax returns and any reasonably required schedules.
          </p>
          <p className="mb-3">
            <strong className="text-portal-ink">Scope.</strong> Preparer will
            organize, prepare, and e-file the return using information supplied
            by Client. Preparer may ask follow-up questions and will flag any
            items that require additional substantiation.
          </p>
          <p className="mb-3">
            <strong className="text-portal-ink">Client responsibility.</strong>{" "}
            All information provided is complete and accurate to the best of
            Client&apos;s knowledge. Client will retain originals of source
            documents for the statutory records-retention period.
          </p>
          <p className="mb-3">
            <strong className="text-portal-ink">Fees.</strong> Fees are quoted
            on the Services screen and confirmed on invoice before filing. A
            $50 deposit is due to schedule the prep appointment.
          </p>
          <p className="mb-3">
            <strong className="text-portal-ink">Confidentiality.</strong>{" "}
            Preparer will not disclose Client information to any third party
            except as compelled by law or as consented to separately under
            IRC §7216.
          </p>
          <p className="mb-3">
            <strong className="text-portal-ink">Termination.</strong> Either
            party may terminate this engagement in writing. Preparer will
            refund any unearned portion of fees paid.
          </p>
          <p className="mb-3">
            <strong className="text-portal-ink">Dispute resolution.</strong>{" "}
            Any dispute arising from this engagement will first be addressed
            through good-faith discussion; unresolved disputes may be submitted
            to mediation in Los Angeles County, California.
          </p>
          <p className="mt-4 border-t border-portal-border-soft pt-3 text-[11.5px] text-portal-muted">
            Generated {new Date().toLocaleDateString()} · Vazant Consulting ·
            CA PTIN on file
          </p>
        </div>

        <div className="px-6 pb-4">
          {!scrolledToEnd ? (
            <div className="mb-3 rounded-[10px] border border-portal-border-soft bg-portal-bg-elev px-3 py-2 text-center text-[12px] text-portal-muted">
              Scroll to the end to continue
            </div>
          ) : null}
          <FieldLabel>Type your full legal name to sign</FieldLabel>
          <TextField
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={fullName || "Your name"}
            disabled={legal.engagement.signed || !scrolledToEnd}
          />
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={!canSign}
          onClick={handleSign}>
          {legal.engagement.signed ? "Signed" : "Sign & continue"}
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── §7216 consent ─────────────────────── */

export function ScreenConsent7216() {
  const { firstName, lastName, legal, signConsent7216, goNext, goPrev } =
    useIntakeStore();
  const [typed, setTyped] = React.useState("");
  const [scrolledToEnd, setScrolledToEnd] = React.useState(false);

  const fullName = `${firstName} ${lastName}`.trim();
  const canSign =
    typed.trim().toLowerCase() === fullName.toLowerCase() &&
    scrolledToEnd &&
    !legal.consent7216.signed;

  const onBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
      setScrolledToEnd(true);
    }
  };

  const handleSign = () => {
    signConsent7216();
    goNext();
  };

  return (
    <Screen>
      <IntakeHeader label="§7216 consent" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-col gap-3 px-6 pt-5 pb-3">
          <Eyebrow color="forest">Document B of B</Eyebrow>
          <h1
            className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
            style={{
              fontVariationSettings: '"opsz" 36',
              fontSynthesis: "none"
            }}>
            Use & disclosure consent
          </h1>
        </div>

        <div
          className="mx-6 mb-4 flex-1 overflow-y-auto rounded-[14px] border border-portal-border bg-portal-card px-5 py-4 text-[13px] leading-[1.6] text-portal-ink-soft"
          onScroll={onBodyScroll}>
          <p className="mb-3 font-medium text-portal-ink">
            Consent to use of tax return information — IRC §7216
          </p>
          <p className="mb-3">
            Federal law requires this consent form be provided to you. Unless
            authorized by law, Preparer cannot disclose your tax return
            information to third parties for purposes other than the
            preparation and filing of your tax return without your consent.
          </p>
          <p className="mb-3">
            <strong className="text-portal-ink">What I&apos;d like to use it for.</strong>{" "}
            I&apos;d like your permission to use the information on your 2024
            return to (a) suggest specific add-on services (bookkeeping,
            quarterly estimates, entity planning) that your situation indicates
            would benefit you, and (b) compare your return against prior years
            to catch year-over-year inconsistencies before filing.
          </p>
          <p className="mb-3">
            <strong className="text-portal-ink">What I will not do.</strong>{" "}
            I will not share, sell, or disclose your return information to
            anyone outside Vazant Consulting without your separate written
            consent.
          </p>
          <p className="mb-3">
            <strong className="text-portal-ink">Your rights.</strong> You can
            decline this consent without affecting my preparation of your
            return. The consent is effective for one year from the date
            signed.
          </p>
          <p className="mb-3">
            If you believe your return information has been disclosed or used
            improperly, you may contact the Treasury Inspector General for Tax
            Administration (TIGTA) toll-free at 1-800-366-4484 or by email at
            complaints@tigta.treas.gov.
          </p>
          <p className="mt-4 border-t border-portal-border-soft pt-3 text-[11.5px] text-portal-muted">
            Required by IRC §7216 · Separate signature, separate timestamp
          </p>
        </div>

        <div className="px-6 pb-4">
          {!scrolledToEnd ? (
            <div className="mb-3 rounded-[10px] border border-portal-border-soft bg-portal-bg-elev px-3 py-2 text-center text-[12px] text-portal-muted">
              Scroll to the end to continue
            </div>
          ) : null}
          <FieldLabel>Type your full legal name to sign</FieldLabel>
          <TextField
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={fullName || "Your name"}
            disabled={legal.consent7216.signed || !scrolledToEnd}
          />
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={!canSign}
          onClick={handleSign}>
          {legal.consent7216.signed ? "Signed" : "Sign & continue"}
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Schedule appointment ─────────────────────── */

const MOCK_SLOTS = [
  { iso: "2026-04-22T10:00:00-07:00", label: "Wed Apr 22 · 10:00 AM" },
  { iso: "2026-04-22T14:00:00-07:00", label: "Wed Apr 22 · 2:00 PM" },
  { iso: "2026-04-23T09:00:00-07:00", label: "Thu Apr 23 · 9:00 AM" },
  { iso: "2026-04-23T13:00:00-07:00", label: "Thu Apr 23 · 1:00 PM" },
  { iso: "2026-04-24T11:00:00-07:00", label: "Fri Apr 24 · 11:00 AM" },
  { iso: "2026-04-24T15:00:00-07:00", label: "Fri Apr 24 · 3:00 PM" }
];

const FORMAT_OPTIONS: {
  id: AppointmentFormat;
  title: string;
  sub: string;
}[] = [
  { id: "phone", title: "Phone call", sub: "Easiest — I'll call you" },
  { id: "video", title: "Video call", sub: "Google Meet link sent day-of" },
  { id: "inperson", title: "In-person", sub: "Claremont office — 2200 Foothill Blvd" }
];

export function ScreenScheduleAppt() {
  const { appointment, patch, goNext, goPrev } = useIntakeStore();

  const setFormat = (format: AppointmentFormat) =>
    patch({ appointment: { ...appointment, format } });
  const setSlot = (iso: string) =>
    patch({ appointment: { ...appointment, slotIso: iso } });

  const canContinue = appointment.format !== null && appointment.slotIso !== null;

  return (
    <Screen>
      <IntakeHeader label="Schedule" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-6 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Let&apos;s get on the calendar.
            </h1>
            <Body size={14}>
              We&apos;ll walk through your return together before I file.
              Takes about 30 minutes.
            </Body>
          </Stack>

          <div className="mt-7">
            <FieldLabel>Format</FieldLabel>
            <Stack gap={8}>
              {FORMAT_OPTIONS.map((o) => (
                <OptionRow
                  key={o.id}
                  selected={appointment.format === o.id}
                  onClick={() => setFormat(o.id)}
                  title={o.title}
                  sub={o.sub}
                />
              ))}
            </Stack>
          </div>

          <div className="mt-6">
            <FieldLabel>Pick a time</FieldLabel>
            <Stack gap={6}>
              {MOCK_SLOTS.map((s) => (
                <button
                  key={s.iso}
                  type="button"
                  onClick={() => setSlot(s.iso)}
                  className={[
                    "flex w-full items-center justify-between rounded-[12px] border px-4 py-3 text-left transition-[border-color,background-color] duration-150",
                    appointment.slotIso === s.iso
                      ? "border-forest bg-forest-tint"
                      : "border-portal-border bg-portal-card hover:bg-portal-bg-elev"
                  ].join(" ")}>
                  <span className="text-[14px] font-medium text-portal-ink tabular-nums">
                    {s.label}
                  </span>
                  {appointment.slotIso === s.iso ? (
                    <span className="grid size-5 place-items-center rounded-full bg-forest text-white">
                      <Glyph name="check" className="size-3.5" />
                    </span>
                  ) : (
                    <Glyph name="chevronRight" className="size-3.5 text-portal-muted" />
                  )}
                </button>
              ))}
            </Stack>
          </div>

          <AntonioNote>
            If none of these work I&apos;ll text you other options after you
            finish intake. Don&apos;t let scheduling be the thing that stops
            you.
          </AntonioNote>
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={!canContinue}
          onClick={goNext}>
          Continue
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Deposit ─────────────────────── */

export function ScreenDeposit() {
  const { deposit, markDepositPaid, goNext, goPrev } = useIntakeStore();
  const [processing, setProcessing] = React.useState(false);

  const pay = () => {
    setProcessing(true);
    window.setTimeout(() => {
      markDepositPaid(50);
      goNext();
    }, 1400);
  };

  return (
    <Screen>
      <IntakeHeader label="Deposit" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-6 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              One last thing.
            </h1>
            <Body size={14}>
              A $50 deposit secures your appointment and is credited toward
              your final fee.
            </Body>
          </Stack>

          {/* Summary card */}
          <div className="mt-7 rounded-[16px] border border-portal-border bg-portal-card px-5 py-5">
            <Row justify="space-between" align="center">
              <div>
                <Eyebrow color="forest">Deposit</Eyebrow>
                <div
                  className="mt-1 font-serif text-[36px] font-medium leading-none text-portal-ink tabular-nums"
                  style={{
                    fontVariationSettings: '"opsz" 48',
                    fontSynthesis: "none"
                  }}>
                  $50
                </div>
              </div>
              <span className="grid size-12 place-items-center rounded-full bg-forest-tint text-forest">
                <Glyph name="wallet" className="size-6" />
              </span>
            </Row>
            <div className="mt-4 border-t border-portal-border-soft pt-4 text-[12.5px] leading-[1.5] text-portal-muted">
              Charged via Square. Credited in full toward your return fee.
              Refundable if you change your mind before our first call.
            </div>
          </div>

          <AntonioNote>
            The deposit filters for seriousness on both sides — it keeps my
            calendar clear for clients who are ready to work.
          </AntonioNote>
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button
          variant="primary"
          fullWidth
          disabled={processing || deposit.paid}
          onClick={pay}>
          {deposit.paid
            ? "Paid"
            : processing
              ? "Processing…"
              : "Pay $50 deposit"}
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Done ─────────────────────── */

export function ScreenDone() {
  const { firstName, appointment, reset } = useIntakeStore();

  const slotLabel = React.useMemo(() => {
    if (!appointment.slotIso) return "";
    const d = new Date(appointment.slotIso);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }, [appointment.slotIso]);

  return (
    <Screen>
      <div className="flex min-h-full flex-col px-6 pt-14 pb-10">
        <Stack gap={28} className="flex-1">
          <div className="flex justify-center">
            <AvatarSlot size={84} />
          </div>

          <Stack gap={10} className="text-center">
            <h1
              className="font-serif text-[32px] font-medium leading-[1.08] tracking-[-0.02em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 48',
                fontSynthesis: "none"
              }}>
              {firstName ? `Thank you, ${firstName}.` : "Thank you."}
            </h1>
            <Body
              size={15.5}
              className="mx-auto max-w-[320px] text-balance leading-[1.5]">
              I&apos;ve got everything I need to start. Here&apos;s what
              happens next.
            </Body>
          </Stack>

          <Stack gap={12} className="mt-2">
            <TimelineStep
              step="1"
              title="You get a confirmation text"
              sub="In the next minute or two"
              done
            />
            <TimelineStep
              step="2"
              title={slotLabel ? `We meet ${slotLabel}` : "We meet on your scheduled slot"}
              sub="Phone, video, or in-person — your call"
            />
            <TimelineStep
              step="3"
              title="I prepare your return"
              sub="You'll get notified for review when it's ready"
            />
            <TimelineStep
              step="4"
              title="You review and sign Form 8879"
              sub="Then I e-file immediately"
            />
          </Stack>
        </Stack>

        <Stack gap={12} className="mt-6">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => {
              // Landing on post-login portal — transition handled by
              // PortalApp via isIntakeComplete().
              useIntakeStore.setState({ currentStep: "done" });
              // Tiny nudge: trigger a re-render of portal shell so the
              // home screen mounts. PortalApp reads isIntakeComplete().
              window.setTimeout(
                () => useIntakeStore.setState({ currentStep: "done" }),
                50
              );
            }}>
            Go to my portal
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                if (confirm("Start over? This clears all your answers.")) {
                  reset();
                }
              }}
              className="text-[12px] text-portal-muted transition-colors hover:text-portal-ink-soft">
              Start over
            </button>
          </div>
        </Stack>
      </div>
    </Screen>
  );
}

function TimelineStep({
  step,
  title,
  sub,
  done
}: {
  step: string;
  title: string;
  sub: string;
  done?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={[
          "grid size-7 flex-shrink-0 place-items-center rounded-full text-[12px] font-semibold",
          done
            ? "bg-forest text-white"
            : "border border-portal-border bg-portal-card text-portal-ink-soft"
        ].join(" ")}>
        {done ? <Glyph name="check" className="size-4" /> : step}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-[14px] font-medium text-portal-ink">{title}</span>
        <span className="text-[12.5px] text-portal-muted">{sub}</span>
      </div>
    </div>
  );
}
