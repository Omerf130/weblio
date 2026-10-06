import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE,
  PROJECTS_PAGE_FEATURED_LACE_DISPLAY_TITLE,
  compactFeaturedDescription,
  featuredTagsForProject,
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
  it("resolves ÉVOIR and Lace Models with display overrides and assets", () => {
    const projects: ProjectsPagePublicProjectDto[] = [
      sampleProject({
        id: "lace",
        title: "lace",
        subtitle: "סוכנות דוגמנות",
        projectUrl: "https://www.lacemodel.com/",
        technologies: ["Next.js", "Custom Design", "Responsive"],
      }),
      sampleProject({
        id: "evoir",
        title: "jozef la perfume",
        subtitle: "חנות בשמים",
        description: "אתר מסחר אלקטרוני לבשמים עם חוויית קנייה נקייה.",
        projectUrl: "https://www.jozeflaperfume.co.il/",
        technologies: ["Next.js", "E-commerce"],
      }),
    ];

    const cards = resolveProjectsPageFeaturedCards(projects);

    assert.equal(cards.length, 2);
    assert.equal(cards[0]?.slot, "evoir");
    assert.equal(cards[0]?.displayTitle, PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE);
    assert.equal(cards[0]?.featuredImageSrc, "/pics/evoir-projects.png");
    assert.equal(cards[0]?.showFeaturedBadge, true);
    assert.equal(cards[1]?.slot, "lace");
    assert.equal(cards[1]?.displayTitle, PROJECTS_PAGE_FEATURED_LACE_DISPLAY_TITLE);
    assert.equal(cards[1]?.featuredImageSrc, "/pics/lace-projects.png");
    assert.equal(cards[1]?.showFeaturedBadge, false);
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

  it("returns empty when neither featured project exists", () => {
    const cards = resolveProjectsPageFeaturedCards([
      sampleProject({ id: "x", projectUrl: "https://shiputi.co.il/" }),
    ]);
    assert.equal(cards.length, 0);
  });
});
