import {
  OPPORTUNITY_CLASSIFICATIONS,
  OPPORTUNITY_SOURCES,
  OPPORTUNITY_STATUSES,
  type OpportunityClassification,
  type OpportunitySource,
  type OpportunityStatus,
} from "@/types/opportunity";

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  new: "חדש",
  researching: "בבדיקה",
  contacted: "נוצר קשר",
  converted: "הומר לליד",
  dismissed: "נדחה",
};

export const OPPORTUNITY_CLASSIFICATION_LABELS: Record<
  OpportunityClassification,
  string
> = {
  explicitNeed: "צורך מפורש",
  possibleNeed: "צורך אפשרי",
  businessDiscovery: "עסק פוטנציאלי",
};

export const OPPORTUNITY_SOURCE_LABELS: Record<OpportunitySource, string> = {
  manual: "ידני",
  intent: "כוונה (Intent)",
  businessDiscovery: "גילוי עסקים",
  referral: "הפניה",
  other: "אחר",
};

/** Statuses admins may set through normal status updates (not conversion). */
export const MANUAL_OPPORTUNITY_STATUSES = [
  "new",
  "researching",
  "contacted",
  "dismissed",
] as const;

export type ManualOpportunityStatus = (typeof MANUAL_OPPORTUNITY_STATUSES)[number];

const ACTIVE_STATUSES: OpportunityStatus[] = ["new", "researching", "contacted"];

export function isOpportunityStatus(value: string): value is OpportunityStatus {
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(value);
}

export function isOpportunitySource(value: string): value is OpportunitySource {
  return (OPPORTUNITY_SOURCES as readonly string[]).includes(value);
}

export function isOpportunityClassification(
  value: string
): value is OpportunityClassification {
  return (OPPORTUNITY_CLASSIFICATIONS as readonly string[]).includes(value);
}

export function isManualOpportunityStatus(
  value: string
): value is ManualOpportunityStatus {
  return (MANUAL_OPPORTUNITY_STATUSES as readonly string[]).includes(value);
}

/**
 * Whether a normal (non-conversion) status update is allowed.
 * `converted` cannot be chosen manually and cannot be left once set.
 */
export function canTransitionOpportunityStatus(
  current: OpportunityStatus,
  next: OpportunityStatus
): boolean {
  if (current === next) {
    return true;
  }

  if (current === "converted") {
    return false;
  }

  if (next === "converted") {
    return false;
  }

  if (current === "dismissed") {
    return ACTIVE_STATUSES.includes(next);
  }

  if (ACTIVE_STATUSES.includes(current)) {
    return ACTIVE_STATUSES.includes(next) || next === "dismissed";
  }

  return false;
}

export function assertOpportunityStatusTransition(
  current: OpportunityStatus,
  next: OpportunityStatus
): void {
  if (!canTransitionOpportunityStatus(current, next)) {
    throw new Error("INVALID_OPPORTUNITY_STATUS_TRANSITION");
  }
}

/** Manual status targets allowed from `current` (for admin UI; server remains authoritative). */
export function getManualStatusTransitionTargets(
  current: OpportunityStatus
): ManualOpportunityStatus[] {
  return MANUAL_OPPORTUNITY_STATUSES.filter(
    (next) => next !== current && canTransitionOpportunityStatus(current, next)
  );
}

export const DEFAULT_OPPORTUNITY_PAGE_SIZE = 20;
export const MAX_OPPORTUNITY_PAGE_SIZE = 100;

export function normalizeOpportunityListPagination(options: {
  page?: number;
  pageSize?: number;
}): { page: number; pageSize: number } {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(
    MAX_OPPORTUNITY_PAGE_SIZE,
    Math.max(1, options.pageSize ?? DEFAULT_OPPORTUNITY_PAGE_SIZE)
  );
  return { page, pageSize };
}
