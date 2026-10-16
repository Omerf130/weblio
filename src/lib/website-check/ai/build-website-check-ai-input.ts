import type {
  WebsiteAnalysisCategoryScores,
  WebsiteAnalysisFinding,
} from "@/types/website-analysis-run";

export type WebsiteCheckAiPromptFinding = {
  auditId: string;
  category?: string;
  auditKind?: string;
  status: string;
  displayValue?: string | null;
  score?: number | null;
};

export type WebsiteCheckAiPromptInput = {
  scores: WebsiteAnalysisCategoryScores;
  findings: WebsiteCheckAiPromptFinding[];
};

const MAX_FINDINGS = 24;

export function buildWebsiteCheckAiPromptInput(
  scores: WebsiteAnalysisCategoryScores,
  findings: readonly WebsiteAnalysisFinding[]
): WebsiteCheckAiPromptInput {
  const actionable = findings.filter((f) => {
    const kind = f.auditKind ?? "diagnostic";
    return kind === "failure" || kind === "opportunity" || f.status === "failed" || f.status === "warning";
  });

  const selected = (actionable.length > 0 ? actionable : findings).slice(0, MAX_FINDINGS);

  return {
    scores: {
      performance: scores.performance,
      seo: scores.seo,
      accessibility: scores.accessibility,
      ux: scores.ux,
      overall: scores.overall,
    },
    findings: selected
      .filter((f) => f.auditId?.trim())
      .map((f) => ({
        auditId: f.auditId!.trim(),
        category: f.category,
        auditKind: f.auditKind,
        status: f.status,
        displayValue: f.displayValue ?? null,
        score: f.score ?? null,
      })),
  };
}
