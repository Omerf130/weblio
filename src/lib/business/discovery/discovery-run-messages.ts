import type {
  DiscoveryRunSummaryDto,
  RunTavilyDiscoveryActionResult,
} from "@/types/discovery-run";

export type DiscoveryActionMessage = {
  variant: "success" | "partial" | "info" | "error";
  title: string;
  lines: string[];
};

export function formatCooldownRemainingHebrew(seconds: number): string {
  if (seconds <= 0) {
    return "0 דקות";
  }
  if (seconds < 60) {
    return "פחות מדקה";
  }
  const minutes = Math.ceil(seconds / 60);
  return minutes === 1 ? "דקה אחת" : `${minutes} דקות`;
}

function formatSuccessMetrics(summary: DiscoveryRunSummaryDto): string[] {
  return [
    `נבחרו ${summary.profilesSelected} פרופילי חיפוש (${summary.tavilyRequests} בקשות Tavily)`,
    `נמצאו ${summary.rawResults} תוצאות`,
    `נבדקו ${summary.uniqueCandidates} מועמדים ייחודיים`,
    `נוספו ${summary.created} כוונות חדשות`,
    `נמצאו מחדש ${summary.rediscovered} תוצאות קיימות`,
    `סווגו ${summary.classified} כוונות`,
    `נשארו ${summary.unclassified} ללא סיווג`,
  ];
}

export function formatDiscoveryActionResult(
  result: RunTavilyDiscoveryActionResult
): DiscoveryActionMessage {
  if (!result.success) {
    switch (result.reason) {
      case "disabled":
        return {
          variant: "info",
          title: "החיפוש האוטומטי עדיין לא מופעל",
          lines: ["לא ניתן להפעיל חיפוש חדש כרגע."],
        };
      case "cooldown": {
        const remaining = formatCooldownRemainingHebrew(
          result.cooldownRemainingSeconds ?? 0
        );
        return {
          variant: "info",
          title: "המתנה בין חיפושים",
          lines: [`ניתן לבצע חיפוש נוסף בעוד ${remaining}.`],
        };
      }
      case "already_running":
        return {
          variant: "info",
          title: "חיפוש כבר מתבצע",
          lines: ["חיפוש כבר מתבצע כרגע. נסה שוב בעוד כמה דקות."],
        };
      case "credit_limit":
        return {
          variant: "info",
          title: "מגבלת קרדיט חודשית",
          lines: [
            "הגעתם למגבלת הקרדיט החודשית לחיפוש Tavily. לא ניתן להפעיל חיפוש נוסף החודש.",
          ],
        };
      case "failed":
      default:
        return {
          variant: "error",
          title: "החיפוש נכשל",
          lines: ["לא ניתן להשלים את החיפוש כרגע. נסה שוב מאוחר יותר."],
        };
    }
  }

  const lines = formatSuccessMetrics(result.summary);

  if (result.status === "partial") {
    return {
      variant: "partial",
      title: "החיפוש הושלם חלקית",
      lines: [
        "החיפוש הסתיים, אך חלק מהמקורות או התוצאות לא עובדו בהצלחה.",
        ...lines,
      ],
    };
  }

  return {
    variant: "success",
    title: "החיפוש הושלם בהצלחה",
    lines,
  };
}

export type LastDiscoveryRunHint = {
  completedAt: string;
  status: "completed" | "partial" | "failed";
  created: number;
  classified: number;
};

export function toLastDiscoveryRunHint(input: {
  completedAt?: string;
  status: string;
  summary?: DiscoveryRunSummaryDto;
}): LastDiscoveryRunHint | null {
  if (!input.completedAt) {
    return null;
  }
  if (input.status !== "completed" && input.status !== "partial" && input.status !== "failed") {
    return null;
  }

  return {
    completedAt: input.completedAt,
    status: input.status,
    created: input.summary?.created ?? 0,
    classified: input.summary?.classified ?? 0,
  };
}

export function formatLastDiscoveryRunHintHebrew(hint: LastDiscoveryRunHint): string {
  const when = new Intl.DateTimeFormat("he-IL", {
    timeZone: "Asia/Jerusalem",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(hint.completedAt));

  const statusLabel =
    hint.status === "completed"
      ? "הושלם"
      : hint.status === "partial"
        ? "הושלם חלקית"
        : "נכשל";

  return `חיפוש אחרון: ${when} · ${statusLabel} · ${hint.created} כוונות חדשות · ${hint.classified} סווגו`;
}
