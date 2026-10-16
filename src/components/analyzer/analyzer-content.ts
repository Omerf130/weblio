export type AnalyzerMetricId = "performance" | "seo" | "accessibility" | "ux";

export type AnalyzerMetricAccent = "green" | "amber" | "blue" | "purple";

export type AnalyzerMetric = {
  id: AnalyzerMetricId;
  label: string;
  score: number;
  accent: AnalyzerMetricAccent;
};

/** Static demonstration scores. Not the result of a real analysis. */
export const ANALYZER_METRICS: readonly AnalyzerMetric[] = [
  { id: "performance", label: "ביצועים", score: 92, accent: "green" },
  { id: "seo", label: "SEO", score: 88, accent: "amber" },
  { id: "accessibility", label: "נגישות", score: 85, accent: "blue" },
  { id: "ux", label: "חוויית משתמש", score: 90, accent: "purple" },
];

export const ANALYZER_HIGHLIGHTS = [
  { id: "no-commitment", label: "ללא התחייבות" },
  { id: "clear-report", label: "דוח ברור ופשוט" },
  { id: "recommendations", label: "המלצות לשיפור" },
  { id: "four-areas", label: "4 תחומי בדיקה" },
] as const;

export const ANALYZER_CONTENT = {
  eyebrow: "WEBLIO WEBSITE ANALYZER",
  headline: "בדיקת אתר בחינם",
  subheadline: "גלו איך האתר שלכם באמת מתפקד",
  description:
    "גלו את החוזקות והחולשות של האתר שלכם בתחומי ביצועים, SEO, נגישות וחוויית משתמש, וקבלו כיוון ברור למה כדאי לשפר.",
  ctaHref: "/website-check",
  ctaLabel: "גלו מה האתר שלכם מפספס",
} as const;
