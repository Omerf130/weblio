import { compareByOrderThenUpdatedAt } from "@/lib/projects/rules";
import {
  hasPublicProjectsPageShowcaseUrl,
  resolvePublicProjectsPageShowcase,
} from "@/lib/projects/projects-page-public-showcase";
import type { ProjectsPagePublicProjectDto, PublicProjectDto } from "@/types/project";

export const PROJECTS_PAGE_FEATURED_CTA_LABEL = "לצפייה באתר";

export const PROJECTS_PAGE_FEATURED_MAX_TAGS = 3;
export const PROJECTS_PAGE_FEATURED_MAX_DESCRIPTION_CHARS = 168;
export const PROJECTS_PAGE_FEATURED_MAX_CARDS = 2;

/** Layout variant keys for existing Featured SCSS (`data-slot`); assigned by render order, not project identity. */
export type ProjectsPageFeaturedLayoutSlot = "evoir" | "lace";

const FEATURED_LAYOUT_VARIANTS: ProjectsPageFeaturedLayoutSlot[] = ["evoir", "lace"];

export type ProjectsPageFeaturedCardModel = {
  slot: ProjectsPageFeaturedLayoutSlot;
  project: PublicProjectDto;
  displayTitle: string;
  featuredImageSrc: string;
  featuredImageAlt: string;
  showFeaturedBadge: boolean;
  description: string | null;
  tags: string[];
  objectPosition: string;
};

export function compactFeaturedDescription(
  description: string | undefined,
  maxChars: number = PROJECTS_PAGE_FEATURED_MAX_DESCRIPTION_CHARS
): string | null {
  const source = description?.trim();
  if (!source) {
    return null;
  }

  if (source.length <= maxChars) {
    return source;
  }

  const truncated = source.slice(0, maxChars - 1).trimEnd();
  const lastSpace = truncated.lastIndexOf(" ");
  const safe =
    lastSpace > maxChars * 0.55 ? truncated.slice(0, lastSpace).trimEnd() : truncated;

  return `${safe}…`;
}

export function featuredTagsForProject(
  project: PublicProjectDto,
  maxTags: number = PROJECTS_PAGE_FEATURED_MAX_TAGS
): string[] {
  return (project.technologies ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, maxTags);
}

function featuredDisplayTitle(project: ProjectsPagePublicProjectDto): string {
  return project.projectsPageDisplayTitle?.trim() || project.title;
}

function buildFeaturedCardModel(
  project: ProjectsPagePublicProjectDto,
  layoutSlot: ProjectsPageFeaturedLayoutSlot
): ProjectsPageFeaturedCardModel | null {
  const showcase = resolvePublicProjectsPageShowcase(project);
  if (!showcase) {
    return null;
  }

  return {
    slot: layoutSlot,
    project,
    displayTitle: featuredDisplayTitle(project),
    featuredImageSrc: showcase.showcaseImageSrc,
    featuredImageAlt: showcase.showcaseImageAlt,
    showFeaturedBadge: project.projectsPageShowFeaturedBadge ?? false,
    description: compactFeaturedDescription(project.description),
    tags: featuredTagsForProject(project),
    objectPosition: showcase.objectPosition,
  };
}

function compareFeaturedOrder(
  a: ProjectsPagePublicProjectDto,
  b: ProjectsPagePublicProjectDto
): number {
  const orderA = a.projectsPageFeaturedOrder ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.projectsPageFeaturedOrder ?? Number.MAX_SAFE_INTEGER;

  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return compareByOrderThenUpdatedAt("projectsPageOrder")(a, b);
}

function isFeaturedEligible(project: ProjectsPagePublicProjectDto): boolean {
  return (
    project.isPublished &&
    project.showOnProjectsPage &&
    project.featuredOnProjectsPage &&
    hasPublicProjectsPageShowcaseUrl(project)
  );
}

/** Featured cards for `/projects` from Mongo/Admin fields only (max 2). */
export function resolveProjectsPageFeaturedCards(
  projects: ProjectsPagePublicProjectDto[]
): ProjectsPageFeaturedCardModel[] {
  const eligible = projects.filter(isFeaturedEligible).sort(compareFeaturedOrder);

  const cards: ProjectsPageFeaturedCardModel[] = [];

  for (const project of eligible) {
    if (cards.length >= PROJECTS_PAGE_FEATURED_MAX_CARDS) {
      break;
    }

    const layoutSlot =
      FEATURED_LAYOUT_VARIANTS[cards.length] ?? FEATURED_LAYOUT_VARIANTS[1]!;
    const card = buildFeaturedCardModel(project, layoutSlot);
    if (card) {
      cards.push(card);
    }
  }

  return cards;
}
