import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildOverviewActionableIntentQuery } from "../../src/lib/business/intents/overview-actionable-intent-query";
import { DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST } from "../../src/lib/discovery/discovery-ingest-path";

describe("overview actionable intent filter", () => {
  it("uses durable classify-first provenance", () => {
    const query = buildOverviewActionableIntentQuery();
    assert.equal(query.status, "new");
    assert.deepEqual(query.classification, {
      $in: ["explicitNeed", "possibleNeed"],
    });
    assert.equal(query.discoveryIngestPath, DISCOVERY_INGEST_PATH_CLASSIFIED_FIRST);
  });

  it("does not use timestamp-delta heuristics", () => {
    const query = buildOverviewActionableIntentQuery();
    assert.equal("$expr" in query, false);
    assert.equal("classifiedAt" in query, false);
  });
});
