import type {
  WebsiteAnalysisRunError,
  WebsiteAnalysisRunStatus,
} from "@/types/website-analysis-run";
import { computeWebsiteAnalysisScores } from "./compute-scores";
import { buildAuditInsightsFromPageSpeedResponse } from "./build-audit-insights";
import { type PageSpeedClientFailure, pageSpeedFailure } from "./pagespeed-errors";
import { parsePageSpeedResponsePayload } from "./parse-pagespeed-response";

export type MobilePageSpeedAnalysisSuccess = {
  ok: true;
  status: Extract<WebsiteAnalysisRunStatus, "completed" | "partial">;
  scores: ReturnType<typeof computeWebsiteAnalysisScores>["scores"];
  scoreMeta: ReturnType<typeof computeWebsiteAnalysisScores>["scoreMeta"];
  labMetrics: NonNullable<ReturnType<typeof parsePageSpeedResponsePayload>>["labMetrics"];
  fieldData: NonNullable<ReturnType<typeof parsePageSpeedResponsePayload>>["fieldData"];
  findings: ReturnType<typeof buildAuditInsightsFromPageSpeedResponse>["findings"];
  recommendations: ReturnType<typeof buildAuditInsightsFromPageSpeedResponse>["recommendations"];
  missingCategories: NonNullable<ReturnType<typeof parsePageSpeedResponsePayload>>["missingCategories"];
  lighthouseVersion: string | null;
};

export type MobilePageSpeedAnalysisFailure = {
  ok: false;
  status: Extract<WebsiteAnalysisRunStatus, "failed" | "partial">;
  error: WebsiteAnalysisRunError;
  partial?: MobilePageSpeedAnalysisSuccess;
  /** Server-only PSI fetch metadata for diagnostics (not persisted). */
  psiFetchFailure?: PageSpeedClientFailure;
};

export type MobilePageSpeedAnalysisResult =
  | MobilePageSpeedAnalysisSuccess
  | MobilePageSpeedAnalysisFailure;

export function assembleMobilePageSpeedAnalysisFromPayload(
  payload: unknown
): MobilePageSpeedAnalysisResult {
  const parsed = parsePageSpeedResponsePayload(payload);
  if (!parsed) {
    const failure = pageSpeedFailure("psi_invalid_response");
    return {
      ok: false,
      status: "failed",
      error: { code: failure.code, messagePublic: failure.messagePublic },
    };
  }

  if (parsed.runtimeErrorCode) {
    const failure = pageSpeedFailure("psi_runtime_error", {
      messagePublic: parsed.runtimeErrorMessage || undefined,
    });
    const partial = tryBuildPartialSuccess(parsed);
    if (partial) {
      return {
        ok: false,
        status: "partial",
        error: { code: failure.code, messagePublic: failure.messagePublic },
        partial,
      };
    }
    return {
      ok: false,
      status: "failed",
      error: { code: failure.code, messagePublic: failure.messagePublic },
    };
  }

  const { scores, scoreMeta } = computeWebsiteAnalysisScores({
    lighthouse: parsed.categoryScores,
    lighthouseVersion: parsed.lighthouseVersion,
    primaryStrategy: "mobile",
  });

  const hasAnyCategoryScore =
    scores.performance !== null || scores.seo !== null || scores.accessibility !== null;

  if (!hasAnyCategoryScore) {
    const failure = pageSpeedFailure("psi_invalid_response");
    return {
      ok: false,
      status: "failed",
      error: { code: failure.code, messagePublic: failure.messagePublic },
    };
  }

  const { findings, recommendations } = buildAuditInsightsFromPageSpeedResponse(parsed.raw);

  const status: "completed" | "partial" =
    parsed.missingCategories.length > 0 ? "partial" : "completed";

  return {
    ok: true,
    status,
    scores,
    scoreMeta,
    labMetrics: parsed.labMetrics,
    fieldData: parsed.fieldData,
    findings,
    recommendations,
    missingCategories: parsed.missingCategories,
    lighthouseVersion: parsed.lighthouseVersion,
  };
}

function tryBuildPartialSuccess(
  parsed: NonNullable<ReturnType<typeof parsePageSpeedResponsePayload>>
): MobilePageSpeedAnalysisSuccess | null {
  const { scores } = computeWebsiteAnalysisScores({
    lighthouse: parsed.categoryScores,
    lighthouseVersion: parsed.lighthouseVersion,
    primaryStrategy: "mobile",
  });

  const hasAnyCategoryScore =
    scores.performance !== null || scores.seo !== null || scores.accessibility !== null;
  if (!hasAnyCategoryScore) {
    return null;
  }

  const { findings, recommendations } = buildAuditInsightsFromPageSpeedResponse(parsed.raw);

  return {
    ok: true,
    status: "partial",
    scores,
    scoreMeta: computeWebsiteAnalysisScores({
      lighthouse: parsed.categoryScores,
      lighthouseVersion: parsed.lighthouseVersion,
      primaryStrategy: "mobile",
    }).scoreMeta,
    labMetrics: parsed.labMetrics,
    fieldData: parsed.fieldData,
    findings,
    recommendations,
    missingCategories: parsed.missingCategories,
    lighthouseVersion: parsed.lighthouseVersion,
  };
}

export function assembleMobilePageSpeedAnalysisFailure(
  failure: PageSpeedClientFailure
): MobilePageSpeedAnalysisFailure {
  return {
    ok: false,
    status: "failed",
    error: {
      code: failure.code,
      messagePublic: failure.messagePublic,
    },
    psiFetchFailure: failure,
  };
}
