"use client";

import { useCallback, useRef, useState } from "react";
import { AnalysisApiError, createWebsiteCheckRun } from "@/lib/website-check/client/analysis-api";
import type { PublicWebsiteAnalysisRunDto } from "@/lib/website-check/public-run-dto";
import type { WebsiteCheckFlowMode, WebsiteCheckPhase, WebsiteCheckState } from "./types";
import { WEBSITE_CHECK_INITIAL_STATE } from "./types";
import { isLiveResultsReady } from "./results-view-model";
import { validateWebsiteUrl } from "./validate-url";

export type WebsiteCheckSubmitResult =
  | { ok: true; normalized: string }
  | { ok: false; message: string };

export function useWebsiteCheckFlow(liveAvailable: boolean) {
  const [state, setState] = useState<WebsiteCheckState>(WEBSITE_CHECK_INITIAL_STATE);
  const submitInFlightRef = useRef(false);

  const resolveFlowMode = useCallback((): WebsiteCheckFlowMode => {
    return liveAvailable ? "live" : "demo";
  }, [liveAvailable]);

  const submitUrl = useCallback(
    async (raw: string): Promise<WebsiteCheckSubmitResult> => {
      const result = validateWebsiteUrl(raw);
      if (!result.ok) {
        return { ok: false, message: result.message };
      }

      const flowMode = resolveFlowMode();

      if (flowMode === "demo") {
        setState({
          phase: "scanning",
          url: result.normalized,
          flowMode: "demo",
          runId: null,
          analysisRun: null,
        });
        return { ok: true, normalized: result.normalized };
      }

      if (submitInFlightRef.current) {
        return { ok: false, message: "הבקשה כבר נשלחת. אנא המתינו." };
      }

      submitInFlightRef.current = true;

      try {
        const { run, httpStatus } = await createWebsiteCheckRun(result.normalized);
        const cacheReplay = httpStatus === 200 && run.cacheHit && isLiveResultsReady(run);
        setState({
          phase: cacheReplay ? "results" : "scanning",
          url: result.normalized,
          flowMode: "live",
          runId: run.id,
          analysisRun: run,
        });
        return { ok: true, normalized: result.normalized };
      } catch (error: unknown) {
        if (error instanceof AnalysisApiError) {
          return { ok: false, message: error.message };
        }
        return { ok: false, message: "לא ניתן להתחיל ניתוח כרגע. נסו שוב מאוחר יותר." };
      } finally {
        submitInFlightRef.current = false;
      }
    },
    [resolveFlowMode]
  );

  const resetToEntry = useCallback(() => {
    submitInFlightRef.current = false;
    setState(WEBSITE_CHECK_INITIAL_STATE);
  }, []);

  const setPhase = useCallback((phase: WebsiteCheckPhase) => {
    setState((prev) => ({ ...prev, phase }));
  }, []);

  const goToResults = useCallback(() => {
    setState((prev) => {
      if (!prev.url || !prev.flowMode) {
        return prev;
      }
      if (prev.flowMode === "demo") {
        return { ...prev, phase: "results" };
      }
      if (prev.flowMode === "live" && isLiveResultsReady(prev.analysisRun)) {
        return { ...prev, phase: "results" };
      }
      return prev;
    });
  }, []);

  const setAnalysisRun = useCallback((run: PublicWebsiteAnalysisRunDto) => {
    setState((prev) => ({
      ...prev,
      analysisRun: run,
    }));
  }, []);

  return {
    phase: state.phase,
    url: state.url,
    flowMode: state.flowMode,
    runId: state.runId,
    analysisRun: state.analysisRun,
    submitUrl,
    resetToEntry,
    setPhase,
    goToResults,
    setAnalysisRun,
    liveAvailable,
  };
}

export type WebsiteCheckFlow = ReturnType<typeof useWebsiteCheckFlow>;
