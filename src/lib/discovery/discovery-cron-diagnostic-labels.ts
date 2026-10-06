import type { DiscoveryCronDiagnosticOutcome } from "@/types/discovery-cron-diagnostic";

export const DISCOVERY_CRON_DIAGNOSTIC_OUTCOME_LABELS_HE: Record<
  DiscoveryCronDiagnosticOutcome,
  string
> = {
  unauthorized: "אימות Cron נכשל",
  automation_disabled: "אוטומציה כבויה",
  not_production: "לא סביבת Production",
  cron_secret_missing: "חסר סוד Cron",
  outside_schedule_window: "מחוץ לחלון הזמן",
  already_executed: "הריצה כבר בוצעה היום",
  discovery_disabled: "Discovery כבוי",
  already_running: "הרצה פעילה כבר קיימת",
  blocked_credit_limit: "נחסם — מגבלת קרדיטים",
  started: "ה-Cron הגיע לשרת — התחילה הרצה",
  completed: "הריצה הושלמה",
  partial: "הריצה הושלמה חלקית",
  failed: "הריצה נכשלה",
  orchestration_error: "שגיאת תזמור",
};

export function getDiscoveryCronDiagnosticOutcomeLabelHe(
  outcome: DiscoveryCronDiagnosticOutcome
): string {
  return DISCOVERY_CRON_DIAGNOSTIC_OUTCOME_LABELS_HE[outcome];
}

/** Whether Vercel reached the app route (even if auth or guards failed). */
export function getDiscoveryCronReachedServerLabelHe(
  outcome: DiscoveryCronDiagnosticOutcome | null
): string {
  if (!outcome) {
    return "טרם התקבל Cron";
  }
  return "ה-Cron הגיע לשרת";
}
