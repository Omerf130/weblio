import type { WebsiteAnalysisRunStatus } from "@/types/website-analysis-run";
import type { WebsiteCheckAiRecommendation } from "@/types/website-check-ai";

export type AdminWebsiteCheckRunListItem = {
  id: string;
  url: string;
  overallScore: number | null;
  overallDisplay: string;
  analyzedAt: string;
  status: WebsiteAnalysisRunStatus;
  statusLabel: string;
  hasLead: boolean;
};

export type AdminWebsiteCheckRunListResult = {
  items: AdminWebsiteCheckRunListItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type AdminWebsiteCheckRunSummary = {
  totalRuns: number;
  uniqueWebsites: number;
  leadsSubmitted: number;
};

export type AdminWebsiteCheckRunDetail = {
  id: string;
  url: string;
  analyzedAt: string;
  status: WebsiteAnalysisRunStatus;
  statusLabel: string;
  scores: {
    overall: number | null;
    performance: number | null;
    seo: number | null;
    accessibility: number | null;
    bestPractices: number | null;
  };
  scoreLabels: {
    overall: string;
    performance: string;
    seo: string;
    accessibility: string;
    bestPractices: string;
  };
  findings: Array<{
    id: string;
    title: string;
    summary: string;
    status: string;
  }>;
  aiInsights: {
    status: string;
    statusLabel: string;
    source: "openai" | "fallback" | null;
    recommendations: WebsiteCheckAiRecommendation[];
    positiveSummary: string | null;
  };
  errorSummary: string | null;
  hasLead: boolean;
  leadId: string | null;
  cacheHit: boolean;
  analysisVersion: number | null;
};
