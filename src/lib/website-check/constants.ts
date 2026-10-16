/** Completed analysis reuse window (24 hours). */
export const WEBSITE_CHECK_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Runs stuck in queued/running longer than this are marked failed. */
export const WEBSITE_CHECK_RUN_STALE_MS = 6 * 60 * 1000;

export const WEBSITE_CHECK_RATE_LIMIT_PER_HOUR = 3;
export const WEBSITE_CHECK_RATE_LIMIT_PER_DAY = 10;

/** POST JSON body limit (bytes). */
export const WEBSITE_CHECK_MAX_REQUEST_BODY_BYTES = 4_096;

export const WEBSITE_CHECK_POST_MAX_DURATION_SECONDS = 300;
