"use client";

import { useEffect, useRef, useState } from "react";
import { getWebsiteCheckRun } from "@/lib/website-check/client/analysis-api";
import type { PublicWebsiteAnalysisRunDto } from "@/lib/website-check/public-run-dto";
import { isWebsiteCheckAiInsightsInProgress } from "@/lib/website-check/ai-insights-status";
import { isTerminalAnalysisStatus } from "@/lib/website-check/live-scan-visual";

export const WEBSITE_CHECK_POLL_INTERVAL_MS = 2_000;

export type WebsiteCheckLivePollState = {
  run: PublicWebsiteAnalysisRunDto | null;
  pollError: string | null;
  isPolling: boolean;
};

export function useWebsiteCheckLivePoll(options: {
  runId: string | null;
  enabled: boolean;
  initialRun?: PublicWebsiteAnalysisRunDto | null;
  onRunUpdate?: (run: PublicWebsiteAnalysisRunDto) => void;
}): WebsiteCheckLivePollState {
  const [run, setRun] = useState<PublicWebsiteAnalysisRunDto | null>(options.initialRun ?? null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onRunUpdateRef = useRef(options.onRunUpdate);
  const runRef = useRef<PublicWebsiteAnalysisRunDto | null>(options.initialRun ?? null);

  useEffect(() => {
    onRunUpdateRef.current = options.onRunUpdate;
  }, [options.onRunUpdate]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    if (options.initialRun) {
      setRun(options.initialRun);
      runRef.current = options.initialRun;
    }
  }, [options.initialRun]);

  useEffect(() => {
    const clearScheduled = () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      abortRef.current?.abort();
      abortRef.current = null;
    };

    if (!options.enabled || !options.runId) {
      setIsPolling(false);
      return undefined;
    }

    const seed = options.initialRun ?? runRef.current;
    if (seed && isTerminalAnalysisStatus(seed.status) && !isWebsiteCheckAiInsightsInProgress(seed.aiInsights?.status)) {
      setIsPolling(false);
      return undefined;
    }

    let stopped = false;

    const scheduleNext = (delayMs: number) => {
      if (stopped || !mountedRef.current) return;
      timeoutRef.current = setTimeout(() => {
        void pollOnce();
      }, delayMs);
    };

    const pollOnce = async () => {
      if (stopped || !mountedRef.current || !options.runId) return;

      const current = runRef.current;
      if (
        current &&
        isTerminalAnalysisStatus(current.status) &&
        !isWebsiteCheckAiInsightsInProgress(current.aiInsights?.status)
      ) {
        setIsPolling(false);
        return;
      }

      if (inFlightRef.current) {
        scheduleNext(WEBSITE_CHECK_POLL_INTERVAL_MS);
        return;
      }

      inFlightRef.current = true;
      setIsPolling(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const next = await getWebsiteCheckRun(options.runId, { signal: controller.signal });
        if (!mountedRef.current || stopped) return;

        setRun(next);
        runRef.current = next;
        setPollError(null);
        onRunUpdateRef.current?.(next);

        if (
          isTerminalAnalysisStatus(next.status) &&
          !isWebsiteCheckAiInsightsInProgress(next.aiInsights?.status)
        ) {
          setIsPolling(false);
          inFlightRef.current = false;
          return;
        }
      } catch (error: unknown) {
        if (!mountedRef.current || stopped) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          inFlightRef.current = false;
          return;
        }
        setPollError(
          error instanceof Error ? error.message : "שגיאת רשת זמנית. מנסים שוב…"
        );
      }

      inFlightRef.current = false;
      if (!mountedRef.current || stopped) return;

      scheduleNext(WEBSITE_CHECK_POLL_INTERVAL_MS);
    };

    void pollOnce();

    return () => {
      stopped = true;
      clearScheduled();
      inFlightRef.current = false;
      setIsPolling(false);
    };
  }, [options.enabled, options.runId, options.initialRun]);

  return { run, pollError, isPolling };
}
