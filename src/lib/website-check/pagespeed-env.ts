import type { WebsiteCheckEngineMode } from "@/types/website-analysis-run";

export const DEFAULT_WEBSITE_CHECK_ENGINE: WebsiteCheckEngineMode = "demo";

/** Client-side abort; PSI may run up to ~120s on Google's side. */
export const DEFAULT_PAGESPEED_INSIGHTS_TIMEOUT_MS = 125_000;

export type ResolvedPageSpeedInsightsEnv = {
  apiKey: string;
  timeoutMs: number;
};

export function parseWebsiteCheckEngineMode(
  source: Record<string, string | undefined> = process.env
): WebsiteCheckEngineMode {
  const raw = source.WEBSITE_CHECK_ENGINE?.trim().toLowerCase();
  if (raw === "live") {
    return "live";
  }
  return "demo";
}

export function isWebsiteCheckLiveEngineRequested(
  source: Record<string, string | undefined> = process.env
): boolean {
  return parseWebsiteCheckEngineMode(source) === "live";
}

/**
 * Returns PSI credentials only when live engine is enabled and a key is configured.
 * Never throws — safe for build and demo mode.
 */
export function resolvePageSpeedInsightsEnv(
  source: Record<string, string | undefined> = process.env
): ResolvedPageSpeedInsightsEnv | null {
  if (!isWebsiteCheckLiveEngineRequested(source)) {
    return null;
  }

  const apiKey = source.PAGESPEED_INSIGHTS_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const timeoutRaw = source.PAGESPEED_INSIGHTS_TIMEOUT_MS?.trim();
  let timeoutMs = DEFAULT_PAGESPEED_INSIGHTS_TIMEOUT_MS;
  if (timeoutRaw) {
    const parsed = Number.parseInt(timeoutRaw, 10);
    if (Number.isFinite(parsed) && parsed >= 5_000 && parsed <= 130_000) {
      timeoutMs = parsed;
    }
  }

  return { apiKey, timeoutMs };
}

export function isWebsiteCheckLiveAnalysisConfigured(
  source: Record<string, string | undefined> = process.env
): boolean {
  return resolvePageSpeedInsightsEnv(source) !== null;
}
