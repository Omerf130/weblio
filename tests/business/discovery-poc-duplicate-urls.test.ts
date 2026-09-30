import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { markDuplicateUrls } from "../../src/lib/discovery/poc/duplicate-urls";
import type { DiscoveryProviderMappedRow } from "../../src/lib/discovery/providers/types";

function row(url: string, rank: number): DiscoveryProviderMappedRow {
  return {
    rank,
    url,
    dedupeUrlKey: url,
    validation: { ok: true },
    duplicateWithinProfile: false,
    duplicateAcrossProfiles: false,
  };
}

describe("discovery poc duplicate url marks", () => {
  it("marks duplicates within profile and across run", () => {
    const seen = new Set<string>();
    const firstBatch = [row("https://example.com/a", 1), row("https://example.com/a", 2)];
    markDuplicateUrls(firstBatch, seen);
    assert.equal(firstBatch[0]?.duplicateWithinProfile, false);
    assert.equal(firstBatch[1]?.duplicateWithinProfile, true);
    assert.equal(firstBatch[0]?.duplicateAcrossProfiles, false);
    assert.equal(firstBatch[1]?.duplicateAcrossProfiles, true);

    const secondBatch = [row("https://example.com/a", 1)];
    markDuplicateUrls(secondBatch, seen);
    assert.equal(secondBatch[0]?.duplicateAcrossProfiles, true);
  });
});
