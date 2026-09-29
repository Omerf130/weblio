import type { IntentSourceType } from "@/types/intent";

/**
 * Provider-neutral shape future search adapters must map into before dedupe/persist.
 */
export type NormalizedDiscoveryInput = {
  provider: string;
  externalId?: string;
  sourceType?: IntentSourceType;
  sourcePlatform?: string;
  sourceUrl?: string;
  title?: string;
  content: string;
  authorDisplayName?: string;
  publishedAt?: Date;
  rawMetadata?: Record<string, unknown>;
};

export type UpsertDiscoveredIntentResult = {
  intentId: string;
  created: boolean;
  dedupeKey: string;
};
