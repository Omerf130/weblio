import { DEFAULT_TAVILY_MAX_RESULTS } from "@/lib/discovery/providers/tavily-env";

/** Tavily Search API `time_range` values (relative freshness window). */
export type TavilyTimeRange = "day" | "week" | "month" | "year" | "d" | "w" | "m" | "y";

export type DiscoveryPolicyTavily = {
  timeRange: TavilyTimeRange;
  excludeDomains: readonly string[];
  maxResultsPerQuery: number;
  searchDepth: "basic";
  /** Tavily Search API topic (required for `country` boost). */
  topic?: "general" | "news";
  /** Tavily country boost — documented for topic `general`. */
  country?: string;
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

/** Manual / V2.1 production discovery (29-profile daily selection). Legacy snapshot reference. */
export const V2_1_PRODUCTION_DISCOVERY_POLICY: DiscoveryPolicy = {
  version: 2,
  tavily: {
    timeRange: "week",
    excludeDomains: PRODUCTION_YOUTUBE_EXCLUDE_DOMAINS,
    maxResultsPerQuery: DEFAULT_TAVILY_MAX_RESULTS,
    searchDepth: "basic",
    topic: "general",
    country: "israel",
  },
  limits: {
    maxProfilesPerRun: 29,
    maxTavilyRequestsPerRun: 29,
    maxCandidatesPerRun: 85,
    maxClassificationsPerRun: 45,
    runCooldownMinutes: 15,
  },
};

/** @deprecated Alias for V2.1 policy (29/day). Prefer V2.2 for current production. */
export const V2_PRODUCTION_DISCOVERY_POLICY = V2_1_PRODUCTION_DISCOVERY_POLICY;

/** V2.2 buyer-intent catalog tuning (~15 Tavily requests/day). */
export const V2_2_PRODUCTION_DISCOVERY_POLICY: DiscoveryPolicy = {
  version: 3,
  tavily: {
    timeRange: "week",
    excludeDomains: PRODUCTION_YOUTUBE_EXCLUDE_DOMAINS,
    maxResultsPerQuery: DEFAULT_TAVILY_MAX_RESULTS,
    searchDepth: "basic",
    topic: "general",
    country: "israel",
  },
  limits: {
    maxProfilesPerRun: 15,
    maxTavilyRequestsPerRun: 15,
    maxCandidatesPerRun: 85,
    maxClassificationsPerRun: 45,
    runCooldownMinutes: 15,
  },
};

export function getV2ProductionDiscoveryPolicy(): DiscoveryPolicy {
  return V2_2_PRODUCTION_DISCOVERY_POLICY;
}

export function getV2_1ProductionDiscoveryPolicy(): DiscoveryPolicy {
  return V2_1_PRODUCTION_DISCOVERY_POLICY;
}

export function getV2_2ProductionDiscoveryPolicy(): DiscoveryPolicy {
  return V2_2_PRODUCTION_DISCOVERY_POLICY;
}

export type TavilyRequestPolicy = {
  timeRange?: TavilyTimeRange;
  excludeDomains?: readonly string[];
  maxResults?: number;
  topic?: "general" | "news";
  country?: string;
};

/** Maps production policy to Tavily per-request options (explicit opt-in at call site). */
export function tavilyRequestPolicyFromDiscoveryPolicy(
  policy: DiscoveryPolicy
): TavilyRequestPolicy {
  return {
    timeRange: policy.tavily.timeRange,
    excludeDomains: [...policy.tavily.excludeDomains],
    maxResults: policy.tavily.maxResultsPerQuery,
    topic: policy.tavily.topic,
    country: policy.tavily.country,
  };
}
