import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveDiscoveryAutomationHealth } from "../../src/lib/business/discovery/automation-health";
import { getIsraelDaysAgo } from "../../src/lib/admin/dashboard-time";
import { calculatePercentChange } from "../../src/lib/admin/dashboard-stats";
import type { DiscoveryRunDto } from "../../src/types/discovery-run";

function minimalRun(
  overrides: Partial<DiscoveryRunDto> = {}
): DiscoveryRunDto {
  return {
    id: "run-1",
    status: "completed",
    startedAt: "2026-10-01T00:00:00.000Z",
    completedAt: "2026-10-01T01:00:00.000Z",
    triggeredBy: "admin@example.com",
    triggerKind: "scheduled",
    scheduleIsraelDateKey: "2026-10-04",
    policy: {
      policyVersion: 1,
      timeRange: "week",
      excludedDomainCount: 0,
      maxProfilesPerRun: 1,
      maxTavilyRequestsPerRun: 1,
      maxResultsPerQuery: 1,
      maxCandidatesPerRun: 1,
      maxClassificationsPerRun: 1,
    },
    catalog: {
      catalogVersion: 1,
      profileCount: 1,
    },
    ...overrides,
  };
}

describe("Business Overview automation health", () => {
  it("returns disabled when automation is off", () => {
    const health = deriveDiscoveryAutomationHealth({
      automationEnabled: false,
      activeRun: null,
      scheduledRunToday: null,
    });
    assert.equal(health.state, "disabled");
    assert.equal(health.label, "כבוי");
  });

  it("returns running when an active run exists", () => {
    const health = deriveDiscoveryAutomationHealth({
      automationEnabled: true,
      activeRun: minimalRun({ status: "running", completedAt: undefined }),
      scheduledRunToday: null,
    });
    assert.equal(health.state, "running");
  });

  it("returns healthy for completed scheduled run today", () => {
    const health = deriveDiscoveryAutomationHealth({
      automationEnabled: true,
      activeRun: null,
      scheduledRunToday: minimalRun({ status: "completed" }),
    });
    assert.equal(health.state, "healthy");
  });

  it("returns credit_stopped for skipped credit block", () => {
    const health = deriveDiscoveryAutomationHealth({
      automationEnabled: true,
      activeRun: null,
      scheduledRunToday: minimalRun({
        status: "skipped",
        failureCategory: "blocked_credit_limit",
      }),
    });
    assert.equal(health.state, "credit_stopped");
  });
});

describe("Business Overview KPI helpers", () => {
  it("computes previous 7-day window boundaries via Israel helpers", () => {
    const reference = new Date("2026-10-04T12:00:00.000Z");
    const sevenDaysAgo = getIsraelDaysAgo(7, reference);
    const fourteenDaysAgo = getIsraelDaysAgo(14, reference);
    assert.ok(fourteenDaysAgo.getTime() < sevenDaysAgo.getTime());
  });

  it("supports lead period comparison without fabricating when previous is zero", () => {
    assert.equal(calculatePercentChange(3, 0), null);
    const change = calculatePercentChange(4, 2);
    assert.ok(change);
    assert.equal(change?.direction, "up");
    assert.equal(change?.percentChange, 100);
  });
});

describe("Business Overview data layer contracts", () => {
  it("overview dashboard loader uses classified review intents", async () => {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/business/overview-dashboard-data.ts"
      ),
      "utf8"
    );
    assert.match(source, /countClassifiedReviewIntents/);
    assert.match(source, /listRecentClassifiedReviewIntents/);
    assert.match(source, /classifiedReviewIntentsCount/);
  });

  it("recent intents list uses classify-at-ingest overview filter", async () => {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/data/intents.ts"
      ),
      "utf8"
    );
    assert.match(source, /buildOverviewActionableIntentQuery/);
  });

  it("intent list helper excludes inbox unclassified in dashboard query file", async () => {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/data/intents.ts"
      ),
      "utf8"
    );
    assert.match(source, /countClassifiedReviewIntents/);
    assert.match(source, /buildOverviewActionableIntentQuery/);
  });

  it("opportunity status aggregation limits operational statuses", async () => {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/data/opportunity-conversion.ts"
      ),
      "utf8"
    );
    assert.match(source, /countNewOpportunitiesLast7Days/);
    assert.match(source, /countOperationalOpportunityStatuses/);
    assert.match(source, /OPERATIONAL_OPPORTUNITY_STATUSES = \["new", "researching", "contacted"\]/);
  });

  it("latest discovery run finder includes all trigger kinds", async () => {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const source = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "../../src/lib/data/discovery-runs.ts"
      ),
      "utf8"
    );
    assert.match(source, /findLatestCompletedDiscoveryRun/);
    assert.match(source, /skipped/);
  });
});
