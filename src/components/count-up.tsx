import { useLayoutEffect, useEffect, useRef, useState } from "react";

// useLayoutEffect on the client so the count starts before first paint (no flash of the final value).
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Ease-out cubic: fast start, gentle landing. */
export function easeOutCubic(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}

/** Value shown `progress` (0..1) of the way from `from` to `to`. */
export function countUpValue(from: number, to: number, progress: number) {
  return from + (to - from) * easeOutCubic(progress);
}

/**
 * Counts up to `value` when it first appears, and from the old to the new value when it changes.
 * Shows the final value straight away for reduced motion. Presentation only.
 */
export function CountUp({
  value,
  decimals = 2,
  duration = 900,
  className,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);

  useBeforePaint(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const began = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = (now - began) / duration;
      const next = progress >= 1 ? value : countUpValue(start, value, progress);
      from.current = next;
      setShown(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    setShown(start);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className={className}>{shown.toFixed(decimals)}</span>;
}
