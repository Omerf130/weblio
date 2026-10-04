import { getIsraelCalendarDateKey } from "@/lib/admin/israel-calendar-date";
import type {
  BusinessOverviewDiscoveryAutomationHealth,
  DiscoveryAutomationHealthState,
} from "@/types/business";
import type { DiscoveryRunDto } from "@/types/discovery-run";

export type DiscoveryAutomationHealth = BusinessOverviewDiscoveryAutomationHealth;
export type { DiscoveryAutomationHealthState };

const STATE_LABELS: Record<DiscoveryAutomationHealthState, string> = {
  disabled: "כבוי",
  healthy: "תקין",
  not_run_today: "טרם רץ היום",
  running: "רץ כעת",
  partial: "הרצה חלקית",
  failed: "נכשל",
  credit_stopped: "נעצר — מגבלת קרדיטים",
};

export function deriveDiscoveryAutomationHealth(input: {
  automationEnabled: boolean;
  activeRun: DiscoveryRunDto | null;
  scheduledRunToday: DiscoveryRunDto | null;
  reference?: Date;
}): DiscoveryAutomationHealth {
  if (!input.automationEnabled) {
    return { state: "disabled", label: STATE_LABELS.disabled };
  }

  if (input.activeRun) {
    return { state: "running", label: STATE_LABELS.running };
  }

  const scheduled = input.scheduledRunToday;
  if (!scheduled) {
    void getIsraelCalendarDateKey(input.reference);
    return { state: "not_run_today", label: STATE_LABELS.not_run_today };
  }

  if (scheduled.status === "completed") {
    return { state: "healthy", label: STATE_LABELS.healthy };
  }

  if (scheduled.status === "partial") {
    return { state: "partial", label: STATE_LABELS.partial };
  }

  if (scheduled.status === "failed") {
    return { state: "failed", label: STATE_LABELS.failed };
  }

  if (
    scheduled.status === "skipped" &&
    scheduled.failureCategory === "blocked_credit_limit"
  ) {
    return { state: "credit_stopped", label: STATE_LABELS.credit_stopped };
  }

  if (scheduled.status === "skipped") {
    return { state: "not_run_today", label: STATE_LABELS.not_run_today };
  }

  return { state: "not_run_today", label: STATE_LABELS.not_run_today };
}

export { STATE_LABELS as DISCOVERY_AUTOMATION_HEALTH_LABELS };
