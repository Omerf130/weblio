import { timingSafeEqual } from "node:crypto";

const BEARER_PREFIX = "Bearer ";

export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith(BEARER_PREFIX)) {
    return null;
  }
  const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
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
