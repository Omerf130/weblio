import type { WebsiteAnalysisFinding } from "@/types/website-analysis-run";
import type { WebsiteCheckFinding } from "@/views/website-check/website-check-results-content";

function inferAuditKind(finding: WebsiteAnalysisFinding): WebsiteCheckFinding["auditKind"] {
  if (finding.auditKind) return finding.auditKind;
  if (finding.status === "failed") return "failure";
  if (finding.status === "positive") return "passed";
  if (finding.status === "neutral") return "diagnostic";
  return "opportunity";
}

export function mapLiveFindingForAiFallback(finding: WebsiteAnalysisFinding): WebsiteCheckFinding {
  return {
    id: finding.id,
    status: finding.status === "failed" ? "failed" : finding.status,
    title: finding.title,
    summary: finding.summary,
    details: finding.details ?? finding.summary,
    category: finding.category ?? "other",
    auditKind: inferAuditKind(finding),
    auditId: finding.auditId,
    displayValue: finding.displayValue ?? null,
    score: finding.score ?? null,
  };
}
