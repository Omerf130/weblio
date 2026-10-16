/** MongoDB TTL on `createdAt` — analysis run document retention (not the 24h result cache). */
export const WEBSITE_ANALYSIS_RUN_TTL_DAYS = 365;

export const WEBSITE_ANALYSIS_RUN_TTL_SECONDS =
  WEBSITE_ANALYSIS_RUN_TTL_DAYS * 24 * 60 * 60;

/** Previous production default — for migration review only. */
export const WEBSITE_ANALYSIS_RUN_LEGACY_TTL_SECONDS = 90 * 24 * 60 * 60;

export const WEBSITE_ANALYSIS_RUN_TTL_INDEX_NAME = "createdAt_1";
