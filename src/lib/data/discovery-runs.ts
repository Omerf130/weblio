import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import type { DiscoveryPolicy } from "@/lib/discovery/discovery-policy";
import type { TavilyDiscoveryRunSummary } from "@/lib/discovery/tavily-discovery-run-summary";
import type { DiscoverySearchProfileCatalog } from "@/lib/discovery/providers/types";
import { DiscoveryRun, type DiscoveryRunDocument } from "@/models/DiscoveryRun";
import type {
  DiscoveryRunCatalogSnapshot,
  DiscoveryRunDto,
  DiscoveryRunPolicySnapshot,
  DiscoveryRunProfileErrorSummary,
  DiscoveryRunStatus,
  DiscoveryRunSummaryDto,
} from "@/types/discovery-run";

/** Max wall-clock time a run may stay `running` before treated as stale (30 minutes). */
export const DISCOVERY_RUN_STALE_AFTER_MS = 30 * 60 * 1000;

const MAX_STORED_PROFILE_ERRORS = 12;
const MAX_PROFILE_ERROR_MESSAGE = 200;

function truncateMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length <= MAX_PROFILE_ERROR_MESSAGE) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_PROFILE_ERROR_MESSAGE - 1)}…`;
}

function toProfileErrors(
  summary: TavilyDiscoveryRunSummary
): DiscoveryRunProfileErrorSummary[] | undefined {
  if (summary.profileErrors.length === 0) {
    return undefined;
  }
  return summary.profileErrors.slice(0, MAX_STORED_PROFILE_ERRORS).map((entry) => ({
    profileId: entry.profileId,
    message: truncateMessage(entry.message),
  }));
}

export function buildPolicySnapshot(policy: DiscoveryPolicy): DiscoveryRunPolicySnapshot {
  return {
    policyVersion: policy.version,
    timeRange: policy.tavily.timeRange,
    excludedDomainCount: policy.tavily.excludeDomains.length,
    maxProfilesPerRun: policy.limits.maxProfilesPerRun,
    maxTavilyRequestsPerRun: policy.limits.maxTavilyRequestsPerRun,
    maxResultsPerQuery: policy.tavily.maxResultsPerQuery,
    maxCandidatesPerRun: policy.limits.maxCandidatesPerRun,
    maxClassificationsPerRun: policy.limits.maxClassificationsPerRun,
  };
}

export function buildCatalogSnapshot(
  catalog: DiscoverySearchProfileCatalog
): DiscoveryRunCatalogSnapshot {
  return {
    catalogVersion: catalog.version,
    environment: catalog.environment,
    profileCount: catalog.profiles.length,
  };
}

export function toDiscoveryRunSummaryDto(
  summary: TavilyDiscoveryRunSummary
): DiscoveryRunSummaryDto {
  return {
    profilesConfigured: summary.profilesConfigured,
    profilesSearched: summary.profilesSearched,
    tavilyRequests: summary.tavilyRequests,
    rawResults: summary.rawResults,
    filteredMapping: summary.filteredMapping,
    filteredValidation: summary.filteredValidation,
    filteredDomain: summary.filteredDomain,
    filteredDuplicateInRun: summary.filteredDuplicateInRun,
    uniqueCandidates: summary.uniqueCandidates,
    candidatesLimited: summary.candidatesLimited,
    ingestReceived: summary.ingestReceived,
    created: summary.created,
    rediscovered: summary.rediscovered,
    classified: summary.classified,
    unclassified: summary.unclassified,
    failed: summary.failed,
    classificationLimit: summary.classificationLimit,
    classificationLimitReached: summary.classificationLimitReached,
    profileErrorCount: summary.profileErrors.length,
  };
}

function toDiscoveryRunDto(doc: DiscoveryRunDocument): DiscoveryRunDto {
  const hasMetrics = doc.profilesConfigured !== undefined && doc.profilesConfigured !== null;

  return {
    id: doc._id.toString(),
    status: doc.status as DiscoveryRunStatus,
    startedAt: doc.startedAt.toISOString(),
    completedAt: doc.completedAt?.toISOString(),
    triggeredBy: doc.triggeredBy,
    failureCategory: doc.failureCategory ?? undefined,
    policy: doc.policy as DiscoveryRunPolicySnapshot,
    catalog: doc.catalog as DiscoveryRunCatalogSnapshot,
    summary: hasMetrics
      ? {
          profilesConfigured: doc.profilesConfigured ?? 0,
          profilesSearched: doc.profilesSearched ?? 0,
          tavilyRequests: doc.tavilyRequests ?? 0,
          rawResults: doc.rawResults ?? 0,
          filteredMapping: doc.filteredMapping ?? 0,
          filteredValidation: doc.filteredValidation ?? 0,
          filteredDomain: doc.filteredDomain ?? 0,
          filteredDuplicateInRun: doc.filteredDuplicateInRun ?? 0,
          uniqueCandidates: doc.uniqueCandidates ?? 0,
          candidatesLimited: doc.candidatesLimited ?? 0,
          ingestReceived: doc.ingestReceived ?? 0,
          created: doc.created ?? 0,
          rediscovered: doc.rediscovered ?? 0,
          classified: doc.classified ?? 0,
          unclassified: doc.unclassified ?? 0,
          failed: doc.failed ?? 0,
          classificationLimit: doc.classificationLimit ?? 0,
          classificationLimitReached: doc.classificationLimitReached ?? false,
          profileErrorCount: doc.profileErrorCount ?? 0,
        }
      : undefined,
    profileErrors: doc.profileErrors?.length
      ? (doc.profileErrors as DiscoveryRunProfileErrorSummary[])
      : undefined,
  };
}

export async function createDiscoveryRunRunning(input: {
  triggeredBy: string;
  policy: DiscoveryPolicy;
  catalog: DiscoverySearchProfileCatalog;
  startedAt?: Date;
}): Promise<DiscoveryRunDto> {
  await connectDB();
  const startedAt = input.startedAt ?? new Date();

  const doc = await DiscoveryRun.create({
    startedAt,
    status: "running",
    triggeredBy: input.triggeredBy.trim(),
    policy: buildPolicySnapshot(input.policy),
    catalog: buildCatalogSnapshot(input.catalog),
  });

  return toDiscoveryRunDto(doc);
}

function summaryToUpdateFields(summary: TavilyDiscoveryRunSummary) {
  return {
    profilesConfigured: summary.profilesConfigured,
    profilesSearched: summary.profilesSearched,
    tavilyRequests: summary.tavilyRequests,
    rawResults: summary.rawResults,
    filteredMapping: summary.filteredMapping,
    filteredValidation: summary.filteredValidation,
    filteredDomain: summary.filteredDomain,
    filteredDuplicateInRun: summary.filteredDuplicateInRun,
    uniqueCandidates: summary.uniqueCandidates,
    candidatesLimited: summary.candidatesLimited,
    ingestReceived: summary.ingestReceived,
    created: summary.created,
    rediscovered: summary.rediscovered,
    classified: summary.classified,
    unclassified: summary.unclassified,
    failed: summary.failed,
    classificationLimit: summary.classificationLimit,
    classificationLimitReached: summary.classificationLimitReached,
    profileErrorCount: summary.profileErrors.length,
    profileErrors: toProfileErrors(summary),
  };
}

export async function completeDiscoveryRun(input: {
  runId: string;
  status: Exclude<DiscoveryRunStatus, "running">;
  summary: TavilyDiscoveryRunSummary;
  completedAt?: Date;
  failureCategory?: string;
}): Promise<DiscoveryRunDto | null> {
  await connectDB();
  const completedAt = input.completedAt ?? new Date();

  const doc = await DiscoveryRun.findByIdAndUpdate(
    input.runId,
    {
      $set: {
        status: input.status,
        completedAt,
        failureCategory: input.failureCategory?.trim() || undefined,
        ...summaryToUpdateFields(input.summary),
      },
    },
    { new: true }
  ).lean<DiscoveryRunDocument>();

  if (!doc) {
    return null;
  }

  return toDiscoveryRunDto(doc as DiscoveryRunDocument);
}

export async function failDiscoveryRun(input: {
  runId: string;
  failureCategory: string;
  completedAt?: Date;
  summary?: TavilyDiscoveryRunSummary;
}): Promise<DiscoveryRunDto | null> {
  await connectDB();
  const completedAt = input.completedAt ?? new Date();
  const update: Record<string, unknown> = {
    status: "failed",
    completedAt,
    failureCategory: input.failureCategory.trim().slice(0, 64),
  };

  if (input.summary) {
    Object.assign(update, summaryToUpdateFields(input.summary));
  }

  const doc = await DiscoveryRun.findByIdAndUpdate(
    input.runId,
    { $set: update },
    { new: true }
  ).lean<DiscoveryRunDocument>();

  if (!doc) {
    return null;
  }

  return toDiscoveryRunDto(doc as DiscoveryRunDocument);
}

export async function getDiscoveryRunById(
  runId: string
): Promise<DiscoveryRunDto | null> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(runId)) {
    return null;
  }

  const doc = await DiscoveryRun.findById(runId).lean<DiscoveryRunDocument>();
  if (!doc) {
    return null;
  }

  return toDiscoveryRunDto(doc as DiscoveryRunDocument);
}

export async function findLatestDiscoveryRunForCooldown(): Promise<DiscoveryRunDto | null> {
  await connectDB();
  const doc = await DiscoveryRun.findOne({
    status: { $in: ["completed", "partial", "failed"] },
    completedAt: { $exists: true },
  })
    .sort({ completedAt: -1 })
    .lean<DiscoveryRunDocument>();

  if (!doc) {
    return null;
  }

  return toDiscoveryRunDto(doc as DiscoveryRunDocument);
}

export async function findActiveDiscoveryRun(): Promise<DiscoveryRunDto | null> {
  await connectDB();
  const doc = await DiscoveryRun.findOne({ status: "running" })
    .sort({ startedAt: -1 })
    .lean<DiscoveryRunDocument>();

  if (!doc) {
    return null;
  }

  return toDiscoveryRunDto(doc as DiscoveryRunDocument);
}

export function computeCooldownRemainingSeconds(input: {
  lastCompletedAt: Date;
  cooldownMinutes: number;
  now?: Date;
}): number {
  const now = input.now ?? new Date();
  const cooldownMs = input.cooldownMinutes * 60 * 1000;
  const elapsed = now.getTime() - input.lastCompletedAt.getTime();
  const remainingMs = cooldownMs - elapsed;
  if (remainingMs <= 0) {
    return 0;
  }
  return Math.ceil(remainingMs / 1000);
}

export function isDiscoveryRunStale(
  startedAt: Date,
  now: Date = new Date(),
  staleAfterMs: number = DISCOVERY_RUN_STALE_AFTER_MS
): boolean {
  return now.getTime() - startedAt.getTime() > staleAfterMs;
}

export async function markStaleDiscoveryRunsFailed(
  now: Date = new Date(),
  staleAfterMs: number = DISCOVERY_RUN_STALE_AFTER_MS
): Promise<number> {
  await connectDB();
  const threshold = new Date(now.getTime() - staleAfterMs);

  const result = await DiscoveryRun.updateMany(
    {
      status: "running",
      startedAt: { $lt: threshold },
    },
    {
      $set: {
        status: "failed",
        completedAt: now,
        failureCategory: "stale_running",
      },
    }
  );

  return result.modifiedCount ?? 0;
}
