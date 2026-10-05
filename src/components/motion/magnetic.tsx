"use client";

import { useMotionValue, useSpring } from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { useRenderMotion } from "./use-render-motion";

type MagneticProps = {
  children: ReactNode;
  /** 0–1: how far the element follows the cursor relative to the offset. */
  strength?: number;
};

const SPRING = { stiffness: 260, damping: 18, mass: 0.5 };

/**
 * Pulls its child towards the mouse cursor.
 *
 * Client island because it needs pointer events. Motion values + springs
 * update `transform` outside React's render cycle — moving the mouse does not
 * re-render anything, which keeps INP flat. Only reacts to a real mouse
 * (touch/pen are ignored) and does nothing with reduced motion.
 */
export function Magnetic({ children, strength = 0.3 }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);
  // Measured once on enter: reading layout on every move would also measure
  // our own transform and feed it back into the next frame.
  const rect = useRef<DOMRect | null>(null);
  const enabled = useRef(false);

  useRenderMotion(ref, [springX, springY], (element) => {
    element.style.transform = `translate3d(${springX.get()}px, ${springY.get()}px, 0)`;
  });

  function onPointerEnter(event: PointerEvent<HTMLSpanElement>) {
    enabled.current =
      event.pointerType === "mouse" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rect.current = enabled.current ? event.currentTarget.getBoundingClientRect() : null;
  }

  function onPointerMove(event: PointerEvent<HTMLSpanElement>) {
    const box = rect.current;
    if (!enabled.current || !box) return;
    x.set((event.clientX - (box.left + box.width / 2)) * strength);
    y.set((event.clientY - (box.top + box.height / 2)) * strength);
  }

  function onPointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <span
      ref={ref}
      className="inline-flex"
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </span>
  );
}
