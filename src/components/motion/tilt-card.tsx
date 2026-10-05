"use client";

import { useMotionValue, useSpring } from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { useRenderMotion } from "./use-render-motion";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees. */
  maxTilt?: number;
};

const GLOW_SIZE = 320;
const SPRING = { stiffness: 180, damping: 20, mass: 0.6 };

/**
 * 3D tilt + cursor-following glow, driven only by transform/opacity.
 *
 * The card's content is passed as `children` from a Server Component, so the
 * text, tags and links are static HTML; only this wrapper ships JS.
 */
export function TiltCard({ children, className = "", maxTilt = 6 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);
  const glowOpacity = useSpring(0, { stiffness: 200, damping: 30 });
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const rect = useRef<DOMRect | null>(null);
  const enabled = useRef(false);

  useRenderMotion(cardRef, [rotateX, rotateY], (element) => {
    element.style.transform = `perspective(1000px) rotateX(${rotateX.get()}deg) rotateY(${rotateY.get()}deg)`;
  });
  useRenderMotion(glowRef, [glowX, glowY, glowOpacity], (element) => {
    element.style.transform = `translate3d(${glowX.get()}px, ${glowY.get()}px, 0)`;
    element.style.opacity = String(glowOpacity.get());
  });

  function onPointerEnter(event: PointerEvent<HTMLDivElement>) {
    enabled.current =
      event.pointerType === "mouse" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!enabled.current) return;
    rect.current = event.currentTarget.getBoundingClientRect();
    glowOpacity.set(1);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const box = rect.current;
    if (!enabled.current || !box) return;
    const localX = event.clientX - box.left;
    const localY = event.clientY - box.top;
    // -0.5…0.5 from the card centre.
    const offsetX = localX / box.width - 0.5;
    const offsetY = localY / box.height - 0.5;
    rotateY.set(offsetX * 2 * maxTilt);
    rotateX.set(-offsetY * 2 * maxTilt);
    glowX.set(localX - GLOW_SIZE / 2);
    glowY.set(localY - GLOW_SIZE / 2);
  }

  function onPointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
    glowOpacity.set(0);
  }

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 rounded-full bg-[radial-gradient(closest-side,var(--mesh-1),transparent)] opacity-0"
        style={{ width: GLOW_SIZE, height: GLOW_SIZE }}
      />
      {children}
    </div>
  );
}
