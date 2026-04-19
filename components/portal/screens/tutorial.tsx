"use client";

import * as React from "react";
import { useIntakeStore } from "@/lib/portal/intake-store";
import {
  Body,
  Button,
  Eyebrow,
  H1,
  Row,
  Screen,
  Stack
} from "@/components/portal/primitives";

/**
 * Tutorial overlay — a short 3-slide orientation shown once per
 * client (gated by `tutorialSeen` in the store). Each slide is a
 * glyph + title + body. The user can skip at any time.
 *
 * Condensed from design-references/client-portal/components/
 * tutorial.jsx (308 lines of SVG-heavy orientation) into a
 * restrained three-card version that matches the editorial tone —
 * verbose tutorials tend to get skipped anyway.
 */

type Slide = {
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  art: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "01 · How this works",
    title: (
      <>
        A conversation,
        <br />
        <span className="italic">not a form</span>
      </>
    ),
    body: "Answer the questions the way you'd talk to me in my office. We'll skip anything that doesn't apply to your situation.",
    art: <ArtConversation />
  },
  {
    eyebrow: "02 · Your documents",
    title: (
      <>
        Snap a photo.
        <br />
        <span className="italic">We handle the rest.</span>
      </>
    ),
    body: "Upload from your phone, email, or desktop. Docket classifies each document and extracts the fields automatically.",
    art: <ArtDocuments />
  },
  {
    eyebrow: "03 · Finish at your pace",
    title: (
      <>
        Pause. Resume.
        <br />
        <span className="italic">No timer.</span>
      </>
    ),
    body: "Your progress is saved on every screen. Come back when you have the information you need — your answers will be waiting.",
    art: <ArtPace />
  }
];

export function ScreenTutorial() {
  const { markTutorialSeen, goNext } = useIntakeStore();
  const [idx, setIdx] = React.useState(0);
  const slide = SLIDES[idx];
  const last = idx === SLIDES.length - 1;

  const advance = () => {
    if (last) {
      markTutorialSeen();
      goNext();
    } else {
      setIdx(idx + 1);
    }
  };

  const skip = () => {
    markTutorialSeen();
    goNext();
  };

  return (
    <Screen>
      <div className="flex min-h-full flex-col px-6 pt-7 pb-8">
        <Row justify="space-between" className="mb-6">
          <Eyebrow>{slide.eyebrow}</Eyebrow>
          <button
            type="button"
            onClick={skip}
            className="text-[13px] text-portal-muted transition-colors hover:text-portal-ink-soft">
            Skip
          </button>
        </Row>

        <Stack gap={24} className="flex-1">
          <div className="flex h-[220px] items-center justify-center">
            {slide.art}
          </div>
          <Stack gap={10}>
            <H1>{slide.title}</H1>
            <Body size={15.5} className="max-w-[340px] text-balance">
              {slide.body}
            </Body>
          </Stack>
        </Stack>

        <Stack gap={14} className="mt-6">
          <Row gap={6} justify="center">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={[
                  "h-1 rounded-full transition-[width,background-color] duration-200",
                  i === idx
                    ? "w-8 bg-forest"
                    : "w-1.5 bg-portal-border"
                ].join(" ")}
              />
            ))}
          </Row>
          <Button variant="primary" size="lg" fullWidth onClick={advance}>
            {last ? "Start intake" : "Continue"}
          </Button>
        </Stack>
      </div>
    </Screen>
  );
}

/* ─────────────────────── Slide illustrations ─────────────────────── */
/* Minimalist forest-accented linework. No photos, no emoji.        */

function ArtConversation() {
  return (
    <svg width="200" height="160" viewBox="0 0 200 160" fill="none" aria-hidden>
      {/* Left bubble (client) */}
      <rect
        x="14"
        y="36"
        width="112"
        height="48"
        rx="14"
        className="fill-portal-card"
        stroke="var(--portal-border)"
        strokeWidth="1.2"
      />
      <line
        x1="28"
        y1="52"
        x2="100"
        y2="52"
        stroke="var(--portal-ink-soft)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
      <line
        x1="28"
        y1="64"
        x2="80"
        y2="64"
        stroke="var(--portal-ink-soft)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Right bubble (Antonio) */}
      <rect
        x="74"
        y="88"
        width="112"
        height="48"
        rx="14"
        fill="var(--portal-forest)"
      />
      <line
        x1="90"
        y1="104"
        x2="168"
        y2="104"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      <line
        x1="90"
        y1="116"
        x2="150"
        y2="116"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

function ArtDocuments() {
  return (
    <svg width="200" height="160" viewBox="0 0 200 160" fill="none" aria-hidden>
      {/* Phone */}
      <rect
        x="36"
        y="18"
        width="60"
        height="120"
        rx="10"
        className="fill-portal-card"
        stroke="var(--portal-border)"
        strokeWidth="1.4"
      />
      <rect
        x="44"
        y="30"
        width="44"
        height="72"
        rx="3"
        fill="var(--portal-bg-elev)"
      />
      <circle cx="66" cy="66" r="12" stroke="var(--portal-forest)" strokeWidth="1.5" />
      <circle cx="66" cy="66" r="5" fill="var(--portal-forest)" />
      <rect x="52" y="112" width="28" height="4" rx="2" fill="var(--portal-border)" />
      {/* Arrow to doc */}
      <path
        d="M104 78 L134 78"
        stroke="var(--portal-forest)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M128 72 L134 78 L128 84"
        stroke="var(--portal-forest)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Parsed doc card */}
      <rect
        x="138"
        y="40"
        width="52"
        height="76"
        rx="8"
        className="fill-portal-card"
        stroke="var(--portal-border)"
        strokeWidth="1.2"
      />
      <rect x="146" y="50" width="20" height="4" rx="2" fill="var(--portal-forest)" />
      <line x1="146" y1="64" x2="182" y2="64" stroke="var(--portal-ink-soft)" strokeWidth="1.2" opacity="0.45" strokeLinecap="round" />
      <line x1="146" y1="74" x2="174" y2="74" stroke="var(--portal-ink-soft)" strokeWidth="1.2" opacity="0.45" strokeLinecap="round" />
      <line x1="146" y1="84" x2="180" y2="84" stroke="var(--portal-ink-soft)" strokeWidth="1.2" opacity="0.45" strokeLinecap="round" />
      <circle cx="150" cy="102" r="3" fill="var(--portal-forest)" />
      <line x1="158" y1="102" x2="180" y2="102" stroke="var(--portal-ink-soft)" strokeWidth="1.2" opacity="0.7" strokeLinecap="round" />
    </svg>
  );
}

function ArtPace() {
  return (
    <svg width="200" height="160" viewBox="0 0 200 160" fill="none" aria-hidden>
      {/* Progress ring */}
      <circle cx="100" cy="80" r="46" stroke="var(--portal-border)" strokeWidth="2" />
      <circle
        cx="100"
        cy="80"
        r="46"
        stroke="var(--portal-forest)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="289"
        strokeDashoffset="96"
        transform="rotate(-90 100 80)"
      />
      {/* Pause glyph */}
      <rect x="90" y="70" width="6" height="22" rx="1" fill="var(--portal-forest)" />
      <rect x="104" y="70" width="6" height="22" rx="1" fill="var(--portal-forest)" />
      {/* Dots for persistence */}
      <circle cx="44" cy="80" r="3" fill="var(--portal-border)" />
      <circle cx="156" cy="80" r="3" fill="var(--portal-border)" />
    </svg>
  );
}
