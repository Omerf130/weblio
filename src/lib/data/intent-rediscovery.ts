import { assessDiscoveryContentQuality } from "@/lib/discovery/discovery-content-quality";
import { extractDiscoveryProvenance } from "@/lib/discovery/discovery-provenance";
import type { NormalizedDiscoveryInput } from "@/lib/discovery/types";
import type { IntentClassification, IntentContentQuality } from "@/types/intent";

/** Fields that must never change on rediscovery upsert. */
export const REDISCOVERY_PRESERVED_FIELD_KEYS = [
  "classification",
  "classificationReason",
  "classifiedAt",
  "classifierVersion",
  "status",
  "opportunityId",
  "convertedAt",
  "discoveredAt",
] as const;

export type RediscoveryMongoUpdate = {
  $set: { lastSeenAt: Date };
  $inc: { discoveryCount: 1 };
};

export function buildRediscoveryUpdate(now: Date): RediscoveryMongoUpdate {
  return {
    $set: { lastSeenAt: now },
    $inc: { discoveryCount: 1 },
  };
}

export type FirstDiscoveryDocumentFields = {
  provider: string;
  externalId?: string;
  dedupeKey: string;
  sourceType?: NormalizedDiscoveryInput["sourceType"];
  sourcePlatform?: string;
  sourceUrl?: string;
  title?: string;
  content: string;
  authorDisplayName?: string;
  publishedAt?: Date;
  discoveredAt: Date;
  lastSeenAt: Date;
  discoveryCount: 1;
  classification: IntentClassification;
  classificationReason?: string;
  classifiedAt?: Date;
  classifierVersion?: string;
  status: "new";
  rawMetadata?: Record<string, unknown>;
  discoveryProfileId?: string;
  discoveryQuery?: string;
  contentQuality?: IntentContentQuality;
  contentQualityReasons?: string[];
};

export function buildFirstDiscoveryDocument(
  input: NormalizedDiscoveryInput,
  dedupeKey: string,
  now: Date,
  classification: IntentClassification = "unclassified"
): FirstDiscoveryDocumentFields {
  const provenance = extractDiscoveryProvenance(input);
  const quality = assessDiscoveryContentQuality({
    content: input.content,
    title: input.title,
    sourceUrl: input.sourceUrl,
    sourcePlatform: input.sourcePlatform,
  });

  return {
    provider: input.provider.trim().toLowerCase(),
    externalId: input.externalId?.trim() || undefined,
    dedupeKey,
    sourceType: input.sourceType,
    sourcePlatform: input.sourcePlatform?.trim() || undefined,
    sourceUrl: input.sourceUrl?.trim() || undefined,
    title: input.title?.trim() || undefined,
    content: input.content.trim(),
    authorDisplayName: input.authorDisplayName?.trim() || undefined,
    publishedAt: input.publishedAt,
    discoveredAt: now,
    lastSeenAt: now,
    discoveryCount: 1,
    classification,
    status: "new",
    rawMetadata: input.rawMetadata,
    discoveryProfileId: provenance.discoveryProfileId,
    discoveryQuery: provenance.discoveryQuery,
    contentQuality: quality.quality,
    ...(quality.reasons.length > 0 ? { contentQualityReasons: quality.reasons } : {}),
  };
}

export function buildClassifiedFirstDiscoveryDocument(
  input: NormalizedDiscoveryInput,
  dedupeKey: string,
  now: Date,
  classification: Exclude<IntentClassification, "unclassified" | "irrelevant">,
  classificationReason: string,
  classifierVersion: string
): FirstDiscoveryDocumentFields {
  const base = buildFirstDiscoveryDocument(input, dedupeKey, now, classification);
  return {
    ...base,
    classificationReason: classificationReason.trim().slice(0, 500),
    classifiedAt: now,
    classifierVersion: classifierVersion.trim().slice(0, 64),
  };
}

/** Ensures rediscovery updates never include preserved workflow/classification fields. */
export function assertRediscoveryUpdateDoesNotResetPreservedFields(
  update: Record<string, unknown>
): void {
  const forbidden = new Set<string>(REDISCOVERY_PRESERVED_FIELD_KEYS);
  const setBlock = update.$set;
  if (setBlock && typeof setBlock === "object") {
    for (const key of Object.keys(setBlock as object)) {
      if (forbidden.has(key as (typeof REDISCOVERY_PRESERVED_FIELD_KEYS)[number])) {
        throw new Error(`REDISCOVERY_UPDATE_MUST_NOT_SET_${key}`);
      }
    }
  }
}
