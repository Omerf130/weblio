import type { WebsiteAnalysisAuditKind } from "@/types/website-analysis-run";
import type { WebsiteCheckFinding } from "@/views/website-check/website-check-results-content";

export type BusinessAudienceCategory =
  | "speed"
  | "search"
  | "accessibility"
  | "mobile"
  | "general";

export type HebrewAuditEvidenceRule = {
  allowedKinds: readonly WebsiteAnalysisAuditKind[];
  /** Binary/metric audits must show failure when true */
  requiresFailure?: boolean;
  /** Numeric/opportunity audits need a measured value in the finding */
  requireMeasurement?: boolean;
};

export type LighthouseHebrewAuditExplanation = {
  auditId: string;
  titleHe: string;
  detectedHe: string;
  whyItMattersHe: string;
  whatToDoHe: string;
  audienceCategory: BusinessAudienceCategory;
  evidence: HebrewAuditEvidenceRule;
};

/** Catalog keyed by stable Lighthouse audit IDs (verified naming convention). */
export const LIGHTHOUSE_HEBREW_AUDIT_CATALOG: Record<string, LighthouseHebrewAuditExplanation> = {
  canonical: {
    auditId: "canonical",
    titleHe: "הכתובת הראשית של העמוד אינה מוגדרת כראוי",
    detectedHe: "בדיקת SEO מצאה בעיה בהגדרת כתובת קנונית של העמוד.",
    whyItMattersHe:
      "כתובת קנונית עוזרת למנועי חיפוש להבין איזו גרסה של העמוד היא העיקרית. זה לא מבטיח דירוג בגוגל, אבל מפחית בלבול טכני.",
    whatToDoHe:
      "בקשו ממפתח/SEO לוודא שלכל עמוד יש תג canonical נכון, במיוחד כשיש כמה כתובות לאותו תוכן.",
    audienceCategory: "search",
    evidence: { allowedKinds: ["failure"], requiresFailure: true },
  },
  "robots-txt": {
    auditId: "robots-txt",
    titleHe: "קובץ robots.txt חוסם או לא תקין",
    detectedHe: "בדיקה טכנית של קובץ robots.txt מצאה בעיה.",
    whyItMattersHe:
      "קובץ זה מורה למנועי חיפוש מה לסרוק. שגיאה עלולה למנוע הצגת עמודים חשובים - זו בדיקה טכנית, לא דירוג בפועל.",
    whatToDoHe: "בקשו ממפתח לבדוק את robots.txt ולוודא שעמודי ליבה לא חסומים בטעות.",
    audienceCategory: "search",
    evidence: { allowedKinds: ["failure"], requiresFailure: true },
  },
  "largest-contentful-paint": {
    auditId: "largest-contentful-paint",
    titleHe: "טעינת התוכן העיקרי איטית (LCP)",
    detectedHe: "מדידת המהירות מראה שהאלמנט המרכזי בדף נטען לאט.",
    whyItMattersHe:
      "כשהתוכן העיקרי מופיע לאט, מבקרים עלולים לעזוב לפני שהם רואים את ההודעה שלכם - במיוחד במובייל.",
    whatToDoHe:
      "שפרו תמונות כבדות, צמצמו עומס בטעינה הראשונית, ושקלו עזרה ממפתח לייעול תצוגת הדף.",
    audienceCategory: "speed",
    evidence: { allowedKinds: ["failure", "opportunity"], requireMeasurement: true },
  },
  "first-contentful-paint": {
    auditId: "first-contentful-paint",
    titleHe: "הדף מתחיל להופיע לאט (FCP)",
    detectedHe: "המדידה מראה עיכוב עד שהדף מתחיל להיראות למבקר.",
    whyItMattersHe: "רושם ראשוני איטי עלול לפגוע באמון ובסבלנות של הגולשים.",
    whatToDoHe: "הקטינו קבצים חוסמים בטעינה הראשונה ושפרו אחסון/דחיסה של משאבים.",
    audienceCategory: "speed",
    evidence: { allowedKinds: ["failure", "opportunity"], requireMeasurement: true },
  },
  "render-blocking-resources": {
    auditId: "render-blocking-resources",
    titleHe: "קבצים שמעכבים את הצגת הדף",
    detectedHe: "זוהו CSS או JavaScript שדוחים את הופעת התוכן.",
    whyItMattersHe: "הדף נראה «ריק» יותר זמן, גם אם שאר האתר תקין.",
    whatToDoHe: "בקשו ממפתח לדחות/לטעון חלק מהקבצים אחרי התוכן העיקרי.",
    audienceCategory: "speed",
    evidence: { allowedKinds: ["opportunity", "failure"], requireMeasurement: true },
  },
  "uses-optimized-images": {
    auditId: "uses-optimized-images",
    titleHe: "תמונות לא מותאמות לגודל/דחיסה",
    detectedHe: "חלק מהתמונות גדולות מדי ביחס לתצוגה בפועל.",
    whyItMattersHe: "תמונות כבדות מאטות את האתר ומייקרות חבילות גלישה למבקרים.",
    whatToDoHe: "הקטינו תמונות, השתמשו בפורמטים מודרניים (WebP/AVIF) והפעילו lazy loading.",
    audienceCategory: "speed",
    evidence: { allowedKinds: ["opportunity", "failure"], requireMeasurement: true },
  },
  "modern-image-formats": {
    auditId: "modern-image-formats",
    titleHe: "תמונות בפורמטים ישנים",
    detectedHe: "ניתן לחסוך נפח על ידי פורמטי תמונה חדשים יותר.",
    whyItMattersHe: "פחות נפח = טעינה מהירה יותר, בלי לשנות את העיצוב.",
    whatToDoHe: "המרת תמונות ל-WebP/AVIF במקומות שאפשר, במיוחד בדף הבית.",
    audienceCategory: "speed",
    evidence: { allowedKinds: ["opportunity", "failure"], requireMeasurement: true },
  },
  "unused-javascript": {
    auditId: "unused-javascript",
    titleHe: "האתר טוען קוד שלא תמיד נחוץ",
    detectedHe: "הדפדפן מוריד קוד שלא נדרש להצגת העמוד.",
    whyItMattersHe: "זה מבזבז זמן טעינה וסוללה, במיוחד במובייל.",
    whatToDoHe: "בקשו ממפתח להסיר או לדחות ספריות שלא נחוצות בעמוד.",
    audienceCategory: "speed",
    evidence: { allowedKinds: ["opportunity", "failure"], requireMeasurement: true },
  },
  "uses-long-cache-ttl": {
    auditId: "uses-long-cache-ttl",
    titleHe: "קבצים ללא שמירה (cache) מספקת בדפדפן",
    detectedHe: "משאבים חוזרים להיטען מחדש בכל ביקור.",
    whyItMattersHe: "מבקרים חוזרים יחוו אתר איטי יותר ממה שצריך.",
    whatToDoHe: "הגדירו תוקף cache לקבצים סטטיים (תמונות, CSS, JS) בשרת.",
    audienceCategory: "speed",
    evidence: { allowedKinds: ["opportunity", "failure"], requireMeasurement: true },
  },
  redirects: {
    auditId: "redirects",
    titleHe: "יותר מדי הפניות (redirects) לפני טעינת העמוד",
    detectedHe: "הגולש עובר דרך כמה כתובות לפני שהתוכן נטען.",
    whyItMattersHe: "כל הפניה מוסיפה עיכוב - במיוחד בקמפיינים וקישורים מפרסום.",
    whatToDoHe: "קשרו ישירות לכתובת הסופית וצמצמו שרשרת redirects.",
    audienceCategory: "speed",
    evidence: { allowedKinds: ["opportunity", "failure"], requireMeasurement: true },
  },
  "color-contrast": {
    auditId: "color-contrast",
    titleHe: "ניגודיות צבעים לא מספקת",
    detectedHe: "טקסט או אלמנטים קשים לקריאה בגלל ניגודיות נמוכה.",
    whyItMattersHe:
      "זה פוגע בקריאות לכל הגולשים, ובמיוחד בכוח ראייה מופחת. זו בדיקה אוטומטית - לא תחליף לביקורת נגישות מלאה.",
    whatToDoHe: "עדכנו צבעי טקסט/רקע לפי הנחיות WCAG או התייעצו עם מעצב/נגישות.",
    audienceCategory: "accessibility",
    evidence: { allowedKinds: ["failure"], requiresFailure: true },
  },
  viewport: {
    auditId: "viewport",
    titleHe: "הגדרות תצוגה במובייל לא תקינות",
    detectedHe: "תג viewport חסר או לא מתאים לתצוגה במובייל.",
    whyItMattersHe: "בלי viewport נכון, האתר עלול להיראות זעיר או שבור בטלפון.",
    whatToDoHe: "בקשו ממפתח להוסיף/לתקן meta viewport תקני בכל העמודים.",
    audienceCategory: "mobile",
    evidence: { allowedKinds: ["failure"], requiresFailure: true },
  },
  "document-title": {
    auditId: "document-title",
    titleHe: "חסר כותרת עמוד (Title)",
    detectedHe: "לעמוד אין כותרת title מוגדרת.",
    whyItMattersHe: "כותרת מופיעה בתוצאות חיפוש ובלשונית הדפדפן - זו בדיקה טכנית, לא דירוג.",
    whatToDoHe: "הוסיפו כותרת ברורה וייחודית לכל עמוד חשוב.",
    audienceCategory: "search",
    evidence: { allowedKinds: ["failure"], requiresFailure: true },
  },
};

export const CATALOGUED_LIGHTHOUSE_AUDIT_IDS = Object.keys(LIGHTHOUSE_HEBREW_AUDIT_CATALOG);

function hasMeasurement(finding: Pick<WebsiteCheckFinding, "displayValue" | "score"> & { score?: number | null }): boolean {
  if (finding.displayValue?.trim()) return true;
  return typeof finding.score === "number" && Number.isFinite(finding.score);
}

export function auditEvidenceSupportsHebrewExplanation(
  finding: WebsiteCheckFinding,
  entry: LighthouseHebrewAuditExplanation
): boolean {
  const kind = finding.auditKind ?? "diagnostic";
  if (!entry.evidence.allowedKinds.includes(kind)) {
    return false;
  }
  if (entry.evidence.requiresFailure && kind !== "failure" && finding.status !== "failed") {
    return false;
  }
  if (entry.evidence.requireMeasurement && !hasMeasurement(finding as WebsiteCheckFinding & { score?: number | null })) {
    return false;
  }
  return true;
}

export function resolveHebrewAuditExplanation(
  finding: WebsiteCheckFinding
): LighthouseHebrewAuditExplanation | null {
  const auditId = finding.auditId?.trim();
  if (!auditId) return null;
  const entry = LIGHTHOUSE_HEBREW_AUDIT_CATALOG[auditId];
  if (!entry) return null;
  if (!auditEvidenceSupportsHebrewExplanation(finding, entry)) {
    return null;
  }
  return entry;
}

export function formatDetectedWithEvidence(
  entry: LighthouseHebrewAuditExplanation,
  finding: WebsiteCheckFinding & { displayValue?: string | null; score?: number | null }
): string {
  const display = finding.displayValue?.trim();
  if (display) {
    return `${entry.detectedHe} (מדידה: ${display})`;
  }
  return entry.detectedHe;
}
