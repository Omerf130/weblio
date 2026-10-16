import { normalizeWebsiteCheckPublicCopy } from "@/lib/website-check/normalize-public-copy";
import { selectPrioritizedBusinessFindings } from "@/lib/website-check/business-report";
import type { WebsiteCheckFinding } from "@/views/website-check/website-check-results-content";
import type { WebsiteCheckAiRecommendation } from "@/types/website-check-ai";

export function buildFallbackAiRecommendationsFromFindings(
  findings: readonly WebsiteCheckFinding[]
): { recommendations: WebsiteCheckAiRecommendation[]; positiveSummary: string | null } {
  const business = selectPrioritizedBusinessFindings(findings, 3);

  if (business.length === 0) {
    return {
      recommendations: [],
      positiveSummary: normalizeWebsiteCheckPublicCopy(
        "לא זוהו ממצאים דחופים בבדיקה האוטומטית. כדאי לשמור על האתר מעודכן ולבצע בדיקה תקופתית."
      ),
    };
  }

  return {
    recommendations: business
      .map((item, index) => ({
        id: `fallback-${index + 1}-${item.id}`,
        title: normalizeWebsiteCheckPublicCopy(item.title),
        explanation: normalizeWebsiteCheckPublicCopy(item.whatWeFound),
        action: normalizeWebsiteCheckPublicCopy(item.whatToDo),
        auditIds: item.auditId ? [item.auditId] : [],
      }))
      .filter((r) => r.auditIds.length > 0),
    positiveSummary: null,
  };
}
