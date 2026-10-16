import { normalizeWebsiteCheckPublicCopy } from "@/lib/website-check/normalize-public-copy";
import type {
  WebsiteAnalysisRunDto,
  WebsiteAnalysisRunError,
} from "@/types/website-analysis-run";
import type { PublicWebsiteCheckAiInsights } from "@/types/website-check-ai";

export type PublicWebsiteAnalysisRunDto = {
  id: string;
  url: string;
  status: WebsiteAnalysisRunDto["status"];
  phase: WebsiteAnalysisRunDto["phase"];
  scores: WebsiteAnalysisRunDto["scores"];
  scoreMeta?: WebsiteAnalysisRunDto["scoreMeta"];
  findings: WebsiteAnalysisRunDto["findings"];
  recommendations: WebsiteAnalysisRunDto["recommendations"];
  fieldData?: {
    available: boolean;
    metrics?: WebsiteAnalysisRunDto["fieldData"] extends infer T
      ? T extends { metrics?: infer M }
        ? M
        : never
      : never;
  };
  labMetrics?: WebsiteAnalysisRunDto["labMetrics"];
  error?: WebsiteAnalysisRunError;
  cacheHit: boolean;
  analysisVersion?: number;
  aiInsights?: PublicWebsiteCheckAiInsights;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export function toPublicWebsiteAnalysisRunDto(
  run: WebsiteAnalysisRunDto,
  options?: { cacheHit?: boolean }
): PublicWebsiteAnalysisRunDto {
  return {
    id: run.id,
    url: run.urlNormalized,
    status: run.status,
    phase: run.phase,
    scores: run.scores,
    scoreMeta: run.scoreMeta,
    findings: run.findings,
    recommendations: run.recommendations,
    fieldData: run.fieldData
      ? {
          available: run.fieldData.available,
          metrics: run.fieldData.metrics,
        }
      : undefined,
    labMetrics: run.labMetrics,
    error: run.error
      ? {
          code: run.error.code,
          messagePublic: normalizeWebsiteCheckPublicCopy(run.error.messagePublic),
        }
      : undefined,
    cacheHit: options?.cacheHit ?? run.cacheHit,
    analysisVersion: run.analysisVersion,
    aiInsights: run.aiInsights
      ? {
          status: run.aiInsights.status,
          recommendations: run.aiInsights.recommendations,
          positiveSummary: run.aiInsights.positiveSummary ?? null,
        }
      : undefined,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}
