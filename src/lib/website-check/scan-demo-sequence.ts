import type { AnalyzerMetricId } from "@/components/analyzer/analyzer-content";

export type ScanDemoStageId = AnalyzerMetricId;

export type ScanDemoStage = {
  id: ScanDemoStageId;
  label: string;
  /** Shown on the timeline node */
  shortLabel: string;
  /** Progress bar status while this stage is active */
  statusLabel: string;
  /** Lines cycled in the activity panel during this stage */
  activities: readonly string[];
  accent: "green" | "amber" | "blue" | "purple";
};

/** Deterministic mock scan — not a real analysis. */
export const SCAN_DEMO_STAGES: readonly ScanDemoStage[] = [
  {
    id: "performance",
    label: "ביצועים",
    shortLabel: "ביצועים",
    statusLabel: "בודקים ביצועים וזמני טעינה",
    accent: "green",
    activities: [
      "מכינים את סביבת ההדמיה לבדיקת ביצועים…",
      "סורקים מבנה דף לדוגמה (הדמיה בלבד)…",
      "מעריכים עומס משאבים ויזואלי (ללא ניתוח אמיתי)…",
    ],
  },
  {
    id: "seo",
    label: "SEO",
    shortLabel: "SEO",
    statusLabel: "בודקים SEO ומבנה תוכן",
    accent: "amber",
    activities: [
      "בודקים כותרות ומטא-נתונים בהדמיה…",
      "ממפים קישורים פנימיים לדוגמה…",
      "מסכמים תובנות SEO כלליות (הדמיה)…",
    ],
  },
  {
    id: "accessibility",
    label: "נגישות",
    shortLabel: "נגישות",
    statusLabel: "בודקים נגישות ושימושיות",
    accent: "blue",
    activities: [
      "בודקים ניגודיות וגודל טקסט (הדמיה)…",
      "סורקים תוויות וטפסים לדוגמה…",
      "מעריכים חוויית מקלדת וקורא מסך (הדמיה)…",
    ],
  },
  {
    id: "ux",
    label: "תקינות האתר",
    shortLabel: "תקינות",
    statusLabel: "בודקים תקינות טכנית (Best Practices)",
    accent: "purple",
    activities: [
      "בודקים HTTPS והגדרות בסיסיות בהדמיה…",
      "מעריכים שיטות עבודה מומלצות (הדמיה)…",
      "מסיימים את שלב ההדמיה (ללא דוח אמיתי)…",
    ],
  },
] as const;

export const SCAN_DEMO_STAGE_COUNT = SCAN_DEMO_STAGES.length;

export const SCAN_DEMO_DURATION_MS = 13_500;

export type ScanDemoStageVisualStatus = "pending" | "active" | "completed";

export type ScanDemoVisualState = {
  progress: number;
  activeStageIndex: number;
  isComplete: boolean;
  stageStatuses: ScanDemoStageVisualStatus[];
  statusLabel: string;
  activityLine: string;
};

function clampProgress(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function getScanDemoVisualState(
  progress: number,
  activityTick: number,
): ScanDemoVisualState {
  const clamped = clampProgress(progress);
  const isComplete = clamped >= 100;
  const stageSpan = 100 / SCAN_DEMO_STAGE_COUNT;
  const activeStageIndex = isComplete
    ? SCAN_DEMO_STAGE_COUNT - 1
    : Math.min(SCAN_DEMO_STAGE_COUNT - 1, Math.floor(clamped / stageSpan));

  const stageStatuses: ScanDemoStageVisualStatus[] = SCAN_DEMO_STAGES.map((_, index) => {
    const stageStart = index * stageSpan;
    const stageEnd = (index + 1) * stageSpan;

    if (isComplete || clamped >= stageEnd) {
      return "completed";
    }
    if (clamped >= stageStart && clamped < stageEnd) {
      return "active";
    }
    return "pending";
  });

  const stage = SCAN_DEMO_STAGES[activeStageIndex];
  const activityIndex = activityTick % stage.activities.length;

  return {
    progress: clamped,
    activeStageIndex,
    isComplete,
    stageStatuses,
    statusLabel: isComplete ? "ההדמיה הושלמה - דוח אמיתי עדיין לא זמין" : stage.statusLabel,
    activityLine: isComplete
      ? "סיימנו את רצף ההדמיה. לא בוצעה בדיקה אמיתית של האתר ולא נוצרו ציונים."
      : stage.activities[activityIndex],
  };
}
