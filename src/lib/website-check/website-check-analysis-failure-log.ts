import { isWebsiteCheckDevDiagnosticsEnabled } from "@/lib/website-check/website-check-dev-diagnostics";
import type { PageSpeedClientFailure } from "@/lib/website-check/psi/pagespeed-errors";

export type WebsiteCheckAnalysisFailureDiagnostics = {
  runId: string;
  urlNormalized: string;
  phase: string;
  status: "failed";
  errorCode: string;
  messagePublic: string;
  upstreamHttpStatus: number | null;
  upstreamMessage: string | null;
  elapsedMs: number;
  category:
    | "pagespeed_client"
    | "pagespeed_server"
    | "pagespeed_rate_limit"
    | "pagespeed_timeout"
    | "pagespeed_network"
    | "pagespeed_invalid_response"
    | "pagespeed_runtime"
    | "pagespeed_not_configured"
    | "analysis_other";
};

function mapFailureCategory(code: string): WebsiteCheckAnalysisFailureDiagnostics["category"] {
  switch (code) {
    case "psi_client_error":
      return "pagespeed_client";
    case "psi_server_error":
      return "pagespeed_server";
    case "psi_rate_limited":
      return "pagespeed_rate_limit";
    case "psi_timeout":
      return "pagespeed_timeout";
    case "psi_network_error":
      return "pagespeed_network";
    case "psi_invalid_response":
      return "pagespeed_invalid_response";
    case "psi_runtime_error":
      return "pagespeed_runtime";
    case "psi_not_configured":
      return "pagespeed_not_configured";
    default:
      return "analysis_other";
  }
}

export function buildWebsiteCheckAnalysisFailureDiagnostics(input: {
  runId: string;
  urlNormalized: string;
  phase: string;
  errorCode: string;
  messagePublic: string;
  elapsedMs: number;
  psiFailure?: Pick<PageSpeedClientFailure, "httpStatus" | "upstreamMessage">;
}): WebsiteCheckAnalysisFailureDiagnostics {
  return {
    runId: input.runId,
    urlNormalized: input.urlNormalized,
    phase: input.phase,
    status: "failed",
    errorCode: input.errorCode,
    messagePublic: input.messagePublic,
    upstreamHttpStatus: input.psiFailure?.httpStatus ?? null,
    upstreamMessage: input.psiFailure?.upstreamMessage ?? null,
    elapsedMs: input.elapsedMs,
    category: mapFailureCategory(input.errorCode),
  };
}

export function logWebsiteCheckAnalysisFailure(
  diagnostics: WebsiteCheckAnalysisFailureDiagnostics,
  envSource: Record<string, string | undefined> = process.env
): void {
  if (!isWebsiteCheckDevDiagnosticsEnabled(envSource)) {
    console.warn(
      `[website-check] analysis failed run=${diagnostics.runId} code=${diagnostics.errorCode}`
    );
    return;
  }
  console.info("[website-check-diag] analysis_failed", diagnostics);
}
