import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const repoRoot = join(import.meta.dirname, "../../..");
const revalidatePath = join(
  repoRoot,
  "src/lib/projects/revalidate-paths.ts"
);
const applyUpdatePath = join(
  repoRoot,
  "src/lib/business/ai-marketing/update-project-website-content-fields.ts"
);

describe("project revalidation paths", () => {
  it("revalidate helper covers public home, projects, and admin list", () => {
    const source = readFileSync(revalidatePath, "utf8");
    assert.ok(source.includes('revalidatePath("/")'));
    assert.ok(source.includes('revalidatePath("/projects")'));
    assert.ok(source.includes('revalidatePath("/admin/projects")'));
  });

  it("website content apply uses shared revalidation", () => {
    const source = readFileSync(applyUpdatePath, "utf8");
    assert.ok(source.includes("revalidateProjectPaths"));
  });
});
