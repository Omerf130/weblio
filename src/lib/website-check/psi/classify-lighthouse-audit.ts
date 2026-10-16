import type {
  WebsiteAnalysisAuditKind,
  WebsiteAnalysisFindingStatus,
} from "@/types/website-analysis-run";
import type { PsiAudit } from "./pagespeed-response-types";

export function isOpportunityAudit(audit: PsiAudit): boolean {
  const type = audit.details?.type?.trim();
  return type === "opportunity" || type === "table" || type === "debugdata";
}

export function classifyLighthouseAudit(audit: PsiAudit): {
  status: WebsiteAnalysisFindingStatus;
  auditKind: WebsiteAnalysisAuditKind;
} {
  const mode = audit.scoreDisplayMode?.trim();

  if (mode === "informative" || mode === "manual" || mode === "notApplicable") {
    return { status: "neutral", auditKind: "diagnostic" };
  }

  if (isOpportunityAudit(audit)) {
    return { status: "warning", auditKind: "opportunity" };
  }

  if (mode === "binary") {
    if (audit.score === 0) {
      return { status: "failed", auditKind: "failure" };
    }
    if (audit.score === 1) {
      return { status: "positive", auditKind: "passed" };
    }
    return { status: "neutral", auditKind: "diagnostic" };
  }

  if (typeof audit.score !== "number" || !Number.isFinite(audit.score)) {
    return { status: "neutral", auditKind: "diagnostic" };
  }

  if (audit.score >= 0.99) {
    return { status: "positive", auditKind: "passed" };
  }

  if (audit.score >= 0.5) {
    return { status: "warning", auditKind: "opportunity" };
  }

  return { status: "failed", auditKind: "failure" };
}

export function shouldIncludeLighthouseFinding(audit: PsiAudit): boolean {
  const { auditKind } = classifyLighthouseAudit(audit);
  if (auditKind === "passed") {
    return false;
  }
  const mode = audit.scoreDisplayMode?.trim();
  if (mode === "notApplicable") {
    return false;
  }
  return true;
}
