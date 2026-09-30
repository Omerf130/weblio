/** Lowercase hostname without leading www. */
export function normalizeDiscoveryHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

/**
 * True when hostname matches a configured excluded domain (exact or subdomain).
 * e.g. m.youtube.com matches youtube.com; www.youtube.com matches youtube.com.
 */
export function hostnameMatchesExcludedDomain(
  hostname: string,
  excludedDomains: readonly string[]
): boolean {
  const host = normalizeDiscoveryHostname(hostname);
  if (!host) {
    return false;
  }

  for (const entry of excludedDomains) {
    const excluded = normalizeDiscoveryHostname(entry);
    if (!excluded) {
      continue;
    }
    if (host === excluded) {
      return true;
    }
    if (host.endsWith(`.${excluded}`)) {
      return true;
    }
  }

  return false;
}

export function isExcludedDiscoverySourceUrl(
  sourceUrl: string | undefined,
  excludedDomains: readonly string[]
): boolean {
  if (!sourceUrl?.trim()) {
    return false;
  }

  try {
    const hostname = new URL(sourceUrl).hostname;
    return hostnameMatchesExcludedDomain(hostname, excludedDomains);
  } catch {
    return true;
  }
}
