"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef } from "react";

type CounterProps = {
  value: number;
  prefix?: string;
  suffix?: string;
};

/**
 * Counts up to `value` when scrolled into view.
 *
 * - The static HTML already contains the final number (SEO, no-JS, and
 *   screen readers get the real value via the sr-only copy).
 * - Frames are written straight to the text node instead of setState: 60
 *   re-renders per second for a number is wasted work.
 * - The count only "arms" (resets to 0) if the counter is below the fold on
 *   mount — otherwise a visible "95" would blink to "0".
 */
export function Counter({ value, prefix = "", suffix = "" }: CounterProps) {
  const numberRef = useRef<HTMLSpanElement>(null);
  const armed = useRef(false);
  const inView = useInView(numberRef, { once: true, margin: "0px 0px -10% 0px" });

  useEffect(() => {
    const el = numberRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.textContent = "0";
      armed.current = true;
    }
  }, []);

  useEffect(() => {
    const el = numberRef.current;
    if (!inView || !armed.current || !el) return;
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        el.textContent = String(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [inView, value]);

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
