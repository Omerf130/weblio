import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveProjectsPageGridCards } from "../../src/lib/projects/projects-page-grid";
import { resolveProjectsPageFeaturedCards } from "../../src/lib/projects/projectsPageFeatured";
import { isManagedProjectsPageShowcase } from "../../src/lib/storage/project-images";
import type { ProjectsPagePublicProjectDto } from "../../src/types/project";

const testDir = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(testDir, "../../src/lib/projects");

function readSrc(relativePath: string): string {
  return readFileSync(join(srcRoot, relativePath), "utf8");
}

function pageProject(
  overrides: Partial<ProjectsPagePublicProjectDto> &
    Pick<ProjectsPagePublicProjectDto, "id" | "title">
): ProjectsPagePublicProjectDto {
  return {
    subtitle: "",
    imageUrl: "",
    imageAlt: "",
    projectUrl: "https://example.com/",
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

describe("Checkpoint 4B — generic grid", () => {
  it("renders arbitrary Mongo project with showcase (Tabi-like)", () => {
    const tabi = pageProject({
      id: "tabi",
      title: "Tabi",
      projectsPageOrder: 9,
      projectsPageShowcase: {
        url: "https://blob.example/tabi.webp",
        alt: "Tabi",
      },
    });

    const cards = resolveProjectsPageGridCards([tabi]);
    assert.equal(cards.length, 1);
    assert.equal(cards[0]?.slotId, "tabi");
    assert.equal(cards[0]?.showcaseImageSrc, "https://blob.example/tabi.webp");
    assert.equal(cards[0]?.displayTitle, "Tabi");
  });

  it("does not render project without Mongo showcase", () => {
    const hidden = pageProject({
      id: "hidden",
      title: "נזיקי",
      projectUrl: "https://www.neziki.org.il/",
    });

    assert.equal(resolveProjectsPageGridCards([hidden]).length, 0);
  });

  it("excludes Featured-on-page projects from grid", () => {
    const cards = resolveProjectsPageGridCards([
      pageProject({
        id: "f",
        title: "Featured",
        featuredOnProjectsPage: true,
        projectsPageShowcase: { url: "/pics/f.png", alt: "f" },
      }),
      pageProject({
        id: "g",
        title: "Grid",
        projectsPageOrder: 1,
        projectsPageShowcase: { url: "/pics/g.png", alt: "g" },
      }),
    ]);

    assert.equal(cards.length, 1);
    assert.equal(cards[0]?.project.id, "g");
  });

  it("sorts by projectsPageOrder and uses display title fallback", () => {
    const cards = resolveProjectsPageGridCards([
      pageProject({
        id: "b",
        title: "B title",
        projectsPageOrder: 2,
        projectsPageShowcase: { url: "/pics/b.png", alt: "b" },
      }),
      pageProject({
        id: "a",
        title: "A title",
        projectsPageDisplayTitle: "A display",
        projectsPageOrder: 1,
        projectsPageShowcase: { url: "/pics/a.png", alt: "a" },
      }),
    ]);

    assert.deepEqual(
      cards.map((card) => card.project.id),
      ["a", "b"]
    );
    assert.equal(cards[0]?.displayTitle, "A display");
    assert.equal(cards[1]?.displayTitle, "B title");
  });
});

describe("Checkpoint 4B — generic Featured", () => {
  it("uses Mongo badge, display title, and object position", () => {
    const cards = resolveProjectsPageFeaturedCards([
      pageProject({
        id: "f1",
        title: "Any Featured",
        featuredOnProjectsPage: true,
        projectsPageFeaturedOrder: 1,
        projectsPageDisplayTitle: "Custom Featured",
        projectsPageShowFeaturedBadge: true,
        projectsPageShowcase: {
          url: "/pics/custom-featured.png",
          alt: "Featured alt",
        },
        projectsPageShowcaseObjectPosition: "33% 44%",
      }),
    ]);

    assert.equal(cards.length, 1);
    assert.equal(cards[0]?.displayTitle, "Custom Featured");
    assert.equal(cards[0]?.featuredImageSrc, "/pics/custom-featured.png");
    assert.equal(cards[0]?.showFeaturedBadge, true);
    assert.equal(cards[0]?.objectPosition, "33% 44%");
  });
});

describe("Checkpoint 4B — legacy removed from public runtime", () => {
  it("public grid resolver does not reference batch-1 migration modules", () => {
    const source = readSrc("projects-page-grid.ts");
    assert.doesNotMatch(source, /BATCH1_SLOTS|projectsPageGridBatch1|legacy/i);
  });

  it("public Featured resolver does not use legacy identity or fill", () => {
    const source = readSrc("projectsPageFeatured.ts");
    assert.doesNotMatch(source, /BATCH1|isEvoir|isLace|legacy|seedKey|deriveSeedKey/i);
  });

  it("static /pics showcase paths are not treated as managed Blob keys", () => {
    assert.equal(isManagedProjectsPageShowcase(undefined), false);
    assert.equal(isManagedProjectsPageShowcase("/pics/project-pics/zuoko.png"), false);
  });
});
