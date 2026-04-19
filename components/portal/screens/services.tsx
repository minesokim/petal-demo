"use client";

import * as React from "react";

import {
  ADDONS,
  OTHER_SUB,
  SERVICE_PATHS,
  estimateFee,
  formatFeeRange,
  type ServicePathId
} from "@/lib/portal/service-catalog";
import { useIntakeStore } from "@/lib/portal/intake-store";
import {
  AntonioNote,
  BackButton,
  Body,
  BottomBar,
  Button,
  Eyebrow,
  IntakeHeader,
  OptionRow,
  Row,
  Screen,
  Stack
} from "@/components/portal/primitives";
import { ServiceIcon } from "./icons";

/* ─────────────────────── Step 1A — Service path ─────────────────────── */

export function ScreenServicePath() {
  const { servicePath, otherSub, goNext, goPrev, patch } = useIntakeStore();
  const [path, setPath] = React.useState<ServicePathId>(
    servicePath ?? "personal"
  );
  const [sub, setSub] = React.useState<string | null>(otherSub ?? null);

  const pickPath = (id: ServicePathId) => {
    setPath(id);
    if (id !== "other") setSub(null);
  };

  const currentPath = SERVICE_PATHS.find((p) => p.id === path)!;
  const currentSub = sub ? OTHER_SUB.find((o) => o.id === sub) : null;
  const estimate = estimateFee(path, (sub as never) ?? null, []);

  const canContinue = path !== "other" || !!sub;

  const handleNext = () => {
    patch({
      servicePath: path,
      otherSub: (sub as never) ?? null,
      addons: []
    });
    goNext();
  };

  return (
    <Screen>
      <IntakeHeader step={1} subStep="A" label="Services" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-2">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              What brings you here?
            </h1>
            <Body size={14}>
              Pick the closest match. You can add details later.
            </Body>
          </Stack>

          {/* Dynamic fee ticker */}
          <div className="mt-5 rounded-[14px] border border-portal-border-soft bg-portal-bg-elev px-4 py-3">
            <Row justify="space-between" align="baseline">
              <Eyebrow color="forest">Estimated fee</Eyebrow>
              <span className="text-[18px] font-medium tracking-[-0.01em] text-portal-ink tabular-nums">
                {path === "other" && currentSub
                  ? currentSub.fee
                  : path === "other"
                    ? "—"
                    : formatFeeRange(estimate)}
              </span>
            </Row>
          </div>
        </div>

        <div className="px-6 pt-4 pb-6">
          <Stack gap={10}>
            {SERVICE_PATHS.map((p) => (
              <OptionRow
                key={p.id}
                selected={path === p.id}
                onClick={() => pickPath(p.id)}
                icon={<ServiceIcon name={p.icon} />}
                title={p.name}
                sub={p.sub}
                right={
                  <span className="shrink-0 text-[12px] font-medium text-portal-muted tabular-nums">
                    {p.fee}
                  </span>
                }
              />
            ))}
          </Stack>

          {path === "other" ? (
            <div className="mt-5">
              <Eyebrow className="mb-2.5 block">Pick a service</Eyebrow>
              <Stack gap={8}>
                {OTHER_SUB.map((o) => (
                  <OptionRow
                    key={o.id}
                    selected={sub === o.id}
                    onClick={() => setSub(o.id)}
                    icon={<ServiceIcon name={o.icon} />}
                    title={o.name}
                    sub={o.sub}
                    right={
                      <span className="shrink-0 text-[12px] font-medium text-portal-muted tabular-nums">
                        {o.fee}
                      </span>
                    }
                  />
                ))}
              </Stack>
            </div>
          ) : null}

          <AntonioNote>
            {path === "biz"
              ? "Business returns vary a lot depending on entity and activity. This range is a starting point — I'll give you a fixed quote once I see your books."
              : path === "other"
                ? "Pick the option closest to what you need. We can always adjust the scope when we talk."
                : currentPath.name.startsWith("Self")
                  ? "Self-employed returns take longer because there's more to substantiate. Most clients land in the middle of this range."
                  : "Simple personal returns rarely go above the low end. If yours is more complex I'll tell you before we start."}
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
          onClick={handleNext}>
          Continue
        </Button>
      </BottomBar>
    </Screen>
  );
}

/* ─────────────────────── Step 1B — Add-ons ─────────────────────── */

export function ScreenServiceAddons() {
  const { servicePath, otherSub, addons, goNext, goPrev, patch } =
    useIntakeStore();
  const path = servicePath ?? "personal";
  const list = ADDONS[path] ?? [];
  const [selected, setSelected] = React.useState<Set<string>>(
    new Set(addons)
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const estimate = estimateFee(path, otherSub ?? null, [...selected]);

  const handleNext = () => {
    patch({ addons: [...selected] });
    goNext();
  };

  // If no applicable addons (e.g. path = other which shouldn't be here),
  // auto-skip the screen on mount.
  React.useEffect(() => {
    if (list.length === 0) goNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <IntakeHeader step={1} subStep="B" label="Services" />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="px-6 pt-7 pb-2">
          <Stack gap={10}>
            <h1
              className="font-serif text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-portal-ink"
              style={{
                fontVariationSettings: '"opsz" 36',
                fontSynthesis: "none"
              }}>
              Anything else going on?
            </h1>
            <Body size={14}>
              Pick any that apply. You can skip entirely if none do.
            </Body>
          </Stack>

          <div className="mt-5 rounded-[14px] border border-portal-border-soft bg-portal-bg-elev px-4 py-3">
            <Row justify="space-between" align="baseline">
              <Eyebrow color="forest">Estimated fee</Eyebrow>
              <span className="text-[18px] font-medium tracking-[-0.01em] text-portal-ink tabular-nums">
                {formatFeeRange(estimate)}
              </span>
            </Row>
            {selected.size > 0 ? (
              <div className="mt-1 text-[11px] text-portal-muted">
                {selected.size} add-on{selected.size > 1 ? "s" : ""} selected
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-6 pt-4 pb-6">
          <Stack gap={10}>
            {list.map((a) => (
              <OptionRow
                key={a.id}
                selected={selected.has(a.id)}
                onClick={() => toggle(a.id)}
                icon={<ServiceIcon name={a.icon} />}
                title={a.name}
                sub={a.sub}
                right={
                  <span className="shrink-0 text-[12px] font-medium text-portal-muted tabular-nums">
                    {a.fee}
                  </span>
                }
              />
            ))}
          </Stack>
        </div>
      </div>

      <BottomBar>
        <Button variant="secondary" onClick={goPrev}>
          Back
        </Button>
        <Button variant="primary" fullWidth onClick={handleNext}>
          Continue
        </Button>
      </BottomBar>
    </Screen>
  );
}
