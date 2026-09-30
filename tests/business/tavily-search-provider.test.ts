import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTavilySearchRequestBody,
  createTavilySearchProvider,
  mapTavilyResponseToRows,
} from "../../src/lib/discovery/providers/tavily-search-provider";
import { tavilyRequestPolicyFromDiscoveryPolicy } from "../../src/lib/discovery/discovery-policy";

const profile = {
  id: "B1",
  category: "landing_page",
  queryHe: "מחפש מישהו שיבנה דף נחיתה",
};

describe("tavily search provider (mocked)", () => {
  it("maps API response rows and validates with Zod", () => {
    const rows = mapTavilyResponseToRows(profile, [
      {
        title: "דף נחיתה",
        url: "https://example.co.il/post/1",
        content: "מחפש מישהו שיבנה דף נחיתה לקמפיין",
        score: 0.77,
        id: "r1",
      },
    ]);

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.validation.ok, true);
    assert.equal(rows[0]?.normalized?.provider, "tavily");
  });

  it("buildTavilySearchRequestBody omits freshness filters for PoC default", () => {
    const body = buildTavilySearchRequestBody({
      query: "מחפש בונה אתרים",
      maxResults: 5,
    });
    assert.equal(body.query, "מחפש בונה אתרים");
    assert.equal(body.search_depth, "basic");
    assert.equal(body.max_results, 5);
    assert.equal(body.include_answer, false);
    assert.equal(body.include_raw_content, false);
    assert.equal(body.auto_parameters, false);
    assert.equal(body.time_range, undefined);
    assert.equal(body.exclude_domains, undefined);
    assert.equal(body.filter_by_published_date, undefined);
    assert.equal(body.start_date, undefined);
    assert.equal(body.end_date, undefined);
  });

  it("buildTavilySearchRequestBody includes production policy fields when provided", () => {
    const policy = tavilyRequestPolicyFromDiscoveryPolicy({
      version: 1,
      tavily: {
        timeRange: "week",
        excludeDomains: ["youtube.com", "www.youtube.com", "youtu.be"],
        maxResultsPerQuery: 5,
        searchDepth: "basic",
      },
      limits: {
        maxProfilesPerRun: 7,
        maxTavilyRequestsPerRun: 7,
        maxCandidatesPerRun: 35,
        maxClassificationsPerRun: 20,
        runCooldownMinutes: 15,
      },
    });

    const body = buildTavilySearchRequestBody({
      query: "מחפש מישהו שיבנה לי אתר",
      maxResults: policy.maxResults ?? 5,
      timeRange: policy.timeRange,
      excludeDomains: policy.excludeDomains,
    });

    assert.equal(body.time_range, "week");
    assert.deepEqual(body.exclude_domains, [
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
    ]);
    assert.equal(body.filter_by_published_date, undefined);
    assert.equal(body.start_date, undefined);
    assert.equal(body.end_date, undefined);
  });

  it("search without tavilyRequest sends PoC-compatible body", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const provider = createTavilySearchProvider({
      apiKey: "tvly-test-key-not-real",
      fetchImpl: async (_url, init) => {
        capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await provider.search(profile, { maxResults: 5 });
    assert.ok(capturedBody);
    assert.equal(capturedBody!.time_range, undefined);
    assert.equal(capturedBody!.exclude_domains, undefined);
  });

  it("search with production tavilyRequest includes time_range and exclude_domains", async () => {
    let capturedBody: Record<string, unknown> | undefined;
    const tavilyRequest = tavilyRequestPolicyFromDiscoveryPolicy({
      version: 1,
      tavily: {
        timeRange: "week",
        excludeDomains: ["youtube.com", "www.youtube.com", "youtu.be"],
        maxResultsPerQuery: 5,
        searchDepth: "basic",
      },
      limits: {
        maxProfilesPerRun: 7,
        maxTavilyRequestsPerRun: 7,
        maxCandidatesPerRun: 35,
        maxClassificationsPerRun: 20,
        runCooldownMinutes: 15,
      },
    });

    const provider = createTavilySearchProvider({
      apiKey: "tvly-test-key-not-real",
      fetchImpl: async (_url, init) => {
        capturedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    await provider.search(profile, { maxResults: 5, tavilyRequest });
    assert.equal(capturedBody?.time_range, "week");
    assert.deepEqual(capturedBody?.exclude_domains, [
      "youtube.com",
      "www.youtube.com",
      "youtu.be",
    ]);
    assert.equal(capturedBody?.max_results, 5);
    assert.equal(capturedBody?.search_depth, "basic");
  });

  it("search uses fetch mock and never logs api key", async () => {
    let capturedAuth = "";
    const provider = createTavilySearchProvider({
      apiKey: "tvly-test-key-not-real",
      fetchImpl: async (_url, init) => {
        const headers = init?.headers as Record<string, string> | undefined;
        capturedAuth = headers?.Authorization ?? "";
        return new Response(
          JSON.stringify({
            results: [
              {
                title: "t",
                url: "https://example.com/a",
                content: "מחפש בונה אתרים",
                score: 0.5,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    });

    const result = await provider.search(profile, { maxResults: 5 });
    assert.equal(result.rawResultCount, 1);
    assert.equal(result.rows[0]?.validation.ok, true);
    assert.equal(capturedAuth, "Bearer tvly-test-key-not-real");
    assert.doesNotMatch(JSON.stringify(result), /tvly-test-key-not-real/);
  });
});
