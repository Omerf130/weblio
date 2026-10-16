import type {
  WebsiteAnalysisCruxMetricSnapshot,
  WebsiteAnalysisFieldDataSnapshot,
  WebsiteAnalysisLabMetricSnapshot,
  WebsiteAnalysisLabMetricsSnapshot,
} from "@/types/website-analysis-run";
import type { PageSpeedLighthouseCategoryId } from "./pagespeed-categories";
import type { PsiPageSpeedResponse } from "./pagespeed-response-types";

export type ParsedLighthouseCategoryScores = {
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  bestPractices: number | null;
};

export type ParsedPageSpeedResponse = {
  lighthouseVersion: string | null;
  runtimeErrorCode: string | null;
  runtimeErrorMessage: string | null;
  categoryScores: ParsedLighthouseCategoryScores;
  missingCategories: PageSpeedLighthouseCategoryId[];
  labMetrics: WebsiteAnalysisLabMetricsSnapshot;
  fieldData: WebsiteAnalysisFieldDataSnapshot;
  raw: PsiPageSpeedResponse;
};

const LAB_METRIC_AUDIT_IDS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
  "interactive",
  "max-potential-fid",
  "experimental-interaction-to-next-paint",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parsePageSpeedResponsePayload(payload: unknown): ParsedPageSpeedResponse | null {
  if (!isRecord(payload)) {
    return null;
  }

  const raw = payload as PsiPageSpeedResponse;
  const lighthouse = raw.lighthouseResult;
  if (!lighthouse || !isRecord(lighthouse)) {
    return null;
  }

  const categories = lighthouse.categories ?? {};
  const audits = lighthouse.audits ?? {};

  const categoryScores: ParsedLighthouseCategoryScores = {
    performance: normalizeCategoryScore(categories.performance?.score),
    seo: normalizeCategoryScore(categories.seo?.score),
    accessibility: normalizeCategoryScore(categories.accessibility?.score),
    bestPractices: normalizeCategoryScore(categories["best-practices"]?.score),
  };

  const missingCategories: PageSpeedLighthouseCategoryId[] = [];
  if (categoryScores.performance === null) missingCategories.push("performance");
  if (categoryScores.seo === null) missingCategories.push("seo");
  if (categoryScores.accessibility === null) missingCategories.push("accessibility");
  if (categoryScores.bestPractices === null) missingCategories.push("best-practices");

  const labMetricEntries: WebsiteAnalysisLabMetricSnapshot[] = [];
  for (const auditId of LAB_METRIC_AUDIT_IDS) {
    const audit = audits[auditId];
    if (!audit) continue;
    labMetricEntries.push({
      id: auditId,
      title: audit.title?.trim() || auditId,
      numericValue: typeof audit.numericValue === "number" ? audit.numericValue : null,
      displayValue: audit.displayValue?.trim() || null,
      score: typeof audit.score === "number" ? audit.score : null,
    });
  }

  const labMetrics: WebsiteAnalysisLabMetricsSnapshot = {
    strategy: "mobile",
    metrics: labMetricEntries,
    finalUrl: lighthouse.finalUrl?.trim() || undefined,
    fetchTime: lighthouse.fetchTime?.trim() || undefined,
  };

  const fieldData = extractFieldDataSnapshot(raw);

  return {
    lighthouseVersion: lighthouse.lighthouseVersion?.trim() || null,
    runtimeErrorCode: lighthouse.runtimeError?.code?.trim() || null,
    runtimeErrorMessage: lighthouse.runtimeError?.message?.trim() || null,
    categoryScores,
    missingCategories,
    labMetrics,
    fieldData,
    raw,
  };
}

export function normalizeCategoryScore(score: unknown): number | null {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }
  if (score < 0 || score > 1) {
    return null;
  }
  return Math.round(score * 100);
}

function extractFieldDataSnapshot(raw: PsiPageSpeedResponse): WebsiteAnalysisFieldDataSnapshot {
  const loading =
    raw.loadingExperience?.metrics && Object.keys(raw.loadingExperience.metrics).length > 0
      ? raw.loadingExperience
      : raw.originLoadingExperience?.metrics &&
          Object.keys(raw.originLoadingExperience.metrics).length > 0
        ? raw.originLoadingExperience
        : undefined;

  if (!loading?.metrics) {
    return { available: false };
  }

  const metrics: WebsiteAnalysisCruxMetricSnapshot[] = Object.entries(loading.metrics).map(
    ([id, entry]) => ({
      id,
      percentile: typeof entry.percentile === "number" ? entry.percentile : null,
      category: entry.category?.trim() || null,
    })
  );

  const payload: Record<string, unknown> = {
    overallCategory: loading.overall_category ?? null,
    metricCount: metrics.length,
  };

  return {
    available: metrics.length > 0,
    metrics,
    payload,
  };
}

export function getLighthouseCategories(raw: PsiPageSpeedResponse): Record<string, unknown> {
  return raw.lighthouseResult?.categories ?? {};
}

export function getLighthouseAudits(raw: PsiPageSpeedResponse): Record<string, unknown> {
  return raw.lighthouseResult?.audits ?? {};
}
