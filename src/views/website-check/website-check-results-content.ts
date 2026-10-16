import type { AnalyzerMetricAccent, AnalyzerMetricId } from "@/components/analyzer/analyzer-content";

export const WEBSITE_CHECK_DEMO_OVERALL_SCORE = 82;

export type WebsiteCheckResultsMetricView = {
  id: AnalyzerMetricId;
  label: string;
  score: number | null;
  accent: AnalyzerMetricAccent;
  description: string;
  statusLabel: string;
  unavailable?: boolean;
};

/** @deprecated Use WebsiteCheckResultsMetricView */
export type WebsiteCheckDemoMetric = WebsiteCheckResultsMetricView;

/** Static demo metric cards - not from a real scan. */
export const WEBSITE_CHECK_DEMO_METRICS: readonly WebsiteCheckResultsMetricView[] = [
  {
    id: "performance",
    label: "מהירות וביצועים",
    score: 92,
    accent: "green",
    description: "זמני טעינה ומשאבים - תוכן הדגמה בלבד.",
    statusLabel: "חזק (דוגמה)",
  },
  {
    id: "seo",
    label: "התאמה למנועי חיפוש",
    score: 88,
    accent: "amber",
    description: "מבנה, מטא וקישורים - תוכן הדגמה בלבד.",
    statusLabel: "טוב (דוגמה)",
  },
  {
    id: "accessibility",
    label: "נגישות בסיסית",
    score: 85,
    accent: "blue",
    description: "ניגודיות, תוויות וטפסים - תוכן הדגמה בלבד.",
    statusLabel: "לשיפור (דוגמה)",
  },
  {
    id: "ux",
    label: "תקינות האתר",
    score: 86,
    accent: "purple",
    description: "שיטות עבודה טכניות נבחרות (Lighthouse) - תוכן הדגמה בלבד.",
    statusLabel: "טוב (דוגמה)",
  },
] as const;

export type WebsiteCheckFindingStatus = "positive" | "warning" | "neutral" | "failed";

export type WebsiteCheckFindingCategory =
  | "performance"
  | "seo"
  | "accessibility"
  | "best-practices"
  | "other";

export type WebsiteCheckAuditKind = "failure" | "opportunity" | "diagnostic" | "passed";

export type WebsiteCheckFinding = {
  id: string;
  status: WebsiteCheckFindingStatus;
  title: string;
  summary: string;
  details: string;
  category?: WebsiteCheckFindingCategory;
  auditKind?: WebsiteCheckAuditKind;
  documentationUrl?: string | null;
  auditId?: string;
  displayValue?: string | null;
  score?: number | null;
};

export type WebsiteCheckRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  summary: string;
  details: string;
};

/** Static illustrative content - not derived from the submitted URL. */
export const WEBSITE_CHECK_DEMO_FINDINGS: readonly WebsiteCheckFinding[] = [
  {
    id: "perf-resources",
    status: "warning",
    title: "אופטימיזציה של משאבים (דוגמה)",
    summary: "בדוח הדגמה מוצג פוטנציאל לשיפור בטעינת תמונות וקבצי CSS.",
    details:
      "זוהה תרחיש הדגמה בלבד: דחיסת תמונות, lazy loading והפחתת משאבים חוסמים יכולים לשפר ביצועים. לא נותח האתר שהוזן.",
  },
  {
    id: "seo-structure",
    status: "positive",
    title: "מבנה כותרות (דוגמה)",
    summary: "במסגרת ההדגמה, היררכיית H1-H3 נראית מאוזנת בדוח לדוגמה.",
    details:
      "הממצא מבוסס על תבנית תוכן סטטית להמחשה. בדיקה אמיתית תבחן את האתר שלכם בפועל כשהמנוע יהיה פעיל.",
  },
  {
    id: "a11y-contrast",
    status: "warning",
    title: "ניגודיות צבעים (דוגמה)",
    summary: "בדוח ההדגמה מודגשים אזורים שבהם כדאי לבדוק ניגודיות טקסט/רקע.",
    details:
      "המלצה כללית להדגמה: וודאו יחס ניגודיות של לפחות 4.5:1 לטקסט גוף. לא בוצעה בדיקת נגישות אמיתית על הכתובת שהוזנה.",
  },
  {
    id: "ux-mobile",
    status: "neutral",
    title: "התאמה למובייל (דוגמה)",
    summary: "פריסת הדגמה מציגה בדיקת breakpoints ומרווחי מגע.",
    details:
      "תוכן זה אינו מבוסס על מדידה של האתר שלכם. בשלב הבא נחבר ניתוח חי של viewport וזרימת משתמש.",
  },
] as const;

export const WEBSITE_CHECK_DEMO_RECOMMENDATIONS: readonly WebsiteCheckRecommendation[] = [
  {
    id: "rec-perf",
    priority: "high",
    title: "ייעול זמני טעינה (הדגמה)",
    summary: "התמקדו במשאבים above-the-fold ובדחיסת מדיה - כיוון כללי לדוגמה.",
    details:
      "המלצה להמחשה בלבד. כשמנוע הניתוח יהיה פעיל, נציג כאן תובנות מבוססות מדידה. כיום אין ניתוח של האתר שהוזן.",
  },
  {
    id: "rec-seo",
    priority: "medium",
    title: "חיזוק SEO טכני (הדגמה)",
    summary: "בדקו meta descriptions, canonical ו-sitemap - רשימת פעולות לדוגמה.",
    details:
      "פריט הדגמה סטטי. לא נסרקה כתובת האתר שלכם ולא נשלפו נתונים חיצוניים.",
  },
  {
    id: "rec-a11y",
    priority: "high",
    title: "שיפור נגישות טפסים (הדגמה)",
    summary: "הוסיפו תוויות מקושרות, הודעות שגיאה ברורות ו-focus states בולטים.",
    details:
      "המלצה כללית לשיפור חוויית משתמש ונגישות. אינה מבוססת על ממצאים אמיתיים מהאתר שהוזן.",
  },
  {
    id: "rec-ux",
    priority: "low",
    title: "חידוד קריאות לפעולה (הדגמה)",
    summary: "הבהירו CTA ראשי וצמצמו הסחות בנתיב ההמרה - דוגמה לעיצוב דוח.",
    details:
      "תוכן הדגמה לצורך תצוגה בלבד. לא מייצג מסקנות על האתר שלכם.",
  },
] as const;

export type WebsiteCheckResultsCopy = {
  demoBanner: string;
  eyebrow: string;
  title: string;
  summary: string;
  urlLabel: string;
  backLabel: string;
  restartLabel: string;
  restartHint: string;
  overallKicker: string;
  overallLabel: string;
  overallCaption: string;
  overallStatusLabel: string;
  metricsHeading: string;
  findingsHeading: string;
  findingsIntro: string;
  recommendationsHeading: string;
  recommendationsIntro: string;
  summaryHeading: string;
  summaryIntro: string;
  placeholderLabel: string;
  placeholderHint: string;
  priorityLabels: { high: string; medium: string; low: string };
  findingStatusLabels: Record<WebsiteCheckFindingStatus, string>;
  findingsPreviewHeading: string;
  findingsPreviewIntro: string;
  findingsPreviewMoreLabel: string;
  findingsEmptyMessage: string;
  recommendationsEmptyMessage: string;
  detailsSectionHeading: string;
  detailsTabsAriaLabel: string;
  tabFindingsLabel: string;
  tabRecommendationsLabel: string;
  transparencyHeading: string;
  transparencyBody: string;
  executiveSummaryHeading: string;
  topFindingsHeading: string;
  topFindingsIntro: string;
  groupedFindingsHeading: string;
  recommendationsSectionHeading: string;
  technicalDetailsHeading: string;
  learnMoreLabel: string;
  auditKindLabels: Record<WebsiteCheckAuditKind, string>;
  categoryLabels: Record<WebsiteCheckFindingCategory, string>;
  businessFindingsHeading: string;
  businessFindingsIntro: string;
  strengthsHeading: string;
  weaknessesHeading: string;
  practicalRecommendationsHeading: string;
  practicalRecommendationsIntro: string;
  positiveStateHeading: string;
  mainFindingsHeading: string;
  demoFindingsNotice: string;
  strengthsSectionHeading: string;
  ctaHeading: string;
  ctaBody: string;
  ctaButtonLabel: string;
  aiRecommendationsHeading: string;
  aiLoadingLabel: string;
  aiDemoNotice: string;
};

export const WEBSITE_CHECK_RESULTS_COPY: WebsiteCheckResultsCopy = {
  demoBanner: "דוח הדגמה. לא נותח אתר אמיתי",
  eyebrow: "WEBLIO WEBSITE ANALYZER",
  title: "סיכום בדיקת האתר",
  summary:
    "להלן דוח הדגמה עם ציונים, ממצאים והמלצות לדוגמה. הנתונים סטטיים ואינם משקפים את האתר שהוזן.",
  urlLabel: "כתובת שהוזנה (להצגה בלבד)",
  backLabel: "חזרה למסך ההתחלה",
  restartLabel: "בדיקה נוספת",
  restartHint:
    "בדיקה נוספת לאותה כתובת תשתמש במטמון 24 שעות אם קיימת בדיקה תואמת - לא תמיד תרוץ PageSpeed מחדש.",
  overallKicker: "ציון כללי להדגמה",
  overallLabel: "ציון מסכם לדוגמה",
  overallCaption: "82 מתוך 100. ערך סטטי להמחשה, לא תוצאת ניתוח.",
  overallStatusLabel: "ביצועים טובים (הדגמה)",
  metricsHeading: "פירוט לפי תחומים (הדגמה)",
  findingsHeading: "ממצאים לדוגמה",
  findingsIntro: "הממצאים הבאים הם תוכן סטטי. לא בוצעה בדיקה של האתר שהזנתם.",
  recommendationsHeading: "המלצות לשיפור (הדגמה)",
  recommendationsIntro: "המלצות כלליות להמחשת הממשק - לא מבוססות על סריקה אמיתית.",
  summaryHeading: "תצוגה מקדימה של האתר",
  summaryIntro:
    "תצוגה מקדימה מעוצבת להמחשה בלבד - זו לא צילום מסך אמיתי של הכתובת שהוזנה, ולא נשלפו נתונים חיצוניים.",
  placeholderLabel: "תצוגה מקדימה להדגמה",
  placeholderHint: "כשהניתוח האמיתי יהיה זמין, כאן תוצג תצוגה מהאתר.",
  priorityLabels: {
    high: "עדיפות גבוהה",
    medium: "עדיפות בינונית",
    low: "עדיפות נמוכה",
  },
  findingStatusLabels: {
    positive: "חיובי (דוגמה)",
    warning: "לשיפור (דוגמה)",
    neutral: "למעקב (דוגמה)",
    failed: "נכשל (דוגמה)",
  },
  findingsEmptyMessage: "אין ממצאים להצגה בדוח ההדגמה.",
  recommendationsEmptyMessage: "אין המלצות להצגה בדוח ההדגמה.",
  findingsPreviewHeading: "תקציר ממצאים (הדגמה)",
  findingsPreviewIntro: "תצוגה מקוצרת - פרטים מלאים בלשוניות למטה.",
  findingsPreviewMoreLabel: "גללו לממצאים והמלצות בדוח",
  detailsSectionHeading: "פירוט מלא (הדגמה)",
  detailsTabsAriaLabel: "ממצאים והמלצות בדוח ההדגמה",
  tabFindingsLabel: "ממצאים",
  tabRecommendationsLabel: "המלצות לשיפור",
  transparencyHeading: "",
  transparencyBody: "",
  executiveSummaryHeading: "סיכום קצר (הדגמה)",
  topFindingsHeading: "ממצאים בולטים (הדגמה)",
  topFindingsIntro: "עד שלושה ממצאים להמחשה - לא מבוססי Lighthouse.",
  groupedFindingsHeading: "כל הממצאים לפי תחום (הדגמה)",
  recommendationsSectionHeading: "המלצות (הדגמה)",
  technicalDetailsHeading: "מידע טכני למתקדמים",
  learnMoreLabel: "למידע נוסף",
  businessFindingsHeading: "ממצאים חשובים (הדגמה)",
  businessFindingsIntro: "בדוח אמיתי יוצגו כאן עד חמישה ממצאים מאומתים בעברית.",
  strengthsHeading: "חוזקות (הדגמה)",
  weaknessesHeading: "נקודות לשיפור (הדגמה)",
  practicalRecommendationsHeading: "המלצות מעשיות (הדגמה)",
  practicalRecommendationsIntro: "בדוח אמיתי - צעדים מומלצים על בסיס ממצאים מאומתים.",
  positiveStateHeading: "מצב כללי",
  mainFindingsHeading: "דברים שכדאי לטפל בהם (הדגמה)",
  demoFindingsNotice: "בדוח הדגמה לא מוצגים ממצאים מאומתים. בבדיקה אמיתית יופיעו עד שלושה נושאים בעברית.",
  strengthsSectionHeading: "מה עובד טוב?",
  ctaHeading: "רוצים לשפר את האתר?",
  ctaBody: "נשמח לעזור לכם להבין מה כדאי לשפר ואיך להפוך את האתר שלכם לטוב יותר.",
  ctaButtonLabel: "צור קשר לשיפור האתר",
  aiRecommendationsHeading: "מה כדאי לשפר קודם באתר שלך? (הדגמה)",
  aiLoadingLabel: "",
  aiDemoNotice:
    "בדוח הדגמה אין המלצות מותאמות אישית. בבדיקה אמיתית יוצגו עד שלושה צעדים בעברית על בסיס Lighthouse.",
  auditKindLabels: {
    failure: "נכשל (דוגמה)",
    opportunity: "הזדמנות (דוגמה)",
    diagnostic: "מידע (דוגמה)",
    passed: "עבר (דוגמה)",
  },
  categoryLabels: {
    performance: "מהירות וביצועים",
    seo: "התאמה למנועי חיפוש",
    accessibility: "נגישות בסיסית",
    "best-practices": "שיטות מומלצות",
    other: "כללי",
  },
};

export const WEBSITE_CHECK_LIVE_OVERALL_UNAVAILABLE =
  "לא ניתן לחשב ציון כללי. חסרות קטגוריות זמינות.";

export const WEBSITE_CHECK_LIVE_PARTIAL_BANNER =
  "הניתוח הושלם חלקית. ייתכן שחלק מהביקורות או הציונים חסרים. מוצגים רק נתונים שהתקבלו מהשרת.";

export const WEBSITE_CHECK_LIVE_RESULTS_META = {
  metaStrategyLabel: "אסטרטגיה",
  metaStrategyMobile: "Mobile - Lighthouse",
  metaStrategyDesktop: "Desktop - Lighthouse",
  metaTimestampLabel: "מועד הניתוח",
  metaLabLabel: "נתוני lab",
  metaLabValue: "מדידה סינתטית (Lighthouse). לא חוויית משתמשים אמיתית",
  metaFieldLabel: "נתוני שדה (CrUX)",
  metaFieldAvailable: "זמינים חלקית לכתובת/מקור (ראו מדדים בשרת)",
  metaFieldUnavailable: "לא זמינים לכתובת זו",
  metaLighthouseLabel: "גרסת Lighthouse",
  metaCacheLabel: "מקור",
  metaCacheValue: "בדיקה קודמת",
} as const;

export const WEBSITE_CHECK_LIVE_RESULTS_COPY: WebsiteCheckResultsCopy = {
  demoBanner: "דוח ניתוח אמיתי. PageSpeed Insights (mobile)",
  eyebrow: "WEBLIO WEBSITE ANALYZER",
  title: "דוח בריאות האתר",
  summary:
    "דוח בעברית פשוטה לבעלי עסקים. מבוסס על בדיקת PageSpeed (mobile) במעבדה.",
  urlLabel: "כתובת שנבדקה",
  backLabel: "חזרה למסך ההתחלה",
  restartLabel: "בדיקה נוספת",
  restartHint:
    "בדיקה נוספת לאותה כתובת תשתמש במטמון 24 שעות אם קיימת בדיקה תואמת - לא תמיד תרוץ PageSpeed מחדש.",
  overallKicker: "ציון בריאות האתר",
  overallLabel: "ציון מסכם",
  overallCaption: "",
  overallStatusLabel: "",
  metricsHeading: "ציונים לפי תחום",
  findingsHeading: "ממצאים מ-Lighthouse",
  findingsIntro: "מקור: Lighthouse - שפת המקור (לרוב אנגלית).",
  recommendationsHeading: "המלצות לשיפור",
  recommendationsIntro:
    "המלצות מבוססות על הזדמנויות וממצאים מ-Lighthouse - לא תוכן שנוצר ב-AI.",
  summaryHeading: "תצוגה מקדימה של האתר",
  summaryIntro:
    "תצוגה מעוצבת להמחשה בלבד - זו לא צילום מסך של האתר ולא נלכדה תמונה מהשרת.",
  placeholderLabel: "איור להמחשה",
  placeholderHint: "מוצג דומיין האתר שהוזן - לא תצוגה חיה של הדף.",
  priorityLabels: {
    high: "עדיפות גבוהה",
    medium: "עדיפות בינונית",
    low: "עדיפות נמוכה",
  },
  findingStatusLabels: {
    positive: "עובר",
    warning: "לשיפור",
    neutral: "מידע",
    failed: "נכשל",
  },
  findingsPreviewHeading: "תקציר ממצאים",
  findingsPreviewIntro: "תצוגה מקוצרת - פרטים מלאים בלשוניות למטה.",
  findingsPreviewMoreLabel: "גללו לממצאים והמלצות בדוח",
  findingsEmptyMessage: "לא נמצאו ממצאים להצגה בניתוח זה.",
  recommendationsEmptyMessage: "לא נמצאו המלצות להצגה בניתוח זה.",
  detailsSectionHeading: "פירוט מלא",
  detailsTabsAriaLabel: "ממצאים והמלצות בדוח הניתוח",
  tabFindingsLabel: "ממצאים",
  tabRecommendationsLabel: "המלצות לשיפור",
  transparencyHeading: "שקיפות הניתוח",
  transparencyBody:
    "הניתוח מבוסס על Lighthouse במצב lab (mobile). נתוני שדה (CrUX) מוצגים רק כשזמינים. «תקינות האתר» משקפת בדיקות Best Practices טכניות, לא ביקורת אבטחה מקיפה.",
  executiveSummaryHeading: "סיכום למנהל/ת",
  topFindingsHeading: "ממצאים שכדאי לטפל בהם",
  topFindingsIntro: "תצוגה טכנית - ראו גם «מידע טכני למתקדמים».",
  groupedFindingsHeading: "כל הממצאים (Lighthouse)",
  recommendationsSectionHeading: "המלצות Lighthouse (מקור)",
  technicalDetailsHeading: "מידע טכני למתקדמים",
  learnMoreLabel: "למידע נוסף",
  businessFindingsHeading: "ממצאים חשובים לטיפול",
  businessFindingsIntro:
    "עד חמישה נושאים מאומתים מהבדיקה - בעברית, בלי תרגום מומצא לביקורות לא מוכרות.",
  strengthsHeading: "חוזקות",
  weaknessesHeading: "נקודות לשיפור",
  practicalRecommendationsHeading: "המלצות מעשיות",
  practicalRecommendationsIntro: "צעדים שכדאי לשקול - על בסיס הממצאים המאומתים למעלה.",
  positiveStateHeading: "מצב כללי",
  mainFindingsHeading: "דברים שכדאי לטפל בהם",
  demoFindingsNotice: "",
  strengthsSectionHeading: "מה עובד טוב?",
  ctaHeading: "רוצים לשפר את האתר?",
  ctaBody: "נשמח לעזור לכם להבין מה כדאי לשפר ואיך להפוך את האתר שלכם לטוב יותר.",
  ctaButtonLabel: "צור קשר לשיפור האתר",
  aiRecommendationsHeading: "מה כדאי לשפר קודם באתר שלך?",
  aiLoadingLabel: "מכינים המלצות מותאמות על בסיס הבדיקה…",
  aiDemoNotice: "",
  auditKindLabels: {
    failure: "בדיקה נכשלה",
    opportunity: "הזדמנות לשיפור",
    diagnostic: "מידע אבחוני",
    passed: "עבר",
  },
  categoryLabels: {
    performance: "מהירות וביצועים",
    seo: "התאמה למנועי חיפוש",
    accessibility: "נגישות בסיסית",
    "best-practices": "שיטות מומלצות",
    other: "כללי",
  },
};

export const WEBSITE_CHECK_FINDINGS_PREVIEW_COUNT = 3;
