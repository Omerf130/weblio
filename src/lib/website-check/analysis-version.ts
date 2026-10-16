import type { WebsiteAnalysisRunDto } from "@/types/website-analysis-run";
import type { WebsiteCheckAiInsights } from "@/types/website-check-ai";

/**
 * Bump when cache reuse requirements change (e.g. new Lighthouse categories, AI pipeline).
 * v1: legacy runs (no version field) — perf/seo/a11y only, no AI.
 * v2: Best Practices → scores.ux, overall weights include 4th category, AI insights persisted.
 */
export const WEBSITE_CHECK_ANALYSIS_VERSION = 2;

export type WebsiteAnalysisCacheIncompatibilityReason =
  | "missing_version"
  | "version_mismatch"
  | "ai_not_finished"
  | "ai_missing";

function isAiTerminalForCache(ai: WebsiteCheckAiInsights | undefined): boolean {
  if (!ai) {
    return false;
  }
  return ai.status === "completed" || ai.status === "unavailable";
}

export function getWebsiteAnalysisCacheIncompatibilityReason(
  run: Pick<WebsiteAnalysisRunDto, "analysisVersion" | "aiInsights">
): WebsiteAnalysisCacheIncompatibilityReason | null {
  if (run.analysisVersion === undefined || run.analysisVersion === null) {
    return "missing_version";
  }
  if (run.analysisVersion !== WEBSITE_CHECK_ANALYSIS_VERSION) {
    return "version_mismatch";
  }
  if (!run.aiInsights) {
    return "ai_missing";
  }
  if (!isAiTerminalForCache(run.aiInsights)) {
    return "ai_not_finished";
  }
  return null;
}

export function isWebsiteAnalysisRunCacheCompatible(
  run: Pick<WebsiteAnalysisRunDto, "analysisVersion" | "aiInsights">
): boolean {
  return getWebsiteAnalysisCacheIncompatibilityReason(run) === null;
}

export function isBestPracticesScorePresent(run: Pick<WebsiteAnalysisRunDto, "scores" | "scoreMeta">): boolean {
  if (run.scores.ux !== null) {
    return true;
  }
  return run.scoreMeta?.availableCategories?.includes("ux") ?? false;
}
