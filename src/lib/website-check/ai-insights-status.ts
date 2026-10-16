import type { WebsiteCheckAiInsightStatus } from "@/types/website-check-ai";

export function isWebsiteCheckAiInsightsInProgress(
  status: WebsiteCheckAiInsightStatus | undefined
): boolean {
  return status === "pending" || status === "generating";
}
