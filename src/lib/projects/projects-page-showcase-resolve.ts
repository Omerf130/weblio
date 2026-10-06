import {
  BATCH1_SLOTS,
  type Batch1SlotConfig,
  projectMatchesLegacyGridBatch1Slot,
} from "@/lib/projects/projectsPageGridBatch1";
import {
  isEvoirProject,
  isLaceProject,
  PROJECTS_PAGE_FEATURED_EVOIR_IMAGE,
  PROJECTS_PAGE_FEATURED_LACE_IMAGE,
  type ProjectsPageFeaturedSlot,
} from "@/lib/projects/projectsPageFeatured";
import { sanitizeProjectsPageShowcaseObjectPosition } from "@/lib/projects/projects-page-showcase-object-position";
import type { ProjectsPagePublicProjectDto } from "@/types/project";

export type ResolvedProjectsPageShowcase = {
  showcaseImageSrc: string;
  showcaseImageAlt: string;
  objectPosition: string;
  source: "mongo" | "legacy-grid" | "legacy-featured";
};

export function findLegacyGridSlotForProject(
  project: ProjectsPagePublicProjectDto
): Batch1SlotConfig | undefined {
  return BATCH1_SLOTS.find((slot) => projectMatchesLegacyGridBatch1Slot(project, slot));
}

export function findLegacyFeaturedSlotForProject(
  project: ProjectsPagePublicProjectDto
): ProjectsPageFeaturedSlot | undefined {
  if (isEvoirProject(project)) {
    return "evoir";
  }
  if (isLaceProject(project)) {
    return "lace";
  }
  return undefined;
}

function legacyFeaturedShowcaseImageSrc(slot: ProjectsPageFeaturedSlot): string {
  return slot === "evoir"
    ? PROJECTS_PAGE_FEATURED_EVOIR_IMAGE
    : PROJECTS_PAGE_FEATURED_LACE_IMAGE;
}

function legacyFeaturedDefaultObjectPosition(slot: ProjectsPageFeaturedSlot): string {
  return slot === "evoir" ? "28% 50%" : "38% 52%";
}

export function resolveProjectsPageShowcaseForGrid(
  project: ProjectsPagePublicProjectDto
): ResolvedProjectsPageShowcase | null {
  const mongoUrl = project.projectsPageShowcase?.url?.trim();
  if (mongoUrl) {
    const objectPosition =
      sanitizeProjectsPageShowcaseObjectPosition(
        project.projectsPageShowcaseObjectPosition
      ) ?? "50% 50%";

    return {
      showcaseImageSrc: mongoUrl,
      showcaseImageAlt:
        project.projectsPageShowcase?.alt?.trim() ||
        project.imageAlt ||
        project.title,
      objectPosition,
      source: "mongo",
    };
  }

  const slot = findLegacyGridSlotForProject(project);
  if (!slot) {
    return null;
  }

  return {
    showcaseImageSrc: slot.showcaseImageSrc,
    showcaseImageAlt: project.imageAlt || project.title,
    objectPosition: slot.objectPosition,
    source: "legacy-grid",
  };
}

export function resolveProjectsPageShowcaseForFeatured(
  project: ProjectsPagePublicProjectDto,
  legacySlot?: ProjectsPageFeaturedSlot
): ResolvedProjectsPageShowcase | null {
  const slot = legacySlot ?? findLegacyFeaturedSlotForProject(project);
  const mongoUrl = project.projectsPageShowcase?.url?.trim();

  if (mongoUrl) {
    const objectPosition =
      sanitizeProjectsPageShowcaseObjectPosition(
        project.projectsPageShowcaseObjectPosition
      ) ??
      (slot ? legacyFeaturedDefaultObjectPosition(slot) : "50% 50%");

    return {
      showcaseImageSrc: mongoUrl,
      showcaseImageAlt:
        project.projectsPageShowcase?.alt?.trim() ||
        project.imageAlt ||
        project.title,
      objectPosition,
      source: "mongo",
    };
  }

  if (slot) {
    return {
      showcaseImageSrc: legacyFeaturedShowcaseImageSrc(slot),
      showcaseImageAlt:
        slot === "evoir"
          ? "תצוגת אתר ÉVOIR: מחשב נייד וטלפון על רקע בושם ופרחים"
          : "תצוגת אתר Lace Models: מחשב נייד וטלפון בסגנון אופנה עריכתי",
      objectPosition: legacyFeaturedDefaultObjectPosition(slot),
      source: "legacy-featured",
    };
  }

  return null;
}

export function projectHasGridShowcase(project: ProjectsPagePublicProjectDto): boolean {
  return resolveProjectsPageShowcaseForGrid(project) !== null;
}

export function projectHasFeaturedShowcase(
  project: ProjectsPagePublicProjectDto
): boolean {
  return resolveProjectsPageShowcaseForFeatured(project) !== null;
}
