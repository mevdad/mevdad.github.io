"use client";

import type Lenis from "lenis";
import { useEffect } from "react";

/**
 * Lenis smooth scrolling + accessible in-page anchor navigation.
 *
 * - Lenis is loaded with a dynamic import, so it never sits in the
 *   first-load bundle and is never downloaded with reduced motion.
 * - Only on fine pointers (mouse/trackpad) and only once the main thread is idle.
 * - Reduced motion is honoured live: flipping the OS setting tears Lenis
 *   down (or starts it) without a reload.
 * - Anchor clicks are handled here rather than with Lenis' `anchors`
 *   option, because that option only scrolls: it does not move keyboard
 *   focus, which breaks the skip link and leaves screen-reader users at
 *   the top of the page.
 * - The sticky-header offset comes from CSS `scroll-margin-top` on sections,
 *   which both Lenis and native `scrollIntoView` respect — one source of truth.
 */
export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Touch screens already have native momentum scrolling; Lenis would only
    // add a permanent rAF loop there. Smooth scrolling is for wheel/trackpad.
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let lenis: Lenis | null = null;
    let disposed = false;
    // Guards against the async import resolving after unmount / setting change.
    let generation = 0;

    async function start() {
      // Checked before the import: with reduced motion Lenis is never even downloaded.
      if (disposed || !finePointer || media.matches) return;
      const current = ++generation;
      const { default: LenisCtor } = await import("lenis");
      // `lenis` guard: two overlapping start() calls (idle callback + motion-preference
      // change) can both pass the generation check; a second instance would double-drive scroll.
      if (disposed || current !== generation || media.matches || lenis) return;
      lenis = new LenisCtor({ autoRaf: true, lerp: 0.11 });
    }

    function stop() {
      generation++;
      lenis?.destroy();
      lenis = null;
    }

    function onMotionPreferenceChange() {
      if (media.matches) stop();
      else void start();
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>("a[href*='#']");
      if (!anchor) return;
      const url = new URL(anchor.href);
      if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !url.hash) {
        return;
      }

      // A malformed escape (e.g. "#%E0%A4%A") makes decodeURIComponent throw; leave it to the browser.
      let id: string;
      try {
        id = decodeURIComponent(url.hash.slice(1));
      } catch {
        return;
      }
      // "#top" is a real focusable element (<div id="top" tabindex="-1"> in the layout), so it is
      // handled like any other target; only the scroll position is special (0, not the div's offset).
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      // Focus first, without scrolling: it no longer depends on the scroll animation finishing
      // (an interrupted Lenis scroll never calls onComplete); the scroll below does the moving.
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });

      const toTop = id === "top";
      if (lenis) {
        lenis.scrollTo(toTop ? 0 : target);
      } else {
        // Reduced motion / Lenis not ready: jump instantly (CSS scroll-margin handles the header).
        if (toTop) window.scrollTo({ top: 0 });
        else target.scrollIntoView({ block: "start" });
      }

      // Clicking the link for the hash we are already on must not stack identical history entries.
      const next = toTop ? url.pathname + url.search : url.hash;
      const alreadyThere = toTop ? window.location.hash === "" : window.location.hash === url.hash;
      if (alreadyThere) history.replaceState(null, "", next);
      else history.pushState(null, "", next);
    }

    // Start once the browser is idle, so Lenis never competes with hydration.
    // (Safari has no requestIdleCallback; a short timeout is the fallback.)
    const scheduleStart = () => void start();
    const idleHandle =
      // DOM typings claim requestIdleCallback always exists; Safari disagrees, so check at runtime.
      typeof window.requestIdleCallback === "function"
        ? { kind: "idle" as const, id: window.requestIdleCallback(scheduleStart, { timeout: 1500 }) }
        : { kind: "timeout" as const, id: window.setTimeout(scheduleStart, 300) };
    media.addEventListener("change", onMotionPreferenceChange);
    document.addEventListener("click", onClick);

    return () => {
      disposed = true;
      if (idleHandle.kind === "idle") window.cancelIdleCallback(idleHandle.id);
      else window.clearTimeout(idleHandle.id);
      media.removeEventListener("change", onMotionPreferenceChange);
      document.removeEventListener("click", onClick);
      stop();
    };
  }, []);

  return null;
}
