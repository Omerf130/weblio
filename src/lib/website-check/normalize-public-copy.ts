const LONG_DASH_PATTERN = /[\u2013\u2014]/g;

/** User-facing Website Analyzer copy uses ASCII hyphens only. */
export function normalizeWebsiteCheckPublicCopy(text: string): string {
  return text.replace(LONG_DASH_PATTERN, "-");
}

export function containsWebsiteCheckLongDash(text: string): boolean {
  return LONG_DASH_PATTERN.test(text);
}
