import { isThinProjectMarketingContext } from "@/lib/business/ai-marketing/project-context-hints";
import { mapAdminProjectToMarketingContext } from "@/lib/business/ai-marketing/project-marketing-context";
import type { AdminProjectDto } from "@/types/project";

export type AiMarketingProjectPickerOption = {
  id: string;
  label: string;
  detail: string;
  isPublished: boolean;
  technologies: string[];
  thinContext: boolean;
};

export function formatProjectPickerLabel(project: AdminProjectDto): string {
  const title = project.title.trim();
  const subtitle = project.subtitle.trim();
  if (subtitle) {
    return `${title} - ${subtitle}`;
  }
  return title;
}

export function formatProjectPickerDetail(project: AdminProjectDto): string {
  const parts: string[] = [];
  if (!project.isPublished) {
    parts.push("לא מפורסם");
  } else if (project.showOnHome) {
    parts.push("מוצג בדף הבית");
  } else if (project.showOnProjectsPage) {
    parts.push("בעמוד פרויקטים");
  }
  if (project.technologies.length > 0) {
    parts.push(project.technologies.slice(0, 3).join(", "));
  }
  return parts.join(" · ") || "פרויקט במערכת";
}

export function mapAdminProjectsToPickerOptions(
  projects: AdminProjectDto[]
): AiMarketingProjectPickerOption[] {
  return projects.map((project) => ({
    id: project.id,
    label: formatProjectPickerLabel(project),
    detail: formatProjectPickerDetail(project),
    isPublished: project.isPublished,
    technologies: [...project.technologies],
    thinContext: isThinProjectMarketingContext(
      mapAdminProjectToMarketingContext(project)
    ),
  }));
}

export function findPickerOptionById(
  options: AiMarketingProjectPickerOption[],
  projectId: string
): AiMarketingProjectPickerOption | undefined {
  return options.find((option) => option.id === projectId);
}
