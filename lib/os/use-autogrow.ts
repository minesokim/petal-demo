import { useEffect, useRef } from "react";

/**
 * Auto-grow a textarea from a single line up to `maxPx`, then scroll — the claude.ai composer idiom.
 * Re-measures whenever `value` changes: typing, shift+enter newlines, a starter/skill prompt injected
 * externally, or the reset to "" after a send. The default cap is ~17 lines at the chat type scale.
 */
export function useAutogrow(value: string, maxPx = 384) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`;
    el.style.overflowY = el.scrollHeight > maxPx ? "auto" : "hidden";
  }, [value, maxPx]);
  return ref;
}
