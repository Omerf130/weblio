import type { AdminProjectDto } from "@/types/project";

export const PROJECTS_PAGE_FEATURED_DESIGN_MAX = 2;

export const PROJECTS_PAGE_FEATURED_OVERFLOW_WARNING =
  "שימו לב: בעיצוב הנוכחי של עמוד הפרויקטים מוצגים עד 2 פרויקטים נבחרים. יש יותר מ-2 פרויקטים מסומנים כ'פרויקט נבחר בעמוד הפרויקטים' (מפורסמים ומוצגים בעמוד).";

export function isProjectsPageFeaturedCandidate(project: {
  isPublished: boolean;
  showOnProjectsPage: boolean;
  featuredOnProjectsPage: boolean;
}): boolean {
  return (
    project.isPublished &&
    project.showOnProjectsPage &&
    project.featuredOnProjectsPage
  );
}

export function countProjectsPageFeaturedCandidates(
  projects: AdminProjectDto[]
): number {
  return projects.filter(isProjectsPageFeaturedCandidate).length;
}

export function shouldWarnProjectsPageFeaturedOverflow(count: number): boolean {
  return count > PROJECTS_PAGE_FEATURED_DESIGN_MAX;
}
