export const INTENT_SOURCE_TYPES = [
  "search_result",
  "post",
  "comment",
  "page",
  "manual",
] as const;

export type IntentSourceType = (typeof INTENT_SOURCE_TYPES)[number];

export const INTENT_CLASSIFICATIONS = [
  "unclassified",
  "explicitNeed",
  "possibleNeed",
  "irrelevant",
] as const;

export type IntentClassification = (typeof INTENT_CLASSIFICATIONS)[number];

export const INTENT_STATUSES = ["new", "dismissed", "saved"] as const;

export type IntentStatus = (typeof INTENT_STATUSES)[number];

/** Extensible provider slug (dev, brave, tavily, …). */
export type IntentProvider = string;

export type AdminIntentListItemDto = {
  id: string;
  provider: string;
  externalId?: string;
  sourceType?: IntentSourceType;
  sourcePlatform?: string;
  sourceUrl?: string;
  title?: string;
  contentPreview: string;
  authorDisplayName?: string;
  publishedAt?: string;
  discoveredAt: string;
  lastSeenAt: string;
  discoveryCount: number;
  classification: IntentClassification;
  classificationReason?: string;
  classifiedAt?: string;
  classifierVersion?: string;
  status: IntentStatus;
  opportunityId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminIntentDetailDto = AdminIntentListItemDto & {
  content: string;
  rawMetadata?: Record<string, unknown>;
};

export type IntentStatusFilter = "all" | IntentStatus;

export type IntentClassificationFilter = "all" | IntentClassification;

export type IntentProviderFilter = "all" | string;

export type IntentListOptions = {
  page?: number;
  pageSize?: number;
  status?: IntentStatus;
  classification?: IntentClassification;
  /** When set, matches any of these classifications (`$in`). */
  classifications?: IntentClassification[];
  provider?: string;
  q?: string;
  sort?: "discoveredAt" | "-discoveredAt" | "lastSeenAt" | "-lastSeenAt";
};

export type IntentListResult = {
  items: AdminIntentListItemDto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
