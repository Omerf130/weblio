import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const repoRoot = join(import.meta.dirname, "../../..");
const actionsPath = join(
  repoRoot,
  "src/lib/business/ai-marketing/actions.ts"
);
const updateHelperPath = join(
  repoRoot,
  "src/lib/business/ai-marketing/update-project-website-content-fields.ts"
);
const generateDraftPath = join(
  repoRoot,
  "src/lib/business/ai-marketing/generate-marketing-draft.ts"
);

const actionsSource = readFileSync(actionsPath, "utf8");
const updateHelperSource = readFileSync(updateHelperPath, "utf8");
const generateDraftSource = readFileSync(generateDraftPath, "utf8");

describe("ai marketing apply server actions", () => {
  it("apply action requires admin", () => {
    assert.match(
      actionsSource,
      /export async function applyAiMarketingWebsiteContentAction[\s\S]*?await requireAdmin\(\)/m
    );
  });

  it("generate action does not mutate projects", () => {
    const beforeApply = actionsSource.split(
      "export async function applyAiMarketingWebsiteContentAction"
    )[0];
    assert.doesNotMatch(beforeApply, /updateProjectWebsiteContentFields/);
    assert.doesNotMatch(generateDraftSource, /Project\.update/);
    assert.doesNotMatch(generateDraftSource, /findByIdAndUpdate/);
  });

  it("apply uses narrow update helper only", () => {
    assert.match(
      actionsSource,
      /applyAiMarketingWebsiteContentAction[\s\S]*updateProjectWebsiteContentFields/m
    );
    assert.doesNotMatch(actionsSource, /updateProjectAction/);
    assert.doesNotMatch(actionsSource, /mapFieldsToDocument/);
  });

  it("update helper does not reference forbidden project fields", () => {
    for (const token of [
      "imageUrl",
      "imageStorageKey",
      "projectUrl",
      "isPublished",
      "showOnHome",
      "projectsPageOrder",
    ]) {
      assert.doesNotMatch(
        updateHelperSource,
        new RegExp(`\\$set[^;]*${token}`)
      );
    }
  });

  it("does not add AI Marketing mongo models", () => {
    assert.doesNotMatch(updateHelperSource, /new Schema/);
    assert.doesNotMatch(actionsSource, /mongoose\.model/);
  });

  it("does not touch Intent Monitor classifier", () => {
    assert.doesNotMatch(actionsSource, /discovery\/classifier/);
    assert.doesNotMatch(updateHelperSource, /discovery\/classifier/);
    assert.doesNotMatch(generateDraftSource, /discovery\/classifier/);
  });
});
