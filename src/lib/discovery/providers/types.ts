import type { NormalizedDiscoveryInput } from "@/lib/discovery/types";

export type DiscoverySearchProfile = {
  id: string;
  category: string;
  queryHe: string;
  notes?: string;
};

export type DiscoverySearchProfileCatalog = {
  version: number;
  locale: string;
  environment?: string;
  pocVersion?: number;
  strategy?: string;
  profiles: DiscoverySearchProfile[];
};

/** Optional Tavily API fields — omit entirely when unset (PoC-compatible default). */
export type TavilySearchRequestPolicy = {
  timeRange?: string;
  excludeDomains?: readonly string[];
  topic?: "general" | "news";
  country?: string;
};

export type DiscoverySearchProviderSearchOptions = {
  maxResults?: number;
  tavilyRequest?: TavilySearchRequestPolicy;
};

/** Provider-neutral search contract (maps to NormalizedDiscoveryInput before ingest). */
export type DiscoverySearchProvider = {
  readonly providerId: string;
  search(
    profile: DiscoverySearchProfile,
    options?: DiscoverySearchProviderSearchOptions
  ): Promise<DiscoveryProviderSearchResult>;
};

export type DiscoveryProviderMappedRow = {
  rank: number;
  title?: string;
  url?: string;
  domain?: string;
  snippet?: string;
  score?: number;
  publishedAt?: string;
  normalized?: NormalizedDiscoveryInput;
  validation:
    | { ok: true }
    | { ok: false; issues: string[] };
  skipReason?: string;
  duplicateWithinProfile: boolean;
  duplicateAcrossProfiles: boolean;
  dedupeUrlKey?: string;
  /** Deterministic PoC inspection label — not AI classification. */
  domainCategory?: string;
};

export type DiscoveryProviderSearchResult = {
  provider: string;
  profileId: string;
  query: string;
  requestedMaxResults: number;
  rawResultCount: number;
  rows: DiscoveryProviderMappedRow[];
  error?: string;
};
