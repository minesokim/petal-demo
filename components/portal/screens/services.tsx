"use client";

import * as React from "react";

import type { PortalTheme } from "../theme";
import { Body, Button, Card, H1, Row, Screen, Stack } from "../primitives";
import { AntonioNote, IntakeHeader } from "../intake-chrome";
import { AskAntonioBar } from "../ask-antonio";
import { useIntakeStore } from "@/lib/portal/intake-store";
import {
  ADDONS,
  OTHER_SUB,
  SERVICE_PATHS,
  type OtherSubId,
  type ServicePathId
} from "@/lib/portal/service-catalog";

/**
 * Filing Status + Services screens — 1:1 port of
 * design-references/client-portal/components/intake-screens.jsx
 * (ScreenFilingStatus, ServiceIcon, ScreenServicePath,
 * ScreenServiceAddons).
 */

/* ─── ServiceIcon — inline SVG glyphs copied verbatim ─── */

export function ServiceIcon({
  t,
  kind
}: {
  t: PortalTheme;
  kind: string;
}) {
  const s = {
    width: 20,
    height: 20,
    stroke: t.rustInk,
    strokeWidth: 1.4,
    fill: "none" as const
  };
  const map: Record<string, React.ReactNode> = {
    personal: (
      <svg {...s} viewBox="0 0 20 20">
        <rect x="3" y="3" width="14" height="14" rx="2" strokeLinejoin="round" />
        <path d="M6 8h8M6 11h5" strokeLinecap="round" />
      </svg>
    ),
    self: (
      <svg {...s} viewBox="0 0 20 20">
        <path d="M3 6h14v11H3zM3 6l3-3h8l3 3" strokeLinejoin="round" />
        <path d="M8 10h4" strokeLinecap="round" />
      </svg>
    ),
    biz: (
      <svg {...s} viewBox="0 0 20 20">
        <rect x="3" y="6" width="14" height="11" rx="1" strokeLinejoin="round" />
        <path d="M7 6V4h6v2M8 10v4M12 10v4" strokeLinecap="round" />
      </svg>
    ),
    rental: (
      <svg {...s} viewBox="0 0 20 20">
        <path d="M3 10l7-6 7 6v7H3z" strokeLinejoin="round" />
        <path d="M8 17v-4h4v4" />
      </svg>
    ),
    crypto: (
      <svg {...s} viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="7" />
        <path
          d="M8 7v6M12 7v6M7 9h5a1.5 1.5 0 010 3H7M7 9l-1 1M7 12l-1 1"
          strokeLinecap="round"
        />
      </svg>
    ),
    amend: (
      <svg {...s} viewBox="0 0 20 20">
        <path d="M4 4h9l3 3v9H4z" strokeLinejoin="round" />
        <path d="M7 11l3 3 5-5" strokeLinecap="round" />
      </svg>
    ),
    states: (
      <svg {...s} viewBox="0 0 20 20">
        <path d="M3 5l4-1 6 2 4-1v11l-4 1-6-2-4 1z" strokeLinejoin="round" />
        <path d="M7 4v12M13 6v12" />
      </svg>
    ),
    fbar: (
      <svg {...s} viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="7" />
        <path d="M3 10h14M10 3c2.5 2 2.5 12 0 14M10 3c-2.5 2-2.5 12 0 14" />
      </svg>
    ),
    consult: (
      <svg {...s} viewBox="0 0 20 20">
        <path d="M4 4h12v9H9l-4 3v-3H4z" strokeLinejoin="round" />
        <path d="M8 8h4M8 10h3" strokeLinecap="round" />
      </svg>
    ),
    formation: (
      <svg {...s} viewBox="0 0 20 20">
        <path d="M5 3h7l3 3v11H5z" strokeLinejoin="round" />
        <path d="M12 3v4h3M8 11h4M8 13h4" strokeLinecap="round" />
      </svg>
    ),
    books: (
      <svg {...s} viewBox="0 0 20 20">
        <path
          d="M4 4h5a2 2 0 012 2v11a2 2 0 00-2-2H4zM16 4h-5a2 2 0 00-2 2v11a2 2 0 012-2h5z"
          strokeLinejoin="round"
        />
      </svg>
    ),
    strategy: (
      <svg {...s} viewBox="0 0 20 20">
        <path
          d="M3 15l4-5 3 2 4-6 3 4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx="7" cy="10" r="1.2" fill={t.rustInk} />
        <circle cx="14" cy="6" r="1.2" fill={t.rustInk} />
      </svg>
    )
  };
  return (map[kind] ?? null) as React.ReactNode;
}

/* ─── Filing Status ─── */

const FILING_OPTIONS = [
  { id: "single", label: "Single", hint: "Unmarried or legally separated" },
  { id: "mfj", label: "Married filing jointly", hint: "Most common for married couples" },
  { id: "mfs", label: "Married filing separately", hint: "Each spouse files their own return" },
  { id: "hoh", label: "Head of household", hint: "Unmarried, supporting a qualifying dependent" },
  { id: "qw", label: "Qualifying widow(er)", hint: "Spouse passed within the last 2 years" }
] as const;

export function ScreenFilingStatus({ t }: { t: PortalTheme }) {
  const { filingStatus, patch, goNext, goPrev } = useIntakeStore();
  const sel = filingStatus ?? "single";

  return (
    <Screen t={t}>
      <div
        style={{
          padding: "24px 0 0",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%"
        }}>
        <IntakeHeader t={t} step={4} label="Filing" />
        <div style={{ padding: "32px 24px 8px" }}>
          <Stack gap={10}>
            <H1 t={t}>What&apos;s your filing status?</H1>
            <Body t={t} size={15}>
              This affects your standard deduction and tax bracket.
            </Body>
          </Stack>
        </div>
        <Stack gap={10} style={{ padding: "20px 24px 16px", flex: 1 }}>
          {FILING_OPTIONS.map((o) => (
            <Card
              key={o.id}
              t={t}
              onClick={() => patch({ filingStatus: o.id })}
              selected={sel === o.id}
              tinted={sel === o.id}
              style={{ padding: "16px 18px" }}>
              <Row gap={12} align="flex-start">
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: `1.5px solid ${sel === o.id ? t.rust : t.border}`,
                    background: sel === o.id ? t.rust : "transparent",
                    flexShrink: 0,
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                  {sel === o.id && (
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "#fff"
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: t.ink,
                      marginBottom: 3
                    }}>
                    {o.label}
                  </div>
                  <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.4 }}>
                    {o.hint}
                  </div>
                </div>
              </Row>
            </Card>
          ))}
          <div style={{ marginTop: 8 }}>
            <AntonioNote t={t}>
              If you&apos;re not sure which applies, pick your best guess — I&apos;ll verify during our call.
            </AntonioNote>
          </div>
        </Stack>
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: `linear-gradient(to top, ${t.bg} 75%, transparent)`,
            padding: "20px 24px 28px"
          }}>
          <div style={{ marginBottom: 12 }}>
            <AskAntonioBar t={t} />
          </div>
          <Row gap={10}>
            <Button
              t={t}
              variant="ghost"
              onClick={goPrev}
              style={{ flex: "0 0 auto" }}>
              Back
            </Button>
            <Button t={t} onClick={goNext} style={{ flex: 1 }}>
              Continue
            </Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}

/* ─── Services — Screen A: choose path ─── */

export function ScreenServicePath({ t }: { t: PortalTheme }) {
  const { servicePath, otherSub, patch, goNext, goPrev } = useIntakeStore();
  const path = (servicePath ?? "personal") as ServicePathId;
  const sub = otherSub;

  const pickPath = (id: ServicePathId) => {
    patch({
      servicePath: id,
      otherSub: id !== "other" ? null : otherSub
    });
  };

  const currentPath = SERVICE_PATHS.find((p) => p.id === path)!;
  const currentOther = sub ? OTHER_SUB.find((o) => o.id === sub) : null;

  const headline =
    path === "other"
      ? currentOther
        ? currentOther.fee
        : "Pick a service below"
      : currentPath.fee;

  const canContinue = path !== "other" || !!sub;

  return (
    <Screen t={t}>
      <div
        style={{
          padding: "24px 0 0",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%"
        }}>
        <IntakeHeader t={t} step={1} subStep="A" label="Services" />
        <div style={{ padding: "32px 24px 8px" }}>
          <Stack gap={10}>
            <H1 t={t}>What brings you in this year?</H1>
            <Body t={t} size={15}>
              Pick the one that fits best. I&apos;ll ask about add-ons next.
            </Body>
          </Stack>
        </div>

        <Stack gap={12} style={{ padding: "24px 24px 16px", flex: 1 }}>
          {SERVICE_PATHS.map((p) => (
            <Card
              key={p.id}
              t={t}
              onClick={() => pickPath(p.id)}
              selected={path === p.id}
              tinted={path === p.id}
              style={{ padding: "16px 18px" }}>
              <Row gap={14} align="flex-start">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: path === p.id ? t.rustSoft : t.bgElev,
                    border: `1px solid ${path === p.id ? t.rust : t.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 2
                  }}>
                  <ServiceIcon t={t} kind={p.icon} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Row justify="space-between" align="baseline" gap={10}>
                    <div style={{ fontSize: 16, fontWeight: 500, color: t.ink }}>
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontFamily: t.mono,
                        fontSize: 12,
                        color: path === p.id ? t.rustInk : t.muted,
                        fontWeight: path === p.id ? 500 : 400,
                        whiteSpace: "nowrap"
                      }}>
                      {p.fee}
                    </div>
                  </Row>
                  <div
                    style={{
                      fontSize: 13,
                      color: t.muted,
                      lineHeight: 1.45,
                      marginTop: 3
                    }}>
                    {p.sub}
                  </div>
                  {p.id === "other" && path === "other" ? (
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 12,
                        borderTop: `1px dashed ${t.borderSoft}`
                      }}>
                      <div
                        style={{
                          fontFamily: t.serif,
                          fontStyle: "italic",
                          fontSize: 13,
                          color: t.inkSoft,
                          marginBottom: 10
                        }}>
                        Which one?
                      </div>
                      <Stack gap={8}>
                        {OTHER_SUB.map((o) => (
                          <div
                            key={o.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              patch({ otherSub: o.id as OtherSubId });
                            }}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 12,
                              padding: "12px",
                              background: sub === o.id ? t.rustSoft : t.bgElev,
                              border: `1px solid ${sub === o.id ? t.rust : t.border}`,
                              borderRadius: 8,
                              cursor: "pointer"
                            }}>
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                border: `1.5px solid ${sub === o.id ? t.rust : t.border}`,
                                background: sub === o.id ? t.rust : "transparent",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                marginTop: 2
                              }}>
                              {sub === o.id && (
                                <div
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: "#fff"
                                  }}
                                />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Row
                                justify="space-between"
                                align="baseline"
                                gap={8}
                                style={{ marginBottom: 2 }}>
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: t.ink,
                                    fontWeight: 500
                                  }}>
                                  {o.name}
                                </div>
                                <div
                                  style={{
                                    fontFamily: t.mono,
                                    fontSize: 11,
                                    color: sub === o.id ? t.rustInk : t.muted,
                                    whiteSpace: "nowrap",
                                    flexShrink: 0
                                  }}>
                                  {o.fee}
                                </div>
                              </Row>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: t.muted,
                                  lineHeight: 1.4
                                }}>
                                {o.sub}
                              </div>
                            </div>
                          </div>
                        ))}
                      </Stack>
                    </div>
                  ) : null}
                </div>
              </Row>
            </Card>
          ))}

          <div style={{ marginTop: 4 }}>
            <AntonioNote t={t}>
              Not sure? Pick the closest match — we can adjust once I see your
              documents.
            </AntonioNote>
          </div>
        </Stack>

        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: `linear-gradient(to top, ${t.bg} 70%, transparent)`,
            padding: "20px 24px 28px"
          }}>
          <div
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: t.radius,
              padding: "14px 16px",
              marginBottom: 12,
              boxShadow: "0 6px 18px rgba(60, 40, 28, 0.06)"
            }}>
            <Row justify="space-between" align="center">
              <div
                style={{
                  fontFamily: t.serif,
                  fontStyle: "italic",
                  fontSize: 13,
                  color: t.muted
                }}>
                Starting estimate
              </div>
              <div
                style={{
                  fontFamily: t.serif,
                  fontSize: 20,
                  color: t.ink,
                  letterSpacing: -0.3
                }}>
                {headline}
              </div>
            </Row>
          </div>
          <div style={{ marginBottom: 12 }}>
            <AskAntonioBar t={t} />
          </div>
          <Row gap={10}>
            <Button
              t={t}
              variant="ghost"
              onClick={goPrev}
              style={{ flex: "0 0 auto" }}>
              Back
            </Button>
            <Button
              t={t}
              onClick={goNext}
              style={{ flex: 1 }}
              disabled={!canContinue}>
              {path === "other" ? "Continue" : "Next — add-ons"}
            </Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}

/* ─── Services — Screen B: conditional add-ons ─── */

export function ScreenServiceAddons({ t }: { t: PortalTheme }) {
  const { servicePath, otherSub, addons, patch, goNext, goPrev } =
    useIntakeStore();
  const basePath = (servicePath ?? "personal") as ServicePathId;
  const pathDef =
    SERVICE_PATHS.find((p) => p.id === basePath) ?? SERVICE_PATHS[0];
  const list = ADDONS[basePath] ?? [];

  const [sel, setSel] = React.useState<Set<string>>(new Set(addons));

  const toggle = (id: string) => {
    const n = new Set(sel);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSel(n);
  };

  // Auto-skip if this path has no applicable add-ons
  React.useEffect(() => {
    if (list.length === 0) {
      patch({ addons: [] });
      goNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const breakdown: { id: string; name: string; fee: string; lo: number; hi: number }[] = [
    {
      id: pathDef.id,
      name: pathDef.name,
      fee: pathDef.fee,
      lo: pathDef.lo,
      hi: pathDef.hi
    }
  ];
  list.forEach((a) => {
    if (sel.has(a.id)) {
      breakdown.push({
        id: a.id,
        name: a.name,
        fee: a.fee,
        lo: a.lo,
        hi: a.hi
      });
    }
  });
  const lo = breakdown.reduce((acc, s) => acc + s.lo, 0);
  const hi = breakdown.reduce((acc, s) => acc + s.hi, 0);

  const handleNext = () => {
    patch({ addons: [...sel] });
    goNext();
  };

  return (
    <Screen t={t}>
      <div
        style={{
          padding: "24px 0 0",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%"
        }}>
        <IntakeHeader t={t} step={1} subStep="B" label="Services" />
        <div style={{ padding: "32px 24px 8px" }}>
          <Stack gap={10}>
            <H1 t={t}>Anything else going on?</H1>
            <Body t={t} size={15}>
              Select what applies. Skip if none of these fit.
            </Body>
            <div
              style={{
                marginTop: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                background: t.bgElev,
                border: `1px solid ${t.borderSoft}`,
                borderRadius: 999,
                alignSelf: "flex-start"
              }}>
              <ServiceIcon t={t} kind={pathDef.icon} />
              <span style={{ fontSize: 12.5, color: t.inkSoft }}>
                Building on{" "}
                <span style={{ color: t.ink, fontWeight: 500 }}>
                  {pathDef.name}
                </span>
              </span>
              <span
                onClick={goPrev}
                style={{
                  fontFamily: t.serif,
                  fontStyle: "italic",
                  fontSize: 12,
                  color: t.rustInk,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 2
                }}>
                change
              </span>
            </div>
          </Stack>
        </div>

        <Stack gap={10} style={{ padding: "24px 24px 16px", flex: 1 }}>
          {list.map((item) => {
            const selected = sel.has(item.id);
            return (
              <Card
                key={item.id}
                t={t}
                onClick={() => toggle(item.id)}
                selected={selected}
                tinted={selected}
                style={{ padding: "14px 16px" }}>
                <Row gap={14} align="center">
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      flexShrink: 0,
                      borderRadius: 5,
                      border: `1.5px solid ${selected ? t.rust : t.border}`,
                      background: selected ? t.rust : t.card,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                    {selected ? (
                      <svg width="12" height="10" viewBox="0 0 12 10">
                        <path
                          d="M1 5l3.5 3.5L11 1"
                          stroke="#fff"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: t.ink,
                        marginBottom: 2
                      }}>
                      {item.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: t.muted,
                        lineHeight: 1.4
                      }}>
                      {item.sub}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: t.mono,
                      fontSize: 12,
                      color: selected ? t.rustInk : t.muted,
                      fontWeight: selected ? 500 : 400,
                      whiteSpace: "nowrap"
                    }}>
                    {item.fee}
                  </div>
                </Row>
              </Card>
            );
          })}

          <div style={{ marginTop: 6 }}>
            <AntonioNote t={t}>
              If none of these apply, skip ahead — we&apos;ll catch anything I
              missed during review.
            </AntonioNote>
          </div>
        </Stack>

        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: `linear-gradient(to top, ${t.bg} 70%, transparent)`,
            padding: "20px 24px 28px"
          }}>
          <div
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              borderRadius: t.radius,
              padding: "14px 16px 6px",
              marginBottom: 12,
              boxShadow: "0 6px 18px rgba(60, 40, 28, 0.06)"
            }}>
            <Row justify="space-between" align="flex-start">
              <div>
                <div
                  style={{
                    fontFamily: t.serif,
                    fontStyle: "italic",
                    fontSize: 12.5,
                    color: t.muted,
                    marginBottom: 4
                  }}>
                  Your estimate
                </div>
                <div
                  style={{
                    fontFamily: t.serif,
                    fontSize: 22,
                    color: t.ink,
                    letterSpacing: -0.4
                  }}>
                  {lo === hi
                    ? lo === 0
                      ? "Free"
                      : `$${lo.toLocaleString()}`
                    : `$${lo.toLocaleString()} – $${hi.toLocaleString()}`}
                </div>
              </div>
              <div
                style={{
                  fontFamily: t.serif,
                  fontStyle: "italic",
                  fontSize: 11.5,
                  color: t.muted,
                  textAlign: "right",
                  lineHeight: 1.4,
                  maxWidth: 140,
                  paddingTop: 2
                }}>
                final quote after Antonio reviews
              </div>
            </Row>

            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: `1px dashed ${t.borderSoft}`
              }}>
              {breakdown.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 6px",
                    margin: "0 -6px",
                    borderRadius: 6
                  }}>
                  <span style={{ color: t.rust, fontSize: 10, lineHeight: 1 }}>
                    ●
                  </span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 12.5,
                      color: t.inkSoft,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 11.5,
                      color: t.rustInk,
                      whiteSpace: "nowrap"
                    }}>
                    {item.fee}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <AskAntonioBar t={t} />
          </div>
          <Row gap={10}>
            <Button
              t={t}
              variant="ghost"
              onClick={goPrev}
              style={{ flex: "0 0 auto" }}>
              Back
            </Button>
            <Button t={t} onClick={handleNext} style={{ flex: 1 }}>
              {sel.size === 0
                ? "Skip — nothing else"
                : `Continue with ${sel.size} add-on${sel.size === 1 ? "" : "s"}`}
            </Button>
          </Row>
        </div>
      </div>
    </Screen>
  );
}
