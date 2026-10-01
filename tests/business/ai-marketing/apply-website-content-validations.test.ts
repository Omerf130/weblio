import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  safeParseApplyWebsiteContentInput,
  websiteProjectContentApplyFieldsSchema,
} from "../../../src/lib/business/ai-marketing/apply-website-content-validations";

const validProjectId = "507f1f77bcf86cd799439011";

describe("apply website content validations", () => {
  it("accepts valid five-field payload", () => {
    const parsed = safeParseApplyWebsiteContentInput({
      projectId: validProjectId,
      fields: {
        title: "כותרת",
        subtitle: "תת",
        description: "תיאור",
        homeTitle: "בית",
        homeSubtitle: "תת בית",
      },
    });
    assert.equal(parsed.success, true);
  });

  it("rejects invalid project id", () => {
    const parsed = safeParseApplyWebsiteContentInput({
      projectId: "bad",
      fields: { title: "x", subtitle: "" },
    });
    assert.equal(parsed.success, false);
  });

  it("rejects missing title", () => {
    const parsed = safeParseApplyWebsiteContentInput({
      projectId: validProjectId,
      fields: { title: "   ", subtitle: "" },
    });
    assert.equal(parsed.success, false);
  });

  it("rejects title over 120 chars (no silent truncate)", () => {
    const parsed = safeParseApplyWebsiteContentInput({
      projectId: validProjectId,
      fields: {
        title: "א".repeat(121),
        subtitle: "",
      },
    });
    assert.equal(parsed.success, false);
  });

  it("accepts technologies in apply fields", () => {
    const parsed = websiteProjectContentApplyFieldsSchema.safeParse({
      title: "t",
      subtitle: "",
      technologies: ["React", "TypeScript"],
    });
    assert.equal(parsed.success, true);
  });

  it("rejects unknown keys on fields object", () => {
    const parsed = websiteProjectContentApplyFieldsSchema.safeParse({
      title: "t",
      subtitle: "",
      projectUrl: "https://example.com",
    });
    assert.equal(parsed.success, false);
  });

  it("normalizes empty optional strings to undefined", () => {
    const parsed = websiteProjectContentApplyFieldsSchema.safeParse({
      title: "t",
      subtitle: "",
      description: "",
      homeTitle: "",
      homeSubtitle: "",
    });
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.description, undefined);
      assert.equal(parsed.data.homeTitle, undefined);
    }
  });
});
