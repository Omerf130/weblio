import { getIntentClassifierForIngest } from "@/lib/discovery/classifier/get-intent-classifier";
import { safeParseIntentClassifierResult } from "@/lib/discovery/classifier/parse-result";
import type { IntentClassifier } from "@/lib/discovery/classifier/types";
import type { IntentClassifierInput } from "@/lib/discovery/classifier/types";
import {
  INGEST_ERROR_CODES,
  IngestError,
  toSafeIngestMessage,
} from "@/lib/discovery/ingest-errors";
import {
  assessDiscoveryContentQuality,
  shouldSkipAutomaticIntentClassification,
  type DiscoveryContentQuality,
} from "@/lib/discovery/discovery-content-quality";
import { computeDedupeKey } from "@/lib/discovery/dedupe-key";
import type { NormalizedDiscoveryInput } from "@/lib/discovery/types";
import {
  createClassifiedDiscoveredIntent,
  findDiscoveredIntentByDedupeKey,
  touchDiscoveredIntentRediscovery,
  updateIntentClassification,
} from "@/lib/data/intents";
import {
  normalizedDiscoveryInputSchema,
  safeParseNormalizedDiscoveryInput,
  type NormalizedDiscoveryInputParsed,
} from "@/lib/validations/intent";
import type { AdminIntentDetailDto, IntentClassification } from "@/types/intent";

export const MAX_DISCOVERY_INGEST_BATCH_SIZE = 100;

export const INGEST_SKIP_REASONS = [
  "classification_deferred",
  "classification_failed",
  "auto_classification_skipped",
  "not_actionable",
] as const;

export type IngestSkipReason = (typeof INGEST_SKIP_REASONS)[number];

export type IngestPipelineDeps = {
  findDiscoveredIntentByDedupeKey: typeof findDiscoveredIntentByDedupeKey;
  touchDiscoveredIntentRediscovery: typeof touchDiscoveredIntentRediscovery;
  createClassifiedDiscoveredIntent: typeof createClassifiedDiscoveredIntent;
  updateIntentClassification: typeof updateIntentClassification;
};

const defaultDeps: IngestPipelineDeps = {
  findDiscoveredIntentByDedupeKey,
  touchDiscoveredIntentRediscovery,
  createClassifiedDiscoveredIntent,
  updateIntentClassification,
};

export type IngestDiscoveredResultOptions = {
  classifier?: IntentClassifier;
  deps?: Partial<IngestPipelineDeps>;
  /** When false, new URLs are not classified or persisted (classification cap). */
  attemptClassification?: boolean;
  /** Active DiscoveryRun when ingesting from production discovery orchestration. */
  discoveryRunId?: string;
};

export type IngestDiscoveredSuccess = {
  ok: true;
  persisted: boolean;
  intentId?: string;
  created: boolean;
  rediscovered: boolean;
  dedupeKey: string;
  classification: IntentClassification;
  classified: boolean;
  skipReason?: IngestSkipReason;
};

export type IngestDiscoveredFailure = {
  ok: false;
  code: string;
  message: string;
};

export type IngestDiscoveredOutcome = IngestDiscoveredSuccess | IngestDiscoveredFailure;

export type IngestBatchFailure = {
  index: number;
  code: string;
  message: string;
};

export type IngestDiscoveredBatchSummary = {
  received: number;
  created: number;
  rediscovered: number;
  failed: number;
  classified: number;
  failures: IngestBatchFailure[];
};

export function isActionableIntentClassification(
  classification: IntentClassification
): classification is "explicitNeed" | "possibleNeed" {
  return classification === "explicitNeed" || classification === "possibleNeed";
}

export function shouldAttemptIntentClassification(
  classification: IntentClassification
): boolean {
  return classification === "unclassified";
}

export function buildClassifierInput(
  normalized: NormalizedDiscoveryInputParsed,
  intent: Pick<AdminIntentDetailDto, "content" | "title" | "sourcePlatform">
): IntentClassifierInput {
  return {
    title: normalized.title ?? intent.title,
    content: intent.content,
    sourcePlatform: normalized.sourcePlatform ?? intent.sourcePlatform,
    sourceType: normalized.sourceType,
  };
}

export function buildClassifierInputFromNormalized(
  normalized: NormalizedDiscoveryInputParsed
): IntentClassifierInput {
  return {
    title: normalized.title,
    content: normalized.content,
    sourcePlatform: normalized.sourcePlatform,
    sourceType: normalized.sourceType,
  };
}

export function resolveIntentContentQuality(
  intent: Pick<
    AdminIntentDetailDto,
    "content" | "title" | "sourceUrl" | "sourcePlatform" | "contentQuality" | "contentQualityReasons"
  >
): DiscoveryContentQuality {
  if (intent.contentQuality) {
    return intent.contentQuality;
  }
  return assessDiscoveryContentQuality({
    content: intent.content,
    title: intent.title,
    sourceUrl: intent.sourceUrl,
    sourcePlatform: intent.sourcePlatform,
  }).quality;
}

export async function applyClassifierIfNeeded(
  intent: AdminIntentDetailDto,
  normalized: NormalizedDiscoveryInputParsed,
  classifier: IntentClassifier,
  deps: Pick<IngestPipelineDeps, "updateIntentClassification">
): Promise<{
  classified: boolean;
  classification: IntentClassification;
  autoClassificationSkipped?: boolean;
}> {
  if (!shouldAttemptIntentClassification(intent.classification)) {
    return { classified: false, classification: intent.classification };
  }

  const quality = resolveIntentContentQuality(intent);
  if (
    shouldSkipAutomaticIntentClassification({
      classification: intent.classification,
      quality,
    })
  ) {
    return {
      classified: false,
      classification: intent.classification,
      autoClassificationSkipped: true,
    };
  }

  let classifierOutput;
  try {
    classifierOutput = await classifier.classify(
      buildClassifierInput(normalized, intent)
    );
  } catch {
    return { classified: false, classification: intent.classification };
  }

  const parsedOutput = safeParseIntentClassifierResult(classifierOutput);
  if (!parsedOutput.ok) {
    return { classified: false, classification: intent.classification };
  }

  const updated = await deps.updateIntentClassification({
    intentId: intent.id,
    classification: parsedOutput.data.classification,
    classificationReason: parsedOutput.data.reason,
    classifierVersion: parsedOutput.data.classifierVersion,
  });

  if (!updated) {
    return { classified: false, classification: intent.classification };
  }

  return { classified: true, classification: updated.classification };
}

function resolveDeps(partial?: Partial<IngestPipelineDeps>): IngestPipelineDeps {
  return {
    findDiscoveredIntentByDedupeKey:
      partial?.findDiscoveredIntentByDedupeKey ??
      defaultDeps.findDiscoveredIntentByDedupeKey,
    touchDiscoveredIntentRediscovery:
      partial?.touchDiscoveredIntentRediscovery ??
      defaultDeps.touchDiscoveredIntentRediscovery,
    createClassifiedDiscoveredIntent:
      partial?.createClassifiedDiscoveredIntent ??
      defaultDeps.createClassifiedDiscoveredIntent,
    updateIntentClassification:
      partial?.updateIntentClassification ?? defaultDeps.updateIntentClassification,
  };
}

function validationFailureMessage(input: unknown): string {
  const parsed = safeParseNormalizedDiscoveryInput(input);
  if (parsed.success) {
    return "Invalid discovery input";
  }
  const first = parsed.error.issues[0];
  return first?.message ?? "Invalid discovery input";
}

function toNormalizedDiscoveryInput(
  parsed: NormalizedDiscoveryInputParsed
): NormalizedDiscoveryInput {
  return {
    provider: parsed.provider,
    externalId: parsed.externalId,
    sourceType: parsed.sourceType,
    sourcePlatform: parsed.sourcePlatform,
    sourceUrl: parsed.sourceUrl,
    title: parsed.title,
    content: parsed.content,
    authorDisplayName: parsed.authorDisplayName,
    publishedAt: parsed.publishedAt,
    rawMetadata: parsed.rawMetadata,
  };
}

function dedupeKeyFromParsed(parsed: NormalizedDiscoveryInputParsed): string {
  return computeDedupeKey({
    provider: parsed.provider,
    externalId: parsed.externalId,
    sourceUrl: parsed.sourceUrl,
  });
}

function skippedSuccess(input: {
  dedupeKey: string;
  classification: IntentClassification;
  classified: boolean;
  skipReason: IngestSkipReason;
}): IngestDiscoveredSuccess {
  return {
    ok: true,
    persisted: false,
    created: false,
    rediscovered: false,
    dedupeKey: input.dedupeKey,
    classification: input.classification,
    classified: input.classified,
    skipReason: input.skipReason,
  };
}

async function classifyNewCandidate(
  normalized: NormalizedDiscoveryInputParsed,
  classifier: IntentClassifier
): Promise<
  | { ok: true; classified: true; classification: IntentClassification; reason: string; version: string }
  | { ok: true; classified: false; classification: IntentClassification; autoClassificationSkipped?: boolean }
  | { ok: false }
> {
  const quality = assessDiscoveryContentQuality({
    content: normalized.content,
    title: normalized.title,
    sourceUrl: normalized.sourceUrl,
    sourcePlatform: normalized.sourcePlatform,
  });

  if (
    shouldSkipAutomaticIntentClassification({
      classification: "unclassified",
      quality: quality.quality,
    })
  ) {
    return {
      ok: true,
      classified: false,
      classification: "unclassified",
      autoClassificationSkipped: true,
    };
  }

  let classifierOutput;
  try {
    classifierOutput = await classifier.classify(
      buildClassifierInputFromNormalized(normalized)
    );
  } catch {
    return { ok: false };
  }

  const parsedOutput = safeParseIntentClassifierResult(classifierOutput);
  if (!parsedOutput.ok) {
    return { ok: false };
  }

  return {
    ok: true,
    classified: true,
    classification: parsedOutput.data.classification,
    reason: parsedOutput.data.reason,
    version: parsedOutput.data.classifierVersion,
  };
}

export async function ingestDiscoveredResult(
  input: unknown,
  options: IngestDiscoveredResultOptions = {}
): Promise<IngestDiscoveredOutcome> {
  const parsed = safeParseNormalizedDiscoveryInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: INGEST_ERROR_CODES.VALIDATION_FAILED,
      message: validationFailureMessage(input),
    };
  }

  const deps = resolveDeps(options.deps);
  const classifier = options.classifier ?? getIntentClassifierForIngest();
  const normalized = parsed.data;
  const dedupeKey = dedupeKeyFromParsed(normalized);
  const attemptClassification = options.attemptClassification ?? true;

  try {
    const existing = await deps.findDiscoveredIntentByDedupeKey(dedupeKey);
    if (existing) {
      const touch = await deps.touchDiscoveredIntentRediscovery(dedupeKey);
      return {
        ok: true,
        persisted: true,
        intentId: touch.intentId,
        created: false,
        rediscovered: true,
        dedupeKey,
        classification: touch.intent.classification,
        classified: false,
      };
    }

    if (!attemptClassification) {
      return skippedSuccess({
        dedupeKey,
        classification: "unclassified",
        classified: false,
        skipReason: "classification_deferred",
      });
    }

    const classificationState = await classifyNewCandidate(normalized, classifier);

    if (!classificationState.ok) {
      return skippedSuccess({
        dedupeKey,
        classification: "unclassified",
        classified: false,
        skipReason: "classification_failed",
      });
    }

    if (
      !classificationState.classified &&
      "autoClassificationSkipped" in classificationState &&
      classificationState.autoClassificationSkipped
    ) {
      return skippedSuccess({
        dedupeKey,
        classification: "unclassified",
        classified: false,
        skipReason: "auto_classification_skipped",
      });
    }

    if (!classificationState.classified) {
      return skippedSuccess({
        dedupeKey,
        classification: classificationState.classification,
        classified: false,
        skipReason: "classification_failed",
      });
    }

    if (!isActionableIntentClassification(classificationState.classification)) {
      return skippedSuccess({
        dedupeKey,
        classification: classificationState.classification,
        classified: true,
        skipReason: "not_actionable",
      });
    }

    const created = await deps.createClassifiedDiscoveredIntent({
      normalized: toNormalizedDiscoveryInput(normalized),
      classification: classificationState.classification,
      classificationReason: classificationState.reason,
      classifierVersion: classificationState.version,
      discoveryCreatedRunId: options.discoveryRunId,
    });

    return {
      ok: true,
      persisted: true,
      intentId: created.intentId,
      created: created.created,
      rediscovered: !created.created,
      dedupeKey,
      classification: created.intent.classification,
      classified: true,
    };
  } catch (error) {
    const safe = toSafeIngestMessage(error);
    return {
      ok: false,
      code: safe.code,
      message: safe.message,
    };
  }
}

export async function ingestDiscoveredResults(
  inputs: unknown[],
  options: IngestDiscoveredResultOptions & { maxBatchSize?: number } = {}
): Promise<IngestDiscoveredBatchSummary> {
  const maxBatchSize = options.maxBatchSize ?? MAX_DISCOVERY_INGEST_BATCH_SIZE;

  if (inputs.length > maxBatchSize) {
    throw new IngestError(
      INGEST_ERROR_CODES.BATCH_TOO_LARGE,
      `Batch size ${inputs.length} exceeds limit ${maxBatchSize}`
    );
  }

  const summary: IngestDiscoveredBatchSummary = {
    received: inputs.length,
    created: 0,
    rediscovered: 0,
    failed: 0,
    classified: 0,
    failures: [],
  };

  for (let index = 0; index < inputs.length; index += 1) {
    const outcome = await ingestDiscoveredResult(inputs[index], options);

    if (!outcome.ok) {
      summary.failed += 1;
      summary.failures.push({
        index,
        code: outcome.code,
        message: outcome.message,
      });
      continue;
    }

    if (outcome.persisted) {
      if (outcome.created) {
        summary.created += 1;
      } else if (outcome.rediscovered) {
        summary.rediscovered += 1;
      }
    }

    if (outcome.classified) {
      summary.classified += 1;
    }
  }

  return summary;
}

/** @internal Exported for tests — validates without persisting. */
export function parseNormalizedDiscoveryInputForIngest(input: unknown) {
  return normalizedDiscoveryInputSchema.safeParse(input);
}
