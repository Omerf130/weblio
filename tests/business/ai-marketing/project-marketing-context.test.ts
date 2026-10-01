import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapAdminProjectToMarketingContext } from "../../../src/lib/business/ai-marketing/project-marketing-context";
import type { AdminProjectDto } from "../../../src/types/project";

const sampleProject: AdminProjectDto = {
  id: "507f1f77bcf86cd799439011",
  title: "פרויקט לדוגמה",
  subtitle: "כותרת משנה",
  description: "תיאור קצר",
  homeTitle: "בית",
  homeSubtitle: "משנה בית",
  imageUrl: "https://example.com/a.png",
  imageAlt: "alt",
  imageStorageKey: "projects/secret-key",
  projectUrl: "https://example.com",
  ctaLabel: "Take me",
  isPublished: true,
  showOnHome: true,
  showOnProjectsPage: true,
  homeOrder: 3,
  projectsPageOrder: 2,
  technologies: ["Next.js"],
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("project marketing context", () => {
  it("maps only generation-safe fields", () => {
    const ctx = mapAdminProjectToMarketingContext(sampleProject);
    assert.equal(ctx.title, "פרויקט לדוגמה");
    assert.equal(ctx.projectUrl, "https://example.com");
    assert.deepEqual(ctx.technologies, ["Next.js"]);
    assert.equal(ctx.visibility.isPublished, true);
    assert.equal("id" in (ctx as Record<string, unknown>), false);
    assert.equal("imageUrl" in (ctx as Record<string, unknown>), false);
    assert.equal("imageStorageKey" in (ctx as Record<string, unknown>), false);
    assert.equal("homeOrder" in (ctx as Record<string, unknown>), false);
    assert.equal("seedKey" in (ctx as Record<string, unknown>), false);
  });
});
