import {
  isOpenAIMarketingEnabled,
  resolveOpenAIMarketingEnv,
} from "@/lib/business/ai-marketing/openai-marketing-env";

export type MarketingAdminStatus =
  | { state: "disabled"; message: string }
  | { state: "misconfigured"; message: string }
  | { state: "ready"; message: string };

export function getMarketingAdminStatus(
  source: Record<string, string | undefined> = process.env
): MarketingAdminStatus {
  if (!isOpenAIMarketingEnabled(source)) {
    return {
      state: "disabled",
      message:
        "AI Marketing כבוי. הגדר OPENAI_MARKETING_ENABLED=1 ו-OPENAI_API_KEY בשרת כדי להפעיל.",
    };
  }

  const env = resolveOpenAIMarketingEnv(source);
  if (!env) {
    return {
      state: "misconfigured",
      message:
        "AI Marketing מסומן כמופעל, אך חסר OPENAI_API_KEY תקין. בדוק את הגדרות הסביבה.",
    };
  }

  return {
    state: "ready",
    message: "יצירת טיוטות מופעלת. התוכן נוצר לסקירה ידנית - אין פרסום אוטומטי.",
  };
}
