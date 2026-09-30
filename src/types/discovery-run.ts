export type DiscoveryRunStatus = "running" | "completed" | "partial" | "failed";

export type DiscoveryRunProfileErrorSummary = {
  profileId: string;
  message: string;
};

export type DiscoveryRunPolicySnapshot = {
  policyVersion: number;
  timeRange: string;
  excludedDomainCount: number;
  maxProfilesPerRun: number;
  maxTavilyRequestsPerRun: number;
  maxResultsPerQuery: number;
  maxCandidatesPerRun: number;
  maxClassificationsPerRun: number;
};

export type DiscoveryRunCatalogSnapshot = {
  catalogVersion: number;
  environment?: string;
  profileCount: number;
};

/** Per-profile discovery metrics for a single run (first-wins URL attribution). */
export type DiscoveryRunProfileSummaryDto = {
  profileId: string;
  query: string;
  raw: number;
  afterFilter: number;
  uniqueAttributed: number;
  created: number;
  rediscovered: number;
  classified: number;
  explicitNeed: number;
  possibleNeed: number;
  irrelevant: number;
  unclassified: number;
  errors: number;
};

export type DiscoveryRunSummaryDto = {
  profilesConfigured: number;
  profilesSearched: number;
  tavilyRequests: number;
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
  profileErrorCount: number;
};

export type DiscoveryRunDto = {
  id: string;
  status: DiscoveryRunStatus;
  startedAt: string;
  completedAt?: string;
  triggeredBy: string;
  failureCategory?: string;
  policy: DiscoveryRunPolicySnapshot;
  catalog: DiscoveryRunCatalogSnapshot;
  summary?: DiscoveryRunSummaryDto;
  profileErrors?: DiscoveryRunProfileErrorSummary[];
  profileSummaries?: DiscoveryRunProfileSummaryDto[];
};

export type RunTavilyDiscoveryBlockReason =
  | "disabled"
  | "cooldown"
  | "already_running"
  | "failed";

export type RunTavilyDiscoveryActionResult =
  | {
      success: false;
      reason: RunTavilyDiscoveryBlockReason;
      message: string;
      cooldownRemainingSeconds?: number;
    }
  | {
      success: true;
      runId: string;
      status: DiscoveryRunStatus;
      summary: DiscoveryRunSummaryDto;
    };
