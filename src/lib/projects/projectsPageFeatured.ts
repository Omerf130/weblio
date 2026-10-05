import { deriveSeedKey } from "@/lib/projects/rules";
import type { PublicProjectDto } from "@/types/project";

export const PROJECTS_PAGE_FEATURED_EVOIR_IMAGE = "/pics/evoir-projects.png";
export const PROJECTS_PAGE_FEATURED_LACE_IMAGE = "/pics/lace-projects.png";

export const PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE = "ÉVOIR";
export const PROJECTS_PAGE_FEATURED_LACE_DISPLAY_TITLE = "Lace Models";

export const PROJECTS_PAGE_FEATURED_CTA_LABEL = "לצפייה באתר";

export const PROJECTS_PAGE_FEATURED_MAX_TAGS = 3;
export const PROJECTS_PAGE_FEATURED_MAX_DESCRIPTION_CHARS = 168;

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

function isEvoirProject(project: PublicProjectDto): boolean {
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

function isLaceProject(project: PublicProjectDto): boolean {
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

function buildCardModel(
  slot: ProjectsPageFeaturedSlot,
  project: PublicProjectDto
): ProjectsPageFeaturedCardModel {
  const isEvoir = slot === "evoir";

  return {
    slot,
    project,
    displayTitle: isEvoir
      ? PROJECTS_PAGE_FEATURED_EVOIR_DISPLAY_TITLE
      : PROJECTS_PAGE_FEATURED_LACE_DISPLAY_TITLE,
    featuredImageSrc: isEvoir
      ? PROJECTS_PAGE_FEATURED_EVOIR_IMAGE
      : PROJECTS_PAGE_FEATURED_LACE_IMAGE,
    featuredImageAlt: isEvoir
      ? "תצוגת אתר ÉVOIR: מחשב נייד וטלפון על רקע בושם ופרחים"
      : "תצוגת אתר Lace Models: מחשב נייד וטלפון בסגנון אופנה עריכתי",
    showFeaturedBadge: isEvoir,
    description: compactFeaturedDescription(project.description),
    tags: featuredTagsForProject(project),
    objectPosition: isEvoir ? "28% 50%" : "38% 52%",
  };
}

/**
 * Resolves the two desktop Featured cards for `/projects` (ÉVOIR + Lace Models).
 * Order is fixed: ÉVOIR first, Lace second.
 */
export function resolveProjectsPageFeaturedCards(
  projects: PublicProjectDto[]
): ProjectsPageFeaturedCardModel[] {
  const evoir = findFeaturedProject(projects, isEvoirProject);
  const lace = findFeaturedProject(projects, isLaceProject);

  const cards: ProjectsPageFeaturedCardModel[] = [];
  if (evoir) {
    cards.push(buildCardModel("evoir", evoir));
  }
  if (lace) {
    cards.push(buildCardModel("lace", lace));
  }

  return cards;
}
