import mongoose from "mongoose";
import { computeDedupeKey } from "@/lib/discovery/dedupe-key";
import type { NormalizedDiscoveryInput } from "@/lib/discovery/types";
import type { UpsertDiscoveredIntentResult } from "@/lib/discovery/types";
import {
  assertIntentStatusTransition,
  LIST_CONTENT_PREVIEW_LENGTH,
  normalizeIntentListPagination,
} from "@/lib/business/intents/rules";
import {
  buildFirstDiscoveryDocument,
  buildRediscoveryUpdate,
} from "@/lib/data/intent-rediscovery";
import { connectDB } from "@/lib/db/mongoose";
import type { NormalizedDiscoveryInputParsed } from "@/lib/validations/intent";
import { normalizedDiscoveryInputSchema } from "@/lib/validations/intent";
import type { UpdateIntentClassificationInput } from "@/lib/validations/intent";
import type { SetIntentStatusInput } from "@/lib/validations/intent";
import { Intent, type IntentDocument } from "@/models/Intent";
import type {
  AdminIntentDetailDto,
  AdminIntentListItemDto,
  IntentClassification,
  IntentContentQuality,
  IntentListOptions,
  IntentListResult,
  IntentSourceType,
  IntentStatus,
} from "@/types/intent";

type LeanIntent = Omit<IntentDocument, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildContentPreview(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= LIST_CONTENT_PREVIEW_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, LIST_CONTENT_PREVIEW_LENGTH)}…`;
}

function toAdminIntentListItemDto(doc: LeanIntent): AdminIntentListItemDto {
  return {
    id: doc._id.toString(),
    provider: doc.provider,
    externalId: doc.externalId || undefined,
    sourceType: doc.sourceType as IntentSourceType | undefined,
    sourcePlatform: doc.sourcePlatform || undefined,
    sourceUrl: doc.sourceUrl || undefined,
    title: doc.title || undefined,
    contentPreview: buildContentPreview(doc.content),
    authorDisplayName: doc.authorDisplayName || undefined,
    publishedAt: doc.publishedAt?.toISOString(),
    discoveredAt: doc.discoveredAt.toISOString(),
    lastSeenAt: doc.lastSeenAt.toISOString(),
    discoveryCount: doc.discoveryCount,
    classification: doc.classification as IntentClassification,
    classificationReason: doc.classificationReason || undefined,
    classifiedAt: doc.classifiedAt?.toISOString(),
    classifierVersion: doc.classifierVersion || undefined,
    status: doc.status as IntentStatus,
    opportunityId: doc.opportunityId?.toString(),
    convertedAt: doc.convertedAt?.toISOString(),
    discoveryProfileId: doc.discoveryProfileId || undefined,
    discoveryQuery: doc.discoveryQuery || undefined,
    contentQuality: doc.contentQuality as IntentContentQuality | undefined,
    contentQualityReasons:
      doc.contentQualityReasons && doc.contentQualityReasons.length > 0
        ? [...doc.contentQualityReasons]
        : undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toAdminIntentDetailDto(doc: LeanIntent): AdminIntentDetailDto {
  const raw =
    doc.rawMetadata &&
    typeof doc.rawMetadata === "object" &&
    !Array.isArray(doc.rawMetadata)
      ? (doc.rawMetadata as Record<string, unknown>)
      : undefined;

  return {
    ...toAdminIntentListItemDto(doc),
    content: doc.content,
    rawMetadata: raw,
  };
}

function buildIntentListQuery(
  options: Pick<
    IntentListOptions,
    "status" | "classification" | "classifications" | "provider" | "q"
  >
): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (options.status) {
    query.status = options.status;
  }

  if (options.classifications && options.classifications.length > 0) {
    query.classification = { $in: options.classifications };
  } else if (options.classification) {
    query.classification = options.classification;
  }

  if (options.provider) {
    query.provider = options.provider.trim().toLowerCase();
  }

  const search = options.q?.trim();
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    query.$or = [{ title: pattern }, { content: pattern }];
  }

  return query;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

function parseNormalizedInput(
  input: NormalizedDiscoveryInput
): NormalizedDiscoveryInputParsed {
  const parsed = normalizedDiscoveryInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("INVALID_NORMALIZED_DISCOVERY_INPUT");
  }
  return parsed.data;
}

export async function getIntentById(id: string): Promise<AdminIntentDetailDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const doc = await Intent.findById(id).lean<LeanIntent | null>();
  return doc ? toAdminIntentDetailDto(doc) : null;
}

export async function listIntents(
  options: IntentListOptions = {}
): Promise<IntentListResult> {
  await connectDB();

  const { page, pageSize } = normalizeIntentListPagination(options);
  const query = buildIntentListQuery(options);

  const sortField = options.sort ?? "-discoveredAt";
  const sortDirection = sortField.startsWith("-") ? -1 : 1;
  const sortKey = sortField.replace(/^-/, "");

  const [docs, totalItems] = await Promise.all([
    Intent.find(query)
      .sort({ [sortKey]: sortDirection })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<LeanIntent[]>(),
    Intent.countDocuments(query),
  ]);

  return {
    items: docs.map(toAdminIntentListItemDto),
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize) || 0,
  };
}

export async function upsertDiscoveredIntent(
  input: NormalizedDiscoveryInput
): Promise<UpsertDiscoveredIntentResult & { intent: AdminIntentDetailDto }> {
  const parsed = parseNormalizedInput(input);
  const dedupeKey = computeDedupeKey({
    provider: parsed.provider,
    externalId: parsed.externalId,
    sourceUrl: parsed.sourceUrl,
  });

  await connectDB();

  const now = new Date();
  const existing = await Intent.findOne({ dedupeKey }).lean<LeanIntent | null>();

  if (existing) {
    const updated = await Intent.findOneAndUpdate(
      { dedupeKey },
      buildRediscoveryUpdate(now),
      { returnDocument: "after" }
    ).lean<LeanIntent | null>();

    if (!updated) {
      throw new Error("INTENT_UPSERT_FAILED");
    }

    return {
      intentId: updated._id.toString(),
      created: false,
      dedupeKey,
      intent: toAdminIntentDetailDto(updated),
    };
  }

  const createPayload = buildFirstDiscoveryDocument(parsed, dedupeKey, now);

  try {
    const doc = await Intent.create(createPayload);
    const lean = doc.toObject() as LeanIntent;
    return {
      intentId: lean._id.toString(),
      created: true,
      dedupeKey,
      intent: toAdminIntentDetailDto(lean),
    };
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const updated = await Intent.findOneAndUpdate(
      { dedupeKey },
      buildRediscoveryUpdate(now),
      { returnDocument: "after" }
    ).lean<LeanIntent | null>();

    if (!updated) {
      throw new Error("INTENT_UPSERT_RACE_FAILED");
    }

    return {
      intentId: updated._id.toString(),
      created: false,
      dedupeKey,
      intent: toAdminIntentDetailDto(updated),
    };
  }
}

export async function updateIntentClassification(
  input: UpdateIntentClassificationInput
): Promise<AdminIntentDetailDto | null> {
  if (!mongoose.Types.ObjectId.isValid(input.intentId)) {
    return null;
  }

  await connectDB();

  const existing = await Intent.findById(input.intentId).lean<LeanIntent | null>();
  if (!existing) {
    return null;
  }

  if (existing.status === "saved") {
    throw new Error("INTENT_CLASSIFICATION_LOCKED");
  }

  const isUnclassified = input.classification === "unclassified";

  const doc = await Intent.findByIdAndUpdate(
    input.intentId,
    {
      $set: isUnclassified
        ? {
            classification: "unclassified",
            classificationReason: null,
            classifierVersion: null,
            classifiedAt: null,
          }
        : {
            classification: input.classification,
            classificationReason: input.classificationReason ?? null,
            classifierVersion: input.classifierVersion ?? "manual-v1",
            classifiedAt: new Date(),
          },
    },
    { returnDocument: "after" }
  ).lean<LeanIntent | null>();

  return doc ? toAdminIntentDetailDto(doc) : null;
}

export async function setIntentStatus(
  input: SetIntentStatusInput
): Promise<AdminIntentDetailDto | null> {
  if (!mongoose.Types.ObjectId.isValid(input.intentId)) {
    return null;
  }

  await connectDB();

  const existing = await Intent.findById(input.intentId).lean<LeanIntent | null>();
  if (!existing) {
    return null;
  }

  const currentStatus = existing.status as IntentStatus;
  assertIntentStatusTransition(currentStatus, input.status);

  const doc = await Intent.findByIdAndUpdate(
    input.intentId,
    { $set: { status: input.status } },
    { returnDocument: "after" }
  ).lean<LeanIntent | null>();

  return doc ? toAdminIntentDetailDto(doc) : null;
}

const ACTIONABLE_INBOX_CLASSIFICATIONS = [
  "unclassified",
  "explicitNeed",
  "possibleNeed",
] as const;

export async function countActionableIntents(): Promise<number> {
  await connectDB();
  return Intent.countDocuments({
    status: "new",
    classification: { $in: [...ACTIONABLE_INBOX_CLASSIFICATIONS] },
  });
}

export async function getDistinctIntentProviders(): Promise<string[]> {
  await connectDB();
  const providers = await Intent.distinct("provider");
  return providers.filter((value): value is string => typeof value === "string").sort();
}

export {
  buildIntentListQuery,
  buildContentPreview,
  normalizeIntentListPagination,
};
