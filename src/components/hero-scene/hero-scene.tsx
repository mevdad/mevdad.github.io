"use client";

import { useEffect, useRef, useState } from "react";
import { heroScene } from "@/content/hero-scene";
import type { SceneHandle } from "./scene"; // type-only: erased at build, pulls nothing into this chunk

/**
 * Client island for the hero's 3D scene. Why it is a Client Component: it needs effects, browser
 * APIs (IntersectionObserver, matchMedia, WebGL) and state. It is the only client code in the hero
 * besides the Magnetic buttons, and it stays tiny: the heavy part (three.js + model) is behind a
 * dynamic `import("./scene")`, i.e. code splitting — a separate chunk the browser fetches only when
 * this island decides to.
 *
 * Loading strategy (the page's LCP and TBT must not notice the scene exists):
 *   1. SSR/first paint: a fixed-aspect box with a static poster (WebP, ~tens of KB). No JS needed.
 *   2. After `load` AND an idle callback AND the box being on screen: import the scene chunk and
 *      download the model.
 *   3. Skipped entirely (poster + "Play" button instead) for reduced motion, Save-Data, slow
 *      connections and narrow screens. Playing then is the user's explicit choice.
 *   4. Once live, the scene pauses itself off-screen and in background tabs (see scene.ts).
 */

type Phase = "poster" | "loading" | "live";

interface ConnectionInfo {
  saveData?: unknown;
  effectiveType?: unknown;
}

/** Why auto-start is declined, or null if it is fine. Network Information API is not in lib.dom, so it is narrowed by hand. */
function autoStartBlocker(): string | null {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced-motion";
  // Below `lg` the layout puts the scene under the text (often off-screen) — don't spend mobile data/battery unasked.
  if (!window.matchMedia("(min-width: 1024px)").matches) return "small-screen";
  if ("connection" in navigator) {
    const connection: unknown = navigator.connection;
    if (typeof connection === "object" && connection !== null) {
      const { saveData, effectiveType }: ConnectionInfo = connection;
      if (saveData === true) return "save-data";
      if (typeof effectiveType === "string" && effectiveType !== "4g") return "slow-network";
    }
  }
  return null;
}

/** Runs `callback` when the page has loaded and the main thread is idle; returns a canceller. */
function whenLoadedAndIdle(callback: () => void): () => void {
  let cancelled = false;
  let idleId = 0;
  let timerId = 0;
  const run = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(callback, { timeout: 4000 });
    else timerId = window.setTimeout(callback, 1500); // Safari: no requestIdleCallback
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", run);
    if (idleId) window.cancelIdleCallback(idleId);
    window.clearTimeout(timerId);
  };
}

export function HeroScene({ className = "" }: { className?: string }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<(() => void) | null>(null);
  const [phase, setPhase] = useState<Phase>("poster");
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    const slot = slotRef.current;
    const container = layerRef.current;
    if (!slot || !container) return;

    let controller = new AbortController();
    let handle: SceneHandle | null = null;
    let started = false;

    const stop = () => {
      controller.abort();
      handle?.dispose();
      handle = null;
      started = false;
      controller = new AbortController();
    };

    const start = async () => {
      if (started) return;
      started = true;
      setCanPlay(false);
      setPhase("loading");
      const { signal } = controller;
      try {
        const { mountScene } = await import("./scene");
        const mounted = await mountScene({
          container,
          slot,
          signal,
          onFirstFrame: () => setPhase("live"),
          onContextLost: () => {
            stop();
            setPhase("poster");
          },
        });
        if (signal.aborted) mounted.dispose();
        else handle = mounted;
      } catch {
        // Aborted (unmount), no WebGL, offline, bad model: the poster simply stays. The scene is decoration.
        if (!signal.aborted) setPhase("poster");
      }
    };
    startRef.current = () => void start();

    let cancelAuto = () => {};
    let observer: IntersectionObserver | null = null;
    if (autoStartBlocker()) {
      setCanPlay(true);
    } else {
      cancelAuto = whenLoadedAndIdle(() => {
        observer = new IntersectionObserver(
          (entries) => {
            if (!entries.some((entry) => entry.isIntersecting)) return;
            observer?.disconnect();
            void start();
          },
          { rootMargin: "200px" },
        );
        observer.observe(slot);
      });
    }

    // If the user turns on reduced motion while the scene runs, take it down and fall back to the poster.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      if (!motionQuery.matches) return;
      cancelAuto();
      observer?.disconnect();
      stop();
      setPhase("poster");
      setCanPlay(true);
    };
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      // Runs on unmount AND on StrictMode's dev-only simulated unmount: everything above is undone here.
      motionQuery.removeEventListener("change", onMotionChange);
      cancelAuto();
      observer?.disconnect();
      startRef.current = null;
      stop();
    };
  }, []);

  const { poster, playLabel } = heroScene;

  return (
    // The slot is the only thing in the layout flow: a fixed-aspect box that reserves the space (no CLS) and
    // marks where the character stands. It must NOT be `position: relative`: the live layer inside it is
    // `absolute` and has to resolve against the whole hero section, not against this box.
    <div ref={slotRef} className={`aspect-square w-full ${className}`}>
      {/*
        Static poster + Play button, inside the slot. Deliberately NOT given a negative z-index: a negative
        one paints (and hit-tests) below the slot's own in-flow box, which would swallow clicks on Play.
        The poster never overlaps the text, so painting above it is harmless.
      */}
      <div className="pointer-events-none relative size-full">
        {/*
          The poster is the live scene's first frame cropped to exactly this box, so it must not be masked
          or scaled: any change would make the poster-to-canvas swap visibly jump.
        */}
        <div aria-hidden="true" className="absolute inset-0">
          {/* Plain <img>: static export has no image optimizer. Not `priority`: the headline is the LCP. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={poster.src}
            width={poster.width}
            height={poster.height}
            alt=""
            decoding="async"
            fetchPriority="low"
            loading="lazy"
            className={`size-full object-contain transition-opacity duration-1000 ease-out ${
              phase === "live" ? "opacity-0" : "opacity-100"
            }`}
          />
        </div>
        {canPlay && (
          <button
            type="button"
            onClick={() => startRef.current?.()}
            className="pointer-events-auto absolute right-2 bottom-2 inline-flex items-center gap-2 rounded-full border border-line-strong bg-bg-elevated/85 px-4 py-2 font-mono text-[0.6875rem] tracking-[0.18em] text-fg uppercase hover:border-fg"
          >
            <span aria-hidden="true" className="size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-accent-text" />
            {playLabel}
          </button>
        )}
      </div>

      {/*
        The live scene: a canvas as big as the hero, behind the text, never taking pointer input. three.js
        appends its <canvas> here; React renders no children into it. Decorative, so hidden from assistive tech.
      */}
      <div ref={layerRef} aria-hidden="true" className="scene-layer pointer-events-none absolute inset-0 z-[-5]" />
    </div>
  );
}
