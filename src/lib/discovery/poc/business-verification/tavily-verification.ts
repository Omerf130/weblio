import { DEFAULT_TAVILY_SEARCH_DEPTH } from "@/lib/discovery/providers/tavily-env";
import {
  fetchTavilySearchResults,
  type TavilySearchProviderDeps,
} from "@/lib/discovery/providers/tavily-search-provider";
import type { TavilyApiResult } from "@/lib/discovery/providers/tavily-map";
import { buildTavilyVerificationQuery } from "@/lib/discovery/poc/business-verification/verification-matcher";

export type TavilyVerificationResult =
  | { ok: true; query: string; results: TavilyApiResult[] }
  | { ok: false; query: string; error: string };

export async function runTavilyWebsiteVerification(
  deps: TavilySearchProviderDeps,
  displayName: string,
  cityHe: string,
  maxResults: number
): Promise<TavilyVerificationResult> {
  const query = buildTavilyVerificationQuery(displayName, cityHe);
  try {
    const response = await fetchTavilySearchResults(deps, query, {
      maxResults,
    });
    return {
      ok: true,
      query,
      results: response.results ?? [],
    };
  } catch (error) {
    return {
      ok: false,
      query,
      error: error instanceof Error ? error.message : "TAVILY_UNKNOWN_ERROR",
    };
  }
}

export const BUSINESS_VERIFICATION_TAVILY_SEARCH_DEPTH = DEFAULT_TAVILY_SEARCH_DEPTH;
