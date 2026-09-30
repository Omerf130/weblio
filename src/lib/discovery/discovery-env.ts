/** Server-only: production Tavily discovery is enabled only when exactly "1". */
export function isDiscoveryTavilyEnabled(
  source: Record<string, string | undefined> = process.env
): boolean {
  return source.DISCOVERY_TAVILY_ENABLED === "1";
}
