"use client";

import * as React from "react";

import { useIntakeStore } from "@/lib/portal/intake-store";
import {
  AntonioNote,
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

/* ─────────────────────── Step 8 — Tax questions ─────────────────────── */

export function ScreenTaxQuestions() {
  const { taxQuestions, patch, goNext, goPrev } = useIntakeStore();

  const set = <K extends keyof typeof taxQuestions>(
    key: K,
    value: (typeof taxQuestions)[K]
  ) => patch({ taxQuestions: { ...taxQuestions, [key]: value } });

  const canContinue =
    taxQuestions.digitalAssets !== null &&
    taxQuestions.foreignAccounts !== null &&
    taxQuestions.estimatedPayments !== null &&
    taxQuestions.healthCoverage !== null;

  return (
    <Screen>
      <IntakeHeader step={8} label="Tax questions" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              A few IRS questions.
            </h1>
            <Body size={14}>
              Required on every return — just answer honestly.
            </Body>
          </Stack>

          <Stack gap={24} className="mt-7">
            <div>
              <FieldLabel>Did you buy, sell, or receive digital assets?</FieldLabel>
              <p className="mb-2.5 text-[12px] text-portal-muted">
                Includes crypto, NFTs, stablecoins, airdrops, staking rewards.
              </p>
              <Row gap={8}>
                <YesNo
                  value={taxQuestions.digitalAssets === true}
                  onClick={() => set("digitalAssets", true)}>
                  Yes
                </YesNo>
                <YesNo
                  value={taxQuestions.digitalAssets === false}
                  onClick={() => set("digitalAssets", false)}>
                  No
                </YesNo>
              </Row>
            </div>

            <div>
              <FieldLabel>Did you have foreign financial accounts over $10K?</FieldLabel>
              <p className="mb-2.5 text-[12px] text-portal-muted">
                Bank, brokerage, or crypto accounts outside the US.
              </p>
              <Row gap={8}>
                <YesNo
                  value={taxQuestions.foreignAccounts === true}
                  onClick={() => set("foreignAccounts", true)}>
                  Yes
                </YesNo>
                <YesNo
                  value={taxQuestions.foreignAccounts === false}
                  onClick={() => set("foreignAccounts", false)}>
                  No
                </YesNo>
              </Row>
            </div>

            <div>
              <FieldLabel>Did you make estimated tax payments during 2024?</FieldLabel>
              <Row gap={8}>
                <YesNo
                  value={taxQuestions.estimatedPayments === true}
                  onClick={() => set("estimatedPayments", true)}>
                  Yes
                </YesNo>
                <YesNo
                  value={taxQuestions.estimatedPayments === false}
                  onClick={() => set("estimatedPayments", false)}>
                  No
                </YesNo>
              </Row>
            </div>

            <div>
              <FieldLabel>Health coverage in 2024?</FieldLabel>
              <Stack gap={8}>
                <OptionRow
                  selected={taxQuestions.healthCoverage === "all"}
                  onClick={() => set("healthCoverage", "all")}
                  title="Covered all year"
                  sub="Employer, marketplace, Medicare, or Medicaid"
                />
                <OptionRow
                  selected={taxQuestions.healthCoverage === "partial"}
                  onClick={() => set("healthCoverage", "partial")}
                  title="Partial coverage"
                  sub="Covered some months, not others"
                />
                <OptionRow
                  selected={taxQuestions.healthCoverage === "none"}
                  onClick={() => set("healthCoverage", "none")}
                  title="No coverage"
                  sub="I paid out of pocket or went uninsured"
                />
              </Stack>
            </div>
          </Stack>

          {taxQuestions.foreignAccounts === true ? (
            <AntonioNote>
              Foreign accounts mean FBAR (FinCEN 114) on top of your return.
              Separate filing, same deadline — I&apos;ll handle both.
            </AntonioNote>
          ) : null}
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

/* ─────────────────────── Step 9 — Deductions ─────────────────────── */

export function ScreenDeductions() {
  const { deductions, patch, goNext, goPrev } = useIntakeStore();

  const set = <K extends keyof typeof deductions>(
    key: K,
    value: (typeof deductions)[K]
  ) => patch({ deductions: { ...deductions, [key]: value } });

  const canContinue = deductions.approach !== null;

  return (
    <Screen>
      <IntakeHeader step={9} label="Deductions" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Standard or itemize?
            </h1>
            <Body size={14}>
              Most people take the standard deduction. If you&apos;re unsure
              I&apos;ll figure out which saves you more.
            </Body>
          </Stack>

          <Stack gap={10} className="mt-7">
            <OptionRow
              selected={deductions.approach === "standard"}
              onClick={() => set("approach", "standard")}
              title="Take the standard deduction"
              sub="$14,600 single · $29,200 MFJ (2024)"
            />
            <OptionRow
              selected={deductions.approach === "itemize"}
              onClick={() => set("approach", "itemize")}
              title="I want to itemize"
              sub="Mortgage, charitable, medical, SALT — with documentation"
            />
            <OptionRow
              selected={deductions.approach === "unsure"}
              onClick={() => set("approach", "unsure")}
              title="Not sure — figure it out for me"
              sub="I'll compute both and pick whichever's better"
            />
          </Stack>

          {deductions.approach === "itemize" ? (
            <div className="mt-6">
              <Eyebrow className="mb-2.5 block">Which categories apply?</Eyebrow>
              <Stack gap={8}>
                <CheckRow
                  value={deductions.mortgageInterest}
                  onClick={() =>
                    set("mortgageInterest", !deductions.mortgageInterest)
                  }
                  label="Mortgage interest"
                  sub="Form 1098 from your lender"
                />
                <CheckRow
                  value={deductions.charitable}
                  onClick={() => set("charitable", !deductions.charitable)}
                  label="Charitable donations"
                  sub="Cash, goods, or non-cash gifts"
                />
                <CheckRow
                  value={deductions.medical}
                  onClick={() => set("medical", !deductions.medical)}
                  label="Medical expenses"
                  sub="Only above 7.5% of AGI"
                />
                <CheckRow
                  value={deductions.salt}
                  onClick={() => set("salt", !deductions.salt)}
                  label="State & local taxes (SALT)"
                  sub="Capped at $10K combined"
                />
              </Stack>
            </div>
          ) : null}

          <AntonioNote>
            {deductions.approach === "unsure"
              ? "I'll compute both and show you the difference. Usually standard wins unless you own a home with a mortgage."
              : deductions.approach === "standard"
                ? "Simplest path. Most of my clients take this."
                : deductions.approach === "itemize"
                  ? "Itemizing means more receipts — save everything you can in the docs step."
                  : "Pick whichever feels right; you can change your mind before I file."}
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

/* ─────────────────────── Step 10 — Life events ─────────────────────── */

const LIFE_EVENTS: {
  key: keyof ReturnType<typeof lifeEventKeys>;
  label: string;
  sub: string;
}[] = [
  { key: "married", label: "Got married", sub: "New filing status options" },
  { key: "divorced", label: "Divorced or separated", sub: "Affects filing status + dependents" },
  { key: "hadChild", label: "Had a child", sub: "CTC, dependent care credit" },
  { key: "boughtHome", label: "Bought a home", sub: "Mortgage interest, property tax" },
  { key: "soldHome", label: "Sold a home", sub: "Capital gains exclusion analysis" },
  { key: "movedStates", label: "Moved to another state", sub: "Multi-state return" },
  { key: "jobChange", label: "Changed jobs", sub: "Multiple W-2s, 401(k) rollovers" },
  { key: "lostSpouse", label: "Spouse passed", sub: "Filing status transition" },
  { key: "other", label: "Something else", sub: "Tell Antonio in a note" }
];

// Helper to get keyof life-events shape without pulling in the full type
function lifeEventKeys() {
  return {
    married: false,
    divorced: false,
    hadChild: false,
    boughtHome: false,
    soldHome: false,
    movedStates: false,
    jobChange: false,
    lostSpouse: false,
    other: false
  };
}

export function ScreenLifeEvents() {
  const { lifeEvents, patch, goNext, goPrev } = useIntakeStore();

  const toggle = (key: keyof typeof lifeEvents) => {
    patch({ lifeEvents: { ...lifeEvents, [key]: !lifeEvents[key] } });
  };

  const hasAny = Object.values(lifeEvents).some(Boolean);

  return (
    <Screen>
      <IntakeHeader step={10} label="Life events" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Did anything big happen in 2024?
            </h1>
            <Body size={14}>
              Check any that apply. If nothing did, skip.
            </Body>
          </Stack>

          <Stack gap={8} className="mt-7">
            {LIFE_EVENTS.map((e) => (
              <CheckRow
                key={e.key}
                value={lifeEvents[e.key as keyof typeof lifeEvents]}
                onClick={() => toggle(e.key as keyof typeof lifeEvents)}
                label={e.label}
                sub={e.sub}
              />
            ))}
          </Stack>

          {hasAny ? (
            <AntonioNote>
              Noted. I&apos;ll factor these in — each one changes at least one
              line on the return, sometimes more than you&apos;d expect.
            </AntonioNote>
          ) : null}
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button variant="primary" fullWidth onClick={goNext}>
          {hasAny ? "Continue" : "Skip"}
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Step 11 — Refund preference ─────────────────────── */

export function ScreenRefundPreference() {
  const { refund, patch, goNext, goPrev } = useIntakeStore();

  const set = <K extends keyof typeof refund>(
    key: K,
    value: (typeof refund)[K]
  ) => patch({ refund: { ...refund, [key]: value } });

  const canContinue =
    refund.method === "paper-check" ||
    (refund.method === "direct-deposit" &&
      refund.routing.length === 9 &&
      refund.account.length >= 4 &&
      refund.accountType !== null);

  return (
    <Screen>
      <IntakeHeader step={11} label="Refund" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              If you&apos;re getting a refund.
            </h1>
            <Body size={14}>
              Where should the IRS send it? Direct deposit arrives 2–3 weeks
              faster.
            </Body>
          </Stack>

          <Stack gap={10} className="mt-7">
            <OptionRow
              selected={refund.method === "direct-deposit"}
              onClick={() => set("method", "direct-deposit")}
              title="Direct deposit"
              sub="Fastest — usually 2 to 3 weeks after e-file"
            />
            <OptionRow
              selected={refund.method === "paper-check"}
              onClick={() =>
                set("method", "paper-check")
              }
              title="Paper check"
              sub="Mailed to your address on file (6 to 8 weeks)"
            />
          </Stack>

          {refund.method === "direct-deposit" ? (
            <Stack gap={14} className="mt-6">
              <Row gap={10}>
                <TextField
                  label="Routing #"
                  value={refund.routing}
                  onChange={(e) =>
                    set(
                      "routing",
                      e.target.value.replace(/\D/g, "").slice(0, 9)
                    )
                  }
                  placeholder="9 digits"
                  inputMode="numeric"
                />
                <TextField
                  label="Account #"
                  value={refund.account}
                  onChange={(e) =>
                    set(
                      "account",
                      e.target.value.replace(/\D/g, "").slice(0, 17)
                    )
                  }
                  inputMode="numeric"
                />
              </Row>
              <div>
                <FieldLabel>Account type</FieldLabel>
                <Row gap={8}>
                  <YesNo
                    value={refund.accountType === "checking"}
                    onClick={() => set("accountType", "checking")}>
                    Checking
                  </YesNo>
                  <YesNo
                    value={refund.accountType === "savings"}
                    onClick={() => set("accountType", "savings")}>
                    Savings
                  </YesNo>
                </Row>
              </div>
            </Stack>
          ) : null}

          <AntonioNote>
            You can change this up until I file. We&apos;ll confirm on the last
            step.
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

/* ─────────────────────── Shared ─────────────────────── */

function YesNo({
  value,
  onClick,
  children
}: {
  value: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
        value
          ? "border-forest bg-forest-tint text-forest-ink"
          : "border-portal-border bg-portal-card text-portal-ink-soft hover:bg-portal-bg-elev"
      ].join(" ")}>
      {children}
    </button>
  );
}

function CheckRow({
  value,
  onClick,
  label,
  sub
}: {
  value: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-start gap-3 rounded-[14px] border px-[18px] py-[14px] text-left transition-[border-color,background-color] duration-150",
        value
          ? "border-forest bg-forest-tint"
          : "border-portal-border bg-portal-card hover:bg-portal-bg-elev"
      ].join(" ")}>
      <span
        className={[
          "mt-[2px] grid size-5 flex-shrink-0 place-items-center rounded-[6px] border transition-colors",
          value
            ? "border-forest bg-forest text-white"
            : "border-portal-border bg-portal-card"
        ].join(" ")}
        aria-hidden>
        {value ? (
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 11 l4 4 l8 -9"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-col gap-[2px]">
        <span className="text-[14px] font-medium text-portal-ink">{label}</span>
        {sub ? (
          <span className="text-[12.5px] leading-[1.4] text-portal-muted">
            {sub}
          </span>
        ) : null}
      </span>
    </button>
  );
}
