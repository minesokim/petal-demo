import * as React from "react";

/**
 * Parses *asterisked* fragments as italic rust serif accents.
 * Used in triage detail titles, insight bodies, and similar places
 * where a single editorial accent word is rendered in italic rust
 * (P22 Mackinac opsz 14 SOFT 80, fallback Fraunces).
 */
export function SerifWithAccent({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("*") && p.endsWith("*") ? (
          <em
            key={i}
            className="italic text-rust"
            style={{ fontVariationSettings: '"opsz" 14, "SOFT" 80' }}>
            {p.slice(1, -1)}
          </em>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

/**
 * Wraps $-prefixed numeric tokens in a mono tabular-nums span.
 * Works alongside SerifWithAccent inside the same string — call
 * SerifWithAccent last so its em wrapping survives number parsing.
 */
export function MonoNumbers({ text }: { text: string }) {
  const parts = text.split(/(\$[0-9,]+(?:\.[0-9]+)?)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\$/.test(p) ? (
          <span key={i} className="font-mono tabular-nums">
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

/**
 * Parses **double-asterisk** fragments as weight-550 ink strongs.
 * Used in activity-timeline entries and similar-clients labels.
 */
export function InkStrong({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-[550] text-ink">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}
