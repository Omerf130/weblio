import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapProjectFieldsToDocument } from "../../src/lib/projects/project-document-mapper";
import {
  isValidProjectsPageShowcaseObjectPosition,
  sanitizeProjectsPageShowcaseObjectPosition,
} from "../../src/lib/projects/projects-page-showcase-object-position";
import { resolveProjectsPageGridCards } from "../../src/lib/projects/projects-page-grid";
import { resolveProjectsPageGridBatch1 } from "../../src/lib/projects/projectsPageGridBatch1";
import {
  buildProjectShowcaseImagePathname,
  isManagedProjectsPageShowcase,
} from "../../src/lib/storage/project-images";
import { safeParseProjectFields } from "../../src/lib/validations/project";
import type { PublicProjectDto } from "../../src/types/project";

describe("Project CMS checkpoint 1 — validation defaults", () => {
  it("defaults new Projects-page fields when omitted", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      projectUrl: "https://example.com",
      ctaLabel: "Take me",
    });

    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }

    assert.equal(parsed.data.featuredOnProjectsPage, false);
    assert.equal(parsed.data.projectsPageShowFeaturedBadge, false);
    assert.equal(parsed.data.projectsPageFeaturedOrder, undefined);
    assert.equal(parsed.data.projectsPageDisplayTitle, undefined);
    assert.equal(parsed.data.projectsPageShowcaseObjectPosition, undefined);
  });

  it("allows Projects-page Featured without Homepage Featured", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      projectUrl: "https://example.com",
      ctaLabel: "Take me",
      showOnHome: false,
      featuredOnProjectsPage: true,
      projectsPageFeaturedOrder: 1,
    });

    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }

    assert.equal(parsed.data.showOnHome, false);
    assert.equal(parsed.data.featuredOnProjectsPage, true);
    assert.equal(parsed.data.projectsPageFeaturedOrder, 1);
  });

  it("rejects unsafe object-position values", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      projectUrl: "https://example.com",
      ctaLabel: "Take me",
      projectsPageShowcaseObjectPosition: "url(https://evil.com)",
    });

    assert.equal(parsed.success, false);
  });

  it("accepts safe object-position values", () => {
    assert.equal(isValidProjectsPageShowcaseObjectPosition("36% 50%"), true);
    assert.equal(sanitizeProjectsPageShowcaseObjectPosition(" 28% 50% "), "28% 50%");
    assert.equal(sanitizeProjectsPageShowcaseObjectPosition("expression(1)"), undefined);

    const parsed = safeParseProjectFields({
      title: "פרויקט",
      projectUrl: "https://example.com",
      ctaLabel: "Take me",
      projectsPageShowcaseObjectPosition: "38% 52%",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.projectsPageShowcaseObjectPosition, "38% 52%");
    }
  });
});

describe("Project CMS checkpoint 1 — document mapping", () => {
  it("maps new fields with safe defaults and optional showcase", () => {
    const parsed = safeParseProjectFields({
      title: "ÉVOIR",
      subtitle: "חנות בשמים",
      projectUrl: "https://www.jozeflaperfume.co.il/",
      ctaLabel: "Take me",
      featuredOnProjectsPage: true,
      projectsPageFeaturedOrder: 1,
      projectsPageDisplayTitle: "ÉVOIR",
      projectsPageShowFeaturedBadge: true,
      projectsPageShowcaseObjectPosition: "28% 50%",
    });

    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }

    const doc = mapProjectFieldsToDocument(parsed.data, {
      url: "https://blob.example/thumb.png",
      storageKey: "projects/id/thumb.png",
    });

    assert.equal(doc.featuredOnProjectsPage, true);
    assert.equal(doc.projectsPageFeaturedOrder, 1);
    assert.equal(doc.projectsPageDisplayTitle, "ÉVOIR");
    assert.equal(doc.projectsPageShowFeaturedBadge, true);
    assert.equal(doc.projectsPageShowcaseObjectPosition, "28% 50%");
    assert.equal("projectsPageShowcase" in doc, false);
  });

  it("preserves showcase only when explicitly passed in options", () => {
    const parsed = safeParseProjectFields({
      title: "Grid",
      projectUrl: "https://zoukoisrael.com/",
      ctaLabel: "Take me",
    });

    assert.equal(parsed.success, true);
    if (!parsed.success) {
      return;
    }

    const withShowcase = mapProjectFieldsToDocument(
      parsed.data,
      { url: "/pics/z.png", storageKey: "projects/x/y.png" },
      {
        projectsPageShowcase: {
          url: "/pics/project-pics/zuoko.png",
          alt: "Zouko showcase",
        },
      }
    );

    assert.deepEqual(withShowcase.projectsPageShowcase, {
      url: "/pics/project-pics/zuoko.png",
      alt: "Zouko showcase",
    });
  });
});

describe("Project CMS checkpoint 1 — showcase blob helpers", () => {
  it("uses managed showcase paths under projects/{id}/showcase/", () => {
    const pathname = buildProjectShowcaseImagePathname("abc123", "image/png");
    assert.equal(pathname?.startsWith("projects/abc123/showcase/"), true);
    assert.equal(isManagedProjectsPageShowcase(pathname), true);
    assert.equal(isManagedProjectsPageShowcase("projects/abc123/file.png"), false);
  });
});

describe("Project CMS checkpoint 1 — legacy batch helper still available", () => {
  it("keeps batch-1 slot resolver for migration fallback", () => {
    const projects: PublicProjectDto[] = [
      {
        id: "z",
        title: "זוקו",
        subtitle: "ריקוד",
        projectUrl: "https://zoukoisrael.com/",
        imageUrl: "/pics/z.png",
        imageAlt: "z",
        ctaLabel: "Take me",
        technologies: [],
      },
    ];

    assert.equal(resolveProjectsPageGridBatch1(projects).length, 1);
  });
});

describe("Project CMS checkpoint 1 — mongo grid requires showcase", () => {
  it("renders grid only when projectsPageShowcase exists", () => {
    const projects = [
      {
        id: "z",
        title: "זוקו",
        subtitle: "ריקוד",
        projectUrl: "https://zoukoisrael.com/",
        imageUrl: "/pics/z.png",
        imageAlt: "z",
        ctaLabel: "Take me",
        technologies: [],
        isPublished: true,
        showOnProjectsPage: true,
        featuredOnProjectsPage: false,
        projectsPageOrder: 1,
        projectsPageShowFeaturedBadge: false,
        updatedAt: "2024-01-01T00:00:00.000Z",
        projectsPageShowcase: {
          url: "/pics/project-pics/zuoko.png",
          alt: "z",
        },
      },
    ];

    assert.equal(resolveProjectsPageGridCards(projects).length, 1);
  });
});
