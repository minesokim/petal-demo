"use client";

// Liquid-glass demo surface. Not in nav — reach it at /os/glass.
// Showcases the native LiquidGlass component over imagery + colour so the
// refraction reads. Used to dial the look 1:1 with dashersw/liquid-glass-js.

import { LiquidGlass } from "@/components/os/liquid-glass";
import { PetalMark } from "@/components/petal-mark";

export default function GlassDemoPage() {
  return (
    <div className="h-full overflow-y-auto bg-neutral-950">
      {/* rich backdrop — a photo with a colour wash, like the library demo */}
      <div className="relative min-h-full">
        <img
          src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1600&q=80"
          alt=""
          className="fixed inset-0 h-full w-full object-cover"
        />
        <div className="fixed inset-0 bg-gradient-to-tr from-[#6b5bff]/40 via-transparent to-[#13d6c4]/40" />

        <div className="relative mx-auto max-w-4xl px-8 py-16">
          <h1 className="text-[26px] font-semibold tracking-tight text-white drop-shadow">Liquid glass</h1>
          <p className="mt-1 max-w-xl text-[13px] text-white/70">
            Native CSS/SVG port of liquid-glass-js — feDisplacementMap refraction (same edge/rim/normal
            math as the shader), blur, white→grey tint, and the library shadow. No html2canvas.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-8">
            <LiquidGlass type="pill">
              <span className="flex items-center gap-2 px-7 py-3.5 text-[15px] font-medium text-white">
                <PetalMark className="size-4" /> Ask Petal
              </span>
            </LiquidGlass>

            <LiquidGlass type="circle">
              <span className="grid size-20 place-items-center text-white">
                <PetalMark className="size-8" />
              </span>
            </LiquidGlass>
          </div>

          <div className="mt-10 flex flex-wrap gap-8">
            <LiquidGlass type="rounded" radius={32}>
              <div className="w-[320px] px-7 py-6 text-white">
                <div className="text-[16px] font-semibold">Refraction at the rim</div>
                <div className="mt-1.5 text-[13px] leading-relaxed text-white/80">
                  The photo behind this card bends hardest right at the edge and settles flat in the
                  middle — the signature of the original library, done with an SVG displacement map.
                </div>
              </div>
            </LiquidGlass>

            <LiquidGlass type="rounded" radius={32}>
              <div className="grid w-[220px] grid-cols-3 gap-3 px-6 py-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="grid aspect-square place-items-center rounded-xl bg-white/10 text-white">
                    <PetalMark className="size-5 opacity-80" />
                  </span>
                ))}
              </div>
            </LiquidGlass>
          </div>
        </div>
      </div>
    </div>
  );
}
