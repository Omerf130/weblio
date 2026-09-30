import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveDiscoveryRunStatusFromSummary } from "../../src/lib/discovery/discovery-run-status";
import { createEmptyTavilyDiscoveryRunSummary } from "../../src/lib/discovery/tavily-discovery-run-summary";

describe("discovery run status rules", () => {
  it("completed when no profile errors and no ingest failures", () => {
    const summary = createEmptyTavilyDiscoveryRunSummary(20, 7);
    assert.equal(deriveDiscoveryRunStatusFromSummary(summary), "completed");
  });

  it("partial when profile errors exist", () => {
    const summary = createEmptyTavilyDiscoveryRunSummary(20, 7);
    summary.profileErrors.push({ profileId: "P1", query: "q", message: "err" });
    assert.equal(deriveDiscoveryRunStatusFromSummary(summary), "partial");
  });

  it("partial when ingest failures exist", () => {
    const summary = createEmptyTavilyDiscoveryRunSummary(20, 7);
    summary.failed = 1;
    assert.equal(deriveDiscoveryRunStatusFromSummary(summary), "partial");
  });
});
