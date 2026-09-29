import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APIError } from "openai";
import {
  buildOpenAIClassifierVersion,
  DEFAULT_OPENAI_INTENT_MODEL,
} from "../../src/lib/discovery/classifier/openai-env";
import { createOpenAIIntentClassifier } from "../../src/lib/discovery/classifier/openai-intent-classifier";
import {
  buildOpenAIIntentClassificationMessages,
  MAX_CLASSIFIER_CONTENT_CHARS,
} from "../../src/lib/discovery/classifier/openai-prompt";

describe("openai intent classifier", () => {
  it("returns parsed classification with injected classifierVersion", async () => {
    let capturedBody: unknown;
    const classifier = createOpenAIIntentClassifier({
      model: DEFAULT_OPENAI_INTENT_MODEL,
      timeoutMs: 5000,
      responsesCreate: async (body) => {
        capturedBody = body;
        return {
          output_text: JSON.stringify({
            classification: "explicitNeed",
            reason: "בקשה מפורשת לבניית אתר",
          }),
        } as { output_text: string };
      },
    });

    const result = await classifier.classify({
      content: "מחפש בונה אתרים לעסק קטן",
      title: "שאלה בקבוצה",
      sourcePlatform: "facebook",
      sourceType: "post",
    });

    assert.ok(result);
    assert.equal(result.classification, "explicitNeed");
    assert.equal(result.reason, "בקשה מפורשת לבניית אתר");
    assert.equal(
      result.classifierVersion,
      buildOpenAIClassifierVersion(DEFAULT_OPENAI_INTENT_MODEL)
    );

    const body = capturedBody as {
      input: Array<{ role: string; content: string }>;
      text: { format: { type: string; strict: boolean } };
    };
    assert.equal(body.text.format.type, "json_schema");
    assert.equal(body.text.format.strict, true);
    const userMessage = body.input.find((item) => item.role === "user")?.content;
    assert.ok(userMessage?.includes("facebook"));
    assert.ok(userMessage?.includes("post"));
    assert.ok(userMessage?.includes("שאלה בקבוצה"));
    assert.ok(!userMessage?.includes("rawMetadata"));
  });

  it("truncates long content in prompt", () => {
    const long = "א".repeat(MAX_CLASSIFIER_CONTENT_CHARS + 50);
    const { user } = buildOpenAIIntentClassificationMessages({ content: long });
    assert.ok(user.length < long.length);
    assert.ok(user.includes("…"));
  });

  it("returns null on API error", async () => {
    const classifier = createOpenAIIntentClassifier({
      model: DEFAULT_OPENAI_INTENT_MODEL,
      timeoutMs: 5000,
      responsesCreate: async () => {
        throw new APIError(500, undefined, "server error", undefined);
      },
    });

    const result = await classifier.classify({ content: "טקסט" });
    assert.equal(result, null);
  });

  it("retries once on 429 then succeeds", async () => {
    let calls = 0;
    const classifier = createOpenAIIntentClassifier({
      model: DEFAULT_OPENAI_INTENT_MODEL,
      timeoutMs: 5000,
      responsesCreate: async () => {
        calls += 1;
        if (calls === 1) {
          throw new APIError(429, undefined, "rate limit", undefined);
        }
        return {
          output_text: JSON.stringify({
            classification: "irrelevant",
            reason: "לא רלוונטי",
          }),
        } as { output_text: string };
      },
    });

    const result = await classifier.classify({ content: "טקסט" });
    assert.equal(calls, 2);
    assert.ok(result);
    assert.equal(result.classification, "irrelevant");
  });

  it("returns null on malformed JSON output", async () => {
    const classifier = createOpenAIIntentClassifier({
      model: DEFAULT_OPENAI_INTENT_MODEL,
      timeoutMs: 5000,
      responsesCreate: async () => ({
        output_text: "not json",
      }),
    });

    const result = await classifier.classify({ content: "טקסט" });
    assert.equal(result, null);
  });

  it("returns null when reason exceeds max length", async () => {
    const classifier = createOpenAIIntentClassifier({
      model: DEFAULT_OPENAI_INTENT_MODEL,
      timeoutMs: 5000,
      responsesCreate: async () => ({
        output_text: JSON.stringify({
          classification: "possibleNeed",
          reason: "x".repeat(501),
        }),
      }),
    });

    const result = await classifier.classify({ content: "טקסט" });
    assert.equal(result, null);
  });
});
