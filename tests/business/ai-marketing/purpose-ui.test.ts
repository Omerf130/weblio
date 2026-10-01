import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MARKETING_HUB_PURPOSE_CARDS,
  buildProjectPurposeInput,
} from "../../../src/lib/business/ai-marketing/purpose-ui";
import { safeParseMarketingGenerationInput } from "../../../src/lib/business/ai-marketing/validations";

const validProjectId = "507f1f77bcf86cd799439011";

describe("purpose hub ui helpers", () => {
  it("exposes only the four usable hub tools (no Coming Soon placeholders)", () => {
    assert.equal(MARKETING_HUB_PURPOSE_CARDS.length, 4);
    const purposes = MARKETING_HUB_PURPOSE_CARDS.map((c) => c.purpose);
    assert.deepEqual(purposes, [
      "websiteProjectContent",
      "socialPost",
      "linkedinPost",
      "story",
    ]);
    assert.ok(!purposes.includes("contentIdeas" as never));
    assert.ok(
      !MARKETING_HUB_PURPOSE_CARDS.some((c) =>
        c.label.includes("תיאור מורחב")
      )
    );
  });

  it("buildProjectPurposeInput produces valid server payloads", () => {
    const payload = buildProjectPurposeInput({
      purpose: "linkedinPost",
      projectId: validProjectId,
      userInstruction: "  ",
    });
    const parsed = safeParseMarketingGenerationInput(payload);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.purpose, "linkedinPost");
      assert.equal(parsed.data.source, "project");
    }
  });
});
