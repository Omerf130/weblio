import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { executeTavilyDiscoveryRun } from "../../src/lib/business/discovery/execute-tavily-discovery-run";
import { PRODUCTION_DISCOVERY_POLICY } from "../../src/lib/discovery/discovery-policy";
import { isDiscoveryTavilyEnabled } from "../../src/lib/discovery/discovery-env";
import { deriveDiscoveryRunStatusFromSummary } from "../../src/lib/discovery/discovery-run-status";
import {
  createEmptyTavilyDiscoveryRunSummary,
  type TavilyDiscoveryRunSummary,
} from "../../src/lib/discovery/tavily-discovery-run-summary";
import type { DiscoveryRunDto } from "../../src/types/discovery-run";

const admin = { id: "admin-1", email: "admin@example.com" };

const noopMarkStale = async () => 0;
const noActiveRun = async () => null;
const noCooldownRun = async () => null;

function emptySummary(): TavilyDiscoveryRunSummary {
  return createEmptyTavilyDiscoveryRunSummary(20, 7);
}

function createMemoryDiscoveryRunStore() {
  const runs = new Map<string, DiscoveryRunDto>();
  let seq = 0;

  return {
    runs,
    async createRunning(input: {
      triggeredBy: string;
      policy: typeof PRODUCTION_DISCOVERY_POLICY;
      catalog: { version: number; locale: string; profiles: unknown[]; environment?: string };
      startedAt?: Date;
    }): Promise<DiscoveryRunDto> {
      const id = `run-${++seq}`;
      const dto: DiscoveryRunDto = {
        id,
        status: "running",
        startedAt: (input.startedAt ?? new Date()).toISOString(),
        triggeredBy: input.triggeredBy,
        policy: {
          policyVersion: input.policy.version,
          timeRange: input.policy.tavily.timeRange,
          excludedDomainCount: input.policy.tavily.excludeDomains.length,
          maxProfilesPerRun: input.policy.limits.maxProfilesPerRun,
          maxTavilyRequestsPerRun: input.policy.limits.maxTavilyRequestsPerRun,
          maxResultsPerQuery: input.policy.tavily.maxResultsPerQuery,
          maxCandidatesPerRun: input.policy.limits.maxCandidatesPerRun,
          maxClassificationsPerRun: input.policy.limits.maxClassificationsPerRun,
        },
        catalog: {
          catalogVersion: input.catalog.version,
          environment: input.catalog.environment,
          profileCount: input.catalog.profiles.length,
        },
      };
      runs.set(id, dto);
      return dto;
    },
    async completeRun(input: {
      runId: string;
      status: "completed" | "partial" | "failed";
      summary: TavilyDiscoveryRunSummary;
      completedAt?: Date;
    }): Promise<DiscoveryRunDto | null> {
      const existing = runs.get(input.runId);
      if (!existing) return null;
      const updated: DiscoveryRunDto = {
        ...existing,
        status: input.status,
        completedAt: (input.completedAt ?? new Date()).toISOString(),
        summary: {
          profilesConfigured: input.summary.profilesConfigured,
          profilesSearched: input.summary.profilesSearched,
          tavilyRequests: input.summary.tavilyRequests,
          rawResults: input.summary.rawResults,
          filteredMapping: input.summary.filteredMapping,
          filteredValidation: input.summary.filteredValidation,
          filteredDomain: input.summary.filteredDomain,
          filteredDuplicateInRun: input.summary.filteredDuplicateInRun,
          uniqueCandidates: input.summary.uniqueCandidates,
          candidatesLimited: input.summary.candidatesLimited,
          ingestReceived: input.summary.ingestReceived,
          created: input.summary.created,
          rediscovered: input.summary.rediscovered,
          classified: input.summary.classified,
          unclassified: input.summary.unclassified,
          failed: input.summary.failed,
          classificationLimit: input.summary.classificationLimit,
          classificationLimitReached: input.summary.classificationLimitReached,
          profileErrorCount: input.summary.profileErrors.length,
        },
      };
      runs.set(input.runId, updated);
      return updated;
    },
    async failRun(input: {
      runId: string;
      failureCategory: string;
      completedAt?: Date;
    }): Promise<DiscoveryRunDto | null> {
      const existing = runs.get(input.runId);
      if (!existing) return null;
      const updated: DiscoveryRunDto = {
        ...existing,
        status: "failed",
        completedAt: (input.completedAt ?? new Date()).toISOString(),
        failureCategory: input.failureCategory,
      };
      runs.set(input.runId, updated);
      return updated;
    },
  };
}

describe("discovery feature gate", () => {
  it("requires DISCOVERY_TAVILY_ENABLED === 1", () => {
    assert.equal(isDiscoveryTavilyEnabled({ DISCOVERY_TAVILY_ENABLED: "1" }), true);
    assert.equal(isDiscoveryTavilyEnabled({ DISCOVERY_TAVILY_ENABLED: "0" }), false);
    assert.equal(isDiscoveryTavilyEnabled({}), false);
    assert.equal(isDiscoveryTavilyEnabled({ DISCOVERY_TAVILY_ENABLED: "true" }), false);
  });
});

describe("executeTavilyDiscoveryRun", () => {
  it("blocks when feature gate is disabled before Tavily", async () => {
    let discoveryCalled = false;
    const result = await executeTavilyDiscoveryRun(admin, {
      isEnabled: () => false,
      runDiscovery: async () => {
        discoveryCalled = true;
        return emptySummary();
      },
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.reason, "disabled");
    }
    assert.equal(discoveryCalled, false);
  });

  it("blocks during cooldown using persisted completedAt", async () => {
    const now = new Date("2026-09-30T12:00:00.000Z");
    const result = await executeTavilyDiscoveryRun(admin, {
      isEnabled: () => true,
      now: () => now,
      markStaleRuns: noopMarkStale,
      findActiveRun: noActiveRun,
      findLatestForCooldown: async () => ({
        id: "prev",
        status: "completed",
        startedAt: "2026-09-30T11:40:00.000Z",
        completedAt: "2026-09-30T11:50:00.000Z",
        triggeredBy: admin.email,
        policy: {
          policyVersion: 1,
          timeRange: "week",
          excludedDomainCount: 3,
          maxProfilesPerRun: 7,
          maxTavilyRequestsPerRun: 7,
          maxResultsPerQuery: 5,
          maxCandidatesPerRun: 35,
          maxClassificationsPerRun: 20,
        },
        catalog: { catalogVersion: 1, profileCount: 7 },
      }),
      runDiscovery: async () => emptySummary(),
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.reason, "cooldown");
      assert.ok((result.cooldownRemainingSeconds ?? 0) > 0);
    }
  });

  it("blocks when a non-stale run is already active", async () => {
    const now = new Date("2026-09-30T12:00:00.000Z");
    const result = await executeTavilyDiscoveryRun(admin, {
      isEnabled: () => true,
      now: () => now,
      markStaleRuns: noopMarkStale,
      findLatestForCooldown: noCooldownRun,
      findActiveRun: async () => ({
        id: "active",
        status: "running",
        startedAt: now.toISOString(),
        triggeredBy: admin.email,
        policy: {
          policyVersion: 1,
          timeRange: "week",
          excludedDomainCount: 3,
          maxProfilesPerRun: 7,
          maxTavilyRequestsPerRun: 7,
          maxResultsPerQuery: 5,
          maxCandidatesPerRun: 35,
          maxClassificationsPerRun: 20,
        },
        catalog: { catalogVersion: 1, profileCount: 7 },
      }),
      runDiscovery: async () => emptySummary(),
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.reason, "already_running");
    }
  });

  it("allows a new run when prior running record is stale", async () => {
    const now = new Date("2026-09-30T12:00:00.000Z");
    const store = createMemoryDiscoveryRunStore();
    let failCalled = false;

    const result = await executeTavilyDiscoveryRun(admin, {
      isEnabled: () => true,
      now: () => now,
      markStaleRuns: noopMarkStale,
      findLatestForCooldown: noCooldownRun,
      findActiveRun: async () => ({
        id: "stale",
        status: "running",
        startedAt: new Date(now.getTime() - 31 * 60 * 1000).toISOString(),
        triggeredBy: admin.email,
        policy: {
          policyVersion: 1,
          timeRange: "week",
          excludedDomainCount: 3,
          maxProfilesPerRun: 7,
          maxTavilyRequestsPerRun: 7,
          maxResultsPerQuery: 5,
          maxCandidatesPerRun: 35,
          maxClassificationsPerRun: 20,
        },
        catalog: { catalogVersion: 1, profileCount: 7 },
      }),
      failRun: async (input) => {
        failCalled = true;
        return store.failRun(input);
      },
      createRunning: (input) => store.createRunning(input),
      completeRun: (input) => store.completeRun(input),
      loadCatalog: () => ({
        version: 1,
        locale: "he-IL",
        environment: "production",
        profiles: [{ id: "P1", category: "x", queryHe: "q" }],
      }),
      createProvider: () => ({ providerId: "tavily", search: async () => ({
        provider: "tavily",
        profileId: "P1",
        query: "q",
        requestedMaxResults: 5,
        rawResultCount: 0,
        rows: [],
      }) }),
      runDiscovery: async () => emptySummary(),
    });

    assert.equal(failCalled, true);
    assert.equal(result.success, true);
  });

  it("creates running record then completes with partial status on profile errors", async () => {
    const store = createMemoryDiscoveryRunStore();
    const summary = emptySummary();
    summary.profileErrors.push({
      profileId: "P2",
      query: "q",
      message: "TAVILY_HTTP_503",
    });

    const result = await executeTavilyDiscoveryRun(admin, {
      isEnabled: () => true,
      markStaleRuns: noopMarkStale,
      findActiveRun: noActiveRun,
      findLatestForCooldown: noCooldownRun,
      createRunning: (input) => store.createRunning(input),
      completeRun: (input) => store.completeRun(input),
      loadCatalog: () => ({
        version: 1,
        locale: "he-IL",
        environment: "production",
        profiles: [{ id: "P1", category: "x", queryHe: "q" }],
      }),
      createProvider: () => ({ providerId: "tavily", search: async () => ({
        provider: "tavily",
        profileId: "P1",
        query: "q",
        requestedMaxResults: 5,
        rawResultCount: 0,
        rows: [],
      }) }),
      runDiscovery: async () => summary,
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.status, "partial");
      assert.equal(deriveDiscoveryRunStatusFromSummary(summary), "partial");
    }
    const stored = [...store.runs.values()][0];
    assert.equal(stored?.status, "partial");
    assert.notEqual(stored?.status, "running");
  });

  it("marks run failed when provider unavailable after run creation", async () => {
    const store = createMemoryDiscoveryRunStore();
    const result = await executeTavilyDiscoveryRun(admin, {
      isEnabled: () => true,
      markStaleRuns: noopMarkStale,
      findActiveRun: noActiveRun,
      findLatestForCooldown: noCooldownRun,
      createRunning: (input) => store.createRunning(input),
      failRun: (input) => store.failRun(input),
      loadCatalog: () => ({
        version: 1,
        locale: "he-IL",
        profiles: [{ id: "P1", category: "x", queryHe: "q" }],
      }),
      createProvider: () => null,
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.reason, "failed");
    }
    const stored = [...store.runs.values()][0];
    assert.equal(stored?.status, "failed");
  });

  it("marks run failed when orchestration throws after run creation", async () => {
    const store = createMemoryDiscoveryRunStore();
    const result = await executeTavilyDiscoveryRun(admin, {
      isEnabled: () => true,
      markStaleRuns: noopMarkStale,
      findActiveRun: noActiveRun,
      findLatestForCooldown: noCooldownRun,
      createRunning: (input) => store.createRunning(input),
      failRun: (input) => store.failRun(input),
      loadCatalog: () => ({
        version: 1,
        locale: "he-IL",
        profiles: [{ id: "P1", category: "x", queryHe: "q" }],
      }),
      createProvider: () => ({ providerId: "tavily", search: async () => ({
        provider: "tavily",
        profileId: "P1",
        query: "q",
        requestedMaxResults: 5,
        rawResultCount: 0,
        rows: [],
      }) }),
      runDiscovery: async () => {
        throw new Error("boom");
      },
    });

    assert.equal(result.success, false);
    const stored = [...store.runs.values()][0];
    assert.equal(stored?.status, "failed");
    assert.equal(stored?.failureCategory, "orchestration_error");
  });

  it("result and stored run contain no secret-like strings", async () => {
    const store = createMemoryDiscoveryRunStore();
    const result = await executeTavilyDiscoveryRun(admin, {
      isEnabled: () => true,
      markStaleRuns: noopMarkStale,
      findActiveRun: noActiveRun,
      findLatestForCooldown: noCooldownRun,
      createRunning: (input) => store.createRunning(input),
      completeRun: (input) => store.completeRun(input),
      loadCatalog: () => ({
        version: 1,
        locale: "he-IL",
        profiles: [{ id: "P1", category: "x", queryHe: "q" }],
      }),
      createProvider: () => ({ providerId: "tavily", search: async () => ({
        provider: "tavily",
        profileId: "P1",
        query: "q",
        requestedMaxResults: 5,
        rawResultCount: 0,
        rows: [],
      }) }),
      runDiscovery: async () => emptySummary(),
    });

    const serialized = JSON.stringify(result);
    assert.doesNotMatch(serialized, /tvly-/i);
    assert.doesNotMatch(serialized, /Bearer/i);
  });
});

describe("discovery admin action", () => {
  it("runTavilyDiscoveryAction awaits requireAdmin", () => {
    const path = join(
      dirname(fileURLToPath(import.meta.url)),
      "../../src/lib/business/discovery/actions.ts"
    );
    const source = readFileSync(path, "utf8");
    assert.match(
      source,
      /export async function runTavilyDiscoveryAction[\s\S]*?await requireAdmin\(\)/
    );
  });
});
