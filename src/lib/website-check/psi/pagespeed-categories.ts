export const PAGESPEED_MOBILE_CATEGORIES = [
  "performance",
  "seo",
  "accessibility",
  "best-practices",
] as const;

export type PageSpeedLighthouseCategoryId = (typeof PAGESPEED_MOBILE_CATEGORIES)[number];

export const PAGESPEED_API_BASE = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
