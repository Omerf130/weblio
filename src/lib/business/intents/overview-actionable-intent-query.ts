import { DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST } from "@/lib/discovery/discovery-ingest-path";
import type { IntentClassification, IntentStatus } from "@/types/intent";

const OVERVIEW_ACTIONABLE_CLASSIFICATIONS: IntentClassification[] = [
  "explicitNeed",
  "possibleNeed",
];

/** Business Overview: actionable Intents from classify-first discovery ingest only. */
export function buildOverviewActionableIntentQuery(): Record<string, unknown> {
  return {
    status: "new" satisfies IntentStatus,
    classification: { $in: OVERVIEW_ACTIONABLE_CLASSIFICATIONS },
    discoveryIngestPath: DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST,
  };
}
