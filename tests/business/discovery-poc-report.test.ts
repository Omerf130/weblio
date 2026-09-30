import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertReportContainsNoSecrets,
  buildTavilyPocReportMarkdown,
  computeTavilyPocTotals,
} from "../../src/lib/discovery/poc/poc-report";
import { assignDomainCategoriesToRows } from "../../src/lib/discovery/poc/poc-inspection";
import type { DiscoveryProviderSearchResult } from "../../src/lib/discovery/providers/types";

describe("discovery poc report", () => {
  it("builds markdown without secrets", () => {
    const profiles: DiscoveryProviderSearchResult[] = [
      {
        provider: "tavily",
        profileId: "A1",
        query: "מחפש בונה אתרים",
        requestedMaxResults: 5,
        rawResultCount: 1,
        rows: [
          {
            rank: 1,
            title: "כותרת",
            url: "https://example.com/a",
            domain: "example.com",
            snippet: "תוכן לדוגמה",
            score: 0.8,
            validation: { ok: true },
            duplicateWithinProfile: false,
            duplicateAcrossProfiles: false,
          },
        ],
      },
    ];

    const md = buildTavilyPocReportMarkdown({
      runAt: new Date().toISOString(),
      provider: "tavily",
      catalogVersion: 1,
      profileCount: 1,
      maxResultsPerQuery: 5,
      apiSearchRequests: 1,
      totals: computeTavilyPocTotals(profiles),
      profiles,
    });

    assert.match(md, /Profile A1/);
    assert.match(md, /example.com/);
    assert.doesNotMatch(md, /Bearer/i);
    assert.doesNotMatch(md, /tvly-/i);
  });

  it("detects secret patterns in report guard", () => {
    assert.throws(() => assertReportContainsNoSecrets("Bearer tvly-secret"));
  });

  it("includes PoC #2 metadata, inspection, and comparison section", () => {
    const profiles: DiscoveryProviderSearchResult[] = [
      {
        provider: "tavily",
        profileId: "A1",
        query: "מחפש בונה אתרים",
        requestedMaxResults: 5,
        rawResultCount: 1,
        rows: [
          {
            rank: 1,
            title: "כותרת",
            url: "https://example.com/a",
            domain: "example.com",
            score: 0.5,
            validation: { ok: true },
            duplicateWithinProfile: false,
            duplicateAcrossProfiles: false,
          },
        ],
      },
    ];
    assignDomainCategoriesToRows(profiles[0]!.rows);

    const md = buildTavilyPocReportMarkdown({
      runAt: new Date().toISOString(),
      provider: "tavily",
      catalogVersion: 2,
      pocVersion: 2,
      strategy: "explicit-intent-focused",
      profileCount: 12,
      maxResultsPerQuery: 5,
      apiSearchRequests: 12,
      totals: computeTavilyPocTotals(profiles),
      inspection: {
        uniqueUrls: 1,
        duplicateUrlRows: 0,
        uniqueDomains: 1,
        social: 0,
        forumCommunity: 0,
        video: 0,
        serviceBusinessSite: 0,
        other: 1,
        topDomains: [{ domain: "example.com", count: 1 }],
      },
      profiles,
    });

    assert.match(md, /PoC version: 2/);
    assert.match(md, /explicit-intent-focused/);
    assert.match(md, /Domain category \(deterministic\): other/);
    assert.match(md, /Inspection totals/);
    assert.match(md, /Manual comparison vs PoC #1/);
    assert.match(md, /Unique URLs: 1/);
  });
});
