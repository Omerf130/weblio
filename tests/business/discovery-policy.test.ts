import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getProductionDiscoveryPolicy,
  getV2ProductionDiscoveryPolicy,
  PRODUCTION_DISCOVERY_POLICY,
  V2_2_PRODUCTION_DISCOVERY_POLICY,
  tavilyRequestPolicyFromDiscoveryPolicy,
} from "../../src/lib/discovery/discovery-policy";

describe("production discovery policy", () => {
  it("exposes stable defaults", () => {
    const policy = getProductionDiscoveryPolicy();
    assert.equal(policy, PRODUCTION_DISCOVERY_POLICY);
    assert.equal(policy.version, 1);
    assert.equal(policy.tavily.timeRange, "week");
    assert.deepEqual(policy.tavily.excludeDomains, [
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
    ]);
    assert.equal(policy.tavily.maxResultsPerQuery, 5);
    assert.equal(policy.tavily.searchDepth, "basic");
    assert.equal(policy.limits.maxProfilesPerRun, 7);
    assert.equal(policy.limits.maxTavilyRequestsPerRun, 7);
    assert.equal(policy.limits.maxCandidatesPerRun, 35);
    assert.equal(policy.limits.maxClassificationsPerRun, 20);
    assert.equal(policy.limits.runCooldownMinutes, 15);
  });

  it("exposes V2.2 manual production caps", () => {
    const policy = getV2ProductionDiscoveryPolicy();
    assert.equal(policy, V2_2_PRODUCTION_DISCOVERY_POLICY);
    assert.equal(policy.version, 3);
    assert.equal(policy.limits.maxProfilesPerRun, 15);
    assert.equal(policy.limits.maxTavilyRequestsPerRun, 15);
    assert.equal(policy.limits.maxCandidatesPerRun, 85);
    assert.equal(policy.limits.maxClassificationsPerRun, 45);
    assert.equal(policy.tavily.timeRange, "week");
    assert.equal(policy.tavily.maxResultsPerQuery, 5);
    assert.equal(policy.tavily.topic, "general");
    assert.equal(policy.tavily.country, "israel");
  });

  it("maps to Tavily request policy for explicit production use", () => {
    const mapped = tavilyRequestPolicyFromDiscoveryPolicy(getProductionDiscoveryPolicy());
    assert.equal(mapped.timeRange, "week");
    assert.deepEqual(mapped.excludeDomains, [
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
    ]);
    assert.equal(mapped.maxResults, 5);
  });
});
