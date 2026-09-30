import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assignDomainCategoriesToRows,
  computePocInspectionTotals,
} from "../../src/lib/discovery/poc/poc-inspection";
import type { DiscoveryProviderSearchResult } from "../../src/lib/discovery/providers/types";

describe("poc inspection totals", () => {
  it("counts categories and top domains", () => {
    const profiles: DiscoveryProviderSearchResult[] = [
      {
        provider: "tavily",
        profileId: "A1",
        query: "q",
        requestedMaxResults: 5,
        rawResultCount: 2,
        rows: [
          {
            rank: 1,
            url: "https://facebook.com/x",
            domain: "facebook.com",
            validation: { ok: true },
            duplicateWithinProfile: false,
            duplicateAcrossProfiles: false,
          },
          {
            rank: 2,
            url: "https://example.com/a",
            domain: "example.com",
            validation: { ok: true },
            duplicateWithinProfile: false,
            duplicateAcrossProfiles: false,
          },
        ],
      },
    ];
    assignDomainCategoriesToRows(profiles[0]!.rows);
    const { totals, topDomains } = computePocInspectionTotals(profiles);
    assert.equal(totals.uniqueUrls, 2);
    assert.equal(totals.social, 1);
    assert.equal(totals.other, 1);
    assert.ok(topDomains.some((d) => d.domain === "facebook.com" && d.count === 1));
  });
});
