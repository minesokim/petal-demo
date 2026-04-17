import { Geist, DM_Sans, Geist_Mono, Fraunces } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-mono"
});

// v4: Fraunces is the development/fallback face for P22 Mackinac Pro (self-hosted in globals.css).
// Production uses P22 via @font-face; Fraunces sits behind it in the stack.
//
// Italic is loaded as a real style (not synthesized). The self-hosted P22 Mackinac
// files ship roman-only, so when `font-style: italic` is applied the browser would
// either synthesize-skew the P22 glyphs or reach to the next font in the stack.
// Loading Fraunces italic explicitly ensures we fall through to real italic letterforms
// with proper descenders and terminals instead of a skewed-roman artifact.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces"
});

export const fontVariables = cn(
  geist.variable,
  dmSans.variable,
  geistMono.variable,
  fraunces.variable
);
