import {
  pageSpeedFailure,
  type PageSpeedClientResult,
} from "./pagespeed-errors";
import { extractSafePageSpeedApiErrorMessage } from "./pagespeed-api-error";
import { buildPageSpeedInsightsRequestUrl } from "./pagespeed-request";

export type PageSpeedFetchImpl = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type FetchMobilePageSpeedOptions = {
  url: string;
  apiKey: string;
  timeoutMs: number;
  fetchImpl?: PageSpeedFetchImpl;
  locale?: string;
};

export async function fetchMobilePageSpeedInsights(
  options: FetchMobilePageSpeedOptions
): Promise<PageSpeedClientResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const requestUrl = buildPageSpeedInsightsRequestUrl({
    url: options.url,
    apiKey: options.apiKey,
    locale: options.locale,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetchImpl(requestUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (response.status === 429) {
      return pageSpeedFailure("psi_rate_limited", { httpStatus: 429 });
    }

    if (response.status >= 500) {
      return pageSpeedFailure("psi_server_error", { httpStatus: response.status });
    }

    if (!response.ok) {
      let upstreamMessage: string | undefined;
      try {
        const errorPayload: unknown = await response.clone().json();
        upstreamMessage = extractSafePageSpeedApiErrorMessage(errorPayload) ?? undefined;
      } catch {
        // ignore non-JSON error bodies
      }
      return pageSpeedFailure("psi_client_error", {
        httpStatus: response.status,
        upstreamMessage,
      });
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return pageSpeedFailure("psi_invalid_response", { httpStatus: response.status });
    }

    if (!data || typeof data !== "object") {
      return pageSpeedFailure("psi_invalid_response", { httpStatus: response.status });
    }

    return { ok: true, data };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return pageSpeedFailure("psi_timeout");
    }
    return pageSpeedFailure("psi_network_error");
  } finally {
    clearTimeout(timeout);
  }
}
