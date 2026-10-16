export type {
  WebsiteAnalysisCategoryScores,
  WebsiteAnalysisClientMeta,
  WebsiteAnalysisFieldDataSnapshot,
  WebsiteAnalysisFinding,
  WebsiteAnalysisRecommendation,
  WebsiteAnalysisRunDto,
  WebsiteAnalysisRunError,
  WebsiteAnalysisRunPhase,
  WebsiteAnalysisRunStatus,
  WebsiteAnalysisScoreMeta,
  WebsiteCheckEngineMode,
} from "@/types/website-analysis-run";

export type WebsiteCheckPhase = "entry" | "scanning" | "results";

export type WebsiteCheckFlowMode = "demo" | "live";

export type WebsiteCheckState = {
  phase: WebsiteCheckPhase;
  /** Normalized URL ready for a future analysis request. */
  url: string;
  flowMode: WebsiteCheckFlowMode | null;
  runId: string | null;
  analysisRun: import("@/lib/website-check/public-run-dto").PublicWebsiteAnalysisRunDto | null;
};

export const WEBSITE_CHECK_INITIAL_STATE: WebsiteCheckState = {
  phase: "entry",
  url: "",
  flowMode: null,
  runId: null,
  analysisRun: null,
};
