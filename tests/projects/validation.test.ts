import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HOME_MAX_FOUR_ERROR,
  HOME_PROJECTS_MAX,
  compareByOrderThenUpdatedAt,
  countHomeFeatured,
  deriveSeedKey,
  filterPublishedHome,
  filterPublishedProjectsPage,
  mapToHomePublicProjectDto,
  wouldExceedHomeFeaturedLimit,
} from "../../src/lib/projects/rules";
import { safeParseProjectFields, projectFieldsFromFormData } from "../../src/lib/validations/project";

describe("project validation", () => {
  it("accepts a valid project input", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      subtitle: "תיאור",
      imageAlt: "פרויקט",
      projectUrl: "https://example.com",
      ctaLabel: "Take me",
      isPublished: true,
      showOnHome: true,
      showOnProjectsPage: true,
      homeOrder: 1,
      projectsPageOrder: 2,
      technologies: "React, Next.js",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.technologies.length, 2);
    }
  });

  it("rejects non-https project URLs", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      imageAlt: "פרויקט",
      projectUrl: "http://example.com",
    });

    assert.equal(parsed.success, false);
  });

  it("accepts an optional trimmed description", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      subtitle: "תת-כותרת",
      description: "  תיאור קצר לתצוגה  ",
      projectUrl: "https://example.com",
      ctaLabel: "Take me",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.description, "תיאור קצר לתצוגה");
    }
  });

  it("normalizes empty description to undefined", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      subtitle: "תת-כותרת",
      description: "   ",
      projectUrl: "https://example.com",
      ctaLabel: "Take me",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.description, undefined);
    }
  });

  it("accepts projects without description", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      subtitle: "תת-כותרת",
      projectUrl: "https://example.com",
      ctaLabel: "Take me",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.description, undefined);
    }
  });

  it("rejects descriptions longer than 300 characters", () => {
    const parsed = safeParseProjectFields({
      title: "פרויקט",
      projectUrl: "https://example.com",
      ctaLabel: "Take me",
      description: "א".repeat(301),
    });

    assert.equal(parsed.success, false);
  });

  it("reads description from FormData for create/update flow", () => {
    const formData = new FormData();
    formData.set("title", "פרויקט");
    formData.set("subtitle", "תת-כותרת");
    formData.set("description", "תיאור מהטופס");
    formData.set("projectUrl", "https://example.com");
    formData.set("ctaLabel", "Take me");

    const parsed = safeParseProjectFields(projectFieldsFromFormData(formData));

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.description, "תיאור מהטופס");
    }
  });
});

describe("home max-4 rule", () => {
  it("blocks a fifth published home project", () => {
    const currentCount = HOME_PROJECTS_MAX;
    const exceeded = wouldExceedHomeFeaturedLimit(currentCount, {
      isPublished: true,
      showOnHome: true,
    });

    assert.equal(exceeded, true);
    assert.equal(HOME_MAX_FOUR_ERROR, "ניתן להציג עד 4 פרויקטים בדף הבית.");
  });

  it("allows unpublished home candidates", () => {
    const exceeded = wouldExceedHomeFeaturedLimit(HOME_PROJECTS_MAX, {
      isPublished: false,
      showOnHome: true,
    });

    assert.equal(exceeded, false);
  });
});

describe("public filtering and ordering", () => {
  it("filters published home and projects-page projects", () => {
    const projects = [
      { isPublished: true, showOnHome: true, showOnProjectsPage: true },
      { isPublished: false, showOnHome: true, showOnProjectsPage: true },
      { isPublished: true, showOnHome: false, showOnProjectsPage: true },
      { isPublished: true, showOnHome: true, showOnProjectsPage: false },
    ];

    assert.equal(filterPublishedHome(projects).length, 2);
    assert.equal(filterPublishedProjectsPage(projects).length, 2);
    assert.equal(countHomeFeatured(projects), 2);
  });

  it("sorts by order then updatedAt then id", () => {
    const sorted = [
      { projectsPageOrder: 2, updatedAt: "2024-01-02", id: "b" },
      { projectsPageOrder: 1, updatedAt: "2024-01-03", id: "a" },
      { projectsPageOrder: 1, updatedAt: "2024-01-01", id: "c" },
    ].sort(compareByOrderThenUpdatedAt("projectsPageOrder"));

    assert.deepEqual(
      sorted.map((project) => project.id),
      ["c", "a", "b"]
    );
  });

  it("maps home overrides for public DTO", () => {
    const dto = mapToHomePublicProjectDto({
      _id: "1",
      title: "שיפוטי",
      subtitle: "בלוג משפטי למשרד עורכי דין",
      description: "תיאור קצר לדף הבית",
      homeTitle: "בלוג משפטי",
      image: { url: "/pics/shiputi.jpeg", alt: "" },
      projectUrl: "https://shiputi.co.il/",
      ctaLabel: "Take me",
      technologies: ["Next.js", "TypeScript"],
    });

    assert.equal(dto.title, "בלוג משפטי");
    assert.equal(dto.subtitle, "בלוג משפטי למשרד עורכי דין");
    assert.equal(dto.description, "תיאור קצר לדף הבית");
    assert.equal(dto.imageAlt, "שיפוטי");
    assert.deepEqual(dto.technologies, ["Next.js", "TypeScript"]);
  });

  it("omits description on public DTO when source has none", () => {
    const dto = mapToHomePublicProjectDto({
      _id: "2",
      title: "פרויקט",
      subtitle: "תת-כותרת",
      image: { url: "/pics/example.jpeg", alt: "פרויקט" },
      projectUrl: "https://example.com/",
      ctaLabel: "Take me",
      technologies: [],
    });

    assert.equal(dto.description, undefined);
  });

  it("derives stable seed keys", () => {
    assert.equal(
      deriveSeedKey("https://www.lacemodel.com/"),
      "lacemodel.com"
    );
    assert.equal(
      deriveSeedKey("https://clean-seven-rho.vercel.app/"),
      "clean-seven-rho.vercel.app"
    );
  });
});
