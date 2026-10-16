import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WEBSITE_CHECK_AI_JSON_SCHEMA } from "../../src/lib/website-check/ai/website-check-ai-schema";
import {
  assertStrictJsonSchemaShape,
  buildWebsiteCheckAiResponsesCreateParams,
} from "../../src/lib/website-check/ai/website-check-openai-request";
import { extractSafeOpenAiErrorDetails } from "../../src/lib/website-check/ai/website-check-openai-error-log";
import { APIError } from "openai";

describe("WEBSITE_CHECK_AI_JSON_SCHEMA strict mode", () => {
  it("lists every object property in required (OpenAI strict json_schema)", () => {
    assert.doesNotThrow(() => assertStrictJsonSchemaShape(WEBSITE_CHECK_AI_JSON_SCHEMA));
  });

  it("would reject the pre-3G.2 schema missing positiveSummary and optionalMetric in required", () => {
    const broken = {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        recommendations: {
          type: "array" as const,
          items: {
            type: "object" as const,
            additionalProperties: false,
            properties: {
              title: { type: "string" as const },
              optionalMetric: { type: "string" as const },
            },
            required: ["title"],
          },
        },
        positiveSummary: { type: "string" as const },
      },
      required: ["recommendations"],
    };
    assert.throws(
      () => assertStrictJsonSchemaShape(broken),
      (error: unknown) =>
        error instanceof Error &&
        (error.message.includes("positiveSummary") || error.message.includes("optionalMetric"))
    );
  });

  it("builds Responses API body with strict json_schema format", () => {
    const body = buildWebsiteCheckAiResponsesCreateParams(
      { apiKey: "test", model: "gpt-4o-mini", timeoutMs: 1000, maxOutputTokens: 100 },
      '{"scores":{}}'
    );
    assert.equal(body.text?.format?.type, "json_schema");
    assert.equal(body.text?.format?.strict, true);
    assert.equal(body.text?.format?.name, "website_check_ai_recommendations");
  });
});

describe("extractSafeOpenAiErrorDetails", () => {
  it("extracts type code param and message without leaking request data", () => {
    const error = Object.assign(new Error("400 invalid schema"), {
      status: 400,
      error: {
        message: "Invalid schema for response_format 'website_check_ai_recommendations': ...",
        type: "invalid_request_error",
        param: "text.format.schema",
        code: "invalid_json_schema",
      },
    });
    Object.setPrototypeOf(error, APIError.prototype);

    const details = extractSafeOpenAiErrorDetails(error);
    assert.equal(details.status, 400);
    assert.equal(details.type, "invalid_request_error");
    assert.equal(details.param, "text.format.schema");
    assert.match(details.message ?? "", /Invalid schema/);
  });
});
