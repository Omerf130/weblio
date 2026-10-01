import type { ProjectMarketingContext } from "@/lib/business/ai-marketing/project-marketing-context";

export function isThinProjectMarketingContext(
  context: ProjectMarketingContext
): boolean {
  const hasDescription = Boolean(context.description?.trim());
  const hasSubtitle = Boolean(context.subtitle.trim());
  const hasTechnologies = context.technologies.length > 0;
  return !hasDescription && !hasSubtitle && !hasTechnologies;
}

export const THIN_PROJECT_CONTEXT_NOTICE =
  "יש מעט מידע על הפרויקט. הטיוטה תתבסס רק על המידע הקיים - מומלץ לבדוק שלא נוספו פרטים שלא הוגדרו.";
