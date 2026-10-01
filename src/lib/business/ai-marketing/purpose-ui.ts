import type { HubMarketingPurpose, MarketingPurpose } from "@/lib/business/ai-marketing/types";
import { HUB_MARKETING_PURPOSES } from "@/lib/business/ai-marketing/types";
import type { MarketingGenerationInput } from "@/lib/business/ai-marketing/validations";

export type MarketingPurposeCard = {
  purpose: HubMarketingPurpose;
  label: string;
  description: string;
};

export const MARKETING_HUB_PURPOSE_CARDS: MarketingPurposeCard[] = [
  {
    purpose: "websiteProjectContent",
    label: "תוכן לאתר",
    description: "כותרות ותיאורים לפרויקט בדף הבית ובתצוגת הפרויקטים",
  },
  {
    purpose: "socialPost",
    label: "פוסט לרשתות",
    description: "טיוטה ל-Instagram / Facebook מפרויקט קיים",
  },
  {
    purpose: "linkedinPost",
    label: "פוסט LinkedIn",
    description: "טיוטה מקצועית-אישית מפרויקט קיים",
  },
  {
    purpose: "story",
    label: "סטורי",
    description: "טקסט קצר לסטורי מפרויקט קיים",
  },
];

export function isHubMarketingPurpose(
  purpose: MarketingPurpose
): purpose is HubMarketingPurpose {
  return (HUB_MARKETING_PURPOSES as readonly string[]).includes(purpose);
}

export function buildProjectPurposeInput(params: {
  purpose: HubMarketingPurpose;
  projectId: string;
  userInstruction?: string;
}): MarketingGenerationInput {
  const instruction = params.userInstruction?.trim();
  const base = {
    projectId: params.projectId,
    language: "he" as const,
    userInstruction: instruction || undefined,
  };

  switch (params.purpose) {
    case "websiteProjectContent":
      return {
        purpose: "websiteProjectContent",
        source: "project",
        ...base,
      };
    case "socialPost":
      return { purpose: "socialPost", source: "project", ...base };
    case "linkedinPost":
      return { purpose: "linkedinPost", source: "project", ...base };
    case "story":
      return { purpose: "story", source: "project", ...base };
    default: {
      const _exhaustive: never = params.purpose;
      return _exhaustive;
    }
  }
}
