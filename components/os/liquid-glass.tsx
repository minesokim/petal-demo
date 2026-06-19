"use client";

/**
 * LiquidGlass — a native CSS/SVG re-implementation of dashersw/liquid-glass-js.
 *
 * The original is vanilla JS: it screenshots the page with html2canvas and
 * refracts that texture through a WebGL fragment shader every frame. That can't
 * live in a React/Next app (imperative DOM, per-frame page rasterization). This
 * port reproduces the SAME look with no html2canvas and no per-frame work:
 *
 *   • Refraction  — an SVG <feDisplacementMap> over the element's backdrop. The
 *     displacement map is generated procedurally from the EXACT math the shader
 *     used: per pixel, displace along the outward normal by an exponential
 *     edge + rim profile (strong, razor-thin at the very rim; near-zero inside).
 *   • Blur        — backdrop-filter blur() (shader did a 5px gaussian on the sample).
 *   • Tint        — a vertical white→grey overlay (shader: mix to (1,1,1)→(0.7) @ 0.2).
 *   • Shape       — rounded / pill / circle, matched to the shader's SDFs.
 *   • Shadow      — 0 25px 50px rgba(0,0,0,0.25), straight from glass.css.
 *
 * Defaults are the library's tuned values (controls.js). Reads best over imagery
 * or colour — over a flat near-white surface the refraction is naturally subtle,
 * exactly as the original behaves.
 */

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type GlassShape = "rounded" | "pill" | "circle";

export interface LiquidGlassProps {
  type?: GlassShape;
  /** rounded-corner radius in px (ignored for pill/circle, which derive it) */
  radius?: number;
  /** backdrop blur in px — library default 5 */
  blur?: number;
  /** backdrop saturation multiplier (library doesn't saturate; 1 = faithful) */
  saturate?: number;
  /** white→grey vertical tint strength — library default 0.2 */
  tintOpacity?: number;
  edgeIntensity?: number;
  rimIntensity?: number;
  baseIntensity?: number;
  edgeDistance?: number;
  rimDistance?: number;
  baseDistance?: number;
  cornerBoost?: number;
  /** enable the centre "warp" (library default off) */
  warp?: boolean;
  /** px gain applied to the displacement map (tunes refraction strength) */
  displacementScale?: number;
  /** subtle specular rim highlight (the refracted rim reads as a bright edge) */
  highlight?: boolean;
  /** drop shadow (library: 0 25px 50px rgba(0,0,0,.25)) */
  shadow?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

// Encoding gain: maps the shader's intensity (~0.06 max) into a usable 0–255
// displacement-map range; feDisplacementMap `scale` converts it back to px.
const ENCODE_GAIN = 8.3;
const MAP_CAP = 700; // cap generated-map dimension for perf

export function LiquidGlass({
  type = "rounded",
  radius = 28,
  blur = 2.5,
  saturate = 1.08,
  tintOpacity = 0.2,
  edgeIntensity = 0.01,
  rimIntensity = 0.05,
  baseIntensity = 0.01,
  edgeDistance = 0.15,
  rimDistance = 0.8,
  baseDistance = 0.1,
  cornerBoost = 0.02,
  warp = false,
  displacementScale = 170,
  highlight = true,
  shadow = true,
  className,
  style,
  children,
}: LiquidGlassProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const filterId = `lg-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [mapUrl, setMapUrl] = useState("");

  const effRadius =
    type === "circle" ? Math.min(size.w, size.h) / 2 : type === "pill" ? size.h / 2 : radius;

  // measure the host (drives map regeneration + correct shape radii).
  // Measure synchronously on mount + next frame — don't rely on ResizeObserver
  // firing initially (it doesn't in every engine); RO + resize handle changes.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      setSize(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    let ro: ResizeObserver | undefined;
    try {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } catch {
      /* ResizeObserver unsupported — synchronous + resize fallback below */
    }
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // generate the displacement map — same normal × (edge+rim) profile as the shader
  useEffect(() => {
    if (!size.w || !size.h) return;
    const down = Math.min(1, MAP_CAP / Math.max(size.w, size.h));
    const w = Math.max(1, Math.round(size.w * down));
    const h = Math.max(1, Math.round(size.h * down));
    const rad = Math.max(0.5, effRadius * down);

    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(w, h);
    const d = img.data;
    const cx = w / 2;
    const cy = h / 2;
    const hx = w / 2;
    const hy = h / 2;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5;
        const py = y + 0.5;

        // outward normal (matches shader: normalize(coord - center))
        let nx = px - cx;
        let ny = py - cy;
        const nlen = Math.hypot(nx, ny) || 1;
        nx /= nlen;
        ny /= nlen;

        // distance inside the shape edge, in px (>= 0)
        let dist: number;
        if (type === "circle") {
          dist = rad - Math.hypot(px - cx, py - cy);
        } else if (type === "pill") {
          const sx = rad;
          const ex = w - rad;
          const t = Math.max(0, Math.min(1, (px - sx) / Math.max(1, ex - sx)));
          const clx = sx + t * (ex - sx);
          dist = rad - Math.hypot(px - clx, py - cy);
        } else {
          const tx = Math.abs(px - cx) - (hx - rad);
          const ty = Math.abs(py - cy) - (hy - rad);
          const outside = Math.hypot(Math.max(tx, 0), Math.max(ty, 0));
          const inside = Math.min(Math.max(tx, ty), 0);
          dist = -(outside + inside - rad); // negate SDF → positive inside
        }
        dist = Math.max(dist, 0);

        let intensity =
          edgeIntensity * Math.exp(-dist * edgeDistance) +
          rimIntensity * Math.exp(-dist * rimDistance);
        if (warp) intensity += baseIntensity * (1 - Math.exp(-dist * baseDistance));
        // corner boost (rounded only) — echoes the shader's cornerRefraction
        if (type === "rounded") {
          const cdx = Math.min(px, w - px);
          const cdy = Math.min(py, h - py);
          const corner = Math.max(cdx, cdy);
          intensity += cornerBoost * Math.exp(-corner * 0.3);
        }

        const ax = nx * intensity * ENCODE_GAIN;
        const ay = ny * intensity * ENCODE_GAIN;
        const i = (y * w + x) * 4;
        d[i] = Math.max(0, Math.min(255, Math.round(128 + ax * 127)));
        d[i + 1] = Math.max(0, Math.min(255, Math.round(128 + ay * 127)));
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    setMapUrl(cv.toDataURL());
  }, [
    size.w, size.h, effRadius, type, warp,
    edgeIntensity, rimIntensity, baseIntensity, edgeDistance, rimDistance, baseDistance, cornerBoost,
  ]);

  const borderRadius =
    type === "circle" || type === "pill" ? `${effRadius || 9999}px` : `${radius}px`;

  const backdrop =
    mapUrl
      ? `url(#${filterId}) blur(${blur}px) saturate(${saturate})`
      : `blur(${blur}px) saturate(${saturate})`;

  const grey = 178; // 0.7 * 255, from the shader's bottom tint

  return (
    <div
      ref={hostRef}
      className={cn("relative isolate inline-flex items-center justify-center", className)}
      style={{
        borderRadius,
        boxShadow: shadow ? "0 25px 50px rgba(0,0,0,0.25)" : undefined,
        ...style,
      }}
    >
      {/* refraction + blur layer (filters the backdrop behind the host).
          z-index -1 keeps it above the page but below in-flow content, so
          children size the host naturally and still paint on top. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: -1,
          borderRadius,
          backdropFilter: backdrop,
          WebkitBackdropFilter: `blur(${blur}px) saturate(${saturate})`,
        }}
      />
      {/* vertical white→grey tint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: -1,
          borderRadius,
          background: `linear-gradient(to bottom, rgba(255,255,255,${tintOpacity}), rgba(${grey},${grey},${grey},${tintOpacity}))`,
        }}
      />
      {/* specular rim — the refracted edge reads as a bright lip + faint hairline */}
      {highlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius,
            boxShadow:
              "inset 0 1px 0.5px rgba(255,255,255,0.55), inset 0 -1px 1px rgba(255,255,255,0.12), inset 0 0 0 0.5px rgba(255,255,255,0.16)",
          }}
        />
      )}

      {/* the generated displacement map, wired to feDisplacementMap */}
      {mapUrl && size.w > 0 && (
        <svg aria-hidden width="0" height="0" style={{ position: "absolute" }}>
          <filter
            id={filterId}
            x="0"
            y="0"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
            primitiveUnits="objectBoundingBox"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={mapUrl}
              x="0"
              y="0"
              width="1"
              height="1"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      )}

      {/* content is in normal flow (sizes the host) and paints above the
          z-index:-1 glass layers */}
      {children}
    </div>
  );
}
