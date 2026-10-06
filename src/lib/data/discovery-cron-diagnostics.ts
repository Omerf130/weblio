import { connectDB } from "@/lib/db/mongoose";
import { sanitizeDiscoveryCronDiagnosticDetails } from "@/lib/discovery/discovery-cron-diagnostic-sanitize";
import {
  DiscoveryCronDiagnostic,
  type DiscoveryCronDiagnosticDocument,
} from "@/models/DiscoveryCronDiagnostic";
import type {
  DiscoveryCronDiagnosticDto,
  DiscoveryCronDiagnosticOutcome,
} from "@/types/discovery-cron-diagnostic";

export const DISCOVERY_CRON_DIAGNOSTIC_RETENTION = 30;

/** Pure helper for retention trimming (newest-first id list). */
export function selectDiscoveryCronDiagnosticIdsToDelete(
  sortedNewestFirstIds: string[],
  keep = DISCOVERY_CRON_DIAGNOSTIC_RETENTION
): string[] {
  if (sortedNewestFirstIds.length <= keep) {
    return [];
  }
  return sortedNewestFirstIds.slice(keep);
}

export type BeginDiscoveryCronDiagnosticInput = {
  invokedAt: Date;
  israelLocalTime: string;
  scheduleIsraelDateKey?: string;
  vercelCronSchedule?: string;
  environment?: string;
};

export type RecordDiscoveryCronDiagnosticOutcomeInput = {
  outcome: DiscoveryCronDiagnosticOutcome;
  httpStatus: number;
  scheduleIsraelDateKey?: string;
  details?: string;
  discoveryRunId?: string;
};

function toDto(doc: DiscoveryCronDiagnosticDocument): DiscoveryCronDiagnosticDto {
  return {
    id: String(doc._id),
    invokedAt: doc.invokedAt.toISOString(),
    outcome: doc.outcome as DiscoveryCronDiagnosticOutcome,
    httpStatus: doc.httpStatus,
    scheduleIsraelDateKey: doc.scheduleIsraelDateKey ?? undefined,
    israelLocalTime: doc.israelLocalTime,
    vercelCronSchedule: doc.vercelCronSchedule ?? undefined,
    environment: doc.environment ?? undefined,
    details: doc.details ?? undefined,
    discoveryRunId: doc.discoveryRunId ?? undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function trimDiscoveryCronDiagnosticHistory(
  keep = DISCOVERY_CRON_DIAGNOSTIC_RETENTION
): Promise<void> {
  await connectDB();
  const rows = await DiscoveryCronDiagnostic.find({})
    .sort({ invokedAt: -1 })
    .select({ _id: 1 })
    .lean<{ _id: unknown }[]>();

  const idsToDelete = selectDiscoveryCronDiagnosticIdsToDelete(
    rows.map((row) => String(row._id)),
    keep
  );

  if (idsToDelete.length === 0) {
    return;
  }

  await DiscoveryCronDiagnostic.deleteMany({
    _id: { $in: idsToDelete },
  });
}

/** Creates a placeholder row; outcome finalized via update. */
export async function beginDiscoveryCronDiagnosticAttempt(
  input: BeginDiscoveryCronDiagnosticInput
): Promise<string> {
  await connectDB();
  const doc = await DiscoveryCronDiagnostic.create({
    invokedAt: input.invokedAt,
    outcome: "failed",
    httpStatus: 0,
    israelLocalTime: input.israelLocalTime,
    scheduleIsraelDateKey: input.scheduleIsraelDateKey,
    vercelCronSchedule: input.vercelCronSchedule?.trim() || undefined,
    environment: input.environment?.trim() || undefined,
    details: "pending",
  });
  await trimDiscoveryCronDiagnosticHistory();
  return String(doc._id);
}

export async function updateDiscoveryCronDiagnosticAttempt(
  attemptId: string,
  input: RecordDiscoveryCronDiagnosticOutcomeInput
): Promise<DiscoveryCronDiagnosticDto | null> {
  await connectDB();
  const doc = await DiscoveryCronDiagnostic.findByIdAndUpdate(
    attemptId,
    {
      outcome: input.outcome,
      httpStatus: input.httpStatus,
      ...(input.scheduleIsraelDateKey
        ? { scheduleIsraelDateKey: input.scheduleIsraelDateKey }
        : {}),
      ...(input.discoveryRunId ? { discoveryRunId: input.discoveryRunId } : {}),
      details: sanitizeDiscoveryCronDiagnosticDetails(input.details),
    },
    { new: true }
  ).lean<DiscoveryCronDiagnosticDocument>();

  if (!doc) {
    return null;
  }

  return toDto(doc as DiscoveryCronDiagnosticDocument);
}

export async function findLatestDiscoveryCronDiagnostic(): Promise<DiscoveryCronDiagnosticDto | null> {
  await connectDB();
  const doc = await DiscoveryCronDiagnostic.findOne({
    details: { $ne: "pending" },
  })
    .sort({ invokedAt: -1 })
    .lean<DiscoveryCronDiagnosticDocument>();

  if (!doc) {
    return null;
  }

  return toDto(doc as DiscoveryCronDiagnosticDocument);
}
