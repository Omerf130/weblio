import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeParseMarketingGenerationInput } from "../../../src/lib/business/ai-marketing/validations";

const validProjectId = "507f1f77bcf86cd799439011";

describe("marketing generation validations (purpose + source)", () => {
  it("accepts websiteProjectContent with project source and projectId", () => {
    const parsed = safeParseMarketingGenerationInput({
      purpose: "websiteProjectContent",
      source: "project",
      projectId: validProjectId,
    });
    assert.equal(parsed.success, true);
  });

  it("rejects websiteProjectContent without projectId", () => {
    const parsed = safeParseMarketingGenerationInput({
      purpose: "websiteProjectContent",
      source: "project",
    });
    assert.equal(parsed.success, false);
  });

  it("accepts contentIdeas globalWeblio without projectId", () => {
    const parsed = safeParseMarketingGenerationInput({
      purpose: "contentIdeas",
      source: "globalWeblio",
    });
    assert.equal(parsed.success, true);
  });

  it("accepts contentIdeas with project source", () => {
    const parsed = safeParseMarketingGenerationInput({
      purpose: "contentIdeas",
      source: "project",
      projectId: validProjectId,
      userInstruction: "התמקד באתרים לעסקים קטנים",
    });
    assert.equal(parsed.success, true);
  });

  it("requires userInstruction for freeTopic socialPost", () => {
    const parsed = safeParseMarketingGenerationInput({
      purpose: "socialPost",
      source: "freeTopic",
    });
    assert.equal(parsed.success, false);
  });

  it("accepts freeTopic freeform with instruction", () => {
    const parsed = safeParseMarketingGenerationInput({
      purpose: "freeform",
      source: "freeTopic",
      userInstruction: "כתוב על אתרים",
    });
    assert.equal(parsed.success, true);
  });

  it("rejects rewrite without sourceText", () => {
    const parsed = safeParseMarketingGenerationInput({
      purpose: "rewrite",
      source: "sourceText",
      transformation: "shorter",
    });
    assert.equal(parsed.success, false);
  });

  it("rejects invalid project id for project source", () => {
    const parsed = safeParseMarketingGenerationInput({
      purpose: "socialPost",
      source: "project",
      projectId: "not-an-id",
    });
    assert.equal(parsed.success, false);
  });

  it("rejects obsolete generationType payloads", () => {
    const parsed = safeParseMarketingGenerationInput({
      generationType: "projectLongDescription",
      projectId: validProjectId,
    });
    assert.equal(parsed.success, false);
  });
});
