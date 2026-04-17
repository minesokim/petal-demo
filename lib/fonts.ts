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
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces"
});

export const fontVariables = cn(
  geist.variable,
  dmSans.variable,
  geistMono.variable,
  fraunces.variable
);
