import { compareByOrderThenUpdatedAt } from "@/lib/projects/rules";
import {
  PROJECTS_PAGE_FEATURED_CTA_LABEL,
  compactFeaturedDescription,
  featuredTagsForProject,
} from "@/lib/projects/projectsPageFeatured";
import {
  hasPublicProjectsPageShowcaseUrl,
  resolvePublicProjectsPageShowcase,
} from "@/lib/projects/projects-page-public-showcase";
import type { ProjectsPagePublicProjectDto } from "@/types/project";

export const PROJECTS_PAGE_GRID_MAX_DESCRIPTION_CHARS = 140;

export type ProjectsPageGridCardModel = {
  slotId: string;
  project: ProjectsPagePublicProjectDto;
  displayTitle: string;
  showcaseImageSrc: string;
  showcaseImageAlt: string;
  description: string | null;
  tags: string[];
  objectPosition: string;
  ctaLabel: string;
};

function gridDisplayTitle(project: ProjectsPagePublicProjectDto): string {
  const override = project.projectsPageDisplayTitle?.trim();
  return override || project.title;
}

function buildGridCard(project: ProjectsPagePublicProjectDto): ProjectsPageGridCardModel | null {
  const showcase = resolvePublicProjectsPageShowcase(project);
  if (!showcase) {
    return null;
  }

  return {
    slotId: project.id,
    project,
    displayTitle: gridDisplayTitle(project),
    showcaseImageSrc: showcase.showcaseImageSrc,
    showcaseImageAlt: showcase.showcaseImageAlt,
    description: compactFeaturedDescription(
      project.description,
      PROJECTS_PAGE_GRID_MAX_DESCRIPTION_CHARS
    ),
    tags: featuredTagsForProject(project),
    objectPosition: showcase.objectPosition,
    ctaLabel: PROJECTS_PAGE_FEATURED_CTA_LABEL,
  };
}

/** Grid cards for `/projects` from Mongo/Admin fields only. */
export function resolveProjectsPageGridCards(
  projects: ProjectsPagePublicProjectDto[]
): ProjectsPageGridCardModel[] {
  const eligible = projects.filter(
    (project) =>
      project.isPublished &&
      project.showOnProjectsPage &&
      !project.featuredOnProjectsPage &&
      hasPublicProjectsPageShowcaseUrl(project)
  );

  eligible.sort(
    compareByOrderThenUpdatedAt("projectsPageOrder") as (
      a: ProjectsPagePublicProjectDto,
      b: ProjectsPagePublicProjectDto
    ) => number
  );

  const cards: ProjectsPageGridCardModel[] = [];

  for (const project of eligible) {
    const card = buildGridCard(project);
    if (card) {
      cards.push(card);
    }
  }

  return cards;
}
