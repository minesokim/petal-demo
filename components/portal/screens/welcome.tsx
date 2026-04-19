"use client";

import * as React from "react";

import type { PortalTheme } from "../theme";
import { Body, Button, Row, Screen, Stack } from "../primitives";
import { useIntakeStore } from "@/lib/portal/intake-store";

/**
 * Welcome screen — 1:1 port of ScreenWelcome + VideoPlaceholder +
 * TrustPill in design-references/client-portal/components/
 * intake-screens.jsx (L362–530).
 */

function VideoPlaceholder({ t }: { t: PortalTheme }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: t.radius,
        overflow: "hidden",
        position: "relative",
        background:
          "linear-gradient(135deg, #1a3a26 0%, #0c1f15 70%, #050a07 100%)",
        cursor: "pointer",
        boxShadow: "0 8px 24px rgba(12, 31, 21, 0.18)"
      }}>
      {/* Soft leafy highlight */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 25% 20%, rgba(120, 180, 140, 0.12), transparent 55%)"
        }}
      />
      {/* Film grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 3px)",
          mixBlendMode: "overlay"
        }}
      />

      {/* Corner label */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 16,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#d94545",
            boxShadow: "0 0 0 3px rgba(217, 69, 69, 0.22)"
          }}
        />
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 9.5,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: 1.2,
            textTransform: "uppercase"
          }}>
          REC · ANTONIO
        </span>
      </div>

      {/* Center play */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14
        }}>
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.15)",
            border: "1.5px solid rgba(255, 255, 255, 0.35)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
            transition: "transform 0.15s"
          }}>
          <svg
            width="22"
            height="24"
            viewBox="0 0 22 24"
            fill="none"
            style={{ marginLeft: 4 }}>
            <path d="M2 2 L20 12 L2 22 Z" fill="#fff" />
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: t.serif,
              fontSize: 17,
              color: "#fff",
              letterSpacing: -0.2,
              fontStyle: "italic",
              marginBottom: 4
            }}>
            A message from Antonio
          </div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10.5,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: 0.8
            }}>
            1:12 · TAP TO PLAY
          </div>
        </div>
      </div>

      {/* Bottom scrubber stub */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 14,
          right: 14,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 9,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: 0.5
          }}>
          0:00
        </span>
        <div
          style={{
            flex: 1,
            height: 2,
            borderRadius: 2,
            background: "rgba(255,255,255,0.2)"
          }}
        />
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 9,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: 0.5
          }}>
          1:12
        </span>
      </div>
    </div>
  );
}

function TrustPill({
  t,
  children,
  icon
}: {
  t: PortalTheme;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 11px",
        background: t.bgElev,
        border: `1px solid ${t.borderSoft}`,
        borderRadius: 999,
        fontFamily: t.sans,
        fontSize: 11,
        color: t.inkSoft,
        letterSpacing: 0.1
      }}>
      {icon}
      {children}
    </div>
  );
}

export function ScreenWelcome({ t }: { t: PortalTheme }) {
  const { goNext } = useIntakeStore();
  const ic = {
    width: 11,
    height: 11,
    fill: "none" as const,
    stroke: t.rust,
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  return (
    <Screen t={t}>
      <div
        style={{
          padding: "36px 24px 28px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%"
        }}>
        <Stack gap={26} style={{ flex: 1 }}>
          <VideoPlaceholder t={t} />

          <Stack gap={14} style={{ textAlign: "center" }}>
            <div>
              <div
                style={{
                  fontFamily: t.serif,
                  fontWeight: 400,
                  fontSize: 26,
                  lineHeight: 1.15,
                  letterSpacing: -0.4,
                  color: t.ink
                }}>
                Welcome to<br />
                <span style={{ fontStyle: "italic" }}>Vazant Consulting</span>
              </div>
            </div>
            <Body
              t={t}
              size={14.5}
              style={{ maxWidth: 310, margin: "0 auto" }}>
              I&apos;m Antonio Vazquez, Enrolled Agent. Let&apos;s get your
              taxes handled. Answer a few questions — takes about 10 minutes.
            </Body>
          </Stack>

          <Row gap={6} justify="center" style={{ flexWrap: "wrap" }}>
            <TrustPill
              t={t}
              icon={
                <svg {...ic} viewBox="0 0 11 11">
                  <rect x="2" y="4.5" width="7" height="5" rx="0.8" />
                  <path d="M3.5 4.5V3a2 2 0 014 0v1.5" />
                </svg>
              }>
              AES-256 encrypted
            </TrustPill>
            <TrustPill
              t={t}
              icon={
                <svg {...ic} viewBox="0 0 11 11">
                  <path d="M5.5 1l3 1.5v2.5c0 2-1.3 3.8-3 4.5-1.7-.7-3-2.5-3-4.5V2.5z" />
                  <path d="M4 5.5l1.2 1.2L7.5 4.2" />
                </svg>
              }>
              Enrolled Agent
            </TrustPill>
            <TrustPill
              t={t}
              icon={
                <svg {...ic} viewBox="0 0 11 11">
                  <circle cx="5.5" cy="5.5" r="4" />
                  <path d="M5.5 3.5v2l1.5 1" />
                </svg>
              }>
              ~10 minutes
            </TrustPill>
          </Row>
        </Stack>

        <Stack gap={14} style={{ marginTop: 28 }}>
          <Button
            t={t}
            onClick={goNext}
            style={{ width: "100%", padding: "15px 22px", fontSize: 15 }}>
            Let&apos;s get started
          </Button>
          <div
            style={{
              fontSize: 11.5,
              color: t.muted,
              lineHeight: 1.5,
              textAlign: "center",
              maxWidth: 320,
              margin: "0 auto"
            }}>
            We&apos;ll ask about your filing status, income sources, and
            dependents. Then you&apos;ll upload your documents and sign your
            engagement letter.
          </div>
          <div
            style={{
              fontSize: 10,
              color: t.muted,
              letterSpacing: 0.4,
              textAlign: "center",
              fontFamily: t.mono,
              textTransform: "uppercase",
              paddingTop: 4
            }}>
            Your information is never shared or sold
          </div>
        </Stack>
      </div>
    </Screen>
  );
}
