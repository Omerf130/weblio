import type { DiscoveryProfileMetricsRow } from "@/lib/discovery/discovery-profile-metrics";

export type TavilyDiscoveryProfileError = {
  profileId: string;
  query: string;
  message: string;
};

export type TavilyDiscoveryRunSummary = {
  profilesConfigured: number;
  /** Profiles chosen by the daily selector (V2) or policy slice (legacy). */
  profilesSelected: number;
  selectedProfileIds: string[];
  selectionShortfallTotal: number;
  profilesSearched: number;
  tavilyRequests: number;
  tavilyHttpAttempts: number;
  estimatedTavilyCredits: number;
  profileErrors: TavilyDiscoveryProfileError[];

  rawResults: number;

  filteredMapping: number;
  filteredValidation: number;
  filteredDomain: number;
  filteredDuplicateInRun: number;

  filteredQualitySafety: number;
  filteredQualityLocale: number;
  filteredQualityCareers: number;

  skippedNotActionable: number;
  skippedClassificationDeferred: number;

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
    profilesSelected: 0,
    selectedProfileIds: [],
    selectionShortfallTotal: 0,
    profilesSearched: 0,
    tavilyRequests: 0,
    tavilyHttpAttempts: 0,
    estimatedTavilyCredits: 0,
    profileErrors: [],
    rawResults: 0,
    filteredMapping: 0,
    filteredValidation: 0,
    filteredDomain: 0,
    filteredDuplicateInRun: 0,
    filteredQualitySafety: 0,
    filteredQualityLocale: 0,
    filteredQualityCareers: 0,
    skippedNotActionable: 0,
    skippedClassificationDeferred: 0,
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
