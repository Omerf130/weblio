import { PAGESPEED_API_BASE, PAGESPEED_MOBILE_CATEGORIES } from "./pagespeed-categories";

export function buildPageSpeedInsightsRequestUrl(options: {
  url: string;
  apiKey: string;
  locale?: string;
}): string {
  const params = new URLSearchParams();
  params.set("url", options.url);
  params.set("strategy", "mobile");
  for (const category of PAGESPEED_MOBILE_CATEGORIES) {
    params.append("category", category);
  }
  if (options.locale) {
    params.set("locale", options.locale);
  }
  params.set("key", options.apiKey);
  return `${PAGESPEED_API_BASE}?${params.toString()}`;
}

/** Redact API key from a URL for safe diagnostics. */
export function redactPageSpeedRequestUrl(requestUrl: string): string {
  try {
    const parsed = new URL(requestUrl);
    if (parsed.searchParams.has("key")) {
      parsed.searchParams.set("key", "[REDACTED]");
    }
    return parsed.toString();
  } catch {
    return "[invalid-url]";
  }
}
