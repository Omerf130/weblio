import { sanitizeProjectsPageShowcaseObjectPosition } from "@/lib/projects/projects-page-showcase-object-position";
import type { ProjectsPagePublicProjectDto } from "@/types/project";

export const DEFAULT_PROJECTS_PAGE_SHOWCASE_OBJECT_POSITION = "50% 50%";

export type ResolvedPublicProjectsPageShowcase = {
  showcaseImageSrc: string;
  showcaseImageAlt: string;
  objectPosition: string;
};

export function hasPublicProjectsPageShowcaseUrl(
  project: ProjectsPagePublicProjectDto
): boolean {
  return Boolean(project.projectsPageShowcase?.url?.trim());
}

export function resolvePublicProjectsPageShowcase(
  project: ProjectsPagePublicProjectDto
): ResolvedPublicProjectsPageShowcase | null {
  const showcaseImageSrc = project.projectsPageShowcase?.url?.trim();
  if (!showcaseImageSrc) {
    return null;
  }

  const objectPosition =
    sanitizeProjectsPageShowcaseObjectPosition(
      project.projectsPageShowcaseObjectPosition
    ) ?? DEFAULT_PROJECTS_PAGE_SHOWCASE_OBJECT_POSITION;

  const showcaseImageAlt =
    project.projectsPageShowcase?.alt?.trim() ||
    project.imageAlt?.trim() ||
    project.title.trim();

  return {
    showcaseImageSrc,
    showcaseImageAlt,
    objectPosition,
  };
}
