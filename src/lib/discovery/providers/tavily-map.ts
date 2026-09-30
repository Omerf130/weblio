import { normalizeDiscoveryUrl } from "@/lib/discovery/normalize-url";
import type { NormalizedDiscoveryInput } from "@/lib/discovery/types";
import type { DiscoverySearchProfile } from "@/lib/discovery/providers/types";

export const TAVILY_PROVIDER_ID = "tavily";

export const DISCOVERY_CONTENT_MAX = 10_000;

export type TavilyApiResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  id?: string;
  published_date?: string;
};

export type TavilyMapContext = {
  profile: DiscoverySearchProfile;
  rank: number;
};

export type TavilyMapOutcome =
  | {
      ok: true;
      normalized: NormalizedDiscoveryInput;
      domain?: string;
      dedupeUrlKey?: string;
    }
  | { ok: false; reason: string; title?: string; url?: string };

function truncateContent(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= DISCOVERY_CONTENT_MAX) {
    return trimmed;
  }
  return `${trimmed.slice(0, DISCOVERY_CONTENT_MAX - 1)}…`;
}

function extractHostname(httpsUrl: string): string | undefined {
  try {
    const host = new URL(httpsUrl).hostname.toLowerCase();
    return host.length > 0 ? host.slice(0, 80) : undefined;
  } catch {
    return undefined;
  }
}

function parsePublishedDate(value: string | undefined): Date | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}

export function mapTavilyResultToNormalized(
  result: TavilyApiResult,
  context: TavilyMapContext
): TavilyMapOutcome {
  const title = result.title?.trim() || undefined;
  const rawUrl = result.url?.trim();
  const contentRaw = result.content?.trim() ?? "";
  const content =
    contentRaw.length > 0
      ? truncateContent(contentRaw)
      : title
        ? truncateContent(title)
        : "";

  if (!content) {
    return {
      ok: false,
      reason: "empty_content",
      title,
      url: rawUrl,
    };
  }

  let sourceUrl: string | undefined;
  let dedupeUrlKey: string | undefined;

  if (rawUrl) {
    const normalized = normalizeDiscoveryUrl(rawUrl);
    if (normalized.ok) {
      sourceUrl = normalized.normalizedUrl;
      dedupeUrlKey = normalized.normalizedUrl;
    }
  }

  const tavilyResultId = result.id?.trim() || undefined;

  if (!sourceUrl && !tavilyResultId) {
    return {
      ok: false,
      reason: "missing_https_url_and_external_id",
      title,
      url: rawUrl,
    };
  }

  const score =
    typeof result.score === "number" && Number.isFinite(result.score)
      ? result.score
      : undefined;

  const rawMetadata: Record<string, unknown> = {
    profileId: context.profile.id,
    query: context.profile.queryHe,
    rank: context.rank,
  };
  if (score !== undefined) {
    rawMetadata.score = score;
  }
  if (tavilyResultId) {
    rawMetadata.tavilyResultId = tavilyResultId;
  }

  const publishedAt = parsePublishedDate(result.published_date);

  // URL-first persistence for Tavily: omit externalId when https sourceUrl exists so
  // computeDedupeKey uses normalized URL identity across profiles and result ids.
  const externalId = sourceUrl ? undefined : tavilyResultId;

  const normalized: NormalizedDiscoveryInput = {
    provider: TAVILY_PROVIDER_ID,
    externalId,
    sourceType: "search_result",
    sourcePlatform: sourceUrl ? extractHostname(sourceUrl) : undefined,
    sourceUrl,
    title,
    content,
    publishedAt,
    rawMetadata,
  };

  return {
    ok: true,
    normalized,
    domain: normalized.sourcePlatform,
    dedupeUrlKey,
  };
}
