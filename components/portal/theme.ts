/**
 * Portal theme — 1:1 port of the editorial tone in
 * design-references/client-portal/components/tokens.jsx.
 *
 * Every screen consumes these values via the `t` object (same name
 * as the reference) so inline-style port can match pixel for pixel.
 *
 * The `rust*` variable names are preserved verbatim from the design
 * file — the design file notes the palette switched to forest green
 * without renaming the keys, and we follow suit so the JSX ports
 * read identically to the reference.
 */

export type PortalTheme = {
  // Surfaces
  bg: string;
  bgElev: string;
  ink: string;
  inkSoft: string;
  muted: string;
  border: string;
  borderSoft: string;
  card: string;
  tintAccent: string;
  tintAccentStrong: string;

  // Fonts
  serif: string;
  sans: string;
  mono: string;

  // Shape
  radius: number;
  radiusLg: number;

  // Accent (forest green; key names preserved as rust* from design)
  rust: string;
  rustDark: string;
  rustSoft: string;
  rustInk: string;
  green: string;
  greenSoft: string;
  greenInk: string;

  // Density
  pad: number;
  gap: number;
  rowPad: number;
  tight: number;

  tone: "editorial";
};

export const t: PortalTheme = {
  // Editorial tone
  bg: "#F5F2EA",
  bgElev: "#FBF9F3",
  ink: "#1A1612",
  inkSoft: "#4A4038",
  muted: "#8A7F72",
  border: "#E4DDCE",
  borderSoft: "#EDE7D9",
  card: "#FFFFFF",
  tintAccent: "rgba(51, 94, 69, 0.06)",
  tintAccentStrong: "rgba(51, 94, 69, 0.11)",

  // Classic font pairing — Fraunces / DM Sans (mono role also DM Sans per design)
  serif: '"Fraunces", "Georgia", serif',
  sans: '"DM Sans", -apple-system, system-ui, sans-serif',
  mono: '"DM Sans", -apple-system, system-ui, sans-serif',

  radius: 14,
  radiusLg: 20,

  // Forest-green accent (oklch from reference, hue=150)
  rust: "oklch(42% 0.09 150)",
  rustDark: "oklch(32% 0.08 150)",
  rustSoft: "oklch(93% 0.03 150)",
  rustInk: "oklch(28% 0.07 150)",
  green: "oklch(50% 0.10 150)",
  greenSoft: "oklch(93% 0.03 150)",
  greenInk: "oklch(28% 0.07 150)",

  // Density — comfortable
  pad: 24,
  gap: 18,
  rowPad: 18,
  tight: 14,

  tone: "editorial"
};
