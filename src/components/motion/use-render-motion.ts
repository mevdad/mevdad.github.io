"use client";

import { cancelFrame, frame, type MotionValue } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";

/**
 * Binds motion values to an element's style without `<motion.div>`.
 *
 * Why not `m.div`? The motion component brings the whole VisualElement /
 * layout-projection runtime (~18 KB gz) — we only need "when these values
 * change, write a transform". Motion's own frame loop still batches the
 * writes, so several values changing in one frame cause one style write.
 *
 * `apply` is read through a ref ("latest callback" pattern): the effect
 * subscribes once, yet always calls the newest `apply` — no stale closure,
 * no resubscribing on every render.
 */
export function useRenderMotion<T extends HTMLElement>(
  ref: RefObject<T | null>,
  values: readonly MotionValue<number>[],
  apply: (element: T) => void,
): void {
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });

  const valuesRef = useRef(values);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const write = () => applyRef.current(element);
    const schedule = () => frame.render(write);
    write();
    const unsubscribers = valuesRef.current.map((value) => value.on("change", schedule));
    return () => {
      for (const unsubscribe of unsubscribers) unsubscribe();
      cancelFrame(write);
    };
  }, [ref]);
}
