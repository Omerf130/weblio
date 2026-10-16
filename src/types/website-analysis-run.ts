import type { AnalyzerMetricId } from "@/components/analyzer/analyzer-content";
import type { WebsiteCheckAiInsights } from "@/types/website-check-ai";

export type WebsiteAnalysisRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial"
  | "failed";

export type WebsiteAnalysisRunPhase =
  | "queued"
  | "psi_mobile"
  | "psi_desktop"
  | "scoring"
  | "done";

export type WebsiteAnalysisCategoryId = AnalyzerMetricId;

export type WebsiteAnalysisCategoryScores = {
  performance: number | null;
  seo: number | null;
  accessibility: number | null;
  ux: number | null;
  overall: number | null;
};

export type WebsiteAnalysisScoreMeta = {
  availableCategories: WebsiteAnalysisCategoryId[];
  weightsUsed: Partial<Record<WebsiteAnalysisCategoryId, number>>;
  lighthouseVersion?: string;
  primaryStrategy: "mobile" | "desktop";
  /** Lighthouse category IDs missing from the PSI payload (e.g. best-practices). */
  missingLighthouseCategories?: string[];
};

export type WebsiteAnalysisFindingStatus = "positive" | "warning" | "neutral" | "failed";

export type WebsiteAnalysisFindingCategory =
  | "performance"
  | "seo"
  | "accessibility"
  | "best-practices"
  | "other";

export type WebsiteAnalysisAuditKind = "failure" | "opportunity" | "diagnostic" | "passed";

export type WebsiteAnalysisAuditSource = "lighthouse";

export type WebsiteAnalysisFinding = {
  id: string;
  auditId?: string;
  status: WebsiteAnalysisFindingStatus;
  title: string;
  summary: string;
  details?: string;
  score?: number | null;
  displayValue?: string | null;
  source?: WebsiteAnalysisAuditSource;
  category?: WebsiteAnalysisFindingCategory;
  auditKind?: WebsiteAnalysisAuditKind;
  documentationUrl?: string | null;
  /** Stable key for future Hebrew localization (defaults to auditId). */
  localeKey?: string;
};

export type WebsiteAnalysisRecommendationPriority = "high" | "medium" | "low";

export type WebsiteAnalysisRecommendation = {
  id: string;
  priority: WebsiteAnalysisRecommendationPriority;
  title: string;
  summary: string;
  details?: string;
  auditId?: string;
  source?: WebsiteAnalysisAuditSource;
  localeKey?: string;
};

export type WebsiteAnalysisRunError = {
  code: string;
  messagePublic: string;
};

export type WebsiteAnalysisClientMeta = {
  ipHash?: string;
  userAgent?: string;
};

export type WebsiteAnalysisCruxMetricSnapshot = {
  id: string;
  percentile: number | null;
  category: string | null;
};

export type WebsiteAnalysisFieldDataSnapshot = {
  /** CrUX / loading experience available for the origin or URL. */
  available: boolean;
  origin?: string;
  metrics?: WebsiteAnalysisCruxMetricSnapshot[];
  /** Trimmed raw CrUX section for debugging/admin (optional). */
  payload?: Record<string, unknown>;
};

export type WebsiteAnalysisLabMetricSnapshot = {
  id: string;
  title: string;
  numericValue: number | null;
  displayValue: string | null;
  score: number | null;
};

export type WebsiteAnalysisLabMetricsSnapshot = {
  strategy: "mobile";
  metrics: WebsiteAnalysisLabMetricSnapshot[];
  finalUrl?: string;
  fetchTime?: string;
};

/** Public API / admin DTO (ISO dates). */
export type WebsiteAnalysisRunDto = {
  id: string;
  urlNormalized: string;
  urlHash: string;
  status: WebsiteAnalysisRunStatus;
  phase: WebsiteAnalysisRunPhase;
  scores: WebsiteAnalysisCategoryScores;
  scoreMeta?: WebsiteAnalysisScoreMeta;
  findings: WebsiteAnalysisFinding[];
  recommendations: WebsiteAnalysisRecommendation[];
  fieldData?: WebsiteAnalysisFieldDataSnapshot;
  labMetrics?: WebsiteAnalysisLabMetricsSnapshot;
  error?: WebsiteAnalysisRunError;
  cacheHit: boolean;
  /** Engine/schema version; required for 24h cache reuse when equal to current version. */
  analysisVersion?: number;
  leadId?: string;
  aiInsights?: WebsiteCheckAiInsights;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type WebsiteCheckEngineMode = "demo" | "live";

export const WEBSITE_ANALYSIS_EMPTY_SCORES: WebsiteAnalysisCategoryScores = {
  performance: null,
  seo: null,
  accessibility: null,
  ux: null,
  overall: null,
};
