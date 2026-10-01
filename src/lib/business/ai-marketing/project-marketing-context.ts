import type { AdminProjectDto } from "@/types/project";

export type ProjectMarketingContext = {
  title: string;
  subtitle: string;
  description?: string;
  homeTitle?: string;
  homeSubtitle?: string;
  technologies: string[];
  projectUrl: string;
  ctaLabel: string;
  visibility: {
    isPublished: boolean;
    showOnHome: boolean;
    showOnProjectsPage: boolean;
  };
};

export function mapAdminProjectToMarketingContext(
  project: AdminProjectDto
): ProjectMarketingContext {
  return {
    title: project.title,
    subtitle: project.subtitle,
    description: project.description,
    homeTitle: project.homeTitle,
    homeSubtitle: project.homeSubtitle,
    technologies: [...project.technologies],
    projectUrl: project.projectUrl,
    ctaLabel: project.ctaLabel,
    visibility: {
      isPublished: project.isPublished,
      showOnHome: project.showOnHome,
      showOnProjectsPage: project.showOnProjectsPage,
    },
  };
}

export function formatProjectMarketingContextForPrompt(
  context: ProjectMarketingContext
): string {
  return JSON.stringify(context, null, 2);
}
