import { timingSafeEqual } from "node:crypto";

const BEARER_PREFIX = "Bearer ";

export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
    return null;
  }
  const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Resolved cron Bearer secret for validation and production guards.
 * Precedence: non-empty trimmed `DISCOVERY_CRON_SECRET`, else non-empty trimmed `CRON_SECRET`
 * (Vercel Cron auto-header). Never logs or returns values beyond this resolver.
 */
export function resolveDiscoveryCronSecret(
  source: Record<string, string | undefined>
): string | undefined {
  const discovery = source.DISCOVERY_CRON_SECRET?.trim();
  if (discovery) {
    return discovery;
  }
  const vercel = source.CRON_SECRET?.trim();
  return vercel || undefined;
}

/** Timing-safe cron secret check; never logs or returns the secret. */
export function verifyDiscoveryCronSecret(
  providedToken: string | null,
  expectedSecret: string | undefined
): boolean {
  if (!providedToken || !expectedSecret) {
    return false;
  }

  const provided = Buffer.from(providedToken, "utf8");
  const expected = Buffer.from(expectedSecret, "utf8");

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}
