import type { TavilyDiscoveryRunSummary } from "@/lib/discovery/tavily-discovery-run-summary";
import type { DiscoveryRunStatus } from "@/types/discovery-run";

export type DeriveDiscoveryRunStatusInput = {
  summary?: TavilyDiscoveryRunSummary;
  orchestrationFailed?: boolean;
  providerUnavailable?: boolean;
};

/**
 * completed — orchestrator finished; no profile errors; no ingest failures
 * partial — useful work done but profile errors and/or ingest failures
 * failed — no useful discovery (reserved for fatal paths in execute layer)
 */
export function deriveDiscoveryRunStatusFromSummary(
  summary: TavilyDiscoveryRunSummary
): Exclude<DiscoveryRunStatus, "running"> {
  const hasProfileErrors = summary.profileErrors.length > 0;
  const hasIngestFailures = summary.failed > 0;

  if (hasProfileErrors || hasIngestFailures) {
    return "partial";
  }

  return "completed";
}

export function deriveDiscoveryRunStatus(
  input: DeriveDiscoveryRunStatusInput
): Exclude<DiscoveryRunStatus, "running"> {
  if (input.orchestrationFailed || input.providerUnavailable) {
    return "failed";
  }

  if (!input.summary) {
    return "failed";
  }

  return deriveDiscoveryRunStatusFromSummary(input.summary);
}
