import type { PublicProjectDto } from "@/types/project";

export const HOME_PROJECTS_MAX = 4;
export const HOME_MAX_FOUR_ERROR = "ניתן להציג עד 4 פרויקטים בדף הבית.";

export type HomeFeaturedCandidate = {
  isPublished: boolean;
  showOnHome: boolean;
};

export function wouldExceedHomeFeaturedLimit(
  currentCount: number,
  candidate: HomeFeaturedCandidate
): boolean {
  return candidate.isPublished && candidate.showOnHome && currentCount >= HOME_PROJECTS_MAX;
}

export function countHomeFeatured(projects: HomeFeaturedCandidate[]): number {
  return projects.filter((project) => project.isPublished && project.showOnHome).length;
}

export type SortableProject = {
  homeOrder?: number;
  projectsPageOrder?: number;
  updatedAt?: Date | string;
  _id?: string;
  id?: string;
};

export function compareByOrderThenUpdatedAt(
  orderKey: "homeOrder" | "projectsPageOrder"
): (a: SortableProject, b: SortableProject) => number {
  return (a, b) => {
    const orderA = a[orderKey] ?? 0;
    const orderB = b[orderKey] ?? 0;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const updatedA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const updatedB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

    if (updatedA !== updatedB) {
      return updatedA - updatedB;
    }

    const idA = a.id ?? a._id ?? "";
    const idB = b.id ?? b._id ?? "";
    return idA.localeCompare(idB);
  };
}

export function filterPublishedHome(projects: HomeFeaturedCandidate[]): HomeFeaturedCandidate[] {
  return projects.filter((project) => project.isPublished && project.showOnHome);
}

export function filterPublishedProjectsPage(
  projects: Array<HomeFeaturedCandidate & { showOnProjectsPage: boolean }>
): Array<HomeFeaturedCandidate & { showOnProjectsPage: boolean }> {
  return projects.filter(
    (project) => project.isPublished && project.showOnProjectsPage
  );
}

export type HomeProjectSource = {
  _id: string;
  title: string;
  subtitle: string;
  homeTitle?: string;
  homeSubtitle?: string;
  image: { url: string; alt: string };
  projectUrl: string;
  ctaLabel: string;
};

export function mapToPublicProjectDto(source: HomeProjectSource): PublicProjectDto {
  return {
    id: source._id,
    title: source.title,
    subtitle: source.subtitle,
    imageUrl: source.image.url,
    imageAlt: source.image.alt,
    projectUrl: source.projectUrl,
    ctaLabel: source.ctaLabel,
  };
}

export function mapToHomePublicProjectDto(source: HomeProjectSource): PublicProjectDto {
  return {
    id: source._id,
    title: source.homeTitle?.trim() || source.title,
    subtitle: source.homeSubtitle?.trim() || source.subtitle,
    imageUrl: source.image.url,
    imageAlt: source.image.alt,
    projectUrl: source.projectUrl,
    ctaLabel: source.ctaLabel,
  };
}

export function hasDuplicateOrderValues(
  projects: Array<{ homeOrder?: number; projectsPageOrder?: number }>,
  key: "homeOrder" | "projectsPageOrder"
): boolean {
  const values = projects.map((project) => project[key] ?? 0);
  return new Set(values).size !== values.length;
}

export function deriveSeedKey(projectUrl: string): string {
  const url = new URL(projectUrl);
  const host = url.hostname.replace(/^www\./, "");
  const path = url.pathname.replace(/\/$/, "");
  return path && path !== "/" ? `${host}${path}` : host;
}
