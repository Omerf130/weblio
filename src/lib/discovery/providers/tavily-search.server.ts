import "server-only";

/**
 * Server-only entry for Tavily discovery (admin actions / API routes).
 * PoC CLI imports from tavily-search-provider.ts directly in Node.
 */
export {
  buildTavilySearchRequestBody,
  createTavilySearchProvider,
  createTavilySearchProviderFromEnv,
  fetchTavilySearchResults,
  mapTavilyResponseToRows,
} from "@/lib/discovery/providers/tavily-search-provider";
