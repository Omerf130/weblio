export const TAVILY_SEARCH_API_URL = "https://api.tavily.com/search";

export const DEFAULT_TAVILY_MAX_RESULTS = 5;

export const DEFAULT_TAVILY_SEARCH_DEPTH = "basic" as const;

export const TAVILY_REQUEST_TIMEOUT_MS = 30_000;

export function getTavilyApiKey(
  source: Record<string, string | undefined> = process.env
): string | null {
  const key = source.TAVILY_API_KEY?.trim();
  return key ? key : null;
}
