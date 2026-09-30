import { DEFAULT_TAVILY_MAX_RESULTS } from "@/lib/discovery/providers/tavily-env";

/** Tavily Search API `time_range` values (relative freshness window). */
export type TavilyTimeRange = "day" | "week" | "month" | "year" | "d" | "w" | "m" | "y";

export type DiscoveryPolicyTavily = {
  timeRange: TavilyTimeRange;
  excludeDomains: readonly string[];
  maxResultsPerQuery: number;
  searchDepth: "basic";
};

export type DiscoveryPolicyLimits = {
  maxProfilesPerRun: number;
  maxTavilyRequestsPerRun: number;
  maxCandidatesPerRun: number;
  maxClassificationsPerRun: number;
  runCooldownMinutes: number;
};

export type DiscoveryPolicy = {
  version: number;
  tavily: DiscoveryPolicyTavily;
  limits: DiscoveryPolicyLimits;
};

const PRODUCTION_YOUTUBE_EXCLUDE_DOMAINS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
] as const;

/** Server-side production discovery policy (application safety limits, not Tavily quota). */
export const PRODUCTION_DISCOVERY_POLICY: DiscoveryPolicy = {
  version: 1,
  tavily: {
    timeRange: "week",
    excludeDomains: PRODUCTION_YOUTUBE_EXCLUDE_DOMAINS,
    maxResultsPerQuery: DEFAULT_TAVILY_MAX_RESULTS,
    searchDepth: "basic",
  },
  limits: {
    maxProfilesPerRun: 7,
    maxTavilyRequestsPerRun: 7,
    maxCandidatesPerRun: 35,
    maxClassificationsPerRun: 20,
    runCooldownMinutes: 15,
  },
};

export function getProductionDiscoveryPolicy(): DiscoveryPolicy {
  return PRODUCTION_DISCOVERY_POLICY;
}

export type TavilyRequestPolicy = {
  timeRange?: TavilyTimeRange;
  excludeDomains?: readonly string[];
  maxResults?: number;
};

/** Maps production policy to Tavily per-request options (explicit opt-in at call site). */
export function tavilyRequestPolicyFromDiscoveryPolicy(
  policy: DiscoveryPolicy
): TavilyRequestPolicy {
  return {
    timeRange: policy.tavily.timeRange,
    excludeDomains: [...policy.tavily.excludeDomains],
    maxResults: policy.tavily.maxResultsPerQuery,
  };
}
