"use client";

import { useEffect } from "react";

/**
 * One observer for the whole page instead of a client component per
 * revealed element. Sections stay Server Components and just carry a
 * `data-reveal` attribute (see `revealProps`); this island renders nothing.
 *
 * Why useEffect is legitimate here: we are synchronising with systems
 * outside React (the DOM + IntersectionObserver), not deriving render state.
 */
export function RevealObserver() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const viewportHeight = window.innerHeight;

    // Anything already on screen is marked revealed *before* hiding kicks in,
    // so nothing the user is looking at blinks out and back.
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportHeight && rect.bottom > 0) el.dataset.revealed = "";
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // `entry.target` is typed as Element; narrowing (not casting) proves it has `dataset`.
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
          entry.target.dataset.revealed = "";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    for (const el of targets) {
      if (!("revealed" in el.dataset)) observer.observe(el);
    }
    root.dataset.revealReady = "";

    return () => {
      observer.disconnect();
      delete root.dataset.revealReady;
    };
  }, []);

  return null;
}
