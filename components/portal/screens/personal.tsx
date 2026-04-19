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
import type { Dependent, FilingStatus } from "@/lib/portal/intake-types";

/* ─────────────────────── Step 2 — Personal info ─────────────────────── */

export function ScreenPersonalInfo() {
  const {
    firstName,
    lastName,
    dob,
    ssn,
    email,
    address,
    city,
    state,
    zip,
    patch,
    goNext,
    goPrev
  } = useIntakeStore();

  const canContinue =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    dob.length === 10 &&
    email.includes("@");

  return (
    <Screen>
      <IntakeHeader step={2} label="Personal info" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              The basics.
            </h1>
            <Body size={14}>
              Name, date of birth, where we can reach you.
            </Body>
          </Stack>

          <Stack gap={14} className="mt-7">
            <Row gap={10}>
              <TextField
                label="First name"
                value={firstName}
                onChange={(e) => patch({ firstName: e.target.value })}
                autoComplete="given-name"
              />
              <TextField
                label="Last name"
                value={lastName}
                onChange={(e) => patch({ lastName: e.target.value })}
                autoComplete="family-name"
              />
            </Row>
            <Row gap={10}>
              <TextField
                label="Date of birth"
                value={dob}
                onChange={(e) => patch({ dob: formatDate(e.target.value) })}
                placeholder="MM/DD/YYYY"
                inputMode="numeric"
              />
              <TextField
                label="SSN"
                value={ssn}
                onChange={(e) => patch({ ssn: formatSsn(e.target.value) })}
                placeholder="•••-••-••••"
                inputMode="numeric"
                type="password"
              />
            </Row>
            <TextField
              label="Email"
              value={email}
              onChange={(e) => patch({ email: e.target.value })}
              placeholder="you@email.com"
              autoComplete="email"
              type="email"
            />
            <TextField
              label="Street address"
              value={address}
              onChange={(e) => patch({ address: e.target.value })}
              autoComplete="street-address"
            />
            <Row gap={10}>
              <TextField
                label="City"
                value={city}
                onChange={(e) => patch({ city: e.target.value })}
                autoComplete="address-level2"
              />
              <TextField
                label="State"
                value={state}
                onChange={(e) =>
                  patch({ state: e.target.value.toUpperCase().slice(0, 2) as never })
                }
                maxLength={2}
              />
              <TextField
                label="ZIP"
                value={zip}
                onChange={(e) =>
                  patch({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })
                }
                inputMode="numeric"
                maxLength={5}
              />
            </Row>
          </Stack>

          <AntonioNote>
            Your SSN is encrypted end-to-end. I need it to file — nobody else
            at the firm can see it.
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

function formatDate(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length < 3) return d;
  if (d.length < 5) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function formatSsn(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 9);
  if (d.length < 4) return d;
  if (d.length < 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
}

/* ─────────────────────── Step 3 — State & prior year ─────────────────────── */

export function ScreenStateAndPriorYear() {
  const {
    state,
    residencyState,
    priorYearFiled,
    priorYearPreparer,
    patch,
    goNext,
    goPrev
  } = useIntakeStore();

  // Default residencyState to personal info state if not set
  React.useEffect(() => {
    if (!residencyState && state) {
      patch({ residencyState: state });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canContinue =
    residencyState.length === 2 && priorYearFiled !== null;

  return (
    <Screen>
      <IntakeHeader step={3} label="State & prior year" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Where you lived.
            </h1>
            <Body size={14}>
              Plus a quick note about last year&apos;s return.
            </Body>
          </Stack>

          <Stack gap={16} className="mt-7">
            <div>
              <FieldLabel>Residency state for 2024</FieldLabel>
              <TextField
                value={residencyState}
                onChange={(e) =>
                  patch({
                    residencyState: e.target.value.toUpperCase().slice(0, 2) as never
                  })
                }
                maxLength={2}
                placeholder="CA"
              />
              <p className="mt-1.5 text-[11.5px] text-portal-muted">
                If you moved between states, pick where you lived longer.
                I&apos;ll ask for the other one later.
              </p>
            </div>

            <div>
              <FieldLabel>Did you file a 2023 return?</FieldLabel>
              <Stack gap={8}>
                <OptionRow
                  selected={priorYearFiled === true}
                  onClick={() => patch({ priorYearFiled: true })}
                  title="Yes, I filed 2023"
                  sub="We'll use it as a comparison baseline."
                />
                <OptionRow
                  selected={priorYearFiled === false}
                  onClick={() =>
                    patch({ priorYearFiled: false, priorYearPreparer: "" })
                  }
                  title="No, I didn't file last year"
                  sub="We'll flag whether you need to."
                />
              </Stack>
            </div>

            {priorYearFiled === true ? (
              <TextField
                label="Who prepared it?"
                value={priorYearPreparer}
                onChange={(e) => patch({ priorYearPreparer: e.target.value })}
                placeholder="Self, TurboTax, previous CPA, etc."
              />
            ) : null}
          </Stack>

          <AntonioNote>
            If you filed last year I&apos;ll pull that return into the
            comparison so I can catch anything that shifted materially.
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

/* ─────────────────────── Step 4 — Filing status ─────────────────────── */

const FILING_OPTIONS: {
  id: FilingStatus;
  title: string;
  sub: string;
}[] = [
  {
    id: "single",
    title: "Single",
    sub: "Not married as of Dec 31, no qualifying dependents"
  },
  {
    id: "mfj",
    title: "Married filing jointly",
    sub: "Filing one return with your spouse"
  },
  {
    id: "mfs",
    title: "Married filing separately",
    sub: "Filing two separate returns"
  },
  {
    id: "hoh",
    title: "Head of household",
    sub: "Unmarried + paying for a qualifying dependent"
  },
  {
    id: "qw",
    title: "Qualifying widow(er)",
    sub: "Spouse passed recently + dependent child"
  }
];

export function ScreenFilingStatus() {
  const { filingStatus, patch, goNext, goPrev } = useIntakeStore();

  return (
    <Screen>
      <IntakeHeader step={4} label="Filing status" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              How are you filing?
            </h1>
            <Body size={14}>Pick the one that matches your Dec 31 status.</Body>
          </Stack>

          <Stack gap={10} className="mt-7">
            {FILING_OPTIONS.map((o) => (
              <OptionRow
                key={o.id}
                selected={filingStatus === o.id}
                onClick={() => patch({ filingStatus: o.id })}
                title={o.title}
                sub={o.sub}
              />
            ))}
          </Stack>

          {filingStatus === "hoh" ? (
            <AntonioNote>
              Head of household has strict IRS due-diligence rules. I&apos;ll
              ask a few extra questions later to make sure everything holds up
              under a §6695(g) review.
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
          disabled={!filingStatus}
          onClick={goNext}>
          Continue
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Step 5 — Spouse info (conditional) ─────────────────────── */

export function ScreenSpouseInfo() {
  const {
    spouseFirstName,
    spouseLastName,
    spouseDob,
    spouseSsn,
    spouseHasIncome,
    filingStatus,
    patch,
    goNext,
    goPrev
  } = useIntakeStore();

  const canContinue =
    spouseFirstName.trim().length > 0 &&
    spouseLastName.trim().length > 0 &&
    spouseDob.length === 10 &&
    spouseHasIncome !== null;

  return (
    <Screen>
      <IntakeHeader step={5} label="Spouse info" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              About your spouse.
            </h1>
            <Body size={14}>
              {filingStatus === "mfs"
                ? "I'll still file just yours, but I need their basics for the return."
                : "We're filing the two of you together."}
            </Body>
          </Stack>

          <Stack gap={14} className="mt-7">
            <Row gap={10}>
              <TextField
                label="First name"
                value={spouseFirstName}
                onChange={(e) => patch({ spouseFirstName: e.target.value })}
              />
              <TextField
                label="Last name"
                value={spouseLastName}
                onChange={(e) => patch({ spouseLastName: e.target.value })}
              />
            </Row>
            <Row gap={10}>
              <TextField
                label="Date of birth"
                value={spouseDob}
                onChange={(e) => patch({ spouseDob: formatDate(e.target.value) })}
                placeholder="MM/DD/YYYY"
                inputMode="numeric"
              />
              <TextField
                label="SSN"
                value={spouseSsn}
                onChange={(e) => patch({ spouseSsn: formatSsn(e.target.value) })}
                placeholder="•••-••-••••"
                inputMode="numeric"
                type="password"
              />
            </Row>

            <div>
              <FieldLabel>Did your spouse have income in 2024?</FieldLabel>
              <Stack gap={8}>
                <OptionRow
                  selected={spouseHasIncome === true}
                  onClick={() => patch({ spouseHasIncome: true })}
                  title="Yes"
                  sub="W-2, 1099, self-employed — anything."
                />
                <OptionRow
                  selected={spouseHasIncome === false}
                  onClick={() => patch({ spouseHasIncome: false })}
                  title="No"
                  sub="They had no taxable income this year."
                />
              </Stack>
            </div>
          </Stack>
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

/* ─────────────────────── Step 6a — Dependents count ─────────────────────── */

export function ScreenDependentsCount() {
  const { dependentCount, patch, goNext, goPrev } = useIntakeStore();
  const [count, setCount] = React.useState(dependentCount);

  const bump = (delta: number) => {
    const next = Math.max(0, Math.min(count + delta, 10));
    setCount(next);
  };

  const handleNext = () => {
    // Resize dependents array to match count
    const store = useIntakeStore.getState();
    const existing = store.dependents;
    const resized: Dependent[] = Array.from({ length: count }, (_, i) =>
      existing[i] ?? {
        firstName: "",
        lastName: "",
        ssn: "",
        dob: "",
        relationship: "child" as const,
        monthsInHome: 12
      }
    );
    patch({ dependentCount: count, dependents: resized });
    goNext();
  };

  return (
    <Screen>
      <IntakeHeader step={6} label="Dependents" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Any dependents?
            </h1>
            <Body size={14}>
              Kids, parents, or others who rely on you for support.
            </Body>
          </Stack>

          <div className="mt-10 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => bump(-1)}
              disabled={count === 0}
              aria-label="Decrease count"
              className="grid size-14 place-items-center rounded-full border border-portal-border bg-portal-card text-portal-ink-soft transition-colors hover:bg-portal-bg-elev disabled:opacity-40 disabled:cursor-not-allowed">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div
              className="min-w-[90px] text-center font-serif text-[72px] font-medium leading-none tabular-nums text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 96',
                fontSynthesis: "none"
              }}>
              {count}
            </div>

            <button
              type="button"
              onClick={() => bump(1)}
              aria-label="Increase count"
              className="grid size-14 place-items-center rounded-full border border-forest bg-forest text-white transition-colors hover:bg-forest-2">
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 4v12M4 10h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="mt-4 text-center">
            <Eyebrow>
              {count === 0
                ? "None"
                : count === 1
                  ? "1 dependent"
                  : `${count} dependents`}
            </Eyebrow>
          </div>

          {count > 0 ? (
            <AntonioNote>
              I&apos;ll ask for each dependent&apos;s name, DOB, SSN, and
              relationship on the next screen so I can check for EIC and CTC
              eligibility.
            </AntonioNote>
          ) : null}
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button variant="primary" fullWidth onClick={handleNext}>
          {count === 0 ? "Skip" : "Continue"}
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Step 6b — Dependent details (conditional) ─────────────────────── */

export function ScreenDependentDetails() {
  const { dependents, patch, goNext, goPrev } = useIntakeStore();

  const setAt = (i: number, updater: (d: Dependent) => Dependent) => {
    patch({ dependents: dependents.map((d, j) => (i === j ? updater(d) : d)) });
  };

  const canContinue = dependents.every(
    (d) =>
      d.firstName.trim().length > 0 &&
      d.lastName.trim().length > 0 &&
      d.dob.length === 10
  );

  return (
    <Screen>
      <IntakeHeader step={6} label="Dependent details" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-6">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Tell me about each one.
            </h1>
          </Stack>

          <Stack gap={18} className="mt-6">
            {dependents.map((d, i) => (
              <div
                key={i}
                className="rounded-[14px] border border-portal-border bg-portal-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Eyebrow color="forest">Dependent {i + 1}</Eyebrow>
                  <span className="text-[11px] text-portal-muted">
                    {d.firstName || "—"}
                  </span>
                </div>
                <Stack gap={12}>
                  <Row gap={10}>
                    <TextField
                      label="First name"
                      value={d.firstName}
                      onChange={(e) =>
                        setAt(i, (x) => ({ ...x, firstName: e.target.value }))
                      }
                    />
                    <TextField
                      label="Last name"
                      value={d.lastName}
                      onChange={(e) =>
                        setAt(i, (x) => ({ ...x, lastName: e.target.value }))
                      }
                    />
                  </Row>
                  <Row gap={10}>
                    <TextField
                      label="Date of birth"
                      value={d.dob}
                      onChange={(e) =>
                        setAt(i, (x) => ({
                          ...x,
                          dob: formatDate(e.target.value)
                        }))
                      }
                      placeholder="MM/DD/YYYY"
                      inputMode="numeric"
                    />
                    <TextField
                      label="SSN"
                      value={d.ssn}
                      onChange={(e) =>
                        setAt(i, (x) => ({
                          ...x,
                          ssn: formatSsn(e.target.value)
                        }))
                      }
                      placeholder="•••-••-••••"
                      inputMode="numeric"
                      type="password"
                    />
                  </Row>
                  <div>
                    <FieldLabel>Relationship</FieldLabel>
                    <Row gap={6} className="flex-wrap">
                      {(
                        [
                          "child",
                          "stepchild",
                          "foster",
                          "sibling",
                          "parent",
                          "other"
                        ] as const
                      ).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() =>
                            setAt(i, (x) => ({ ...x, relationship: r }))
                          }
                          className={[
                            "rounded-full border px-3 py-1.5 text-[12px] font-medium capitalize transition-colors",
                            d.relationship === r
                              ? "border-forest bg-forest-tint text-forest-ink"
                              : "border-portal-border bg-portal-card text-portal-ink-soft hover:bg-portal-bg-elev"
                          ].join(" ")}>
                          {r}
                        </button>
                      ))}
                    </Row>
                  </div>
                </Stack>
              </div>
            ))}
          </Stack>
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
