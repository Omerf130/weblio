import {
  isBestPracticesScorePresent,
  WEBSITE_CHECK_ANALYSIS_VERSION,
} from "@/lib/website-check/analysis-version";
import type { WebsiteAnalysisRunDto } from "@/types/website-analysis-run";

export type WebsiteCheckRunDiagnostics = {
  runId: string;
  cacheHit: boolean;
  analysisVersion: number | null;
  expectedAnalysisVersion: number;
  bestPracticesScorePresent: boolean;
  aiStatus: string | null;
  aiSource: "openai" | "fallback" | null;
  cacheIncompatibility: string | null;
};

export function isWebsiteCheckDevDiagnosticsEnabled(
  source: Record<string, string | undefined> = process.env
): boolean {
  return source.NODE_ENV === "development" && source.WEBSITE_CHECK_DEV_DIAGNOSTICS === "1";
}

export function buildWebsiteCheckRunDiagnostics(
  run: WebsiteAnalysisRunDto,
  options?: { cacheHit?: boolean; cacheIncompatibility?: string | null }
): WebsiteCheckRunDiagnostics {
  return {
    runId: run.id,
    cacheHit: options?.cacheHit ?? run.cacheHit,
    analysisVersion: run.analysisVersion ?? null,
    expectedAnalysisVersion: WEBSITE_CHECK_ANALYSIS_VERSION,
    bestPracticesScorePresent: isBestPracticesScorePresent(run),
    aiStatus: run.aiInsights?.status ?? null,
    aiSource: run.aiInsights?.source ?? null,
    cacheIncompatibility: options?.cacheIncompatibility ?? null,
  };
}

export function logWebsiteCheckRunDiagnostics(
  label: string,
  diagnostics: WebsiteCheckRunDiagnostics,
  source: Record<string, string | undefined> = process.env
): void {
  if (!isWebsiteCheckDevDiagnosticsEnabled(source)) {
    return;
  }
  console.info(`[website-check-diag] ${label}`, diagnostics);
}
