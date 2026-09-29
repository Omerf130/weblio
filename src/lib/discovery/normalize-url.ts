const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
]);

export type NormalizeUrlResult =
  | { ok: true; normalizedUrl: string }
  | { ok: false; reason: "invalid" | "not_https" };

/**
 * Conservative URL normalization for deduplication identity.
 * Does not fetch network resources or resolve canonical URLs.
 */
export function normalizeDiscoveryUrl(sourceUrl: string): NormalizeUrlResult {
  const trimmed = sourceUrl.trim();
  if (!trimmed) {
    return { ok: false, reason: "invalid" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "not_https" };
  }

  parsed.hash = "";
  parsed.hostname = parsed.hostname.toLowerCase();

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  }

  const entries: [string, string][] = [];
  parsed.searchParams.forEach((value, key) => {
    if (!TRACKING_PARAMS.has(key.toLowerCase())) {
      entries.push([key, value]);
    }
  });

  entries.sort(([aKey, aVal], [bKey, bVal]) => {
    const keyCompare = aKey.localeCompare(bKey);
    if (keyCompare !== 0) {
      return keyCompare;
    }
    return aVal.localeCompare(bVal);
  });

  const kept = new URLSearchParams();
  for (const [key, value] of entries) {
    kept.append(key, value);
  }

  parsed.search = kept.toString() ? `?${kept.toString()}` : "";

  return { ok: true, normalizedUrl: parsed.toString() };
}
