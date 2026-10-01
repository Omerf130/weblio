import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const repoRoot = join(import.meta.dirname, "../../..");
const ideasPath = join(
  repoRoot,
  "src/components/admin/business/ai-marketing/AiMarketingContentIdeasTool.tsx"
);
const rewritePath = join(
  repoRoot,
  "src/components/admin/business/ai-marketing/AiMarketingRewriteTool.tsx"
);
const freeformPath = join(
  repoRoot,
  "src/components/admin/business/ai-marketing/AiMarketingFreeformTool.tsx"
);
const resultPanelPath = join(
  repoRoot,
  "src/components/admin/business/ai-marketing/AiMarketingContentResultPanel.tsx"
);

describe("ai marketing phase 6D tools", () => {
  it("ideas tool renders list UI not single textarea dump", () => {
    const source = readFileSync(ideasPath, "utf8");
    assert.ok(source.includes("ideasList"));
    assert.ok(source.includes("ideaItem"));
    assert.ok(source.includes("העתק הכל"));
    assert.ok(!source.match(/ideas\.join\([\s\S]*resultTextarea/));
  });

  it("rewrite tool requires source text and supports transformations", () => {
    const source = readFileSync(rewritePath, "utf8");
    assert.ok(source.includes("buildRewritePurposeInput"));
    assert.ok(source.includes("REWRITE_TRANSFORMATION_OPTIONS"));
    assert.ok(source.includes("MAX_MARKETING_SOURCE_TEXT_CHARS"));
  });

  it("freeform tool requires user instruction", () => {
    const source = readFileSync(freeformPath, "utf8");
    assert.ok(source.includes("buildFreeformPurposeInput"));
    assert.ok(source.includes("מה תרצה שאכתוב"));
  });

  it("shared result panel copies edited content via parent handler", () => {
    const source = readFileSync(resultPanelPath, "utf8");
    assert.ok(source.includes("onContentChange"));
    assert.ok(source.includes("onCopy"));
    assert.doesNotMatch(source, /generateMarketingDraftAction/);
  });
});
