import {
  getDiscoveryCronDiagnosticOutcomeLabelHe,
  getDiscoveryCronReachedServerLabelHe,
} from "@/lib/discovery/discovery-cron-diagnostic-labels";
import type { DiscoveryCronDiagnosticDto } from "@/types/discovery-cron-diagnostic";
import type { BusinessOverviewDiscoveryCronDiagnostics } from "@/types/discovery-cron-diagnostic";

export function buildBusinessOverviewDiscoveryCronDiagnostics(
  lastAttempt: DiscoveryCronDiagnosticDto | null
): BusinessOverviewDiscoveryCronDiagnostics {
  if (!lastAttempt || lastAttempt.details === "pending") {
    return {
      lastAttempt: null,
      lastAttemptLabel: "טרם התקבל Cron",
      reachedServerLabel: getDiscoveryCronReachedServerLabelHe(null),
    };
  }

  return {
    lastAttempt,
    lastAttemptLabel: getDiscoveryCronDiagnosticOutcomeLabelHe(lastAttempt.outcome),
    reachedServerLabel: getDiscoveryCronReachedServerLabelHe(lastAttempt.outcome),
  };
}
