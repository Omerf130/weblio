"use client";

import { useCallback } from "react";

const FORM_ID = "lead-form";
const FIRST_INPUT_ID = "lead-form-name";
const VIEWPORT_THRESHOLD = 120;

export function useScrollToLeadForm() {
  return useCallback(() => {
    const form = document.getElementById(FORM_ID);
    const firstInput = document.getElementById(FIRST_INPUT_ID) as HTMLInputElement | null;
    if (!form || !firstInput) {
      return;
    }

    const rect = form.getBoundingClientRect();
    const inView =
      rect.top >= -VIEWPORT_THRESHOLD &&
      rect.bottom <= window.innerHeight + VIEWPORT_THRESHOLD;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (inView) {
      firstInput.focus({ preventScroll: true });
      return;
    }

    form.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    });

    window.setTimeout(() => {
      firstInput.focus({ preventScroll: true });
    }, reducedMotion ? 0 : 400);
  }, []);
}
