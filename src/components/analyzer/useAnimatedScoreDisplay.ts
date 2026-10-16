"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type RefObject } from "react";

export function useAnimatedScoreDisplay(
  target: number,
  active: boolean,
  duration = 1,
  delay = 0,
): RefObject<HTMLSpanElement | null> {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!active) {
      el.textContent = "0";
      return;
    }

    if (prefersReducedMotion) {
      el.textContent = String(target);
      return;
    }

    el.textContent = "0";
    let controls: { stop: () => void } | undefined;
    const timeout = window.setTimeout(() => {
      const state = { value: 0 };
      controls = animate(state, { value: target }, {
        duration,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: () => {
          el.textContent = String(Math.round(state.value));
        },
      });
    }, delay * 1000);

    return () => {
      window.clearTimeout(timeout);
      controls?.stop();
    };
  }, [active, target, duration, delay, prefersReducedMotion]);

  return ref;
}
