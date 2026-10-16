import "server-only";

import { resolvePageSpeedInsightsEnv } from "@/lib/website-check/pagespeed-env";
import {
  pageSpeedFailure,
  type PageSpeedClientFailure,
  type PageSpeedClientResult,
} from "./pagespeed-errors";
import {
  fetchMobilePageSpeedInsights,
  type FetchMobilePageSpeedOptions,
  type PageSpeedFetchImpl,
} from "./pagespeed-fetch";

export { buildPageSpeedInsightsRequestUrl, redactPageSpeedRequestUrl } from "./pagespeed-request";
export { fetchMobilePageSpeedInsights, type FetchMobilePageSpeedOptions, type PageSpeedFetchImpl };

export type FetchMobilePageSpeedFromEnvOptions = {
  url: string;
  fetchImpl?: PageSpeedFetchImpl;
  envSource?: Record<string, string | undefined>;
  locale?: string;
};

export async function fetchMobilePageSpeedInsightsFromEnv(
  options: FetchMobilePageSpeedFromEnvOptions
): Promise<PageSpeedClientResult> {
  const env = resolvePageSpeedInsightsEnv(options.envSource);
  if (!env) {
    return pageSpeedFailure("psi_not_configured");
  }

  return fetchMobilePageSpeedInsights({
    url: options.url,
    apiKey: env.apiKey,
    timeoutMs: env.timeoutMs,
    fetchImpl: options.fetchImpl,
    locale: options.locale,
  });
}

export function toPageSpeedRunError(failure: PageSpeedClientFailure): {
  code: string;
  messagePublic: string;
} {
  return {
    code: failure.code,
    messagePublic: failure.messagePublic,
  };
}
