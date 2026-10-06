import { sanitizeProjectsPageShowcaseObjectPosition } from "@/lib/projects/projects-page-showcase-object-position";
import type { ProjectImageRef } from "@/lib/storage/project-images";
import { resolveProjectImageAlt, type ProjectFieldsInput } from "@/lib/validations/project";

export type ProjectShowcaseImageDocument = {
  url: string;
  alt: string;
  storageKey?: string;
};

export function mapProjectFieldsToDocument(
  input: ProjectFieldsInput,
  image: ProjectImageRef | null | undefined,
  options?: {
    projectsPageShowcase?: ProjectShowcaseImageDocument | null;
  }
) {
  const displayTitle = input.projectsPageDisplayTitle?.trim();
  const objectPosition = sanitizeProjectsPageShowcaseObjectPosition(
    input.projectsPageShowcaseObjectPosition
  );

  const payload: Record<string, unknown> = {
    title: input.title,
    subtitle: input.subtitle,
    description: input.description,
    homeTitle: input.homeTitle,
    homeSubtitle: input.homeSubtitle,
    projectUrl: input.projectUrl,
    ctaLabel: input.ctaLabel,
    isPublished: input.isPublished,
    showOnHome: input.showOnHome,
    showOnProjectsPage: input.showOnProjectsPage,
    homeOrder: input.homeOrder,
    projectsPageOrder: input.projectsPageOrder,
    technologies: input.technologies,
    featuredOnProjectsPage: input.featuredOnProjectsPage,
    projectsPageShowFeaturedBadge: input.projectsPageShowFeaturedBadge,
  };

  if (input.projectsPageFeaturedOrder !== undefined) {
    payload.projectsPageFeaturedOrder = input.projectsPageFeaturedOrder;
  } else {
    payload.projectsPageFeaturedOrder = undefined;
  }

  if (displayTitle) {
    payload.projectsPageDisplayTitle = displayTitle;
  } else {
    payload.projectsPageDisplayTitle = undefined;
  }

  if (objectPosition) {
    payload.projectsPageShowcaseObjectPosition = objectPosition;
  } else {
    payload.projectsPageShowcaseObjectPosition = undefined;
  }

  if (options && "projectsPageShowcase" in options) {
    payload.projectsPageShowcase = options.projectsPageShowcase;
  }

  const imageUrl = image?.url?.trim();
  if (imageUrl) {
    payload.image = {
      url: imageUrl,
      alt: resolveProjectImageAlt(input.imageAlt, input.title),
      ...(image?.storageKey ? { storageKey: image.storageKey } : {}),
    };
  } else {
    payload.image = undefined;
  }

  return payload;
}
