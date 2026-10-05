"use client";

import { useEffect, useRef } from "react";

type CounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
};

const DURATION_MS = 1600;
/** Ease-out-expo; close to the site's `--ease-out-expo` curve, with no dependency. */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Counts up to `value` when scrolled into view.
 *
 * - The static HTML already contains the final number (SEO, no-JS, and
 *   screen readers get the real value via the sr-only copy).
 * - Frames are written straight to the text node instead of setState: 60
 *   re-renders per second for a number is wasted work. A small rAF loop
 *   replaces Motion's `animate`, which cost bundle size for one tween.
 * - The count only "arms" (resets to 0) if the counter is below the fold on
 *   mount — otherwise a visible "95" would blink to "0".
 */
export function Counter({ value, prefix = "", suffix = "" }: CounterProps) {
  const numberRef = useRef<HTMLSpanElement>(null);

  // One effect owns the whole lifecycle (arm -> observe -> animate -> cleanup), so there is no
  // shared "armed" ref between effects. Syncing with IntersectionObserver + rAF, both outside
  // React, is exactly what useEffect is for.
  useEffect(() => {
    const el = numberRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top <= window.innerHeight) return;
    el.textContent = "0";

    let raf = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / DURATION_MS, 1);
          el.textContent = String(Math.round(value * easeOutExpo(progress)));
          if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      // Restore the real value so a remount / value change never leaves a stale "0".
      el.textContent = String(value);
    };
  }, [value]);

  return (
    <>
      <span aria-hidden="true" className="tabular-nums">
        {prefix}
        <span ref={numberRef}>{value}</span>
        {suffix}
      </span>
      <span className="sr-only">{`${prefix}${value}${suffix}`}</span>
    </>
  );
}
