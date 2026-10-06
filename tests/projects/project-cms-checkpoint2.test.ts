import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapProjectFieldsToDocument } from "../../src/lib/projects/project-document-mapper";
import { resolveProjectsPageShowcaseUpdate } from "../../src/lib/projects/project-showcase-update";
import { buildAdminProjectsRedirectPath } from "../../src/lib/projects/project-save-redirect";
import {
  countProjectsPageFeaturedCandidates,
  isProjectsPageFeaturedCandidate,
  PROJECTS_PAGE_FEATURED_OVERFLOW_WARNING,
  shouldWarnProjectsPageFeaturedOverflow,
} from "../../src/lib/projects/projects-page-featured-admin";
import { resolveProjectsPageGridBatch1 } from "../../src/lib/projects/projectsPageGridBatch1";
import {
  buildProjectShowcaseImagePathname,
  deleteProjectsPageShowcaseImage,
  isManagedProjectsPageShowcase,
  isRemoveShowcaseRequested,
} from "../../src/lib/storage/project-images";
import {
  projectFieldsFromFormData,
  safeParseProjectFields,
} from "../../src/lib/validations/project";
import type { AdminProjectDto } from "../../src/types/project";

function baseProjectFields(overrides: Record<string, unknown> = {}) {
  return {
    title: "פרויקט",
    projectUrl: "https://example.com",
    ctaLabel: "Take me",
    ...overrides,
  };
}

function adminProject(partial: Partial<AdminProjectDto>): AdminProjectDto {
  return {
    id: "1",
    title: "פרויקט",
    subtitle: "",
    imageUrl: "https://example.com/a.webp",
    imageAlt: "פרויקט",
    projectUrl: "https://example.com",
    ctaLabel: "Take me",
    isPublished: true,
    showOnHome: false,
    showOnProjectsPage: true,
    homeOrder: 0,
    projectsPageOrder: 0,
    technologies: [],
    featuredOnProjectsPage: false,
    projectsPageShowFeaturedBadge: false,
    updatedAt: "2024-01-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("Project CMS checkpoint 2 — showcase lifecycle", () => {
  it("upload applies managed showcase and schedules previous key deletion", () => {
    const result = resolveProjectsPageShowcaseUpdate({
      existing: {
        url: "https://blob/old.webp",
        alt: "ישן",
        storageKey: "projects/p1/showcase/old.webp",
      },
      uploaded: {
        url: "https://blob/new.webp",
        storageKey: "projects/p1/showcase/new.webp",
      },
      removeRequested: false,
      showcaseAlt: "חדש",
    });

    assert.equal(result.kind, "apply");
    if (result.kind !== "apply") {
      return;
    }

    assert.equal(result.showcase?.url, "https://blob/new.webp");
    assert.equal(result.deleteManagedKey, "projects/p1/showcase/old.webp");
  });

  it("explicit removal clears showcase and deletes managed key only", () => {
    const result = resolveProjectsPageShowcaseUpdate({
      existing: {
        url: "https://blob/old.webp",
        alt: "ישן",
        storageKey: "projects/p1/showcase/old.webp",
      },
      uploaded: null,
      removeRequested: true,
      showcaseAlt: "",
    });

    assert.equal(result.kind, "apply");
    if (result.kind !== "apply") {
      return;
    }

    assert.equal(result.showcase, null);
    assert.equal(result.deleteManagedKey, "projects/p1/showcase/old.webp");
  });

  it("omits showcase update when unrelated edit (no file, no remove)", () => {
    const result = resolveProjectsPageShowcaseUpdate({
      existing: {
        url: "https://blob/keep.webp",
        alt: "שמור",
        storageKey: "projects/p1/showcase/keep.webp",
      },
      uploaded: null,
      removeRequested: false,
      showcaseAlt: "שמור",
    });

    assert.equal(result.kind, "omit");
  });

  it("does not delete unmanaged/static showcase keys on removal", () => {
    const result = resolveProjectsPageShowcaseUpdate({
      existing: {
        url: "/pics/project-pics/zuoko.png",
        alt: "סטטי",
        storageKey: "/pics/project-pics/zuoko.png",
      },
      uploaded: null,
      removeRequested: true,
      showcaseAlt: "",
    });

    assert.equal(result.kind, "apply");
    if (result.kind !== "apply") {
      return;
    }

    assert.equal(result.deleteManagedKey, undefined);
  });

  it("maps explicit null showcase for Mongo unset", () => {
    const parsed = safeParseProjectFields(baseProjectFields());
    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }

    const doc = mapProjectFieldsToDocument(
      parsed.data,
      { url: "https://example.com/img.webp" },
      { projectsPageShowcase: null }
    );

    assert.equal(doc.projectsPageShowcase, null);
  });

  it("does not include showcase in payload when omitted", () => {
    const parsed = safeParseProjectFields(baseProjectFields());
    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }

    const doc = mapProjectFieldsToDocument(parsed.data, {
      url: "https://example.com/img.webp",
    });

    assert.equal("projectsPageShowcase" in doc, false);
  });

  it("builds showcase pathname under projects/{id}/showcase/", () => {
    const pathname = buildProjectShowcaseImagePathname("abc", "image/jpeg");
    assert.match(pathname ?? "", /^projects\/abc\/showcase\/[a-f0-9-]+\.jpg$/);
    assert.equal(isManagedProjectsPageShowcase(pathname), true);
    assert.equal(isManagedProjectsPageShowcase("projects/abc/file.jpg"), false);
  });

  it("deleteProjectsPageShowcaseImage ignores unmanaged keys", async () => {
    await deleteProjectsPageShowcaseImage("/pics/static.png");
    await deleteProjectsPageShowcaseImage("projects/abc/main.webp");
    await deleteProjectsPageShowcaseImage(undefined);
  });

  it("detects removeShowcase checkbox from FormData", () => {
    const form = new FormData();
    assert.equal(isRemoveShowcaseRequested(form), false);
    form.set("removeShowcase", "1");
    assert.equal(isRemoveShowcaseRequested(form), true);
  });
});

describe("Project CMS checkpoint 2 — form fields", () => {
  it("parses Projects-page section fields from FormData including X/Y position", () => {
    const form = new FormData();
    form.set("title", "ÉVOIR");
    form.set("projectUrl", "https://example.com");
    form.set("showOnProjectsPage", "on");
    form.set("featuredOnProjectsPage", "on");
    form.set("projectsPageFeaturedOrder", "2");
    form.set("projectsPageDisplayTitle", "ÉVOIR");
    form.set("projectsPageShowFeaturedBadge", "on");
    form.set("showcasePositionX", "36");
    form.set("showcasePositionY", "50");

    const parsed = safeParseProjectFields(projectFieldsFromFormData(form));
    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }

    assert.equal(parsed.data.showOnProjectsPage, true);
    assert.equal(parsed.data.featuredOnProjectsPage, true);
    assert.equal(parsed.data.projectsPageFeaturedOrder, 2);
    assert.equal(parsed.data.projectsPageDisplayTitle, "ÉVOIR");
    assert.equal(parsed.data.projectsPageShowFeaturedBadge, true);
    assert.equal(parsed.data.projectsPageShowcaseObjectPosition, "36% 50%");
  });

  it("keeps Homepage Featured independent from Projects-page Featured", () => {
    const parsed = safeParseProjectFields({
      ...baseProjectFields(),
      showOnHome: true,
      featuredOnProjectsPage: true,
    });

    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }

    assert.equal(parsed.data.showOnHome, true);
    assert.equal(parsed.data.featuredOnProjectsPage, true);
  });
});

describe("Project CMS checkpoint 2 — Featured overflow warning", () => {
  it("counts only published + visible + featured on projects page", () => {
    const projects = [
      adminProject({ featuredOnProjectsPage: true }),
      adminProject({
        id: "2",
        isPublished: false,
        featuredOnProjectsPage: true,
      }),
      adminProject({
        id: "3",
        showOnProjectsPage: false,
        featuredOnProjectsPage: true,
      }),
      adminProject({ id: "4", featuredOnProjectsPage: true }),
    ];

    assert.equal(isProjectsPageFeaturedCandidate(projects[0]), true);
    assert.equal(countProjectsPageFeaturedCandidates(projects), 2);
    assert.equal(shouldWarnProjectsPageFeaturedOverflow(2), false);
    assert.equal(shouldWarnProjectsPageFeaturedOverflow(3), true);
  });

  it("redirect path includes warning query when overflow", () => {
    const path = buildAdminProjectsRedirectPath(3);
    assert.match(path, /^\/admin\/projects\?warning=/);
    assert.ok(path.includes(encodeURIComponent(PROJECTS_PAGE_FEATURED_OVERFLOW_WARNING)));
    assert.equal(buildAdminProjectsRedirectPath(2), "/admin/projects");
  });
});

describe("Project CMS checkpoint 2 — legacy batch mapping unchanged", () => {
  it("batch-1 resolver still ignores unknown projects without slot match", () => {
    const projects = [
      {
        id: "mongo-only",
        title: "Mongo Showcase",
        subtitle: "",
        description: "",
        imageUrl: "https://blob/showcase.webp",
        imageAlt: "",
        projectUrl: "https://example.com",
        ctaLabel: "Take me",
        technologies: [],
      },
    ];

    assert.equal(resolveProjectsPageGridBatch1(projects).length, 0);
  });
});
