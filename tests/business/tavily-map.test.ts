import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DISCOVERY_CONTENT_MAX,
  mapTavilyResultToNormalized,
  TAVILY_PROVIDER_ID,
} from "../../src/lib/discovery/providers/tavily-map";

const profile = {
  id: "A1",
  category: "explicit_website_need",
  queryHe: "מחפש בונה אתרים לעסק קטן",
};

describe("tavily result mapping", () => {
  it("maps to NormalizedDiscoveryInput with provider and search_result", () => {
    const outcome = mapTavilyResultToNormalized(
      {
        title: "שאלה בפורום",
        url: "https://example.com/thread/1?utm_source=x",
        content: "מחפש בונה אתרים לעסק קטן",
        score: 0.91,
        id: "tv-res-1",
      },
      { profile, rank: 1 }
    );

    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;

    assert.equal(outcome.normalized.provider, TAVILY_PROVIDER_ID);
    assert.equal(outcome.normalized.sourceType, "search_result");
    assert.equal(outcome.normalized.title, "שאלה בפורום");
    assert.equal(outcome.normalized.sourcePlatform, "example.com");
    assert.ok(outcome.normalized.sourceUrl?.startsWith("https://"));
    assert.equal(outcome.normalized.externalId, undefined);
    assert.equal(outcome.normalized.rawMetadata?.tavilyResultId, "tv-res-1");
    assert.equal(outcome.normalized.content, "מחפש בונה אתרים לעסק קטן");
    assert.equal(outcome.normalized.rawMetadata?.profileId, "A1");
    assert.equal(outcome.normalized.rawMetadata?.rank, 1);
    assert.equal(outcome.normalized.rawMetadata?.score, 0.91);
  });

  it("keeps externalId when no https URL is available", () => {
    const outcome = mapTavilyResultToNormalized(
      {
        title: "id only",
        content: "מחפש בונה אתרים",
        id: "tv-res-only",
      },
      { profile, rank: 1 }
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.normalized.externalId, "tv-res-only");
    assert.equal(outcome.normalized.rawMetadata?.tavilyResultId, "tv-res-only");
    assert.equal(outcome.normalized.sourceUrl, undefined);
  });

  it("rejects non-https URL when no external id", () => {
    const outcome = mapTavilyResultToNormalized(
      {
        title: "x",
        url: "http://insecure.example.com/page",
        content: "תוכן",
      },
      { profile, rank: 1 }
    );
    assert.equal(outcome.ok, false);
    if (outcome.ok) return;
    assert.equal(outcome.reason, "missing_https_url_and_external_id");
  });

  it("truncates long content", () => {
    const outcome = mapTavilyResultToNormalized(
      {
        url: "https://example.com/a",
        content: "א".repeat(DISCOVERY_CONTENT_MAX + 50),
      },
      { profile, rank: 1 }
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.equal(outcome.normalized.content.length, DISCOVERY_CONTENT_MAX);
  });

  it("uses published_date only when valid", () => {
    const outcome = mapTavilyResultToNormalized(
      {
        url: "https://example.com/b",
        content: "טקסט",
        published_date: "2025-06-01T00:00:00.000Z",
      },
      { profile, rank: 1 }
    );
    assert.equal(outcome.ok, true);
    if (!outcome.ok) return;
    assert.ok(outcome.normalized.publishedAt instanceof Date);
  });
});
