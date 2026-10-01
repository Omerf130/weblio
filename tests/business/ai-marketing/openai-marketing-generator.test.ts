import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APIError } from "openai";
import { createOpenAIMarketingGenerator } from "../../../src/lib/business/ai-marketing/openai-marketing-generator";
import { DEFAULT_OPENAI_MARKETING_MODEL } from "../../../src/lib/business/ai-marketing/openai-marketing-env";
import { MARKETING_WEBSITE_CONTENT_SCHEMA_NAME } from "../../../src/lib/business/ai-marketing/marketing-output-schema";
import { normalizeWeblioCopyDashes } from "../../../src/lib/business/ai-marketing/normalize-marketing-copy";

describe("openai marketing generator", () => {
  it("returns parsed content draft from structured output", async () => {
    let capturedBody: unknown;
    const generator = createOpenAIMarketingGenerator({
      model: DEFAULT_OPENAI_MARKETING_MODEL,
      timeoutMs: 5000,
      maxOutputTokens: 512,
      responsesCreate: async (body) => {
        capturedBody = body;
        return {
          output_text: JSON.stringify({ content: "טיוטת פוסט לדוגמה" }),
        } as { output_text: string };
      },
    });

    const result = await generator.generate({
      purpose: "freeform",
      source: "freeTopic",
      userInstruction: "כתוב פוסט קצר",
      language: "he",
    });

    assert.ok(result);
    assert.equal(result.kind, "content");
    if (result.kind === "content") {
      assert.equal(result.content, "טיוטת פוסט לדוגמה");
    }

    const body = capturedBody as {
      text: { format: { type: string; name: string; strict: boolean } };
    };
    assert.equal(body.text.format.type, "json_schema");
    assert.equal(body.text.format.name, "marketing_content_draft");
    assert.equal(body.text.format.strict, true);
  });

  it("uses website schema for websiteProjectContent", async () => {
    let capturedBody: unknown;
    const generator = createOpenAIMarketingGenerator({
      model: DEFAULT_OPENAI_MARKETING_MODEL,
      timeoutMs: 5000,
      maxOutputTokens: 512,
      responsesCreate: async (body) => {
        capturedBody = body;
        return {
          output_text: JSON.stringify({
            title: "T\u2014X",
            subtitle: "S",
            description: "",
            homeTitle: "",
            homeSubtitle: "",
            technologies: ["Node\u2013TS"],
          }),
        };
      },
    });

    const result = await generator.generate({
      purpose: "websiteProjectContent",
      source: "project",
      projectId: "507f1f77bcf86cd799439011",
      language: "he",
    });

    assert.ok(result);
    assert.equal(result.kind, "websiteContent");
    if (result.kind === "websiteContent") {
      assert.equal(result.websiteContent.title, normalizeWeblioCopyDashes("T\u2014X"));
      assert.equal(result.websiteContent.technologies[0], "Node-TS");
    }

    const body = capturedBody as {
      text: { format: { name: string } };
    };
    assert.equal(body.text.format.name, MARKETING_WEBSITE_CONTENT_SCHEMA_NAME);
  });

  it("returns ideas array for contentIdeas", async () => {
    const generator = createOpenAIMarketingGenerator({
      model: DEFAULT_OPENAI_MARKETING_MODEL,
      timeoutMs: 5000,
      maxOutputTokens: 512,
      responsesCreate: async () => ({
        output_text: JSON.stringify({
          ideas: ["א", "ב", "ג", "ד", "ה"],
        }),
      }),
    });

    const result = await generator.generate({
      purpose: "contentIdeas",
      source: "globalWeblio",
      language: "he",
    });

    assert.ok(result);
    assert.equal(result.kind, "ideas");
    if (result.kind === "ideas") {
      assert.equal(result.ideas.length, 5);
    }
  });

  it("returns null on API error", async () => {
    const generator = createOpenAIMarketingGenerator({
      model: DEFAULT_OPENAI_MARKETING_MODEL,
      timeoutMs: 5000,
      maxOutputTokens: 512,
      responsesCreate: async () => {
        throw new APIError(500, undefined, "server error", undefined);
      },
    });

    const result = await generator.generate({
      purpose: "freeform",
      source: "freeTopic",
      userInstruction: "טקסט",
      language: "he",
    });
    assert.equal(result, null);
  });
});
