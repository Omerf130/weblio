import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { noopIntentClassifier } from "../../src/lib/discovery/classifier/noop-classifier";
import type { IntentClassifier } from "../../src/lib/discovery/classifier/types";
import { ingestDiscoveredResult } from "../../src/lib/discovery/ingest";
import {
  getProductionDiscoveryPolicy,
  PRODUCTION_DISCOVERY_POLICY,
  type DiscoveryPolicy,
} from "../../src/lib/discovery/discovery-policy";
import { runTavilyProductionDiscovery } from "../../src/lib/discovery/run-tavily-discovery";
import { mapTavilyResponseToRows } from "../../src/lib/discovery/providers/tavily-search-provider";
import type {
  DiscoveryProviderSearchResult,
  DiscoverySearchProfile,
  DiscoverySearchProvider,
  DiscoverySearchProviderSearchOptions,
} from "../../src/lib/discovery/providers/types";
import type { AdminIntentDetailDto } from "../../src/types/intent";

const profileP1: DiscoverySearchProfile = {
  id: "P1",
  category: "explicit_website",
  queryHe: "מחפש מישהו שיבנה לי אתר",
};

const profileP2: DiscoverySearchProfile = {
  id: "P2",
  category: "explicit_website",
  queryHe: "מחפש בונה אתרים",
};

function mockIntent(
  overrides: Partial<AdminIntentDetailDto> = {}
): AdminIntentDetailDto {
  const now = new Date().toISOString();
  return {
    id: "507f1f77bcf86cd799439011",
    provider: "tavily",
    contentPreview: "preview",
    content: "מחפש בונה אתרים",
    discoveredAt: now,
    lastSeenAt: now,
    discoveryCount: 1,
    classification: "unclassified",
    status: "new",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function buildRows(
  profile: DiscoverySearchProfile,
  apiResults: Parameters<typeof mapTavilyResponseToRows>[1]
) {
  return mapTavilyResponseToRows(profile, apiResults);
}

function createRecordingProvider(
  handlers: Record<
    string,
    () => DiscoveryProviderSearchResult | Promise<DiscoveryProviderSearchResult>
  >
): {
  provider: DiscoverySearchProvider;
  searches: Array<{ profileId: string; options?: DiscoverySearchProviderSearchOptions }>;
} {
  const searches: Array<{ profileId: string; options?: DiscoverySearchProviderSearchOptions }> =
    [];
  const provider: DiscoverySearchProvider = {
    providerId: "tavily",
    async search(profile, options) {
      searches.push({ profileId: profile.id, options });
      const handler = handlers[profile.id];
      if (!handler) {
        return {
          provider: "tavily",
          profileId: profile.id,
          query: profile.queryHe,
          requestedMaxResults: options?.maxResults ?? 5,
          rawResultCount: 0,
          rows: [],
        };
      }
      return handler();
    },
  };
  return { provider, searches };
}

describe("runTavilyProductionDiscovery", () => {
  it("passes production tavilyRequest on every search", async () => {
    const { provider, searches } = createRecordingProvider({
      P1: () => ({
        provider: "tavily",
        profileId: "P1",
        query: profileP1.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 0,
        rows: [],
      }),
      P2: () => ({
        provider: "tavily",
        profileId: "P2",
        query: profileP2.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 0,
        rows: [],
      }),
    });

    await runTavilyProductionDiscovery({
      provider,
      loadCatalog: () => ({
        version: 1,
        locale: "he-IL",
        profiles: [profileP1, profileP2],
      }),
      getPolicy: () => ({
        ...PRODUCTION_DISCOVERY_POLICY,
        limits: {
          ...PRODUCTION_DISCOVERY_POLICY.limits,
          maxProfilesPerRun: 2,
          maxTavilyRequestsPerRun: 2,
        },
      }),
      getClassifier: () => noopIntentClassifier,
      ingestDiscoveredResult: async () => ({
        ok: true,
        intentId: mockIntent().id,
        created: false,
        rediscovered: false,
        dedupeKey: "url:x",
        classification: "unclassified",
        classified: false,
      }),
    });

    assert.equal(searches.length, 2);
    for (const call of searches) {
      assert.equal(call.options?.tavilyRequest?.timeRange, "week");
      assert.deepEqual(call.options?.tavilyRequest?.excludeDomains, [
        "youtube.com",
        "www.youtube.com",
        "youtu.be",
      ]);
      assert.equal(call.options?.maxResults, 5);
    }
  });

  it("continues after a profile error and records profileErrors", async () => {
    const { provider } = createRecordingProvider({
      P1: () => ({
        provider: "tavily",
        profileId: "P1",
        query: profileP1.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 0,
        rows: [],
        error: "TAVILY_HTTP_503",
      }),
      P2: () => ({
        provider: "tavily",
        profileId: "P2",
        query: profileP2.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 1,
        rows: buildRows(profileP2, [
          {
            title: "פוסט",
            url: "https://www.facebook.com/groups/demo/posts/1",
            content: "מחפש בונה אתרים",
            id: "fb-1",
          },
        ]),
      }),
    });

    const summary = await runTavilyProductionDiscovery({
      provider,
      loadCatalog: () => ({
        version: 1,
        locale: "he-IL",
        profiles: [profileP1, profileP2],
      }),
      getPolicy: () => ({
        ...PRODUCTION_DISCOVERY_POLICY,
        limits: {
          ...PRODUCTION_DISCOVERY_POLICY.limits,
          maxProfilesPerRun: 2,
          maxTavilyRequestsPerRun: 2,
        },
      }),
      getClassifier: () => noopIntentClassifier,
      ingestDiscoveredResult: async () => ({
        ok: true,
        intentId: mockIntent().id,
        created: true,
        rediscovered: false,
        dedupeKey: "url:x",
        classification: "unclassified",
        classified: false,
      }),
    });

    assert.equal(summary.profileErrors.length, 1);
    assert.equal(summary.profileErrors[0]?.profileId, "P1");
    assert.equal(summary.tavilyRequests, 2);
    assert.equal(summary.ingestReceived, 1);
  });

  it("filters excluded YouTube URLs but keeps Facebook", async () => {
    const { provider } = createRecordingProvider({
      P1: () => ({
        provider: "tavily",
        profileId: "P1",
        query: profileP1.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 2,
        rows: buildRows(profileP1, [
          {
            url: "https://www.youtube.com/watch?v=abc",
            content: "סרטון",
            id: "yt-1",
          },
          {
            url: "https://www.facebook.com/groups/demo/posts/1",
            content: "מחפש בונה אתרים",
            id: "fb-1",
          },
        ]),
      }),
    });

    let ingestCount = 0;
    const summary = await runTavilyProductionDiscovery({
      provider,
      loadCatalog: () => ({ version: 1, locale: "he-IL", profiles: [profileP1] }),
      getPolicy: () => ({
        ...PRODUCTION_DISCOVERY_POLICY,
        limits: { ...PRODUCTION_DISCOVERY_POLICY.limits, maxProfilesPerRun: 1, maxTavilyRequestsPerRun: 1 },
      }),
      getClassifier: () => noopIntentClassifier,
      ingestDiscoveredResult: async () => {
        ingestCount += 1;
        return {
          ok: true,
          intentId: mockIntent().id,
          created: true,
          rediscovered: false,
          dedupeKey: "url:x",
          classification: "unclassified",
          classified: false,
        };
      },
    });

    assert.equal(summary.filteredDomain, 1);
    assert.equal(ingestCount, 1);
  });

  it("dedupes same URL across profiles before ingest", async () => {
    const sharedUrl = "https://example.com/post/1";
    const { provider } = createRecordingProvider({
      P1: () => ({
        provider: "tavily",
        profileId: "P1",
        query: profileP1.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 1,
        rows: buildRows(profileP1, [
          { url: sharedUrl, content: "text", id: "id-1" },
        ]),
      }),
      P2: () => ({
        provider: "tavily",
        profileId: "P2",
        query: profileP2.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 1,
        rows: buildRows(profileP2, [
          { url: sharedUrl, content: "text", id: "id-2" },
        ]),
      }),
    });

    let ingestCount = 0;
    const summary = await runTavilyProductionDiscovery({
      provider,
      loadCatalog: () => ({
        version: 1,
        locale: "he-IL",
        profiles: [profileP1, profileP2],
      }),
      getPolicy: () => ({
        ...PRODUCTION_DISCOVERY_POLICY,
        limits: {
          ...PRODUCTION_DISCOVERY_POLICY.limits,
          maxProfilesPerRun: 2,
          maxTavilyRequestsPerRun: 2,
        },
      }),
      getClassifier: () => noopIntentClassifier,
      ingestDiscoveredResult: async () => {
        ingestCount += 1;
        return {
          ok: true,
          intentId: mockIntent().id,
          created: true,
          rediscovered: false,
          dedupeKey: "url:x",
          classification: "unclassified",
          classified: false,
        };
      },
    });

    assert.equal(summary.rawResults, 2);
    assert.equal(summary.filteredDuplicateInRun, 1);
    assert.equal(summary.uniqueCandidates, 1);
    assert.equal(ingestCount, 1);

    const p1Row = summary.profileSummaries.find((row) => row.profileId === "P1");
    const p2Row = summary.profileSummaries.find((row) => row.profileId === "P2");
    assert.equal(p1Row?.uniqueAttributed, 1);
    assert.equal(p2Row?.uniqueAttributed, 0);
    assert.equal(p1Row?.created, 1);
    assert.equal(p2Row?.created, 0);
  });

  it("enforces maxCandidatesPerRun", async () => {
    const { provider } = createRecordingProvider({
      P1: () => ({
        provider: "tavily",
        profileId: "P1",
        query: profileP1.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 3,
        rows: buildRows(profileP1, [
          { url: "https://example.com/a", content: "a", id: "1" },
          { url: "https://example.com/b", content: "b", id: "2" },
          { url: "https://example.com/c", content: "c", id: "3" },
        ]),
      }),
    });

    const summary = await runTavilyProductionDiscovery({
      provider,
      loadCatalog: () => ({ version: 1, locale: "he-IL", profiles: [profileP1] }),
      getPolicy: () => ({
        ...PRODUCTION_DISCOVERY_POLICY,
        limits: {
          ...PRODUCTION_DISCOVERY_POLICY.limits,
          maxProfilesPerRun: 1,
          maxTavilyRequestsPerRun: 1,
          maxCandidatesPerRun: 2,
        },
      }),
      getClassifier: () => noopIntentClassifier,
      ingestDiscoveredResult: async () => ({
        ok: true,
        intentId: mockIntent().id,
        created: true,
        rediscovered: false,
        dedupeKey: "url:x",
        classification: "unclassified",
        classified: false,
      }),
    });

    assert.equal(summary.uniqueCandidates, 2);
    assert.equal(summary.candidatesLimited, 1);
    assert.equal(summary.ingestReceived, 2);
  });

  it("enforces classification cap but still ingests remaining unclassified", async () => {
    const { provider } = createRecordingProvider({
      P1: () => ({
        provider: "tavily",
        profileId: "P1",
        query: profileP1.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 3,
        rows: buildRows(profileP1, [
          { url: "https://example.com/a", content: "a", id: "1" },
          { url: "https://example.com/b", content: "b", id: "2" },
          { url: "https://example.com/c", content: "c", id: "3" },
        ]),
      }),
    });

    let classifyCalls = 0;
    const countingClassifier: IntentClassifier = {
      async classify() {
        classifyCalls += 1;
        return {
          classification: "explicitNeed",
          reason: "test",
          classifierVersion: "test-v1",
        };
      },
    };

    const summary = await runTavilyProductionDiscovery({
      provider,
      loadCatalog: () => ({ version: 1, locale: "he-IL", profiles: [profileP1] }),
      getPolicy: () => ({
        ...PRODUCTION_DISCOVERY_POLICY,
        limits: {
          ...PRODUCTION_DISCOVERY_POLICY.limits,
          maxProfilesPerRun: 1,
          maxTavilyRequestsPerRun: 1,
          maxCandidatesPerRun: 10,
          maxClassificationsPerRun: 2,
        },
      }),
      getClassifier: () => countingClassifier,
      ingestDiscoveredResult,
      ingestDeps: {
        upsertDiscoveredIntent: async () => ({
          intentId: mockIntent().id,
          created: true,
          dedupeKey: "url:x",
          intent: mockIntent({ classification: "unclassified" }),
        }),
        updateIntentClassification: async (input) =>
          mockIntent({ classification: input.classification }),
      },
    });

    assert.equal(classifyCalls, 2);
    assert.equal(summary.ingestReceived, 3);
    assert.equal(summary.classified, 2);
    assert.equal(summary.unclassified, 1);
    assert.equal(summary.classificationLimitReached, true);
  });

  it("classificationLimitReached is false when cap exhausted with no skipped candidates", async () => {
    const { provider } = createRecordingProvider({
      P1: () => ({
        provider: "tavily",
        profileId: "P1",
        query: profileP1.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 2,
        rows: buildRows(profileP1, [
          { url: "https://example.com/a", content: "a", id: "1" },
          { url: "https://example.com/b", content: "b", id: "2" },
        ]),
      }),
    });

    const summary = await runTavilyProductionDiscovery({
      provider,
      loadCatalog: () => ({ version: 1, locale: "he-IL", profiles: [profileP1] }),
      getPolicy: () => ({
        ...PRODUCTION_DISCOVERY_POLICY,
        limits: {
          ...PRODUCTION_DISCOVERY_POLICY.limits,
          maxProfilesPerRun: 1,
          maxTavilyRequestsPerRun: 1,
          maxClassificationsPerRun: 2,
        },
      }),
      getClassifier: () => ({
        async classify() {
          return {
            classification: "explicitNeed" as const,
            reason: "test",
            classifierVersion: "test-v1",
          };
        },
      }),
      ingestDiscoveredResult,
      ingestDeps: {
        upsertDiscoveredIntent: async () => ({
          intentId: mockIntent().id,
          created: true,
          dedupeKey: "url:x",
          intent: mockIntent({ classification: "unclassified" }),
        }),
        updateIntentClassification: async (input) =>
          mockIntent({ classification: input.classification }),
      },
    });

    assert.equal(summary.classified, 2);
    assert.equal(summary.classificationLimitReached, false);
  });

  it("rediscovered classified intent does not consume classification budget", async () => {
    const { provider } = createRecordingProvider({
      P1: () => ({
        provider: "tavily",
        profileId: "P1",
        query: profileP1.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 2,
        rows: buildRows(profileP1, [
          { url: "https://example.com/a", content: "a", id: "1" },
          { url: "https://example.com/b", content: "b", id: "2" },
        ]),
      }),
    });

    let classifyCalls = 0;
    const countingClassifier: IntentClassifier = {
      async classify() {
        classifyCalls += 1;
        return {
          classification: "explicitNeed",
          reason: "test",
          classifierVersion: "test-v1",
        };
      },
    };

    let upsertCalls = 0;
    const summary = await runTavilyProductionDiscovery({
      provider,
      loadCatalog: () => ({ version: 1, locale: "he-IL", profiles: [profileP1] }),
      getPolicy: () => ({
        ...PRODUCTION_DISCOVERY_POLICY,
        limits: {
          ...PRODUCTION_DISCOVERY_POLICY.limits,
          maxProfilesPerRun: 1,
          maxTavilyRequestsPerRun: 1,
          maxClassificationsPerRun: 1,
        },
      }),
      getClassifier: () => countingClassifier,
      ingestDiscoveredResult,
      ingestDeps: {
        upsertDiscoveredIntent: async () => {
          upsertCalls += 1;
          const alreadyClassified = upsertCalls === 1;
          return {
            intentId: mockIntent().id,
            created: !alreadyClassified,
            dedupeKey: alreadyClassified ? "url:x" : "url:y",
            intent: mockIntent({
              classification: alreadyClassified ? "explicitNeed" : "unclassified",
            }),
          };
        },
        updateIntentClassification: async (input) =>
          mockIntent({ classification: input.classification }),
      },
    });

    assert.equal(classifyCalls, 1);
    assert.equal(summary.classified, 1);
    assert.equal(summary.rediscovered, 1);
    assert.equal(summary.classificationLimitReached, false);
  });

  it("continues when classifier throws and keeps ingest successful", async () => {
    const { provider } = createRecordingProvider({
      P1: () => ({
        provider: "tavily",
        profileId: "P1",
        query: profileP1.queryHe,
        requestedMaxResults: 5,
        rawResultCount: 2,
        rows: buildRows(profileP1, [
          { url: "https://example.com/a", content: "a", id: "1" },
          { url: "https://example.com/b", content: "b", id: "2" },
        ]),
      }),
    });

    const summary = await runTavilyProductionDiscovery({
      provider,
      loadCatalog: () => ({ version: 1, locale: "he-IL", profiles: [profileP1] }),
      getPolicy: () => ({
        ...PRODUCTION_DISCOVERY_POLICY,
        limits: {
          ...PRODUCTION_DISCOVERY_POLICY.limits,
          maxProfilesPerRun: 1,
          maxTavilyRequestsPerRun: 1,
        },
      }),
      getClassifier: () => ({
        async classify() {
          throw new Error("OPENAI_DOWN");
        },
      }),
      ingestDiscoveredResult,
      ingestDeps: {
        upsertDiscoveredIntent: async () => ({
          intentId: mockIntent().id,
          created: true,
          dedupeKey: "url:x",
          intent: mockIntent({ classification: "unclassified" }),
        }),
        updateIntentClassification: async () => mockIntent(),
      },
    });

    assert.equal(summary.failed, 0);
    assert.equal(summary.ingestReceived, 2);
    assert.equal(summary.unclassified, 2);
  });

  it("respects production profile and request limits from default policy", async () => {
    const policy = getProductionDiscoveryPolicy();
    const profiles = Array.from({ length: 10 }, (_, index) => ({
      id: `PX${index}`,
      category: "x",
      queryHe: `query ${index}`,
    }));

    const { provider, searches } = createRecordingProvider(
      Object.fromEntries(
        profiles.map((profile) => [
          profile.id,
          () => ({
            provider: "tavily" as const,
            profileId: profile.id,
            query: profile.queryHe,
            requestedMaxResults: 5,
            rawResultCount: 0,
            rows: [],
          }),
        ])
      )
    );

    const summary = await runTavilyProductionDiscovery({
      provider,
      loadCatalog: () => ({ version: 1, locale: "he-IL", profiles }),
      getClassifier: () => noopIntentClassifier,
      ingestDiscoveredResult: async () => ({
        ok: true,
        intentId: mockIntent().id,
        created: false,
        rediscovered: false,
        dedupeKey: "url:x",
        classification: "unclassified",
        classified: false,
      }),
    });

    assert.equal(searches.length, policy.limits.maxTavilyRequestsPerRun);
    assert.equal(summary.profilesConfigured, 10);
    assert.equal(summary.profilesSearched, policy.limits.maxProfilesPerRun);
  });
});
