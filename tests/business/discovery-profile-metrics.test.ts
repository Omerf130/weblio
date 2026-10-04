import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDiscoveryProfileMetricsTracker } from "../../src/lib/discovery/discovery-profile-metrics";
import { mapTavilyResultToNormalized } from "../../src/lib/discovery/providers/tavily-map";

const profileW1 = {
  id: "W1",
  category: "explicit_website",
  queryHe: "מחפש מישהו שיבנה לי אתר לעסק",
};

const profileW3 = {
  id: "W3",
  category: "explicit_recommendation",
  queryHe: "מחפש המלצה על בונה אתרים לעסק",
};

function normalizedFor(profile: typeof profileW1, url: string) {
  const mapped = mapTavilyResultToNormalized(
    {
      title: "t",
      url,
      content: "מחפש עזרה",
      score: 0.5,
    },
    { profile, rank: 1 }
  );
  assert.equal(mapped.ok, true);
  if (!mapped.ok) {
    throw new Error("expected mapped row");
  }
  return mapped.normalized;
}

describe("discovery profile metrics", () => {
  it("tracks raw and afterFilter per profile", () => {
    const tracker = createDiscoveryProfileMetricsTracker([profileW1, profileW3]);
    tracker.recordProfileSearch("W1", profileW1.queryHe, { raw: 5, afterFilter: 4 });
    tracker.recordProfileSearch("W3", profileW3.queryHe, { raw: 5, afterFilter: 3 });

    const rows = tracker.toSummaries();
    assert.equal(rows.length, 2);
    const w1 = rows.find((row) => row.profileId === "W1");
    assert.equal(w1?.raw, 5);
    assert.equal(w1?.afterFilter, 4);
  });

  it("attributes uniqueAttributed using first-wins profile only", () => {
    const tracker = createDiscoveryProfileMetricsTracker([profileW1, profileW3]);
    tracker.recordProfileSearch("W1", profileW1.queryHe, { raw: 1, afterFilter: 1 });
    tracker.recordProfileSearch("W3", profileW3.queryHe, { raw: 1, afterFilter: 1 });

    const sharedUrl = "https://example.com/shared";
    tracker.recordUniqueAttributedCandidates([
      { profileId: "W1", normalized: normalizedFor(profileW1, sharedUrl) },
    ]);

    const w1 = tracker.toSummaries().find((row) => row.profileId === "W1");
    const w3 = tracker.toSummaries().find((row) => row.profileId === "W3");
    assert.equal(w1?.uniqueAttributed, 1);
    assert.equal(w3?.uniqueAttributed, 0);
  });

  it("attributes ingest and classification outcomes to profile", () => {
    const tracker = createDiscoveryProfileMetricsTracker([profileW1]);
    tracker.recordIngestOutcome("W1", {
      ok: true,
      persisted: true,
      intentId: "1",
      created: true,
      rediscovered: false,
      dedupeKey: "k",
      classification: "explicitNeed",
      classified: true,
    });
    tracker.recordIngestOutcome("W1", {
      ok: true,
      persisted: true,
      intentId: "2",
      created: true,
      rediscovered: false,
      dedupeKey: "k2",
      classification: "unclassified",
      classified: false,
    });

    const row = tracker.toSummaries()[0];
    assert.equal(row?.created, 2);
    assert.equal(row?.classified, 1);
    assert.equal(row?.explicitNeed, 1);
    assert.equal(row?.unclassified, 1);
  });

  it("isolates Tavily request errors per profile", () => {
    const tracker = createDiscoveryProfileMetricsTracker([profileW1, profileW3]);
    tracker.recordProfileRequestError("W3", profileW3.queryHe);
    const w3 = tracker.toSummaries().find((row) => row.profileId === "W3");
    assert.equal(w3?.errors, 1);
  });

  it("counts aggregated auto-skip as unclassified without classified increment", () => {
    const tracker = createDiscoveryProfileMetricsTracker([profileW1]);
    tracker.recordIngestOutcome("W1", {
      ok: true,
      persisted: false,
      intentId: "1",
      created: false,
      rediscovered: false,
      dedupeKey: "k",
      classification: "unclassified",
      classified: false,
      skipReason: "auto_classification_skipped",
    });
    const row = tracker.toSummaries()[0];
    assert.equal(row?.classified, 0);
    assert.equal(row?.unclassified, 1);
    assert.equal(row?.errors, 0);
  });

  it("bounds summaries to initialized production profiles", () => {
    const profiles = Array.from({ length: 7 }, (_, index) => ({
      id: `W${index + 1}`,
      category: "explicit_website",
      queryHe: `query ${index}`,
    }));
    const tracker = createDiscoveryProfileMetricsTracker(profiles);
    assert.equal(tracker.toSummaries().length, 7);
  });
});
