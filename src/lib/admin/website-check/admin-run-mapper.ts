import {
  adminWebsiteCheckOverallDisplay,
  adminWebsiteCheckStatusLabel,
} from "@/lib/admin/website-check/list-query";
import { selectPrioritizedBusinessFindings } from "@/lib/website-check/business-report";
import { mapLiveFindingForAiFallback } from "@/lib/website-check/ai/map-finding-for-ai";
import type { WebsiteAnalysisRunDto } from "@/types/website-analysis-run";
import type {
  AdminWebsiteCheckRunDetail,
  AdminWebsiteCheckRunListItem,
} from "@/types/admin-website-check-run";

function resolveAnalyzedAt(run: WebsiteAnalysisRunDto): string {
  return run.completedAt ?? run.createdAt;
}

function scoreLabel(
  status: WebsiteAnalysisRunDto["status"],
  value: number | null
): string {
  if (status === "failed") {
    return "נכשל";
  }
  if (status === "queued" || status === "running") {
    return "בבדיקה";
  }
  if (value === null || value === undefined) {
    return "לא זמין";
  }
  return String(value);
}

export function toAdminWebsiteCheckRunListItem(
  run: WebsiteAnalysisRunDto
): AdminWebsiteCheckRunListItem {
  return {
    id: run.id,
    url: run.urlNormalized,
    overallScore: run.scores.overall,
    overallDisplay: adminWebsiteCheckOverallDisplay(run.status, run.scores.overall),
    analyzedAt: resolveAnalyzedAt(run),
    status: run.status,
    statusLabel: adminWebsiteCheckStatusLabel(run.status),
    hasLead: Boolean(run.leadId),
  };
}

function aiStatusLabel(status: string | undefined): string {
  switch (status) {
    case "pending":
      return "ממתין";
    case "generating":
      return "ביצירה";
    case "completed":
      return "זמין";
    case "unavailable":
      return "לא זמין";
    default:
      return "לא זמין";
  }
}

export function toAdminWebsiteCheckRunDetail(
  run: WebsiteAnalysisRunDto
): AdminWebsiteCheckRunDetail {
  const mappedFindings = run.findings.map(mapLiveFindingForAiFallback);
  const businessFindings = selectPrioritizedBusinessFindings(mappedFindings, 8);

  return {
    id: run.id,
    url: run.urlNormalized,
    analyzedAt: resolveAnalyzedAt(run),
    status: run.status,
    statusLabel: adminWebsiteCheckStatusLabel(run.status),
    scores: {
      overall: run.scores.overall,
      performance: run.scores.performance,
      seo: run.scores.seo,
      accessibility: run.scores.accessibility,
      bestPractices: run.scores.ux,
    },
    scoreLabels: {
      overall: scoreLabel(run.status, run.scores.overall),
      performance: scoreLabel(run.status, run.scores.performance),
      seo: scoreLabel(run.status, run.scores.seo),
      accessibility: scoreLabel(run.status, run.scores.accessibility),
      bestPractices: scoreLabel(run.status, run.scores.ux),
    },
    findings: businessFindings.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.whatWeFound,
      status: item.priorityLabel,
    })),
    aiInsights: {
      status: run.aiInsights?.status ?? "unavailable",
      statusLabel: aiStatusLabel(run.aiInsights?.status),
      source: run.aiInsights?.source ?? null,
      recommendations: run.aiInsights?.recommendations ?? [],
      positiveSummary: run.aiInsights?.positiveSummary ?? null,
    },
    errorSummary:
      run.status === "failed" ? (run.error?.messagePublic ?? "הניתוח נכשל.") : null,
    hasLead: Boolean(run.leadId),
    leadId: run.leadId ?? null,
    cacheHit: run.cacheHit,
    analysisVersion: run.analysisVersion ?? null,
  };
}

/** Fields allowed in admin API JSON (guard for tests). */
export const ADMIN_WEBSITE_CHECK_FORBIDDEN_RESPONSE_KEYS = [
  "clientMeta",
  "ipHash",
  "userAgent",
  "fieldData",
  "labMetrics",
  "scoreMeta",
] as const;
