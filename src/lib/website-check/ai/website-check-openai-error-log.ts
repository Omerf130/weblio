import { APIError } from "openai";
import { isWebsiteCheckDevDiagnosticsEnabled } from "@/lib/website-check/website-check-dev-diagnostics";

export type SafeOpenAiErrorDetails = {
  status: number | null;
  type: string | null;
  code: string | null;
  param: string | null;
  message: string | null;
};

export function extractSafeOpenAiErrorDetails(error: unknown): SafeOpenAiErrorDetails {
  if (!(error instanceof APIError)) {
    return {
      status: null,
      type: null,
      code: null,
      param: null,
      message: error instanceof Error ? error.name : null,
    };
  }

  const body = error.error as
    | { type?: string; code?: string; param?: string; message?: string }
    | undefined;

  return {
    status: error.status ?? null,
    type: body?.type ?? null,
    code: typeof body?.code === "string" ? body.code : null,
    param: typeof body?.param === "string" ? body.param : null,
    message: typeof body?.message === "string" ? body.message : error.message ?? null,
  };
}

export function logWebsiteCheckOpenAiError(
  context: string,
  error: unknown,
  envSource: Record<string, string | undefined> = process.env
): void {
  const details = extractSafeOpenAiErrorDetails(error);
  console.warn(
    `[website-check-ai] OpenAI error status=${details.status ?? "unknown"} context=${context}`
  );
  if (isWebsiteCheckDevDiagnosticsEnabled(envSource)) {
    console.info("[website-check-ai] OpenAI error details (dev)", details);
  }
}
