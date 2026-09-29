import { getIntentClassifierForIngest } from "@/lib/discovery/classifier/get-intent-classifier";
import { safeParseIntentClassifierResult } from "@/lib/discovery/classifier/parse-result";
import type { IntentClassifier } from "@/lib/discovery/classifier/types";
import type { IntentClassifierInput } from "@/lib/discovery/classifier/types";
import {
  INGEST_ERROR_CODES,
  IngestError,
  toSafeIngestMessage,
} from "@/lib/discovery/ingest-errors";
import type { NormalizedDiscoveryInput } from "@/lib/discovery/types";
import {
  updateIntentClassification,
  upsertDiscoveredIntent,
} from "@/lib/data/intents";
import {
  normalizedDiscoveryInputSchema,
  safeParseNormalizedDiscoveryInput,
  type NormalizedDiscoveryInputParsed,
} from "@/lib/validations/intent";
import type { AdminIntentDetailDto, IntentClassification } from "@/types/intent";

export const MAX_DISCOVERY_INGEST_BATCH_SIZE = 100;

export type IngestPipelineDeps = {
  upsertDiscoveredIntent: typeof upsertDiscoveredIntent;
  updateIntentClassification: typeof updateIntentClassification;
};

const defaultDeps: IngestPipelineDeps = {
  upsertDiscoveredIntent,
  updateIntentClassification,
};

export type IngestDiscoveredResultOptions = {
  classifier?: IntentClassifier;
  deps?: Partial<IngestPipelineDeps>;
};

export type IngestDiscoveredSuccess = {
  ok: true;
  intentId: string;
  created: boolean;
  rediscovered: boolean;
  dedupeKey: string;
  classification: IntentClassification;
  classified: boolean;
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

export async function applyClassifierIfNeeded(
  intent: AdminIntentDetailDto,
  normalized: NormalizedDiscoveryInputParsed,
  classifier: IntentClassifier,
  deps: Pick<IngestPipelineDeps, "updateIntentClassification">
): Promise<{ classified: boolean; classification: IntentClassification }> {
  if (!shouldAttemptIntentClassification(intent.classification)) {
    return { classified: false, classification: intent.classification };
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
    upsertDiscoveredIntent:
      partial?.upsertDiscoveredIntent ?? defaultDeps.upsertDiscoveredIntent,
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

  try {
    const upsertResult = await deps.upsertDiscoveredIntent(
      toNormalizedDiscoveryInput(normalized)
    );

    const classificationState = await applyClassifierIfNeeded(
      upsertResult.intent,
      normalized,
      classifier,
      deps
    );

    return {
      ok: true,
      intentId: upsertResult.intentId,
      created: upsertResult.created,
      rediscovered: !upsertResult.created,
      dedupeKey: upsertResult.dedupeKey,
      classification: classificationState.classification,
      classified: classificationState.classified,
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

    if (outcome.created) {
      summary.created += 1;
    } else {
      summary.rediscovered += 1;
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
