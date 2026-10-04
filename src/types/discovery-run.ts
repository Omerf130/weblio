export type DiscoveryRunStatus =
  | "running"
  | "completed"
  | "partial"
  | "failed"
  | "skipped";

export type DiscoveryTriggerKind = "manual" | "scheduled";

export type DiscoveryRunSkipFailureCategory =
  | "already_executed"
  | "blocked_credit_limit"
  | "already_running"
  | "automation_disabled"
  | "outside_schedule_window"
  | "not_production"
  | "cron_secret_missing";

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
  catalogKind?: string;
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
  rejectedSafety?: number;
  rejectedLocale?: number;
  rejectedCareers?: number;
  skippedNotActionable?: number;
  skippedDeferred?: number;
};

export type DiscoveryRunSummaryDto = {
  profilesConfigured: number;
  profilesSelected: number;
  selectionShortfallTotal: number;
  profilesSearched: number;
  tavilyRequests: number;
  tavilyHttpAttempts?: number;
  estimatedTavilyCredits?: number;
  rawResults: number;
  filteredMapping: number;
  filteredValidation: number;
  filteredDomain: number;
  filteredDuplicateInRun: number;
  filteredQualitySafety?: number;
  filteredQualityLocale?: number;
  filteredQualityCareers?: number;
  skippedNotActionable?: number;
  skippedClassificationDeferred?: number;
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
  triggerKind?: DiscoveryTriggerKind;
  scheduleIsraelDateKey?: string;
  failureCategory?: string;
  policy: DiscoveryRunPolicySnapshot;
  catalog: DiscoveryRunCatalogSnapshot;
  summary?: DiscoveryRunSummaryDto;
  profileErrors?: DiscoveryRunProfileErrorSummary[];
  profileSummaries?: DiscoveryRunProfileSummaryDto[];
  selectedProfileIds?: string[];
};

export type RunTavilyDiscoveryBlockReason =
  | "disabled"
  | "cooldown"
  | "already_running"
  | "credit_limit"
  | "failed";

export type ScheduledDiscoveryOutcome =
  | RunTavilyDiscoveryActionResult
  | {
      success: false;
      reason: "already_executed";
      message: string;
      runId?: string;
    };

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
