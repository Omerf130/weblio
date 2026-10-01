import type { HubMarketingPurpose, MarketingPurpose } from "@/lib/business/ai-marketing/types";
import { HUB_MARKETING_PURPOSES } from "@/lib/business/ai-marketing/types";

export type MarketingPurposeCard = {
  purpose: HubMarketingPurpose;
  label: string;
  description: string;
};

export const MARKETING_HUB_PURPOSE_CARDS: MarketingPurposeCard[] = [
  {
    purpose: "websiteProjectContent",
    label: "תוכן לאתר",
    description: "כותרות, תיאור וטכנולוגיות לפרויקט - עם החלה לפרויקט",
  },
  {
    purpose: "socialPost",
    label: "פוסט לרשתות",
    description: "טיוטה ל-Instagram / Facebook מפרויקט או מנושא חופשי",
  },
  {
    purpose: "linkedinPost",
    label: "פוסט LinkedIn",
    description: "פוסט מקצועי-אישי מפרויקט או מנושא/דעה שתגדיר",
  },
  {
    purpose: "story",
    label: "סטורי",
    description: "טקסט קצר לסטורי - מפרויקט או מנושא חופשי",
  },
  {
    purpose: "contentIdeas",
    label: "רעיונות לתוכן",
    description: "רשימת רעיונות ל-Weblio או סביב פרויקט",
  },
  {
    purpose: "rewrite",
    label: "שיפור טקסט",
    description: "שכתוב טקסט קיים - קצר יותר, ברור יותר, CTA ועוד",
  },
  {
    purpose: "freeform",
    label: "כתיבה חופשית",
    description: "טיוטה לפי הנחיה שלך - גמיש לכל סוג תוכן",
  },
];

export function isHubMarketingPurpose(
  purpose: MarketingPurpose
): purpose is HubMarketingPurpose {
  return (HUB_MARKETING_PURPOSES as readonly string[]).includes(purpose);
}

/** @deprecated Use marketing-input-builders.buildProjectContentPurposeInput */
export { buildProjectContentPurposeInput as buildProjectPurposeInput } from "@/lib/business/ai-marketing/marketing-input-builders";
