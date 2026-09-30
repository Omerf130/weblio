import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toDiscoveryRunSummaryDto } from "../../src/lib/data/discovery-runs";
import { createEmptyTavilyDiscoveryRunSummary } from "../../src/lib/discovery/tavily-discovery-run-summary";

describe("discovery run profile summaries persistence shape", () => {
  it("maps profileSummaries through summary DTO helper", () => {
    const summary = createEmptyTavilyDiscoveryRunSummary(20, 7);
    summary.profileSummaries = [
      {
        profileId: "W2",
        query: "מחפש מישהו שיבנה לי חנות Shopify",
        raw: 5,
        afterFilter: 5,
        uniqueAttributed: 4,
        created: 4,
        rediscovered: 0,
        classified: 3,
        explicitNeed: 1,
        possibleNeed: 0,
        irrelevant: 2,
        unclassified: 1,
        errors: 0,
      },
    ];

    const dto = toDiscoveryRunSummaryDto(summary);
    assert.equal(dto.rawResults, 0);
    assert.equal(summary.profileSummaries[0]?.explicitNeed, 1);
  });

  it("empty profile summaries remain optional on run DTO contract", () => {
    const summary = createEmptyTavilyDiscoveryRunSummary(20, 7);
    assert.deepEqual(summary.profileSummaries, []);
  });
});
