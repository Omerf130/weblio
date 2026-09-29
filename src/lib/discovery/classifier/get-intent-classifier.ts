import type { IntentClassifier } from "@/lib/discovery/classifier/types";
import { getOpenAIClient } from "@/lib/discovery/classifier/openai-client";
import { createOpenAIIntentClassifierFromEnv } from "@/lib/discovery/classifier/openai-intent-classifier";
import { resolveOpenAIIntentEnv } from "@/lib/discovery/classifier/openai-env";
import { noopIntentClassifier } from "@/lib/discovery/classifier/noop-classifier";

let cachedOpenAIClassifier: IntentClassifier | undefined;

/** @internal Resets cached classifier — for tests only. */
export function _resetIntentClassifierCacheForTesting(): void {
  cachedOpenAIClassifier = undefined;
}

export function getIntentClassifierForIngest(): IntentClassifier {
  const env = resolveOpenAIIntentEnv();
  if (!env) {
    return noopIntentClassifier;
  }

  if (cachedOpenAIClassifier === undefined) {
    const client = getOpenAIClient();
    cachedOpenAIClassifier = client
      ? createOpenAIIntentClassifierFromEnv(env, client)
      : noopIntentClassifier;
  }

  return cachedOpenAIClassifier;
}
