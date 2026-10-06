import { compareByOrderThenUpdatedAt, deriveSeedKey } from "@/lib/projects/rules";
import {
  findLegacyFeaturedSlotForProject,
  resolveProjectsPageShowcaseForFeatured,
} from "@/lib/projects/projects-page-showcase-resolve";
import type { ProjectsPagePublicProjectDto, PublicProjectDto } from "@/types/project";

export const PROJECTS_PAGE_FEATURED_EVOIR_IMAGE = "/pics/evoir-projects.png";
export const PROJECTS_PAGE_FEATURED_LACE_IMAGE = "/pics/lace-projects.png";

export const PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE = "ÉVOIR";
export const PROJECTS_PAGE_FEATURED_LACE_DISPLAY_TITLE = "Lace Models";

export const PROJECTS_PAGE_FEATURED_CTA_LABEL = "לצפייה באתר";

export const PROJECTS_PAGE_FEATURED_MAX_TAGS = 3;
export const PROJECTS_PAGE_FEATURED_MAX_DESCRIPTION_CHARS = 168;
export const PROJECTS_PAGE_FEATURED_MAX_CARDS = 2;

export type ProjectsPageFeaturedSlot = "evoir" | "lace";

export type ProjectsPageFeaturedCardModel = {
  slot: ProjectsPageFeaturedSlot;
  project: PublicProjectDto;
  displayTitle: string;
  featuredImageSrc: string;
  featuredImageAlt: string;
  showFeaturedBadge: boolean;
  description: string | null;
  tags: string[];
  objectPosition: string;
};

const EVOIR_SEED_KEYS = new Set(["jozeflaperfume.co.il"]);
const LACE_SEED_KEYS = new Set(["lacemodel.com"]);

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

export function isEvoirProject(project: PublicProjectDto): boolean {
  try {
    if (EVOIR_SEED_KEYS.has(deriveSeedKey(project.projectUrl))) {
      return true;
    }
  } catch {
    // invalid URL — fall through to title heuristics
  }

  const title = normalizeTitle(project.title);
  return (
    title.includes("jozer") ||
    title.includes("jozef") ||
    title.includes("perfume") ||
    title.includes("évoir") ||
    title.includes("evoir")
  );
}

export function isLaceProject(project: PublicProjectDto): boolean {
  try {
    if (LACE_SEED_KEYS.has(deriveSeedKey(project.projectUrl))) {
      return true;
    }
  } catch {
    // invalid URL — fall through to title heuristics
  }

  const title = normalizeTitle(project.title);
  return title === "lace" || title.startsWith("lace ");
}

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

function findFeaturedProject(
  projects: PublicProjectDto[],
  matcher: (project: PublicProjectDto) => boolean
): PublicProjectDto | undefined {
  return projects.find(matcher);
}

function legacyFeaturedDisplayTitle(slot: ProjectsPageFeaturedSlot): string {
  return slot === "evoir"
    ? PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE
    : PROJECTS_PAGE_FEATURED_LACE_DISPLAY_TITLE;
}

function buildLegacyFeaturedCardModel(
  slot: ProjectsPageFeaturedSlot,
  project: PublicProjectDto
): ProjectsPageFeaturedCardModel {
  const showcase = resolveProjectsPageShowcaseForFeatured(
    project as ProjectsPagePublicProjectDto,
    slot
  );
  const isEvoir = slot === "evoir";

  return {
    slot,
    project,
    displayTitle: legacyFeaturedDisplayTitle(slot),
    featuredImageSrc:
      showcase?.showcaseImageSrc ??
      (isEvoir ? PROJECTS_PAGE_FEATURED_EVOIR_IMAGE : PROJECTS_PAGE_FEATURED_LACE_IMAGE),
    featuredImageAlt:
      showcase?.showcaseImageAlt ??
      (isEvoir
        ? "תצוגת אתר ÉVOIR: מחשב נייד וטלפון על רקע בושם ופרחים"
        : "תצוגת אתר Lace Models: מחשב נייד וטלפון בסגנון אופנה עריכתי"),
    showFeaturedBadge: isEvoir,
    description: compactFeaturedDescription(project.description),
    tags: featuredTagsForProject(project),
    objectPosition:
      showcase?.objectPosition ?? (isEvoir ? "28% 50%" : "38% 52%"),
  };
}

function hasMongoProjectsPageShowcase(project: ProjectsPagePublicProjectDto): boolean {
  return Boolean(project.projectsPageShowcase?.url?.trim());
}

function buildMongoFeaturedCardModel(
  project: ProjectsPagePublicProjectDto
): ProjectsPageFeaturedCardModel | null {
  const legacySlot = findLegacyFeaturedSlotForProject(project);
  const showcase = resolveProjectsPageShowcaseForFeatured(project, legacySlot);
  if (!showcase) {
    return null;
  }

  const hasMongoShowcase = hasMongoProjectsPageShowcase(project);
  const displayTitle =
    project.projectsPageDisplayTitle?.trim() ||
    (!hasMongoShowcase && legacySlot ? legacyFeaturedDisplayTitle(legacySlot) : undefined) ||
    project.title;

  const showFeaturedBadge = hasMongoShowcase
    ? project.projectsPageShowFeaturedBadge
    : legacySlot === "evoir";

  const slot: ProjectsPageFeaturedSlot = legacySlot ?? "lace";

  return {
    slot,
    project,
    displayTitle,
    featuredImageSrc: showcase.showcaseImageSrc,
    featuredImageAlt: showcase.showcaseImageAlt,
    showFeaturedBadge,
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

function projectEligibleForMongoFeatured(project: ProjectsPagePublicProjectDto): boolean {
  return (
    project.isPublished &&
    project.showOnProjectsPage &&
    project.featuredOnProjectsPage &&
    resolveProjectsPageShowcaseForFeatured(project) !== null
  );
}

/**
 * Resolves Featured cards for `/projects` (Mongo-first, legacy ÉVOIR/Lace fallback during migration).
 */
export function resolveProjectsPageFeaturedCards(
  projects: ProjectsPagePublicProjectDto[] | PublicProjectDto[]
): ProjectsPageFeaturedCardModel[] {
  const pageProjects = projects as ProjectsPagePublicProjectDto[];
  const cards: ProjectsPageFeaturedCardModel[] = [];
  const usedProjectIds = new Set<string>();

  const mongoFeatured = pageProjects
    .filter(projectEligibleForMongoFeatured)
    .sort(compareFeaturedOrder);

  for (const project of mongoFeatured) {
    if (cards.length >= PROJECTS_PAGE_FEATURED_MAX_CARDS) {
      break;
    }

    const card = buildMongoFeaturedCardModel(project);
    if (!card) {
      continue;
    }

    cards.push(card);
    usedProjectIds.add(project.id);
  }

  if (cards.length < PROJECTS_PAGE_FEATURED_MAX_CARDS) {
    const legacySlots: ProjectsPageFeaturedSlot[] = ["evoir", "lace"];

    for (const slot of legacySlots) {
      if (cards.length >= PROJECTS_PAGE_FEATURED_MAX_CARDS) {
        break;
      }

      const matcher = slot === "evoir" ? isEvoirProject : isLaceProject;
      const project = findFeaturedProject(pageProjects, matcher) as
        | ProjectsPagePublicProjectDto
        | undefined;

      if (!project || usedProjectIds.has(project.id)) {
        continue;
      }

      if (project.featuredOnProjectsPage) {
        continue;
      }

      const publishedOnPage =
        (project.isPublished ?? true) && (project.showOnProjectsPage ?? true);

      if (!publishedOnPage) {
        continue;
      }

      cards.push(buildLegacyFeaturedCardModel(slot, project));
      usedProjectIds.add(project.id);
    }
  }

  return cards;
}
