import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  HOME_MAIN_IMAGE_REQUIRED_ERROR,
  validateMainProjectImageRequirement,
} from "../../src/lib/projects/project-main-image-policy";
import { resolveProjectsPageGridCards } from "../../src/lib/projects/projects-page-grid";
import {
  PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE,
  resolveProjectsPageFeaturedCards,
} from "../../src/lib/projects/projectsPageFeatured";
import { resolveProjectsPageShowcaseForGrid } from "../../src/lib/projects/projects-page-showcase-resolve";
import type { ProjectsPagePublicProjectDto } from "../../src/types/project";

function pageProject(
  overrides: Partial<ProjectsPagePublicProjectDto> &
    Pick<ProjectsPagePublicProjectDto, "id" | "title" | "projectUrl">
): ProjectsPagePublicProjectDto {
  return {
    subtitle: "",
    imageUrl: "",
    imageAlt: "",
    ctaLabel: "Take me",
    technologies: [],
    isPublished: true,
    showOnProjectsPage: true,
    featuredOnProjectsPage: false,
    projectsPageOrder: 0,
    projectsPageShowFeaturedBadge: false,
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("Checkpoint 3 — main project image policy", () => {
  it("allows projects-page-only projects without main image when not on home", () => {
    assert.equal(
      validateMainProjectImageRequirement({
        showOnHome: false,
        imageUrl: "",
      }),
      null
    );
  });

  it("requires main image when showOnHome is enabled", () => {
    assert.equal(
      validateMainProjectImageRequirement({
        showOnHome: true,
        imageUrl: "",
      }),
      HOME_MAIN_IMAGE_REQUIRED_ERROR
    );
  });
});

describe("Checkpoint 3 — mongo-first grid", () => {
  it("renders Mongo showcase project without static mapping (Tabi-like)", () => {
    const tabi = pageProject({
      id: "tabi-id",
      title: "Tabi",
      subtitle: "תת",
      description: "תיאור",
      projectUrl: "https://tabi-example.co.il/",
      projectsPageOrder: 9,
      projectsPageShowcase: {
        url: "https://blob.example/tabi-showcase.webp",
        alt: "Tabi showcase",
      },
      technologies: ["Next.js"],
    });

    const cards = resolveProjectsPageGridCards([tabi]);
    assert.equal(cards.length, 1);
    assert.equal(cards[0]?.displayTitle, "Tabi");
    assert.equal(cards[0]?.showcaseImageSrc, "https://blob.example/tabi-showcase.webp");
    assert.equal(cards[0]?.slotId, "tabi-id");
  });

  it("prefers Mongo showcase over legacy batch mapping", () => {
    const zouko = pageProject({
      id: "z",
      title: "זוקו",
      projectUrl: "https://zoukoisrael.com/",
      projectsPageShowcase: {
        url: "https://blob.example/zouko-admin.webp",
        alt: "zouko",
      },
    });

    const showcase = resolveProjectsPageShowcaseForGrid(zouko);
    assert.equal(showcase?.showcaseImageSrc, "https://blob.example/zouko-admin.webp");
    assert.equal(showcase?.source, "mongo");
  });

  it("uses legacy grid fallback for approved batch projects without Mongo showcase", () => {
    const zouko = pageProject({
      id: "z",
      title: "זוקו",
      projectUrl: "https://zoukoisrael.com/",
    });

    const cards = resolveProjectsPageGridCards([zouko]);
    assert.equal(cards.length, 1);
    assert.equal(cards[0]?.showcaseImageSrc, "/pics/project-pics/zuoko.png");
    assert.equal(cards[0]?.slotId, "zouko");
  });

  it("keeps non-mapped projects without showcase hidden", () => {
    const hidden = pageProject({
      id: "hidden",
      title: "נזיקי",
      projectUrl: "https://nezikin-example.co.il/",
    });

    assert.equal(resolveProjectsPageGridCards([hidden]).length, 0);
  });

  it("sorts grid by projectsPageOrder and excludes Featured-on-page", () => {
    const featured = pageProject({
      id: "f",
      title: "Featured Grid Excluded",
      projectUrl: "https://featured-grid.example/",
      featuredOnProjectsPage: true,
      projectsPageShowcase: { url: "https://blob.example/f.webp", alt: "f" },
      projectsPageOrder: 0,
    });

    const second = pageProject({
      id: "b",
      title: "B",
      projectUrl: "https://b.example/",
      projectsPageOrder: 2,
      projectsPageShowcase: { url: "https://blob.example/b.webp", alt: "b" },
    });

    const first = pageProject({
      id: "a",
      title: "A",
      projectUrl: "https://a.example/",
      projectsPageOrder: 1,
      projectsPageShowcase: { url: "https://blob.example/a.webp", alt: "a" },
    });

    const cards = resolveProjectsPageGridCards([second, featured, first]);
    assert.deepEqual(
      cards.map((card) => card.project.id),
      ["a", "b"]
    );
  });
});

describe("Checkpoint 3 — mongo-first featured", () => {
  it("keeps legacy ÉVOIR/Lace visible during migration", () => {
    const projects = [
      pageProject({
        id: "lace",
        title: "lace",
        projectUrl: "https://www.lacemodel.com/",
      }),
      pageProject({
        id: "evoir",
        title: "jozef la perfume",
        projectUrl: "https://www.jozeflaperfume.co.il/",
      }),
    ];

    const cards = resolveProjectsPageFeaturedCards(projects);
    assert.equal(cards.length, 2);
    assert.equal(cards[0]?.displayTitle, PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE);
  });

  it("limits Featured cards to two and respects Mongo featured order", () => {
    const projects = [
      pageProject({
        id: "f2",
        title: "F2",
        projectUrl: "https://f2.example/",
        featuredOnProjectsPage: true,
        projectsPageFeaturedOrder: 2,
        projectsPageShowcase: { url: "https://blob.example/f2.webp", alt: "f2" },
      }),
      pageProject({
        id: "f1",
        title: "F1",
        projectUrl: "https://f1.example/",
        featuredOnProjectsPage: true,
        projectsPageFeaturedOrder: 1,
        projectsPageShowcase: { url: "https://blob.example/f1.webp", alt: "f1" },
      }),
      pageProject({
        id: "f3",
        title: "F3",
        projectUrl: "https://f3.example/",
        featuredOnProjectsPage: true,
        projectsPageFeaturedOrder: 3,
        projectsPageShowcase: { url: "https://blob.example/f3.webp", alt: "f3" },
      }),
    ];

    const cards = resolveProjectsPageFeaturedCards(projects);
    assert.equal(cards.length, 2);
    assert.deepEqual(
      cards.map((card) => card.project.id),
      ["f1", "f2"]
    );
  });
});
