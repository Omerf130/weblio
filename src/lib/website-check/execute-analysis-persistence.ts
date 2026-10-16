import { WEBSITE_CHECK_ANALYSIS_VERSION } from "@/lib/website-check/analysis-version";
import type { MobilePageSpeedAnalysisResult } from "@/lib/website-check/psi/assemble-mobile-analysis";
import type {
  WebsiteAnalysisCategoryScores,
  WebsiteAnalysisFieldDataSnapshot,
  WebsiteAnalysisFinding,
  WebsiteAnalysisLabMetricsSnapshot,
  WebsiteAnalysisRecommendation,
  WebsiteAnalysisRunError,
  WebsiteAnalysisScoreMeta,
} from "@/types/website-analysis-run";

export type WebsiteAnalysisRunPersistenceUpdate = {
  status: "completed" | "partial" | "failed";
  phase: "done";
  completedAt: Date;
  unsetActiveUrlHash: boolean;
  analysisVersion: number;
  scores?: WebsiteAnalysisCategoryScores;
  scoreMeta?: WebsiteAnalysisScoreMeta;
  findings?: WebsiteAnalysisFinding[];
  recommendations?: WebsiteAnalysisRecommendation[];
  fieldData?: WebsiteAnalysisFieldDataSnapshot;
  labMetrics?: WebsiteAnalysisLabMetricsSnapshot;
  error?: WebsiteAnalysisRunError;
};

function withMissingCategoriesMeta(
  scoreMeta: WebsiteAnalysisScoreMeta | undefined,
  missingCategories: readonly string[] | undefined
): WebsiteAnalysisScoreMeta | undefined {
  if (!scoreMeta && (!missingCategories || missingCategories.length === 0)) {
    return scoreMeta;
  }
  return {
    ...(scoreMeta ?? {
      availableCategories: [],
      weightsUsed: {},
      primaryStrategy: "mobile" as const,
    }),
    missingLighthouseCategories:
      missingCategories && missingCategories.length > 0 ? [...missingCategories] : undefined,
  };
}

export function buildWebsiteAnalysisRunPersistenceUpdate(
  analysis: MobilePageSpeedAnalysisResult,
  completedAt: Date = new Date()
): WebsiteAnalysisRunPersistenceUpdate {
  if (analysis.ok) {
    return {
      status: analysis.status,
      phase: "done",
      completedAt,
      unsetActiveUrlHash: true,
      analysisVersion: WEBSITE_CHECK_ANALYSIS_VERSION,
      scores: analysis.scores,
      scoreMeta: withMissingCategoriesMeta(analysis.scoreMeta, analysis.missingCategories),
      findings: analysis.findings,
      recommendations: analysis.recommendations,
      fieldData: analysis.fieldData,
      labMetrics: analysis.labMetrics,
    };
  }

  if (analysis.partial) {
    const partial = analysis.partial;
    return {
      status: "partial",
      phase: "done",
      completedAt,
      unsetActiveUrlHash: true,
      analysisVersion: WEBSITE_CHECK_ANALYSIS_VERSION,
      scores: partial.scores,
      scoreMeta: withMissingCategoriesMeta(partial.scoreMeta, partial.missingCategories),
      findings: partial.findings,
      recommendations: partial.recommendations,
      fieldData: partial.fieldData,
      labMetrics: partial.labMetrics,
      error: analysis.error,
    };
  }

  return {
    status: "failed",
    phase: "done",
    completedAt,
    unsetActiveUrlHash: true,
    analysisVersion: WEBSITE_CHECK_ANALYSIS_VERSION,
    error: analysis.error,
  };
}
