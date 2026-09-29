import type { IntentClassifier, IntentClassifierInput, IntentClassifierResult } from "./types";

export const NOOP_CLASSIFIER_VERSION = "noop-v1";

/**
 * Does not classify. Callers keep persistence at `unclassified`.
 */
export const noopIntentClassifier: IntentClassifier = {
  async classify(input: IntentClassifierInput): Promise<IntentClassifierResult | null> {
    void input;
    return null;
  },
};
