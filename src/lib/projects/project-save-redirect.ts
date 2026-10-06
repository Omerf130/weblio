import { getAdminProjects } from "@/lib/data/projects";
import {
  countProjectsPageFeaturedCandidates,
  PROJECTS_PAGE_FEATURED_OVERFLOW_WARNING,
  shouldWarnProjectsPageFeaturedOverflow,
} from "@/lib/projects/projects-page-featured-admin";

export function buildAdminProjectsRedirectPath(
  featuredCandidateCount: number
): string {
  if (!shouldWarnProjectsPageFeaturedOverflow(featuredCandidateCount)) {
    return "/admin/projects";
  }

  return `/admin/projects?warning=${encodeURIComponent(PROJECTS_PAGE_FEATURED_OVERFLOW_WARNING)}`;
}

export async function getAdminProjectsRedirectPathAfterSave(): Promise<string> {
  const projects = await getAdminProjects();
  return buildAdminProjectsRedirectPath(countProjectsPageFeaturedCandidates(projects));
}
