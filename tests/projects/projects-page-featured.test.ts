import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compactFeaturedDescription,
  featuredTagsForProject,
  PROJECTS_PAGE_FEATURED_MAX_CARDS,
  resolveProjectsPageFeaturedCards,
} from "../../src/lib/projects/projectsPageFeatured";
import type { ProjectsPagePublicProjectDto } from "../../src/types/project";

function sampleProject(
  overrides: Partial<ProjectsPagePublicProjectDto> &
    Pick<ProjectsPagePublicProjectDto, "id">
): ProjectsPagePublicProjectDto {
  return {
    title: "Example",
    subtitle: "תת-כותרת",
    imageUrl: "/pics/example.jpeg",
    imageAlt: "Example",
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

describe("projects page featured section", () => {
  it("renders generic Mongo Featured projects with Admin fields", () => {
    const projects: ProjectsPagePublicProjectDto[] = [
      sampleProject({
        id: "b",
        title: "Brand B",
        featuredOnProjectsPage: true,
        projectsPageFeaturedOrder: 2,
        projectsPageDisplayTitle: "Display B",
        projectsPageShowFeaturedBadge: false,
        projectsPageShowcase: {
          url: "https://blob.example/b.webp",
          alt: "B showcase",
        },
        projectsPageShowcaseObjectPosition: "40% 50%",
      }),
      sampleProject({
        id: "a",
        title: "Brand A",
        featuredOnProjectsPage: true,
        projectsPageFeaturedOrder: 1,
        projectsPageDisplayTitle: "Display A",
        projectsPageShowFeaturedBadge: true,
        projectsPageShowcase: {
          url: "/pics/evoir-projects.png",
          alt: "A showcase",
        },
        projectsPageShowcaseObjectPosition: "28% 50%",
      }),
    ];

    const cards = resolveProjectsPageFeaturedCards(projects);

    assert.equal(cards.length, 2);
    assert.equal(cards[0]?.project.id, "a");
    assert.equal(cards[0]?.displayTitle, "Display A");
    assert.equal(cards[0]?.featuredImageSrc, "/pics/evoir-projects.png");
    assert.equal(cards[0]?.showFeaturedBadge, true);
    assert.equal(cards[0]?.objectPosition, "28% 50%");
    assert.equal(cards[1]?.project.id, "b");
    assert.equal(cards[1]?.displayTitle, "Display B");
  });

  it("limits to two Featured cards by order", () => {
    const projects = [1, 2, 3].map((order) =>
      sampleProject({
        id: String(order),
        title: `F${order}`,
        featuredOnProjectsPage: true,
        projectsPageFeaturedOrder: order,
        projectsPageShowcase: { url: `/pics/f${order}.png`, alt: "x" },
      })
    );

    const cards = resolveProjectsPageFeaturedCards(projects);
    assert.equal(cards.length, PROJECTS_PAGE_FEATURED_MAX_CARDS);
    assert.deepEqual(
      cards.map((card) => card.project.id),
      ["1", "2"]
    );
  });

  it("returns empty when no eligible Featured projects exist", () => {
    const cards = resolveProjectsPageFeaturedCards([
      sampleProject({
        id: "x",
        projectUrl: "https://shiputi.co.il/",
        featuredOnProjectsPage: false,
      }),
    ]);
    assert.equal(cards.length, 0);
  });

  it("prefers project description and limits tags to three", () => {
    const description = compactFeaturedDescription("תיאור קצר לתצוגה בדף הפרויקטים.");
    assert.equal(description, "תיאור קצר לתצוגה בדף הפרויקטים.");
    assert.equal(compactFeaturedDescription(undefined), null);

    const tags = featuredTagsForProject(
      sampleProject({
        id: "1",
        technologies: ["Next.js", "CMS", "Responsive", "TypeScript"],
      })
    );
    assert.deepEqual(tags, ["Next.js", "CMS", "Responsive"]);
  });
});
