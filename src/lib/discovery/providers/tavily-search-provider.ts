import {
  DEFAULT_TAVILY_MAX_RESULTS,
  DEFAULT_TAVILY_SEARCH_DEPTH,
  getTavilyApiKey,
  TAVILY_REQUEST_TIMEOUT_MS,
  TAVILY_SEARCH_API_URL,
} from "@/lib/discovery/providers/tavily-env";
import {
  mapTavilyResultToNormalized,
  TAVILY_PROVIDER_ID,
  type TavilyApiResult,
} from "@/lib/discovery/providers/tavily-map";
import type {
  DiscoveryProviderMappedRow,
  DiscoveryProviderSearchResult,
  DiscoverySearchProfile,
  DiscoverySearchProvider,
  DiscoverySearchProviderSearchOptions,
} from "@/lib/discovery/providers/types";
import { safeParseNormalizedDiscoveryInput } from "@/lib/validations/intent";
import type { z } from "zod";

const RETRYABLE_STATUS = new Set([429, 503]);
const RETRY_DELAY_MS = 1500;

export type TavilySearchApiResponse = {
  results?: TavilyApiResult[];
  query?: string;
  response_time?: number;
};

export type TavilySearchProviderDeps = {
  apiKey: string;
  fetchImpl?: typeof fetch;
  searchDepth?: typeof DEFAULT_TAVILY_SEARCH_DEPTH;
};

export type TavilySearchRequestBuildInput = {
  query: string;
  maxResults: number;
  searchDepth?: typeof DEFAULT_TAVILY_SEARCH_DEPTH;
  timeRange?: string;
  excludeDomains?: readonly string[];
};

/** Builds Tavily POST JSON; omits optional fields when unset (PoC default body). */
export function buildTavilySearchRequestBody(
  input: TavilySearchRequestBuildInput
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    query: input.query,
    search_depth: input.searchDepth ?? DEFAULT_TAVILY_SEARCH_DEPTH,
    max_results: input.maxResults,
    include_answer: false,
    include_raw_content: false,
    auto_parameters: false,
  };

  const timeRange = input.timeRange?.trim();
  if (timeRange) {
    body.time_range = timeRange;
  }

  const excludeDomains = input.excludeDomains?.filter((d) => d.trim().length > 0);
  if (excludeDomains && excludeDomains.length > 0) {
    body.exclude_domains = [...excludeDomains];
  }

  return body;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.map(String).join(".")}: ` : "";
    return `${path}${issue.message}`;
  });
}

async function postTavilySearch(
  deps: TavilySearchProviderDeps,
  body: Record<string, unknown>
): Promise<Response> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const controller = AbortSignal.timeout(TAVILY_REQUEST_TIMEOUT_MS);

  return fetchImpl(TAVILY_SEARCH_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${deps.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: controller,
  });
}

export type FetchTavilySearchOptions = {
  maxResults: number;
  timeRange?: string;
  excludeDomains?: readonly string[];
};

export async function fetchTavilySearchResults(
  deps: TavilySearchProviderDeps,
  query: string,
  fetchOptions: FetchTavilySearchOptions
): Promise<TavilySearchApiResponse> {
  const body = buildTavilySearchRequestBody({
    query,
    maxResults: fetchOptions.maxResults,
    searchDepth: deps.searchDepth,
    timeRange: fetchOptions.timeRange,
    excludeDomains: fetchOptions.excludeDomains,
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await postTavilySearch(deps, body);

    if (response.ok) {
      return (await response.json()) as TavilySearchApiResponse;
    }

    if (attempt === 0 && RETRYABLE_STATUS.has(response.status)) {
      await sleep(RETRY_DELAY_MS);
      continue;
    }

    const errorText = await response.text().catch(() => "");
    throw new Error(
      `TAVILY_HTTP_${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : ""}`
    );
  }

  throw new Error("TAVILY_REQUEST_FAILED");
}

function validateNormalizedRow(
  normalized: Parameters<typeof safeParseNormalizedDiscoveryInput>[0]
): DiscoveryProviderMappedRow["validation"] {
  const parsed = safeParseNormalizedDiscoveryInput(normalized);
  if (parsed.success) {
    return { ok: true };
  }
  return { ok: false, issues: formatZodIssues(parsed.error) };
}

export function mapTavilyResponseToRows(
  profile: DiscoverySearchProfile,
  apiResults: TavilyApiResult[]
): DiscoveryProviderMappedRow[] {
  const rows: DiscoveryProviderMappedRow[] = [];

  apiResults.forEach((result, index) => {
    const rank = index + 1;
    const mapped = mapTavilyResultToNormalized(result, { profile, rank });

    if (!mapped.ok) {
      rows.push({
        rank,
        title: result.title,
        url: result.url,
        snippet: result.content,
        score: result.score,
        publishedAt: result.published_date,
        validation: { ok: false, issues: [mapped.reason] },
        skipReason: mapped.reason,
        duplicateWithinProfile: false,
        duplicateAcrossProfiles: false,
      });
      return;
    }

    const validation = validateNormalizedRow(mapped.normalized);

    rows.push({
      rank,
      title: mapped.normalized.title ?? result.title,
      url: mapped.normalized.sourceUrl ?? result.url,
      domain: mapped.domain,
      snippet: mapped.normalized.content,
      score: result.score,
      publishedAt: result.published_date,
      normalized: mapped.normalized,
      validation,
      skipReason: validation.ok ? undefined : "validation_failed",
      duplicateWithinProfile: false,
      duplicateAcrossProfiles: false,
      dedupeUrlKey: mapped.dedupeUrlKey,
    });
  });

  return rows;
}

export function createTavilySearchProvider(
  deps: TavilySearchProviderDeps
): DiscoverySearchProvider {
  return {
    providerId: TAVILY_PROVIDER_ID,
    async search(
      profile: DiscoverySearchProfile,
      options?: DiscoverySearchProviderSearchOptions
    ): Promise<DiscoveryProviderSearchResult> {
      const maxResults = options?.maxResults ?? DEFAULT_TAVILY_MAX_RESULTS;
      const tavilyRequest = options?.tavilyRequest;

      try {
        const response = await fetchTavilySearchResults(deps, profile.queryHe, {
          maxResults,
          timeRange: tavilyRequest?.timeRange,
          excludeDomains: tavilyRequest?.excludeDomains,
        });
        const apiResults = response.results ?? [];
        const rows = mapTavilyResponseToRows(profile, apiResults);

        return {
          provider: TAVILY_PROVIDER_ID,
          profileId: profile.id,
          query: profile.queryHe,
          requestedMaxResults: maxResults,
          rawResultCount: apiResults.length,
          rows,
        };
      } catch (error) {
        return {
          provider: TAVILY_PROVIDER_ID,
          profileId: profile.id,
          query: profile.queryHe,
          requestedMaxResults: maxResults,
          rawResultCount: 0,
          rows: [],
          error: error instanceof Error ? error.message : "TAVILY_UNKNOWN_ERROR",
        };
      }
    },
  };
}

export function createTavilySearchProviderFromEnv(
  fetchImpl?: typeof fetch
): DiscoverySearchProvider | null {
  const apiKey = getTavilyApiKey();
  if (!apiKey) {
    return null;
  }
  return createTavilySearchProvider({ apiKey, fetchImpl });
}
