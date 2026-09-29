import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  _resetIntentClassifierCacheForTesting,
  getIntentClassifierForIngest,
} from "../../src/lib/discovery/classifier/get-intent-classifier";
import { noopIntentClassifier } from "../../src/lib/discovery/classifier/noop-classifier";
import { _resetOpenAIClientForTesting } from "../../src/lib/discovery/classifier/openai-client";

const ENV_KEYS = [
  "OPENAI_INTENT_CLASSIFICATION_ENABLED",
  "OPENAI_API_KEY",
  "OPENAI_INTENT_MODEL",
  "OPENAI_INTENT_TIMEOUT_MS",
] as const;

function snapshotEnv(): Record<string, string | undefined> {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot: Record<string, string | undefined>): void {
  for (const key of ENV_KEYS) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("getIntentClassifierForIngest", () => {
  afterEach(() => {
    _resetIntentClassifierCacheForTesting();
    _resetOpenAIClientForTesting();
  });

  it("returns NoOp when classification is disabled", () => {
    const before = snapshotEnv();
    try {
      process.env.OPENAI_INTENT_CLASSIFICATION_ENABLED = "0";
      process.env.OPENAI_API_KEY = "sk-test";
      _resetIntentClassifierCacheForTesting();

      const classifier = getIntentClassifierForIngest();
      assert.equal(classifier, noopIntentClassifier);
    } finally {
      restoreEnv(before);
    }
  });

  it("returns NoOp when enabled but API key is missing", () => {
    const before = snapshotEnv();
    try {
      process.env.OPENAI_INTENT_CLASSIFICATION_ENABLED = "1";
      delete process.env.OPENAI_API_KEY;
      _resetIntentClassifierCacheForTesting();
      _resetOpenAIClientForTesting();

      const classifier = getIntentClassifierForIngest();
      assert.equal(classifier, noopIntentClassifier);
    } finally {
      restoreEnv(before);
    }
  });

  it("returns OpenAI classifier when enabled and key is set", () => {
    const before = snapshotEnv();
    try {
      process.env.OPENAI_INTENT_CLASSIFICATION_ENABLED = "1";
      process.env.OPENAI_API_KEY = "sk-test-key-for-unit-tests";
      _resetIntentClassifierCacheForTesting();
      _resetOpenAIClientForTesting();

      const classifier = getIntentClassifierForIngest();
      assert.notEqual(classifier, noopIntentClassifier);
      assert.equal(typeof classifier.classify, "function");
    } finally {
      restoreEnv(before);
    }
  });
});
