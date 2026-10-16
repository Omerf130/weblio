"use client";

import { useEffect, useRef, useState } from "react";
import {
  getScanDemoVisualState,
  SCAN_DEMO_DURATION_MS,
  type ScanDemoVisualState,
} from "./scan-demo-sequence";

const ACTIVITY_CYCLE_MS = 2_400;

export function useWebsiteCheckScanDemo(enabled: boolean): ScanDemoVisualState {
  const [progress, setProgress] = useState(0);
  const [activityTick, setActivityTick] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const activityIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    startRef.current = performance.now();
    setProgress(0);
    setActivityTick(0);

    const tick = (now: number) => {
      const started = startRef.current ?? now;
      const elapsed = now - started;
      const nextProgress = Math.min(100, (elapsed / SCAN_DEMO_DURATION_MS) * 100);
      setProgress(nextProgress);

      if (nextProgress < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    activityIntervalRef.current = setInterval(() => {
      setActivityTick((value) => value + 1);
    }, ACTIVITY_CYCLE_MS);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (activityIntervalRef.current !== null) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }
      startRef.current = null;
    };
  }, [enabled]);

  return getScanDemoVisualState(progress, activityTick);
}
