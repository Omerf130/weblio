import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { THIN_PROJECT_CONTEXT_NOTICE } from "../../../src/lib/business/ai-marketing/project-context-hints";

const repoRoot = join(import.meta.dirname, "../../..");
const toolPath = join(
  repoRoot,
  "src/components/admin/business/ai-marketing/AiMarketingWebsiteTool.tsx"
);
const confirmPath = join(
  repoRoot,
  "src/components/admin/business/ai-marketing/AiMarketingWebsiteApplyConfirm.tsx"
);

describe("ai marketing website tool (apply UX)", () => {
  it("requires confirmation before apply server action", () => {
    const tool = readFileSync(toolPath, "utf8");
    const confirm = readFileSync(confirmPath, "utf8");

    assert.ok(tool.includes("AiMarketingWebsiteApplyConfirm"));
    assert.ok(tool.includes("showApplyConfirm"));
    assert.ok(tool.includes("החל תוכן בפרויקט"));
    assert.ok(confirm.includes("עדכן את הפרויקט"));

    assert.ok(tool.includes("onConfirm={() => void runApply()}"));
    assert.doesNotMatch(
      tool,
      /החל תוכן בפרויקט[\s\S]*applyAiMarketingWebsiteContentAction/
    );
  });

  it("clears draft when project selection changes", () => {
    const tool = readFileSync(toolPath, "utf8");
    assert.ok(tool.includes("draftProjectId"));
    assert.ok(tool.includes("clearDraft"));
    assert.ok(tool.includes("draftMatchesProject"));
    assert.ok(tool.includes("handleProjectChange"));
  });

  it("exposes admin project edit link after success", () => {
    const tool = readFileSync(toolPath, "utf8");
    assert.ok(tool.includes("פתח את הפרויקט"));
    assert.ok(tool.includes("/admin/projects/${projectId}"));
  });

  it("uses thin context notice without blocking generation", () => {
    const tool = readFileSync(toolPath, "utf8");
    assert.ok(tool.includes("thinContext"));
    assert.ok(tool.includes("THIN_PROJECT_CONTEXT_NOTICE"));
    assert.equal(
      THIN_PROJECT_CONTEXT_NOTICE.includes("יש מעט מידע על הפרויקט"),
      true
    );
    assert.doesNotMatch(tool, /if \(showThinNotice\)[\s\S]*return null/);
  });

  it("includes admin-reviewed technologies in apply payload helper", () => {
    const tool = readFileSync(toolPath, "utf8");
    assert.ok(tool.includes("technologiesInput"));
    assert.ok(tool.includes("commitTechnologiesInput"));
    assert.ok(tool.includes("fieldsForApply"));
    assert.ok(tool.includes("showApplyConfirm"));
  });
});
