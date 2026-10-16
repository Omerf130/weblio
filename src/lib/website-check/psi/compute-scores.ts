import type {
  WebsiteAnalysisCategoryId,
  WebsiteAnalysisCategoryScores,
  WebsiteAnalysisScoreMeta,
} from "@/types/website-analysis-run";
import type { ParsedLighthouseCategoryScores } from "./parse-pagespeed-response";

/** UX slot stores Lighthouse Best Practices (תקינות האתר) for backward-compatible persistence. */
export const DEFAULT_CATEGORY_WEIGHTS: Record<WebsiteAnalysisCategoryId, number> = {
  performance: 0.3,
  seo: 0.25,
  accessibility: 0.25,
  ux: 0.2,
};

export type ComputeScoresInput = {
  lighthouse: ParsedLighthouseCategoryScores;
  lighthouseVersion?: string | null;
  primaryStrategy?: "mobile" | "desktop";
};

export type ComputeScoresResult = {
  scores: WebsiteAnalysisCategoryScores;
  scoreMeta: WebsiteAnalysisScoreMeta;
};

export function computeWebsiteAnalysisScores(input: ComputeScoresInput): ComputeScoresResult {
  const scores: WebsiteAnalysisCategoryScores = {
    performance: input.lighthouse.performance,
    seo: input.lighthouse.seo,
    accessibility: input.lighthouse.accessibility,
    ux: input.lighthouse.bestPractices,
    overall: null,
  };

  const availableCategories: WebsiteAnalysisCategoryId[] = [];
  if (scores.performance !== null) availableCategories.push("performance");
  if (scores.seo !== null) availableCategories.push("seo");
  if (scores.accessibility !== null) availableCategories.push("accessibility");
  if (scores.ux !== null) availableCategories.push("ux");

  const weightsUsed: Partial<Record<WebsiteAnalysisCategoryId, number>> = {};
  let weightSum = 0;

  for (const category of availableCategories) {
    const weight = DEFAULT_CATEGORY_WEIGHTS[category];
    weightsUsed[category] = weight;
    weightSum += weight;
  }

  if (weightSum > 0) {
    let weightedTotal = 0;
    for (const category of availableCategories) {
      const value = scores[category];
      const weight = weightsUsed[category] ?? 0;
      if (value !== null && weight > 0) {
        weightedTotal += value * (weight / weightSum);
      }
    }
    scores.overall = Math.round(weightedTotal);
  }

  return {
    scores,
    scoreMeta: {
      availableCategories,
      weightsUsed,
      lighthouseVersion: input.lighthouseVersion ?? undefined,
      primaryStrategy: input.primaryStrategy ?? "mobile",
    },
  };
}
