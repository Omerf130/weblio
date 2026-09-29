import {
  getIntentById,
  updateIntentClassification,
} from "@/lib/data/intents";
import { getIntentClassifierForIngest } from "@/lib/discovery/classifier/get-intent-classifier";
import { safeParseIntentClassifierResult } from "@/lib/discovery/classifier/parse-result";
import type { IntentClassifier } from "@/lib/discovery/classifier/types";
import type { AdminIntentDetailDto } from "@/types/intent";

export type ClassifyIntentWithAiDeps = {
  getIntentById: typeof getIntentById;
  updateIntentClassification: typeof updateIntentClassification;
};

const defaultDeps: ClassifyIntentWithAiDeps = {
  getIntentById,
  updateIntentClassification,
};

export type ClassifyIntentWithAiFailureReason =
  | "not_found"
  | "not_unclassified"
  | "classification_failed";

export type ClassifyIntentWithAiResult =
  | { ok: true; intent: AdminIntentDetailDto }
  | { ok: false; reason: ClassifyIntentWithAiFailureReason };

function buildClassifierInputFromIntent(
  intent: AdminIntentDetailDto
): Parameters<IntentClassifier["classify"]>[0] {
  return {
    content: intent.content,
    title: intent.title,
    sourcePlatform: intent.sourcePlatform,
    sourceType: intent.sourceType,
  };
}

export async function classifyIntentWithAi(
  intentId: string,
  classifier: IntentClassifier = getIntentClassifierForIngest(),
  partialDeps?: Partial<ClassifyIntentWithAiDeps>
): Promise<ClassifyIntentWithAiResult> {
  const deps = { ...defaultDeps, ...partialDeps };
  const intent = await deps.getIntentById(intentId);
  if (!intent) {
    return { ok: false, reason: "not_found" };
  }

  if (intent.classification !== "unclassified") {
    return { ok: false, reason: "not_unclassified" };
  }

  let classifierOutput;
  try {
    classifierOutput = await classifier.classify(
      buildClassifierInputFromIntent(intent)
    );
  } catch {
    return { ok: false, reason: "classification_failed" };
  }

  const parsed = safeParseIntentClassifierResult(classifierOutput);
  if (!parsed.ok) {
    return { ok: false, reason: "classification_failed" };
  }

  const updated = await deps.updateIntentClassification({
    intentId: intent.id,
    classification: parsed.data.classification,
    classificationReason: parsed.data.reason,
    classifierVersion: parsed.data.classifierVersion,
  });

  if (!updated) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, intent: updated };
}
