import { INTENT_STATUSES, type IntentStatus } from "@/types/intent";

export const INTENT_STATUS_LABELS: Record<IntentStatus, string> = {
  new: "חדש",
  dismissed: "נדחה",
  saved: "נשמר כהזדמנות",
};

/** Statuses admins may set through normal status updates (not conversion). */
export const MANUAL_INTENT_STATUSES = ["new", "dismissed"] as const;

export type ManualIntentStatus = (typeof MANUAL_INTENT_STATUSES)[number];

export const DEFAULT_INTENT_PAGE_SIZE = 20;
export const MAX_INTENT_PAGE_SIZE = 100;

export const LIST_CONTENT_PREVIEW_LENGTH = 240;

export const MANUAL_INTENT_CLASSIFIER_VERSION = "manual-v1";

export const INTENT_SOURCE_TYPE_LABELS: Record<string, string> = {
  search_result: "תוצאת חיפוש",
  post: "פוסט",
  comment: "תגובה",
  page: "עמוד",
  manual: "ידני",
};

export function formatIntentProviderLabel(provider: string): string {
  if (provider === "dev") {
    return "בדיקה";
  }
  return provider;
}

export function isIntentStatus(value: string): value is IntentStatus {
  return (INTENT_STATUSES as readonly string[]).includes(value);
}

export function isManualIntentStatus(value: string): value is ManualIntentStatus {
  return (MANUAL_INTENT_STATUSES as readonly string[]).includes(value);
}

/**
 * Whether a normal (non-conversion) status update is allowed.
 * `saved` cannot be chosen manually and is terminal.
 */
export function canTransitionIntentStatus(
  current: IntentStatus,
  next: IntentStatus
): boolean {
  if (current === next) {
    return true;
  }

  if (current === "saved") {
    return false;
  }

  if (next === "saved") {
    return false;
  }

  if (current === "new" && next === "dismissed") {
    return true;
  }

  if (current === "dismissed" && next === "new") {
    return true;
  }

  return false;
}

export function assertIntentStatusTransition(
  current: IntentStatus,
  next: IntentStatus
): void {
  if (!canTransitionIntentStatus(current, next)) {
    throw new Error("INVALID_INTENT_STATUS_TRANSITION");
  }
}

export function getManualIntentStatusTransitionTargets(
  current: IntentStatus
): ManualIntentStatus[] {
  return MANUAL_INTENT_STATUSES.filter(
    (next) => next !== current && canTransitionIntentStatus(current, next)
  );
}

export function normalizeIntentListPagination(options: {
  page?: number;
  pageSize?: number;
}): { page: number; pageSize: number } {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(
    MAX_INTENT_PAGE_SIZE,
    Math.max(1, options.pageSize ?? DEFAULT_INTENT_PAGE_SIZE)
  );
  return { page, pageSize };
}
