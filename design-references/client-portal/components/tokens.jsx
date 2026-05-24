// Petal v4 — Design tokens + primitives
// Tone variants: 'editorial' (warm cream), 'minimal' (crisp off-white), 'magazine' (bold/inky)

const PETAL_TOKENS = {
  editorial: {
    bg: '#F5F2EA',
    bgElev: '#FBF9F3',
    ink: '#1A1612',
    inkSoft: '#4A4038',
    muted: '#8A7F72',
    border: '#E4DDCE',
    borderSoft: '#EDE7D9',
    card: '#FFFFFF',
    tintAccent: 'rgba(51, 94, 69, 0.06)',
    tintAccentStrong: 'rgba(51, 94, 69, 0.11)',
    serif: '"Fraunces", "Georgia", serif',
    sans: '"DM Sans", -apple-system, system-ui, sans-serif',
    mono: '"DM Sans", -apple-system, system-ui, sans-serif',
    radius: 14,
    radiusLg: 20,
  },
  minimal: {
    bg: '#FAFAF7',
    bgElev: '#FFFFFF',
    ink: '#111111',
    inkSoft: '#3A3A3A',
    muted: '#8A8A8A',
    border: '#ECECE8',
    borderSoft: '#F2F2EE',
    card: '#FFFFFF',
    tintAccent: 'rgba(51, 94, 69, 0.05)',
    tintAccentStrong: 'rgba(51, 94, 69, 0.09)',
    serif: '"Fraunces", "Georgia", serif',
    sans: '"DM Sans", -apple-system, system-ui, sans-serif',
    mono: '"DM Sans", -apple-system, system-ui, sans-serif',
    radius: 10,
    radiusLg: 14,
  },
  magazine: {
    bg: '#EFEAD8',
    bgElev: '#F8F4E6',
    ink: '#0E0A06',
    inkSoft: '#2B2319',
    muted: '#7A6D5A',
    border: '#1A1612',
    borderSoft: '#D9D0B8',
    card: '#FFFFFF',
    tintAccent: 'rgba(51, 94, 69, 0.08)',
    tintAccentStrong: 'rgba(51, 94, 69, 0.15)',
    serif: '"Fraunces", "Georgia", serif',
    sans: '"DM Sans", -apple-system, system-ui, sans-serif',
    mono: '"DM Sans", -apple-system, system-ui, sans-serif',
    radius: 6,
    radiusLg: 10,
  },
};

// Font pairings for tweak
const FONT_PAIRINGS = {
  classic: {
    serif: '"Fraunces", "Georgia", serif',
    sans: '"DM Sans", -apple-system, system-ui, sans-serif',
    mono: '"DM Sans", -apple-system, system-ui, sans-serif',
    label: 'Fraunces / DM Sans',
  },
  instrument: {
    serif: '"Instrument Serif", "Georgia", serif',
    sans: '"Geist", -apple-system, system-ui, sans-serif',
    mono: '"Geist", -apple-system, system-ui, sans-serif',
    label: 'Instrument / Geist',
  },
  newsreader: {
    serif: '"Newsreader", "Georgia", serif',
    sans: '"Manrope", -apple-system, system-ui, sans-serif',
    mono: '"DM Sans", -apple-system, system-ui, sans-serif',
    label: 'Newsreader / Manrope',
  },
};

// Density presets
const DENSITY = {
  comfortable: { pad: 24, gap: 18, rowPad: 18, tight: 14 },
  cozy: { pad: 16, gap: 12, rowPad: 12, tight: 10 },
};

// Accent — forest green primary. Hue tweakable around greens (130–165).
// NOTE: token keys remain rust* to avoid cascading renames; palette is now forest green.
function accentColors(hue = 150) {
  return {
    rust: `oklch(42% 0.09 ${hue})`,       // forest green primary
    rustDark: `oklch(32% 0.08 ${hue})`,   // deep forest
    rustSoft: `oklch(93% 0.03 ${hue})`,   // pale moss tint
    rustInk: `oklch(28% 0.07 ${hue})`,    // readable on soft tint
    green: `oklch(50% 0.10 ${hue})`,      // kept as "success" alias
    greenSoft: `oklch(93% 0.03 ${hue})`,
    greenInk: `oklch(28% 0.07 ${hue})`,
  };
}

// Theme hook
function useTheme({ tone = 'editorial', fonts = 'classic', density = 'comfortable', hue = 150 } = {}) {
  const base = PETAL_TOKENS[tone];
  const font = FONT_PAIRINGS[fonts];
  const d = DENSITY[density];
  const a = accentColors(hue);
  return { ...base, ...font, ...d, ...a, tone };
}

// ─── Primitive components ──────────────────────────────────────────

function Screen({ t, children, style }) {
  return (
    <div style={{
      background: t.bg, color: t.ink, fontFamily: t.sans,
      height: '100%', overflowY: 'auto', overflowX: 'hidden',
      WebkitFontSmoothing: 'antialiased',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Stack({ gap = 12, children, style }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>{children}</div>;
}

function Row({ gap = 8, align = 'center', justify = 'flex-start', children, style }) {
  return <div style={{ display: 'flex', alignItems: align, justifyContent: justify, gap, ...style }}>{children}</div>;
}

function Card({ t, children, style, onClick, selected, tinted }) {
  return (
    <div onClick={onClick} style={{
      background: tinted ? t.tintAccent : t.card,
      border: `1px solid ${selected ? t.rust : t.border}`,
      borderRadius: t.radius,
      padding: t.pad,
      transition: 'all 0.15s ease',
      cursor: onClick ? 'pointer' : 'default',
      ...(selected && t.tone === 'magazine' ? { borderWidth: 2 } : {}),
      ...style,
    }}>
      {children}
    </div>
  );
}

function Button({ t, variant = 'primary', children, onClick, disabled, style, icon }) {
  const base = {
    primary: { bg: t.rust, fg: '#fff', border: t.rust },
    success: { bg: t.green, fg: '#fff', border: t.green },
    ghost: { bg: 'transparent', fg: t.ink, border: t.border },
    dark: { bg: t.ink, fg: t.bgElev, border: t.ink },
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? t.borderSoft : base.bg,
        color: disabled ? t.muted : base.fg,
        border: `1px solid ${disabled ? t.border : base.border}`,
        borderRadius: t.tone === 'magazine' ? 4 : 999,
        padding: '14px 22px',
        fontFamily: t.sans,
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: -0.1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}>
      {children}
      {icon}
    </button>
  );
}

function Eyebrow({ t, children, style }) {
  return (
    <div style={{
      fontFamily: t.sans,
      fontSize: 14,
      fontWeight: 500,
      letterSpacing: 0.2,
      color: t.muted,
      ...style,
    }}>{children}</div>
  );
}

function H1({ t, children, style }) {
  return (
    <h1 style={{
      fontFamily: t.serif,
      fontWeight: 400,
      fontSize: 34,
      lineHeight: 1.12,
      letterSpacing: -0.8,
      margin: 0,
      color: t.ink,
      textWrap: 'pretty',
      ...style,
    }}>{children}</h1>
  );
}

function H2({ t, children, style }) {
  return (
    <h2 style={{
      fontFamily: t.serif,
      fontWeight: 400,
      fontSize: 24,
      lineHeight: 1.2,
      letterSpacing: -0.4,
      margin: 0,
      color: t.ink,
      textWrap: 'pretty',
      ...style,
    }}>{children}</h2>
  );
}

function Body({ t, muted, mono, size = 15, children, style }) {
  return (
    <p style={{
      fontFamily: mono ? t.mono : t.sans,
      fontSize: size,
      lineHeight: 1.5,
      color: muted ? t.muted : t.inkSoft,
      margin: 0,
      textWrap: 'pretty',
      ...style,
    }}>{children}</p>
  );
}

// Module-level memory so ProgressBar animates across route changes (React remounts).
const __progressLast = { pct: 0, total: 0 };

function ProgressBar({ t, value, total = 100 }) {
  const target = Math.min(100, Math.max(0, (value / total) * 100));
  // Start at whatever the previous screen's ProgressBar left us at (same total),
  // then tween to target in the next frame.
  const [pct, setPct] = React.useState(() =>
    __progressLast.total === total ? __progressLast.pct : 0
  );
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setPct(target));
    __progressLast.pct = target;
    __progressLast.total = total;
    return () => cancelAnimationFrame(id);
  }, [target, total]);
  return (
    <div style={{
      height: t.tone === 'magazine' ? 4 : 3,
      background: t.borderSoft,
      borderRadius: 999,
      overflow: 'hidden',
    }}>
      <div style={{
        width: `${pct}%`,
        height: '100%',
        background: t.rust,
        transition: 'width 720ms cubic-bezier(0.22, 0.61, 0.36, 1)',
      }} />
    </div>
  );
}

// Placeholder slot — monospace label, subtle stripes
function Placeholder({ t, label, w = '100%', h = 60, style }) {
  return (
    <div style={{
      width: w,
      height: h,
      border: `1px dashed ${t.border}`,
      borderRadius: t.radius,
      background: `repeating-linear-gradient(135deg, transparent, transparent 8px, ${t.borderSoft} 8px, ${t.borderSoft} 9px)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: t.mono,
      fontSize: 10,
      color: t.muted,
      letterSpacing: 0.5,
      ...style,
    }}>{label}</div>
  );
}

// Avatar — Antonio's real photo, cropped to circle
function AvatarSlot({ t, size = 56, label = 'A', style }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      border: `1px solid ${t.border}`,
      flexShrink: 0,
      background: t.bgElev,
      ...style,
    }}>
      <img
        src="assets/antonio.webp"
        alt={label}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: '50% 22%',
          display: 'block',
        }}
      />
    </div>
  );
}

Object.assign(window, {
  PETAL_TOKENS, FONT_PAIRINGS, DENSITY, accentColors, useTheme,
  Screen, Stack, Row, Card, Button, Eyebrow, H1, H2, Body,
  ProgressBar, Placeholder, AvatarSlot,
});
