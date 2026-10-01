import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeMarketingGenerationSuccess,
  normalizeWeblioCopyDashes,
} from "../../../src/lib/business/ai-marketing/normalize-marketing-copy";

describe("normalize marketing copy dashes", () => {
  it("converts em dash to hyphen", () => {
    assert.equal(normalizeWeblioCopyDashes("א\u2014ב"), "א-ב");
  });

  it("converts en dash to hyphen", () => {
    assert.equal(normalizeWeblioCopyDashes("1\u20133"), "1-3");
  });

  it("normalizes content output", () => {
    const result = normalizeMarketingGenerationSuccess({
      kind: "content",
      content: "שורה\u2014שנייה",
    });
    assert.equal(result.kind, "content");
    if (result.kind === "content") {
      assert.equal(result.content, "שורה-שנייה");
    }
  });

  it("normalizes ideas array", () => {
    const result = normalizeMarketingGenerationSuccess({
      kind: "ideas",
      ideas: ["רעיון\u2014א", "ב"],
    });
    if (result.kind === "ideas") {
      assert.equal(result.ideas[0], "רעיון-א");
    }
  });

  it("normalizes website fields and technologies", () => {
    const result = normalizeMarketingGenerationSuccess({
      kind: "websiteContent",
      websiteContent: {
        title: "כ\u2014ת",
        subtitle: "",
        technologies: ["Next.js\u2014TS"],
      },
    });
    if (result.kind === "websiteContent") {
      assert.equal(result.websiteContent.title, "כ-ת");
      assert.equal(result.websiteContent.technologies[0], "Next.js-TS");
    }
  });
});
