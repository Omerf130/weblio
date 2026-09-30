import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildFirstDiscoveryDocument } from "../../src/lib/data/intent-rediscovery";
import { computeDedupeKey } from "../../src/lib/discovery/dedupe-key";
import { extractDiscoveryProvenance } from "../../src/lib/discovery/discovery-provenance";

describe("discovery provenance", () => {
  it("extracts profileId and query from rawMetadata", () => {
    const provenance = extractDiscoveryProvenance({
      rawMetadata: {
        profileId: "W2",
        query: "מחפש מישהו שיבנה לי חנות Shopify",
        rank: 1,
      },
    });
    assert.deepEqual(provenance, {
      discoveryProfileId: "W2",
      discoveryQuery: "מחפש מישהו שיבנה לי חנות Shopify",
    });
  });

  it("returns empty provenance when metadata absent", () => {
    assert.deepEqual(extractDiscoveryProvenance({}), {});
    assert.deepEqual(extractDiscoveryProvenance({ rawMetadata: null }), {});
  });

  it("copies provenance into first discovery document only when present", () => {
    const now = new Date("2026-09-30T12:00:00.000Z");
    const withProvenance = buildFirstDiscoveryDocument(
      {
        provider: "tavily",
        content: "מחפש בונה אתרים",
        sourceUrl: "https://example.com/post/1",
        rawMetadata: { profileId: "W1", query: "מחפש מישהו שיבנה לי אתר לעסק" },
      },
      "url:https://example.com/post/1",
      now
    );
    assert.equal(withProvenance.discoveryProfileId, "W1");
    assert.equal(withProvenance.discoveryQuery, "מחפש מישהו שיבנה לי אתר לעסק");

    const devDoc = buildFirstDiscoveryDocument(
      { provider: "dev", externalId: "x", content: "manual seed" },
      "provider:dev:x",
      now
    );
    assert.equal(devDoc.discoveryProfileId, undefined);
    assert.equal(devDoc.discoveryQuery, undefined);
  });

  it("does not affect dedupe key computation", () => {
    const base = {
      provider: "tavily" as const,
      sourceUrl: "https://example.com/a",
      content: "text",
    };
    const keyA = computeDedupeKey(base);
    const keyB = computeDedupeKey({
      ...base,
      rawMetadata: { profileId: "W3", query: "q" },
    });
    assert.equal(keyA, keyB);
  });
});
