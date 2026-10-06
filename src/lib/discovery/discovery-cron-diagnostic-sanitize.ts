const MAX_DETAILS_LENGTH = 200;
const UNSAFE_DETAIL_PATTERN = /Bearer\s|CRON_SECRET|DISCOVERY_CRON_SECRET|api[_-]?key|TAVILY_/i;

/** Safe short diagnostic detail; drops values that may contain secrets. */
export function sanitizeDiscoveryCronDiagnosticDetails(
  value: string | undefined
): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const trimmed = value.trim();
  if (UNSAFE_DETAIL_PATTERN.test(trimmed)) {
    return undefined;
  }
  return trimmed.length > MAX_DETAILS_LENGTH
    ? trimmed.slice(0, MAX_DETAILS_LENGTH)
    : trimmed;
}
