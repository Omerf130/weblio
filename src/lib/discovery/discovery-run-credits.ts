type RunCreditFields = {
  estimatedTavilyCredits?: number;
  tavilyHttpAttempts?: number;
  tavilyRequests?: number;
  status?: string;
};

/**
 * Estimated Tavily credits for one run (V1: 1 credit per basic HTTP POST).
 * Prefers persisted attempt counters; falls back to logical tavilyRequests for legacy runs.
 */
export function estimateTavilyCreditsForRun(run: RunCreditFields): number {
  if (typeof run.estimatedTavilyCredits === "number" && run.estimatedTavilyCredits >= 0) {
    return run.estimatedTavilyCredits;
  }
  if (typeof run.tavilyHttpAttempts === "number" && run.tavilyHttpAttempts >= 0) {
    return run.tavilyHttpAttempts;
  }
  if (typeof run.tavilyRequests === "number" && run.tavilyRequests > 0) {
    return run.tavilyRequests;
  }
  return 0;
}

export function runCountsTowardMonthlyUsage(run: RunCreditFields): boolean {
  return estimateTavilyCreditsForRun(run) > 0;
}

export function applySummaryCreditFields(
  summary: { tavilyHttpAttempts?: number; estimatedTavilyCredits?: number },
  httpAttemptCount: number
): void {
  summary.tavilyHttpAttempts = httpAttemptCount;
  summary.estimatedTavilyCredits = httpAttemptCount;
}
