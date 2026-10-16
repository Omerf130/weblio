export type WebsiteCheckAiInsightStatus =
  | "pending"
  | "generating"
  | "completed"
  | "unavailable";

export type WebsiteCheckAiRecommendation = {
  id: string;
  title: string;
  explanation: string;
  action: string;
  auditIds: string[];
  optionalMetric?: string | null;
};

export type WebsiteCheckAiInsights = {
  status: WebsiteCheckAiInsightStatus;
  source?: "openai" | "fallback";
  recommendations: WebsiteCheckAiRecommendation[];
  positiveSummary?: string | null;
  updatedAt?: string;
};

export type PublicWebsiteCheckAiInsights = {
  status: WebsiteCheckAiInsightStatus;
  recommendations: WebsiteCheckAiRecommendation[];
  positiveSummary?: string | null;
};
