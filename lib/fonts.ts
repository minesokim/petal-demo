import { Geist, DM_Sans, Geist_Mono, Spectral, Fraunces } from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

// TWK Lausanne (Pan) — the main UI sans, self-hosted with real 400/500/600/700.
const twkLausanne = localFont({
  src: [
    { path: "./twk/TWKLausannePan-400.woff2", weight: "400", style: "normal" },
    { path: "./twk/TWKLausannePan-500.woff2", weight: "500", style: "normal" },
    { path: "./twk/TWKLausannePan-600.woff2", weight: "600", style: "normal" },
    { path: "./twk/TWKLausannePan-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-twk",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-mono"
});

// v4: Spectral is the editorial serif for brand, headings, client names, AI insight body.
// Loads roman + italic so font-style: italic resolves to real letterforms.
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral"
});

// Fraunces is retained for the client portal (app/clientportal), which references
// it directly via inline fontFamily. Not part of the dashboard serif stack.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces"
});

export const fontVariables = cn(
  geist.variable,
  twkLausanne.variable,
  dmSans.variable,
  geistMono.variable,
  spectral.variable,
  fraunces.variable
);
