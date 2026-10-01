import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_OPENAI_MARKETING_MODEL,
  isOpenAIMarketingEnabled,
  resolveOpenAIMarketingEnv,
} from "../../../src/lib/business/ai-marketing/openai-marketing-env";
import {
  isOpenAIIntentClassificationEnabled,
  resolveOpenAIIntentEnv,
} from "../../../src/lib/discovery/classifier/openai-env";

describe("openai marketing env", () => {
  it("is isolated from intent feature flag", () => {
    const source = {
      OPENAI_API_KEY: "sk-test",
      OPENAI_INTENT_CLASSIFICATION_ENABLED: "1",
      OPENAI_MARKETING_ENABLED: "0",
    };
    assert.equal(isOpenAIIntentClassificationEnabled(source), true);
    assert.equal(isOpenAIMarketingEnabled(source), false);
    assert.equal(resolveOpenAIIntentEnv(source)?.model, "gpt-5.4-nano");
    assert.equal(resolveOpenAIMarketingEnv(source), null);
  });

  it("defaults marketing model to gpt-5.4-mini when enabled", () => {
    const source = {
      OPENAI_API_KEY: "sk-test",
      OPENAI_MARKETING_ENABLED: "1",
    };
    const env = resolveOpenAIMarketingEnv(source);
    assert.ok(env);
    assert.equal(env.model, DEFAULT_OPENAI_MARKETING_MODEL);
    assert.equal(env.model, "gpt-5.4-mini");
  });
});
