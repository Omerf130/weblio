import {
  isFailedDocumentRequestSignal,
  PSI_FAILED_DOCUMENT_REQUEST_PUBLIC_MESSAGE,
} from "./pagespeed-api-error";

export type PageSpeedClientErrorCode =
  | "psi_not_configured"
  | "psi_timeout"
  | "psi_rate_limited"
  | "psi_server_error"
  | "psi_client_error"
  | "psi_network_error"
  | "psi_invalid_response"
  | "psi_runtime_error";

export type PageSpeedClientFailure = {
  ok: false;
  code: PageSpeedClientErrorCode;
  messagePublic: string;
  httpStatus?: number;
  /** Safe upstream API message for server diagnostics only (never expose to clients). */
  upstreamMessage?: string;
};

export type PageSpeedClientSuccess = {
  ok: true;
  data: unknown;
};

export type PageSpeedClientResult = PageSpeedClientSuccess | PageSpeedClientFailure;

export const PSI_PUBLIC_ERROR_MESSAGES: Record<PageSpeedClientErrorCode, string> = {
  psi_not_configured: "שירות הניתוח אינו מוגדר כרגע.",
  psi_timeout: "הניתוח ארך זמן רב מדי. נסו שוב מאוחר יותר.",
  psi_rate_limited: "עומס רב על שירות הניתוח. נסו שוב בעוד מספר דקות.",
  psi_server_error: "שירות הניתוח אינו זמין כרגע. נסו שוב מאוחר יותר.",
  psi_client_error: "לא ניתן להריץ ניתוח לכתובת זו.",
  psi_network_error: "שגיאת רשת בעת הניתוח. נסו שוב.",
  psi_invalid_response: "התקבלה תשובה לא תקינה משירות הניתוח.",
  psi_runtime_error: "הניתוח נכשל עבור הדף שביקשתם.",
};

export function resolvePageSpeedPublicMessage(
  failure: Pick<PageSpeedClientFailure, "code" | "messagePublic" | "upstreamMessage">
): string {
  const upstream = failure.upstreamMessage?.trim();
  const runtimeHint =
    failure.code === "psi_runtime_error" ? failure.messagePublic?.trim() : undefined;

  if (isFailedDocumentRequestSignal(upstream) || isFailedDocumentRequestSignal(runtimeHint)) {
    return PSI_FAILED_DOCUMENT_REQUEST_PUBLIC_MESSAGE;
  }

  return failure.messagePublic;
}

export function pageSpeedFailure(
  code: PageSpeedClientErrorCode,
  overrides?: { messagePublic?: string; httpStatus?: number; upstreamMessage?: string }
): PageSpeedClientFailure {
  const failure: PageSpeedClientFailure = {
    ok: false,
    code,
    messagePublic: overrides?.messagePublic ?? PSI_PUBLIC_ERROR_MESSAGES[code],
    httpStatus: overrides?.httpStatus,
    upstreamMessage: overrides?.upstreamMessage,
  };
  return {
    ...failure,
    messagePublic: resolvePageSpeedPublicMessage(failure),
  };
}
