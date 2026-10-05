import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BATCH1_SLOTS,
  resolveProjectsPageGridBatch1,
} from "../../src/lib/projects/projectsPageGridBatch1";
import type { PublicProjectDto } from "../../src/types/project";

function sampleProject(
  overrides: Partial<PublicProjectDto> & Pick<PublicProjectDto, "id" | "projectUrl">
): PublicProjectDto {
  return {
    title: "Example",
    subtitle: "תת-כותרת",
    imageUrl: "/pics/example.jpeg",
    imageAlt: "Example",
    ctaLabel: "Take me",
    technologies: [],
    ...overrides,
  };
}

describe("projects page grid batch 1", () => {
  it("resolves eight cards in fixed slot order", () => {
    const projects: PublicProjectDto[] = [
      sampleProject({ id: "ship", title: "שיפוטי", projectUrl: "https://shiputi.co.il/" }),
      sampleProject({ id: "z", title: "זוקו", projectUrl: "https://zoukoisrael.com/" }),
      sampleProject({
        id: "ogen",
        title: "ogen",
        projectUrl: "https://ogen-laneshama.vercel.app/",
      }),
      sampleProject({
        id: "eden",
        title: "עדן - דודי שמש",
        projectUrl: "https://www.eden-shemesh.co.il/",
      }),
      sampleProject({
        id: "m",
        title: "מבריק 100",
        projectUrl: "https://clean-seven-rho.vercel.app/",
      }),
      sampleProject({
        id: "a",
        title: "אטיאס אשכנזי ושות'",
        projectUrl: "https://www.ashkenazilaw.co.il/",
      }),
      sampleProject({
        id: "n",
        title: "נוח - סטודנטים לסיעוד",
        projectUrl: "https://www.noah-sn.co.il/",
      }),
      sampleProject({
        id: "g",
        title: "גן מתוקים",
        projectUrl: "https://ganmetukim.co.il",
      }),
    ];

    const cards = resolveProjectsPageGridBatch1(projects);

    assert.equal(cards.length, 8);
    assert.deepEqual(
      cards.map((card) => card.slotId),
      BATCH1_SLOTS.map((slot) => slot.id)
    );
    assert.equal(cards[0]?.showcaseImageSrc, "/pics/project-pics/zuoko.png");
    assert.equal(cards[6]?.project.title, "ogen");
    assert.equal(cards[6]?.showcaseImageSrc, "/pics/project-pics/ogen.png");
    assert.equal(cards.every((card) => card.ctaLabel === "לצפייה באתר"), true);
  });

  it("resolves ogen by Hebrew title when URL differs", () => {
    const cards = resolveProjectsPageGridBatch1([
      sampleProject({
        id: "ogen-he",
        title: "עוגן לנשמה",
        projectUrl: "https://example.co.il/",
      }),
    ]);

    assert.equal(cards.length, 1);
    assert.equal(cards[0]?.slotId, "ogen");
  });

  it("skips missing projects without breaking order of found slots", () => {
    const cards = resolveProjectsPageGridBatch1([
      sampleProject({ id: "z", title: "זוקו", projectUrl: "https://zoukoisrael.com/" }),
    ]);

    assert.equal(cards.length, 1);
    assert.equal(cards[0]?.slotId, "zouko");
  });
});
