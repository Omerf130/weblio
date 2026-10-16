const MAX_UPSTREAM_MESSAGE_LENGTH = 320;

export const PSI_FAILED_DOCUMENT_REQUEST_PUBLIC_MESSAGE =
  "שירות הבדיקה (Google PageSpeed) לא הצליח לטעון את האתר מהשרתים שלו. זה לא אומר בהכרח שהאתר לא עובד אצלכם - לפעמים חסימות, הגדרות אבטחה או תקלות רשת מונעות מהשירות לגשת לכתובת.";

export function isFailedDocumentRequestSignal(message: string | undefined): boolean {
  if (!message?.trim()) {
    return false;
  }
  return /FAILED_DOCUMENT_REQUEST/i.test(message);
}

export function extractSafePageSpeedApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const error = (payload as { error?: { message?: string } }).error;
  const message = error?.message?.trim();
  if (!message) {
    return null;
  }

  const sanitized = message
    .replace(/key=[^&\s]+/gi, "key=[REDACTED]")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized) {
    return null;
  }

  return sanitized.length > MAX_UPSTREAM_MESSAGE_LENGTH
    ? `${sanitized.slice(0, MAX_UPSTREAM_MESSAGE_LENGTH)}…`
    : sanitized;
}
