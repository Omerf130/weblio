import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { getMarketingAdminStatus } from "../../../src/lib/business/ai-marketing/marketing-admin-status";

const repoRoot = join(import.meta.dirname, "../../..");
const shellPath = join(
  repoRoot,
  "src/components/admin/business/ai-marketing/AiMarketingShell.tsx"
);
const websiteToolPath = join(
  repoRoot,
  "src/components/admin/business/ai-marketing/AiMarketingWebsiteTool.tsx"
);
const contentToolPath = join(
  repoRoot,
  "src/components/admin/business/ai-marketing/AiMarketingContentTool.tsx"
);
const pagePath = join(
  repoRoot,
  "src/app/admin/(protected)/business/ai-marketing/page.tsx"
);

describe("ai marketing purpose hub shell (phase 6C.2)", () => {
  it("shell routes hub to purpose-specific tools", () => {
    const source = readFileSync(shellPath, "utf8");
    assert.ok(source.includes("AiMarketingHub"));
    assert.ok(source.includes("AiMarketingWebsiteTool"));
    assert.ok(source.includes("AiMarketingContentTool"));
  });

  it("tools call generateMarketingDraftAction without direct OpenAI client", () => {
    for (const path of [websiteToolPath, contentToolPath]) {
      const source = readFileSync(path, "utf8");
      assert.ok(source.includes("generateMarketingDraftAction"));
      assert.ok(!source.includes("openai-marketing-generator"));
      assert.ok(!source.includes("getOpenAIMarketingClient"));
    }
  });

  it("website tool uses separate apply action without mongoose", () => {
    const source = readFileSync(websiteToolPath, "utf8");
    assert.ok(source.includes("buildProjectPurposeInput"));
    assert.ok(source.includes("applyAiMarketingWebsiteContentAction"));
    assert.ok(!source.includes("updateProjectAction"));
    assert.ok(!source.includes("mongoose"));
  });

  it("content tool supports editable result, copy, and regenerate", () => {
    const source = readFileSync(contentToolPath, "utf8");
    assert.ok(source.includes("setDraftContent"));
    assert.ok(source.includes("navigator.clipboard.writeText"));
    assert.ok(source.includes("צור מחדש"));
  });

  it("page hides shell when marketing is disabled", () => {
    const source = readFileSync(pagePath, "utf8");
    assert.ok(source.includes('status.state === "ready"'));
    assert.ok(source.includes("AiMarketingShell"));
    const disabled = getMarketingAdminStatus({
      OPENAI_MARKETING_ENABLED: "0",
      OPENAI_API_KEY: "sk-test",
    });
    assert.equal(disabled.state, "disabled");
  });
});
