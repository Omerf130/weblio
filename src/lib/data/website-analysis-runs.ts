import mongoose from "mongoose";
import { connectDB } from "@/lib/db/mongoose";
import {
  isWebsiteAnalysisRunCacheCompatible,
  WEBSITE_CHECK_ANALYSIS_VERSION,
} from "@/lib/website-check/analysis-version";
import { WEBSITE_CHECK_CACHE_TTL_MS, WEBSITE_CHECK_RUN_STALE_MS } from "@/lib/website-check/constants";
import { hashWebsiteAnalysisUrl } from "@/lib/website-check/url-hash";
import { validatePublicWebsiteUrl } from "@/lib/website-check/validate-public-url";
import {
  WebsiteAnalysisRun,
  type WebsiteAnalysisRunDocument,
} from "@/models/WebsiteAnalysisRun";
import {
  WEBSITE_ANALYSIS_EMPTY_SCORES,
  type WebsiteAnalysisCategoryScores,
  type WebsiteAnalysisClientMeta,
  type WebsiteAnalysisFieldDataSnapshot,
  type WebsiteAnalysisFinding,
  type WebsiteAnalysisLabMetricsSnapshot,
  type WebsiteAnalysisRecommendation,
  type WebsiteAnalysisRunDto,
  type WebsiteAnalysisRunError,
  type WebsiteAnalysisRunPhase,
  type WebsiteAnalysisRunStatus,
  type WebsiteAnalysisScoreMeta,
} from "@/types/website-analysis-run";
import type { WebsiteCheckAiInsights } from "@/types/website-check-ai";

type LeanWebsiteAnalysisRun = Omit<
  WebsiteAnalysisRunDocument,
  keyof mongoose.Document
> & {
  _id: mongoose.Types.ObjectId;
};

export type CreateWebsiteAnalysisRunInput = {
  url: string;
  clientMeta?: WebsiteAnalysisClientMeta;
  cacheHit?: boolean;
};

export type UpdateWebsiteAnalysisRunInput = {
  status?: WebsiteAnalysisRunStatus;
  phase?: WebsiteAnalysisRunPhase;
  scores?: WebsiteAnalysisCategoryScores;
  scoreMeta?: WebsiteAnalysisScoreMeta;
  findings?: WebsiteAnalysisFinding[];
  recommendations?: WebsiteAnalysisRecommendation[];
  fieldData?: WebsiteAnalysisFieldDataSnapshot;
  labMetrics?: WebsiteAnalysisLabMetricsSnapshot;
  error?: WebsiteAnalysisRunError;
  cacheHit?: boolean;
  leadId?: string;
  startedAt?: Date;
  completedAt?: Date;
};

function toCategoryScores(scores: LeanWebsiteAnalysisRun["scores"]): WebsiteAnalysisCategoryScores {
  return {
    performance: scores?.performance ?? null,
    seo: scores?.seo ?? null,
    accessibility: scores?.accessibility ?? null,
    ux: scores?.ux ?? null,
    overall: scores?.overall ?? null,
  };
}

function toWebsiteAnalysisRunDto(run: LeanWebsiteAnalysisRun): WebsiteAnalysisRunDto {
  return {
    id: run._id.toString(),
    urlNormalized: run.urlNormalized,
    urlHash: run.urlHash,
    status: run.status as WebsiteAnalysisRunStatus,
    phase: run.phase as WebsiteAnalysisRunPhase,
    scores: toCategoryScores(run.scores),
    scoreMeta: run.scoreMeta
      ? {
          availableCategories: (run.scoreMeta.availableCategories ?? []) as WebsiteAnalysisScoreMeta["availableCategories"],
          weightsUsed: (run.scoreMeta.weightsUsed ?? {}) as WebsiteAnalysisScoreMeta["weightsUsed"],
          lighthouseVersion: run.scoreMeta.lighthouseVersion ?? undefined,
          primaryStrategy: (run.scoreMeta.primaryStrategy ?? "mobile") as "mobile" | "desktop",
          missingLighthouseCategories: run.scoreMeta.missingLighthouseCategories ?? undefined,
        }
      : undefined,
    findings: (run.findings ?? []).map((finding) => ({
      id: finding.id,
      auditId: finding.auditId ?? undefined,
      status: finding.status as WebsiteAnalysisFinding["status"],
      title: finding.title,
      summary: finding.summary,
      details: finding.details ?? undefined,
      score: finding.score ?? null,
      displayValue: finding.displayValue ?? null,
      source: finding.source as WebsiteAnalysisFinding["source"],
      localeKey: finding.localeKey ?? undefined,
    })),
    recommendations: (run.recommendations ?? []).map((entry) => ({
      id: entry.id,
      priority: entry.priority as WebsiteAnalysisRecommendation["priority"],
      title: entry.title,
      summary: entry.summary,
      details: entry.details ?? undefined,
      auditId: entry.auditId ?? undefined,
      source: entry.source as WebsiteAnalysisRecommendation["source"],
      localeKey: entry.localeKey ?? undefined,
    })),
    fieldData: run.fieldData
      ? {
          available: run.fieldData.available,
          origin: run.fieldData.origin ?? undefined,
          metrics: run.fieldData.metrics?.map((metric) => ({
            id: metric.id,
            percentile: metric.percentile ?? null,
            category: metric.category ?? null,
          })),
          payload: run.fieldData.payload as Record<string, unknown> | undefined,
        }
      : undefined,
    labMetrics: run.labMetrics
      ? {
          strategy: "mobile",
          metrics: (run.labMetrics.metrics ?? []).map((metric) => ({
            id: metric.id,
            title: metric.title,
            numericValue: metric.numericValue ?? null,
            displayValue: metric.displayValue ?? null,
            score: metric.score ?? null,
          })),
          finalUrl: run.labMetrics.finalUrl ?? undefined,
          fetchTime: run.labMetrics.fetchTime ?? undefined,
        }
      : undefined,
    error: run.error
      ? {
          code: run.error.code,
          messagePublic: run.error.messagePublic,
        }
      : undefined,
    cacheHit: run.cacheHit,
    analysisVersion: run.analysisVersion ?? undefined,
    leadId: run.leadId?.toString(),
    aiInsights: run.aiInsights
      ? ({
          status: run.aiInsights.status,
          source: run.aiInsights.source ?? undefined,
          recommendations: (run.aiInsights.recommendations ?? []).map((rec) => ({
            id: rec.id,
            title: rec.title,
            explanation: rec.explanation,
            action: rec.action,
            auditIds: rec.auditIds ?? [],
            optionalMetric: rec.optionalMetric ?? null,
          })),
          positiveSummary: run.aiInsights.positiveSummary ?? null,
          updatedAt: run.aiInsights.updatedAt?.toISOString(),
        } satisfies WebsiteCheckAiInsights)
      : undefined,
    startedAt: run.startedAt?.toISOString(),
    completedAt: run.completedAt?.toISOString(),
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
  };
}

export async function createWebsiteAnalysisRun(
  input: CreateWebsiteAnalysisRunInput
): Promise<WebsiteAnalysisRunDto> {
  const validated = validatePublicWebsiteUrl(input.url);
  if (!validated.ok) {
    throw new Error(validated.message);
  }

  await connectDB();

  const urlHash = hashWebsiteAnalysisUrl(validated.normalized);

  const run = await WebsiteAnalysisRun.create({
    urlNormalized: validated.normalized,
    urlHash,
    status: "queued",
    phase: "queued",
    scores: { ...WEBSITE_ANALYSIS_EMPTY_SCORES },
    findings: [],
    recommendations: [],
    cacheHit: input.cacheHit ?? false,
    clientMeta: input.clientMeta,
    startedAt: new Date(),
  });

  return toWebsiteAnalysisRunDto(run.toObject() as LeanWebsiteAnalysisRun);
}

export async function getWebsiteAnalysisRunById(
  id: string
): Promise<WebsiteAnalysisRunDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const run = await WebsiteAnalysisRun.findById(id).lean<LeanWebsiteAnalysisRun>();
  if (!run) {
    return null;
  }

  return toWebsiteAnalysisRunDto(run);
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    error instanceof mongoose.mongo.MongoServerError &&
    typeof error.code === "number" &&
    error.code === 11000
  );
}

const STALE_RUN_PUBLIC_ERROR: WebsiteAnalysisRunError = {
  code: "analysis_expired",
  messagePublic: "הניתוח לא הושלם בזמן. ניתן לנסות שוב.",
};

export async function expireStaleWebsiteAnalysisRuns(
  now: Date = new Date()
): Promise<number> {
  await connectDB();

  const staleBefore = new Date(now.getTime() - WEBSITE_CHECK_RUN_STALE_MS);

  const result = await WebsiteAnalysisRun.updateMany(
    {
      status: { $in: ["queued", "running"] },
      updatedAt: { $lt: staleBefore },
    },
    {
      $set: {
        status: "failed",
        phase: "done",
        error: STALE_RUN_PUBLIC_ERROR,
        completedAt: now,
      },
      $unset: { activeUrlHash: "" },
    }
  );

  return result.modifiedCount ?? 0;
}

export async function findActiveWebsiteAnalysisRunByUrlHash(
  urlHash: string
): Promise<WebsiteAnalysisRunDto | null> {
  if (!urlHash.trim()) {
    return null;
  }

  await connectDB();

  const run = await WebsiteAnalysisRun.findOne({
    urlHash,
    status: { $in: ["queued", "running"] },
  })
    .sort({ createdAt: -1 })
    .lean<LeanWebsiteAnalysisRun>();

  if (!run) {
    return null;
  }

  return toWebsiteAnalysisRunDto(run);
}

export async function findWebsiteAnalysisRunByActiveUrlHash(
  activeUrlHash: string
): Promise<WebsiteAnalysisRunDto | null> {
  await connectDB();

  const run = await WebsiteAnalysisRun.findOne({ activeUrlHash })
    .sort({ createdAt: -1 })
    .lean<LeanWebsiteAnalysisRun>();

  if (!run) {
    return null;
  }

  return toWebsiteAnalysisRunDto(run);
}

export async function createActiveWebsiteAnalysisRun(input: {
  urlNormalized: string;
  urlHash: string;
  clientMeta?: WebsiteAnalysisClientMeta;
}): Promise<{ run: WebsiteAnalysisRunDto; created: boolean }> {
  await connectDB();

  try {
    const run = await WebsiteAnalysisRun.create({
      urlNormalized: input.urlNormalized,
      urlHash: input.urlHash,
      activeUrlHash: input.urlHash,
      status: "queued",
      phase: "queued",
      scores: { ...WEBSITE_ANALYSIS_EMPTY_SCORES },
      findings: [],
      recommendations: [],
      cacheHit: false,
      clientMeta: input.clientMeta,
      startedAt: new Date(),
    });

    return {
      run: toWebsiteAnalysisRunDto(run.toObject() as LeanWebsiteAnalysisRun),
      created: true,
    };
  } catch (error: unknown) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const existing = await findWebsiteAnalysisRunByActiveUrlHash(input.urlHash);
    if (!existing) {
      throw error;
    }

    return { run: existing, created: false };
  }
}

export async function transitionWebsiteAnalysisRunToRunning(
  id: string
): Promise<WebsiteAnalysisRunDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const run = await WebsiteAnalysisRun.findOneAndUpdate(
    { _id: id, status: "queued" },
    {
      $set: {
        status: "running",
        phase: "psi_mobile",
        startedAt: new Date(),
      },
    },
    { new: true }
  ).lean<LeanWebsiteAnalysisRun>();

  if (!run) {
    return null;
  }

  return toWebsiteAnalysisRunDto(run);
}

export async function findCachedWebsiteAnalysisByUrl(
  url: string
): Promise<WebsiteAnalysisRunDto | null> {
  const validated = validatePublicWebsiteUrl(url);
  if (!validated.ok) {
    return null;
  }

  const urlHash = hashWebsiteAnalysisUrl(validated.normalized);
  return findLatestCompletedWebsiteAnalysisByUrlHash(urlHash, WEBSITE_CHECK_CACHE_TTL_MS);
}

export async function findLatestCompletedWebsiteAnalysisByUrlHash(
  urlHash: string,
  maxAgeMs: number = WEBSITE_CHECK_CACHE_TTL_MS
): Promise<WebsiteAnalysisRunDto | null> {
  if (!urlHash.trim()) {
    return null;
  }

  await connectDB();

  const since = new Date(Date.now() - maxAgeMs);

  const run = await WebsiteAnalysisRun.findOne({
    urlHash,
    status: { $in: ["completed", "partial"] },
    completedAt: { $gte: since },
    cacheHit: { $ne: true },
    analysisVersion: WEBSITE_CHECK_ANALYSIS_VERSION,
    "aiInsights.status": { $in: ["completed", "unavailable"] },
  })
    .sort({ completedAt: -1 })
    .lean<LeanWebsiteAnalysisRun>();

  if (!run) {
    return null;
  }

  const dto = toWebsiteAnalysisRunDto(run);
  if (!isWebsiteAnalysisRunCacheCompatible(dto)) {
    return null;
  }

  return dto;
}

export async function updateWebsiteAnalysisRun(
  id: string,
  patch: UpdateWebsiteAnalysisRunInput
): Promise<WebsiteAnalysisRunDto | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  await connectDB();

  const update: Record<string, unknown> = {};

  if (patch.status !== undefined) update.status = patch.status;
  if (patch.phase !== undefined) update.phase = patch.phase;
  if (patch.scores !== undefined) update.scores = patch.scores;
  if (patch.scoreMeta !== undefined) update.scoreMeta = patch.scoreMeta;
  if (patch.findings !== undefined) update.findings = patch.findings;
  if (patch.recommendations !== undefined) update.recommendations = patch.recommendations;
  if (patch.fieldData !== undefined) update.fieldData = patch.fieldData;
  if (patch.labMetrics !== undefined) update.labMetrics = patch.labMetrics;
  if (patch.error !== undefined) update.error = patch.error;
  if (patch.cacheHit !== undefined) update.cacheHit = patch.cacheHit;
  if (patch.startedAt !== undefined) update.startedAt = patch.startedAt;
  if (patch.completedAt !== undefined) update.completedAt = patch.completedAt;
  if (patch.leadId !== undefined) {
    update.leadId = mongoose.Types.ObjectId.isValid(patch.leadId)
      ? new mongoose.Types.ObjectId(patch.leadId)
      : undefined;
  }

  const run = await WebsiteAnalysisRun.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true }
  ).lean<LeanWebsiteAnalysisRun>();

  if (!run) {
    return null;
  }

  return toWebsiteAnalysisRunDto(run);
}

/** For unit tests and future API layer. */
export { toWebsiteAnalysisRunDto };
