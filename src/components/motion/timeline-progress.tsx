"use client";

import { useScroll, useSpring } from "motion/react";
import { useRef, type ReactNode } from "react";
import { useRenderMotion } from "./use-render-motion";

/**
 * Wraps the (server-rendered) timeline and draws a progress line that fills
 * as you scroll through it. Scroll-linked, transform-only (scaleY).
 * With reduced motion the CSS forces the line to its full, static state.
 */
export function TimelineProgress({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 55%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useRenderMotion(lineRef, [scaleY], (element) => {
    element.style.transform = `scaleY(${scaleY.get()})`;
  });

  return (
    <div ref={ref} className="relative">
      <div aria-hidden="true" className="absolute top-2 bottom-2 left-[7px] w-px bg-line" />
      <div
        ref={lineRef}
        aria-hidden="true"
        className="timeline-progress absolute top-2 bottom-2 left-[7px] w-px origin-top bg-accent-text"
        // Inline `transform`, not Tailwind's `scale-y-0`: Tailwind v4 uses the separate
        // `scale` property, which would compose with (and override) our scaleY writes.
        style={{ transform: "scaleY(0)" }}
      />
      {children}
    </div>
  );
}
