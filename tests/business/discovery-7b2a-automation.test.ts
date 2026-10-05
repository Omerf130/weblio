import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executeTavilyDiscoveryRun } from "../../src/lib/business/discovery/execute-tavily-discovery-run";
import { getDiscoveryCreditConfig } from "../../src/lib/discovery/discovery-credit-env";
import { getDiscoveryAutomationConfig } from "../../src/lib/discovery/discovery-automation-env";
import { evaluateCreditPreflight } from "../../src/lib/discovery/discovery-credit-guard";
import {
  countPlannedTavilyProfileSearches,
  worstCaseTavilyHttpAttempts,
} from "../../src/lib/discovery/discovery-planned-profiles";
import { assertProductionDiscoveryAutomationAllowed } from "../../src/lib/discovery/discovery-production-automation-guard";
import {
  estimateTavilyCreditsForRun,
  runCountsTowardMonthlyUsage,
} from "../../src/lib/discovery/discovery-run-credits";
import {
  SCHEDULED_DISCOVERY_TRIGGERED_BY,
  normalizeDiscoveryRunTrigger,
  triggeredByFromTrigger,
} from "../../src/lib/discovery/discovery-run-trigger";
import { getV2ProductionDiscoveryPolicy } from "../../src/lib/discovery/discovery-policy";
import {
  fetchTavilySearchResults,
  createTavilySearchProvider,
} from "../../src/lib/discovery/providers/tavily-search-provider";
import { loadSearchProfileCatalogV2Production } from "../../src/lib/discovery/providers/load-search-profiles";
import { formatDiscoveryActionResult } from "../../src/lib/business/discovery/discovery-run-messages";

const admin = { id: "admin-1", email: "admin@example.com" };

describe("7B.2A trigger metadata", () => {
  it("normalizes legacy admin argument to manual trigger", () => {
    const trigger = normalizeDiscoveryRunTrigger(admin);
    assert.equal(trigger.kind, "manual");
    assert.equal(triggeredByFromTrigger(trigger), admin.email);
  });

  it("scheduled trigger uses fixed token", () => {
    const trigger = normalizeDiscoveryRunTrigger({
      kind: "scheduled",
      channel: "vercel_cron",
      scheduleIsraelDateKey: "2026-10-04",
    });
    assert.equal(triggeredByFromTrigger(trigger), SCHEDULED_DISCOVERY_TRIGGERED_BY);
  });
});

describe("7B.2A credit configuration", () => {
  it("defaults hard stop and soft warn when env unset", () => {
    const config = getDiscoveryCreditConfig({});
    assert.equal(config.monthlyHardStop, 950);
    assert.equal(config.monthlySoftWarn, 780);
  });

  it("parses overrides from env names only", () => {
    const config = getDiscoveryCreditConfig({
      DISCOVERY_MONTHLY_CREDIT_HARD_STOP: "800",
      DISCOVERY_MONTHLY_CREDIT_SOFT_WARN: "600",
    });
    assert.equal(config.monthlyHardStop, 800);
    assert.equal(config.monthlySoftWarn, 600);
  });
});

describe("7B.2A credit guard preflight", () => {
  it("allows when usage plus worst-case equals hard stop", () => {
    const policy = getV2ProductionDiscoveryPolicy();
    const catalog = loadSearchProfileCatalogV2Production();
    const planned = countPlannedTavilyProfileSearches({ catalog, policy });
    const reserved = worstCaseTavilyHttpAttempts(planned);
    const result = evaluateCreditPreflight({
      monthCreditsUsed: 950 - reserved,
      plannedProfileCount: planned,
      creditConfig: { monthlyHardStop: 950, monthlySoftWarn: 780 },
    });
    assert.equal(result.ok, true);
  });

  it("blocks when usage plus worst-case exceeds hard stop", () => {
    const policy = getV2ProductionDiscoveryPolicy();
    const catalog = loadSearchProfileCatalogV2Production();
    const planned = countPlannedTavilyProfileSearches({ catalog, policy });
    const result = evaluateCreditPreflight({
      monthCreditsUsed: 951 - worstCaseTavilyHttpAttempts(planned),
      plannedProfileCount: planned,
      creditConfig: { monthlyHardStop: 950, monthlySoftWarn: 780 },
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "credit_limit");
    }
  });
});

describe("7B.2A Tavily HTTP attempt accounting", () => {
  it("counts retry POSTs separately from logical profile searches", async () => {
    let calls = 0;
    const counter = { count: 0 };
    await fetchTavilySearchResults(
      {
        apiKey: "tvly-test",
        fetchImpl: async () => {
          calls += 1;
          if (calls === 1) {
            return new Response("rate", { status: 429 });
          }
          return new Response(JSON.stringify({ results: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
        httpAttemptCounter: counter,
      },
      "query",
      { maxResults: 5 }
    );
    assert.equal(counter.count, 2);
  });

  it("provider search leaves logical tavilyRequests to orchestrator", async () => {
    const counter = { count: 0 };
    const provider = createTavilySearchProvider({
      apiKey: "tvly-test",
      httpAttemptCounter: counter,
      fetchImpl: async () =>
        new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    });
    await provider.search(
      { id: "K01", category: "x", queryHe: "q" },
      { maxResults: 5 }
    );
    assert.equal(counter.count, 1);
  });
});

describe("7B.2A monthly credit estimation helpers", () => {
  it("prefers estimatedTavilyCredits over legacy tavilyRequests", () => {
    assert.equal(
      estimateTavilyCreditsForRun({
        estimatedTavilyCredits: 30,
        tavilyRequests: 15,
      }),
      30
    );
  });

  it("falls back to tavilyRequests for legacy runs", () => {
    assert.equal(estimateTavilyCreditsForRun({ tavilyRequests: 15 }), 15);
  });

  it("does not double-count zero-spend skipped runs", () => {
    assert.equal(
      runCountsTowardMonthlyUsage({
        estimatedTavilyCredits: 0,
        tavilyRequests: 0,
      }),
      false
    );
  });
});

describe("7B.2A automation env foundation", () => {
  it("defaults automation off and detects missing cron secret", () => {
    const config = getDiscoveryAutomationConfig({});
    assert.equal(config.automationEnabled, false);
    assert.equal(config.cronSecretConfigured, false);
  });

  it("treats CRON_SECRET alone as configured when DISCOVERY_CRON_SECRET is unset", () => {
    const config = getDiscoveryAutomationConfig({ CRON_SECRET: "vercel-only" });
    assert.equal(config.cronSecretConfigured, true);
  });

  it("production guard rejects preview and disabled automation", () => {
    assert.equal(
      assertProductionDiscoveryAutomationAllowed({
        DISCOVERY_AUTOMATION_ENABLED: "1",
        VERCEL_ENV: "preview",
        DISCOVERY_CRON_SECRET: "x",
      }).ok,
      false
    );
  });
});

describe("7B.2A scheduled idempotency (in-memory)", () => {
  it("second scheduled begin for same Israel date is rejected before Tavily", async () => {
    const scheduleIsraelDateKey = "2026-10-04";
    const scheduledKeys = new Set<string>();
    let discoveryCalls = 0;

    const sharedDeps = {
      isEnabled: () => true,
      getMonthlyUsage: async () => ({
        monthKey: "2026-10",
        estimatedCreditsUsed: 0,
        runCountWithSpend: 0,
        softWarnReached: false,
        hardStopReached: false,
        hardStopLimit: 950,
        softWarnLimit: 780,
      }),
      findActiveRun: async () => null,
      findLatestForCooldown: async () => null,
      markStaleRuns: async () => 0,
      tryBeginRun: async (input: { scheduleIsraelDateKey?: string }) => {
        if (
          input.scheduleIsraelDateKey &&
          scheduledKeys.has(input.scheduleIsraelDateKey)
        ) {
          return { ok: false as const, reason: "already_executed" as const };
        }
        if (input.scheduleIsraelDateKey) {
          scheduledKeys.add(input.scheduleIsraelDateKey);
        }
        return {
          ok: true as const,
          run: {
            id: "run-scheduled-1",
            status: "running" as const,
            startedAt: new Date().toISOString(),
            triggeredBy: SCHEDULED_DISCOVERY_TRIGGERED_BY,
            triggerKind: "scheduled" as const,
            scheduleIsraelDateKey: input.scheduleIsraelDateKey,
            policy: {
              policyVersion: 3,
              timeRange: "week",
              excludedDomainCount: 3,
              maxProfilesPerRun: 15,
              maxTavilyRequestsPerRun: 15,
              maxResultsPerQuery: 5,
              maxCandidatesPerRun: 85,
              maxClassificationsPerRun: 45,
            },
            catalog: { catalogVersion: 4, profileCount: 49 },
          },
        };
      },
      completeRun: async ({ runId, status, summary }) => ({
        id: runId,
        status,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        triggeredBy: SCHEDULED_DISCOVERY_TRIGGERED_BY,
        policy: {
          policyVersion: 3,
          timeRange: "week",
          excludedDomainCount: 3,
          maxProfilesPerRun: 15,
          maxTavilyRequestsPerRun: 15,
          maxResultsPerQuery: 5,
          maxCandidatesPerRun: 85,
          maxClassificationsPerRun: 45,
        },
        catalog: { catalogVersion: 4, profileCount: 49 },
        summary: {
          profilesConfigured: summary.profilesConfigured,
          profilesSelected: summary.profilesSelected,
          selectionShortfallTotal: summary.selectionShortfallTotal,
          profilesSearched: summary.profilesSearched,
          tavilyRequests: summary.tavilyRequests,
          rawResults: summary.rawResults,
          filteredMapping: 0,
          filteredValidation: 0,
          filteredDomain: 0,
          filteredDuplicateInRun: 0,
          uniqueCandidates: 0,
          candidatesLimited: 0,
          ingestReceived: 0,
          created: 0,
          rediscovered: 0,
          classified: 0,
          unclassified: 0,
          failed: 0,
          classificationLimit: 45,
          classificationLimitReached: false,
          profileErrorCount: 0,
        },
      }),
      runDiscovery: async () => {
        discoveryCalls += 1;
        const { createEmptyTavilyDiscoveryRunSummary } = await import(
          "../../src/lib/discovery/tavily-discovery-run-summary"
        );
        return createEmptyTavilyDiscoveryRunSummary(45, 49);
      },
      createProvider: () => ({
        providerId: "tavily",
        search: async () => ({
          provider: "tavily",
          profileId: "K01",
          query: "q",
          requestedMaxResults: 5,
          rawResultCount: 0,
          rows: [],
        }),
      }),
    };

    const trigger = {
      kind: "scheduled" as const,
      channel: "vercel_cron" as const,
      scheduleIsraelDateKey,
    };

    await executeTavilyDiscoveryRun(trigger, sharedDeps);
    const second = await executeTavilyDiscoveryRun(trigger, sharedDeps);

    assert.equal(discoveryCalls, 1);
    assert.equal(second.success, false);
  });

});

describe("7B.2A manual credit block messaging", () => {
  it("returns Hebrew message for credit_limit", () => {
    const message = formatDiscoveryActionResult({
      success: false,
      reason: "credit_limit",
      message: "blocked",
    });
    assert.match(message.title, /מגבלת קרדיט/);
  });
});

describe("7B.2A V2.2 policy regression", () => {
  it("still caps logical Tavily requests at 15", () => {
    const policy = getV2ProductionDiscoveryPolicy();
    assert.equal(policy.limits.maxTavilyRequestsPerRun, 15);
    assert.equal(policy.version, 3);
  });
});
