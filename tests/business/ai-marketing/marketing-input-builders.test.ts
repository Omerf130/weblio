import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildContentIdeasInput,
  buildFreeTopicContentPurposeInput,
  buildFreeformPurposeInput,
  buildProjectContentPurposeInput,
  buildRewritePurposeInput,
} from "../../../src/lib/business/ai-marketing/marketing-input-builders";
import { safeParseMarketingGenerationInput } from "../../../src/lib/business/ai-marketing/validations";

const validProjectId = "507f1f77bcf86cd799439011";

describe("marketing input builders", () => {
  it("builds social project and freeTopic payloads", () => {
    const project = safeParseMarketingGenerationInput(
      buildProjectContentPurposeInput({
        purpose: "socialPost",
        projectId: validProjectId,
      })
    );
    assert.equal(project.success, true);

    const free = safeParseMarketingGenerationInput(
      buildFreeTopicContentPurposeInput({
        purpose: "socialPost",
        topic: "נושא לפוסט",
      })
    );
    assert.equal(free.success, true);
    if (free.success) {
      assert.equal(free.data.source, "freeTopic");
    }
  });

  it("builds linkedin freeTopic payload", () => {
    const parsed = safeParseMarketingGenerationInput(
      buildFreeTopicContentPurposeInput({
        purpose: "linkedinPost",
        topic: "לקח מעבודה עם לקוחות",
      })
    );
    assert.equal(parsed.success, true);
  });

  it("builds story project payload", () => {
    const parsed = safeParseMarketingGenerationInput(
      buildProjectContentPurposeInput({
        purpose: "story",
        projectId: validProjectId,
      })
    );
    assert.equal(parsed.success, true);
  });

  it("builds content ideas global and project payloads", () => {
    const global = safeParseMarketingGenerationInput(
      buildContentIdeasInput({ mode: "globalWeblio" })
    );
    assert.equal(global.success, true);

    const project = safeParseMarketingGenerationInput(
      buildContentIdeasInput({
        mode: "project",
        projectId: validProjectId,
      })
    );
    assert.equal(project.success, true);
  });

  it("builds rewrite with each transformation", () => {
    for (const transformation of [
      "shorter",
      "morePersonal",
      "moreProfessional",
      "strongerCta",
      "clearer",
      "fullRewrite",
    ] as const) {
      const parsed = safeParseMarketingGenerationInput(
        buildRewritePurposeInput({
          sourceText: "טקסט מקור",
          transformation,
        })
      );
      assert.equal(parsed.success, true, transformation);
    }
  });

  it("builds freeform with required instruction", () => {
    const ok = safeParseMarketingGenerationInput(
      buildFreeformPurposeInput({ userInstruction: "כתוב CTA" })
    );
    assert.equal(ok.success, true);

    const bad = safeParseMarketingGenerationInput(
      buildFreeformPurposeInput({ userInstruction: "   " })
    );
    assert.equal(bad.success, false);
  });
});
