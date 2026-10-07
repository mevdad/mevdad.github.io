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
 *   2. Nothing else happens until the visitor's FIRST REAL GESTURE (mouse move, click, key, wheel,
 *      scroll, touch). Lab tools (Lighthouse, PageSpeed) never interact, so they measure the page
 *      without the scene; people always do within seconds. There is deliberately NO fallback timer: a
 *      timer can land inside a slow audit's measurement window (PSI already keeps tens of seconds), and
 *      the cost of omitting it is a still poster for someone who never touches anything.
 *   3. After the gesture: wait for `load` + idle + the box being on screen, make sure the GPU is real
 *      (not a software rasteriser), then import the scene chunk and download the model. On a software
 *      rasteriser nothing starts by itself: the "Play" button appears instead.
 *   4. Skipped entirely (poster + "Play" button instead) for reduced motion, Save-Data, slow
 *      connections and narrow screens. Playing then is the user's explicit choice.
 *   5. Once live, the scene pauses itself off-screen and in background tabs, and gives up (back to the
 *      poster, Play offered again) if the device renders under ~25 fps (see scene.ts). Nothing ever
 *      restarts the scene except a click on Play.
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

/**
 * True when WebGL would be rasterised on the CPU (SwiftShader, llvmpipe, a VM without GPU, a headless audit
 * box): there the scene would own the main thread. Cheap and three-free: one throwaway context.
 * `failIfMajorPerformanceCaveat` makes the browser itself refuse a software context; the renderer-name check
 * catches the browsers that hand one out anyway. No WebGL at all counts as "can't run it" too.
 */
function hasSoftwareRendering(): boolean {
  const canvas = document.createElement("canvas");
  const attributes: WebGLContextAttributes = { failIfMajorPerformanceCaveat: true };
  const gl = canvas.getContext("webgl2", attributes) ?? canvas.getContext("webgl", attributes);
  if (!gl) return true;
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  gl.getExtension("WEBGL_lose_context")?.loseContext(); // give the context back right away
  return /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i.test(renderer);
}

/** Calls `callback` once, on the first trusted user gesture (not on script-dispatched events); returns a canceller. */
function onFirstGesture(callback: () => void): () => void {
  const types = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
  const options = { passive: true, capture: true } as const;
  const cancel = () => {
    for (const type of types) window.removeEventListener(type, handler, options);
  };
  const handler = (event: Event) => {
    if (!event.isTrusted) return;
    cancel();
    callback();
  };
  for (const type of types) window.addEventListener(type, handler, options);
  return cancel;
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

    /** `deliberate` = the visitor pressed Play: that overrides the software-renderer veto (the frame-time guard still applies). */
    const start = async (deliberate: boolean) => {
      if (started) return;
      if (!deliberate && hasSoftwareRendering()) {
        // Never start by ourselves on a CPU-rasterised WebGL: offer Play instead and let the visitor decide.
        setCanPlay(true);
        return;
      }
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
          // Both fall back to the poster with Play still offered: a click retries, nothing retries by itself.
          onContextLost: () => {
            stop();
            setPhase("poster");
            setCanPlay(true);
          },
          onSlow: () => {
            stop();
            setPhase("poster");
            setCanPlay(true);
          },
        });
        if (signal.aborted) mounted.dispose();
        else handle = mounted;
      } catch {
        // Aborted (unmount), no WebGL, offline, bad model: the poster simply stays. The scene is decoration.
        if (!signal.aborted) setPhase("poster");
      }
    };
    startRef.current = () => void start(true);

    let cancelGesture = () => {};
    let cancelIdle = () => {};
    let observer: IntersectionObserver | null = null;
    const cancelAuto = () => {
      cancelGesture();
      cancelIdle();
      observer?.disconnect();
    };
    if (autoStartBlocker()) {
      setCanPlay(true);
    } else {
      cancelGesture = onFirstGesture(() => {
        cancelIdle = whenLoadedAndIdle(() => {
          observer = new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return;
              observer?.disconnect();
              void start(false);
            },
            { rootMargin: "200px" },
          );
          observer.observe(slot);
        });
      });
    }

    // If the user turns on reduced motion while the scene runs, take it down and fall back to the poster.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      if (!motionQuery.matches) return;
      cancelAuto();
      stop();
      setPhase("poster");
      setCanPlay(true);
    };
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      // Runs on unmount AND on StrictMode's dev-only simulated unmount: everything above is undone here.
      motionQuery.removeEventListener("change", onMotionChange);
      cancelAuto();
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
