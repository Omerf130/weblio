import type { DiscoveryProfileMetricsRow } from "@/lib/discovery/discovery-profile-metrics";

export type TavilyDiscoveryProfileError = {
  profileId: string;
  query: string;
  message: string;
};

export type TavilyDiscoveryRunSummary = {
  profilesConfigured: number;
  profilesSearched: number;
  tavilyRequests: number;
  profileErrors: TavilyDiscoveryProfileError[];

  rawResults: number;

  filteredMapping: number;
  filteredValidation: number;
  filteredDomain: number;
  filteredDuplicateInRun: number;

  uniqueCandidates: number;
  candidatesLimited: number;

  ingestReceived: number;
  created: number;
  rediscovered: number;
  classified: number;
  unclassified: number;
  failed: number;

  classificationLimit: number;
  classificationLimitReached: boolean;

  /** Per-profile metrics; bounded to production profile count. */
  profileSummaries: DiscoveryProfileMetricsRow[];
};

export function createEmptyTavilyDiscoveryRunSummary(
  classificationLimit: number,
  profilesConfigured: number
): TavilyDiscoveryRunSummary {
  return {
    profilesConfigured,
    profilesSearched: 0,
    tavilyRequests: 0,
    profileErrors: [],
    rawResults: 0,
    filteredMapping: 0,
    filteredValidation: 0,
    filteredDomain: 0,
    filteredDuplicateInRun: 0,
    uniqueCandidates: 0,
    candidatesLimited: 0,
    ingestReceived: 0,
    created: 0,
    rediscovered: 0,
    classified: 0,
    unclassified: 0,
    failed: 0,
    classificationLimit,
    classificationLimitReached: false,
    profileSummaries: [],
  };
}
