import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatCooldownRemainingHebrew,
  formatDiscoveryActionResult,
} from "../../src/lib/business/discovery/discovery-run-messages";
import type { DiscoveryRunSummaryDto } from "../../src/types/discovery-run";

function sampleSummary(
  overrides: Partial<DiscoveryRunSummaryDto> = {}
): DiscoveryRunSummaryDto {
  return {
    profilesConfigured: 7,
    profilesSelected: 7,
    selectionShortfallTotal: 0,
    profilesSearched: 7,
    tavilyRequests: 7,
    rawResults: 20,
    filteredMapping: 0,
    filteredValidation: 0,
    filteredDomain: 2,
    filteredDuplicateInRun: 3,
    uniqueCandidates: 10,
    candidatesLimited: 0,
    ingestReceived: 10,
    created: 4,
    rediscovered: 2,
    classified: 3,
    unclassified: 5,
    failed: 0,
    classificationLimit: 20,
    classificationLimitReached: false,
    profileErrorCount: 0,
    ...overrides,
  };
}

describe("discovery run admin messages", () => {
  it("formats completed success metrics in Hebrew", () => {
    const message = formatDiscoveryActionResult({
      success: true,
      runId: "run-1",
      status: "completed",
      summary: sampleSummary(),
    });

    assert.equal(message.variant, "success");
    assert.match(message.lines.join(" "), /20 תוצאות/);
    assert.match(message.lines.join(" "), /10 מועמדים/);
    assert.match(message.lines.join(" "), /4 כוונות חדשות/);
  });

  it("formats partial success with warning line", () => {
    const message = formatDiscoveryActionResult({
      success: true,
      runId: "run-1",
      status: "partial",
      summary: sampleSummary({ failed: 1, profileErrorCount: 1 }),
    });

    assert.equal(message.variant, "partial");
    assert.match(message.title, /חלקית/);
    assert.match(message.lines[0] ?? "", /חלק מהמקורות/);
  });

  it("formats disabled without env names", () => {
    const message = formatDiscoveryActionResult({
      success: false,
      reason: "disabled",
      message: "internal",
    });
    assert.equal(message.variant, "info");
    assert.match(message.title, /לא מופעל/);
    assert.doesNotMatch(JSON.stringify(message), /DISCOVERY_TAVILY/i);
  });

  it("formats cooldown with minutes", () => {
    const message = formatDiscoveryActionResult({
      success: false,
      reason: "cooldown",
      message: "internal",
      cooldownRemainingSeconds: 600,
    });
    assert.match(message.lines[0] ?? "", /10 דקות/);
  });

  it("formats already_running", () => {
    const message = formatDiscoveryActionResult({
      success: false,
      reason: "already_running",
      message: "internal",
    });
    assert.match(message.lines[0] ?? "", /כבר מתבצע/);
  });

  it("formats failed generically", () => {
    const message = formatDiscoveryActionResult({
      success: false,
      reason: "failed",
      message: "TAVILY_HTTP_500 secret",
    });
    assert.equal(message.variant, "error");
    assert.doesNotMatch(JSON.stringify(message), /TAVILY_HTTP/);
  });

  it("formats cooldown helper for sub-minute", () => {
    assert.equal(formatCooldownRemainingHebrew(30), "פחות מדקה");
  });
});
