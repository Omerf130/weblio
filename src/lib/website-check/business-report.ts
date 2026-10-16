import type { PublicWebsiteAnalysisRunDto } from "@/lib/website-check/public-run-dto";
import {
  formatDetectedWithEvidence,
  resolveHebrewAuditExplanation,
  type BusinessAudienceCategory,
} from "@/lib/website-check/lighthouse-audit-hebrew-catalog";
import type { WebsiteCheckFinding } from "@/views/website-check/website-check-results-content";

export type BusinessFindingView = {
  id: string;
  title: string;
  whatWeFound: string;
  whyItMatters: string;
  whatToDo: string;
  categoryLabel: string;
  catalogMatched: boolean;
  auditId?: string;
  audienceCategory?: BusinessAudienceCategory;
  priority: number;
  priorityLabel: BusinessFindingPriorityLabel;
};

export type StrengthsWeaknessesSummary = {
  strengths: string[];
  weaknesses: string[];
  emptyPositiveMessage: string | null;
};

export type BusinessFindingPriorityLabel = "high" | "medium" | "low";

export type WebsiteCheckOverallPresentation = {
  headline: string;
  support: string;
};

export const WEBSITE_CHECK_BUSINESS_FINDINGS_LIMIT = 3;
export const WEBSITE_CHECK_VERIFIED_STRENGTHS_LIMIT = 3;

const STRENGTH_SCORE_THRESHOLD = 85;

const AUDIENCE_CATEGORY_LABELS: Record<BusinessAudienceCategory, string> = {
  speed: "מהירות",
  search: "מנועי חיפוש",
  accessibility: "נגישות",
  mobile: "מובייל",
  general: "כללי",
};

const SEO_FAILURE_AUDITS = new Set(["canonical", "robots-txt", "document-title"]);

export function businessFindingPriorityLabel(priority: number): BusinessFindingPriorityLabel {
  if (priority <= 2) return "high";
  if (priority <= 5) return "medium";
  return "low";
}

export function buildOverallSummaryPresentation(
  overallScore: number | null,
  verifiedFindingCount: number
): WebsiteCheckOverallPresentation {
  if (overallScore === null) {
    return {
      headline: "לא הצלחנו לחשב ציון כללי",
      support:
        "חלק מהתחומים לא נמדדו בבדיקה זו. אפשר לנסות שוב, או לפנות אלינו לעזרה.",
    };
  }

  let headline: string;
  if (overallScore >= 90) headline = "האתר במצב טוב מאוד";
  else if (overallScore >= 75) headline = "האתר במצב טוב";
  else if (overallScore >= 50) headline = "יש מקום לשיפור";
  else headline = "כדאי לתת תשומת לב לנושאים שמצאנו";

  let support: string;
  if (verifiedFindingCount > 0) {
    support =
      "מצאנו כמה דברים שכדאי לשפר כדי לעזור לגולשים ולמבקרים באתר שלך.";
  } else if (overallScore >= 75) {
    support =
      "לא מצאנו ממצאים דחופים בבדיקה האוטומטית. כדאי להמשיך לעדכן ולשמור על האתר.";
  } else {
    support = "מומלץ לעבור על הממצאים להלן ולתעדף שיפורים שישפיעו על המבקרים.";
  }

  return { headline, support };
}

export function buildVerifiedStrengths(
  scores: PublicWebsiteAnalysisRunDto["scores"],
  limit = WEBSITE_CHECK_VERIFIED_STRENGTHS_LIMIT
): string[] {
  const items: string[] = [];

  if (scores.performance !== null && scores.performance >= STRENGTH_SCORE_THRESHOLD) {
    items.push("מהירות טעינה טובה בבדיקה הזו (מעבדה, mobile).");
  }
  if (scores.seo !== null && scores.seo >= STRENGTH_SCORE_THRESHOLD) {
    items.push("התאמה טובה למנועי חיפוש בבדיקה הטכנית (לא דירוג בגוגל).");
  }
  if (scores.accessibility !== null && scores.accessibility >= STRENGTH_SCORE_THRESHOLD) {
    items.push("נגישות בסיסית טובה בבדיקה האוטומטית (לא ביקורת מלאה).");
  }

  return items.slice(0, limit);
}

function findingPriority(finding: WebsiteCheckFinding): number {
  const kind = finding.auditKind ?? "diagnostic";
  const auditId = finding.auditId ?? "";

  if (kind === "failure" && SEO_FAILURE_AUDITS.has(auditId)) return 0;
  if (kind === "failure" && finding.category === "accessibility") return 1;
  if (kind === "failure") return 2;
  if (kind === "opportunity" && finding.category === "performance") return 3;
  if (kind === "opportunity") return 4;
  if (finding.status === "failed") return 2;
  if (finding.status === "warning") return 5;
  return 20;
}

function isActionableForBusiness(finding: WebsiteCheckFinding): boolean {
  const kind = finding.auditKind ?? "diagnostic";
  if (kind === "diagnostic" || kind === "passed") return false;
  if (kind === "failure" || kind === "opportunity") return true;
  return finding.status === "failed" || finding.status === "warning";
}

export function buildGenericBusinessFinding(finding: WebsiteCheckFinding): BusinessFindingView {
  return {
    id: finding.id,
    title: "ממצא שדורש בדיקה",
    whatWeFound:
      "זוהתה ביקורת טכנית במערכת הניתוח. לא קיים הסבר עסקי מוכן בעברית לפריט זה - ראו את המידע הטכני למטה.",
    whyItMatters: "ייתכן שיש כאן נושא לטיפול, אך לא הצגנו הסבר שלא אומת מהנתונים.",
    whatToDo: "העבירו את הפרטים למפתח או לספק שירות, או פנו אלינו לסיוע.",
    categoryLabel: "כללי",
    catalogMatched: false,
    auditId: finding.auditId,
    priority: findingPriority(finding),
    priorityLabel: businessFindingPriorityLabel(findingPriority(finding)),
  };
}

export function buildBusinessFindingView(finding: WebsiteCheckFinding): BusinessFindingView {
  const catalog = resolveHebrewAuditExplanation(finding);
  if (!catalog) {
    return buildGenericBusinessFinding(finding);
  }

  const priority = findingPriority(finding);
  return {
    id: finding.id,
    title: catalog.titleHe,
    whatWeFound: formatDetectedWithEvidence(catalog, finding),
    whyItMatters: catalog.whyItMattersHe,
    whatToDo: catalog.whatToDoHe,
    categoryLabel: AUDIENCE_CATEGORY_LABELS[catalog.audienceCategory],
    catalogMatched: true,
    auditId: finding.auditId,
    audienceCategory: catalog.audienceCategory,
    priority,
    priorityLabel: businessFindingPriorityLabel(priority),
  };
}

export function selectPrioritizedBusinessFindings(
  findings: readonly WebsiteCheckFinding[],
  limit = WEBSITE_CHECK_BUSINESS_FINDINGS_LIMIT
): BusinessFindingView[] {
  return [...findings]
    .filter(isActionableForBusiness)
    .filter((finding) => resolveHebrewAuditExplanation(finding) !== null)
    .sort((a, b) => findingPriority(a) - findingPriority(b))
    .map(buildBusinessFindingView)
    .slice(0, limit);
}

export function buildStrengthsWeaknessesSummary(
  scores: PublicWebsiteAnalysisRunDto["scores"],
  businessFindings: readonly BusinessFindingView[]
): StrengthsWeaknessesSummary {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (scores.performance !== null && scores.performance >= 85) {
    strengths.push("מהירות וביצועים נראים טובים בבדיקה הזו.");
  } else if (scores.performance !== null && scores.performance < 60) {
    weaknesses.push("מהירות וביצועים - יש מקום לשיפור משמעותי.");
  }

  if (scores.seo !== null && scores.seo >= 85) {
    strengths.push("התאמה טכנית למנועי חיפוש - מצב טוב בבדיקה (לא דירוג בגוגל).");
  } else if (scores.seo !== null && scores.seo < 60) {
    weaknesses.push("התאמה למנועי חיפוש - נמצאו נושאים טכניים לטיפול.");
  }

  if (scores.accessibility !== null && scores.accessibility >= 85) {
    strengths.push("נגישות בסיסית - ציון טוב בבדיקה האוטומטית (לא ביקורת מלאה).");
  } else if (scores.accessibility !== null && scores.accessibility < 60) {
    weaknesses.push("נגישות בסיסית - יש ממצאים שדורשים טיפול.");
  }

  for (const finding of businessFindings.slice(0, 3)) {
    if (finding.catalogMatched) {
      weaknesses.push(finding.title);
    }
  }

  const uniqueWeaknesses = [...new Set(weaknesses)].slice(0, 4);

  return {
    strengths: [...new Set(strengths)],
    weaknesses: uniqueWeaknesses,
    emptyPositiveMessage:
      uniqueWeaknesses.length === 0
        ? "לא זוהו ממצאים משמעותיים לטיפול מיידי בבדיקה זו. מומלץ לשמור על האתר ולבצע בדיקה תקופתית."
        : null,
  };
}

export function buildBusinessExecutiveSummary(
  scores: PublicWebsiteAnalysisRunDto["scores"],
  businessFindings: readonly BusinessFindingView[]
): string {
  const parts: string[] = [];

  if (scores.overall !== null) {
    parts.push(`ציון בריאות כללי של האתר: ${scores.overall} מתוך 100.`);
  } else {
    parts.push("לא ניתן לחשב ציון בריאות כללי - חסרות קטגוריות בבדיקה.");
  }

  parts.push(
    "הציון מבוסס על בדיקת PageSpeed (mobile) במעבדה - לא על חוויית לקוחות אמיתית ולא על דירוג בגוגל."
  );

  if (businessFindings.length === 0) {
    parts.push("לא נמצאו ממצאים דחופים לטיפול בדוח זה.");
  } else {
    parts.push(`הדגשנו ${businessFindings.length} נושאים שכדאי לבדוק בהקדם.`);
  }

  return parts.join(" ");
}
