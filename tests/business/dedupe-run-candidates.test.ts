import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeDedupeKey } from "../../src/lib/discovery/dedupe-key";
import {
  dedupeRunCandidates,
  runCandidatePersistKey,
} from "../../src/lib/discovery/dedupe-run-candidates";
import { mapTavilyResultToNormalized } from "../../src/lib/discovery/providers/tavily-map";

const profileA = { id: "P1", category: "x", queryHe: "q1" };
const profileB = { id: "P2", category: "x", queryHe: "q2" };

describe("run candidate dedupe (Tavily URL-first)", () => {
  it("same URL with different Tavily result ids shares one persist key", () => {
    const url = "https://example.com/post/1?utm_source=a";
    const first = mapTavilyResultToNormalized(
      { url, content: "מחפש בונה אתרים", id: "tavily-id-1" },
      { profile: profileA, rank: 1 }
    );
    const second = mapTavilyResultToNormalized(
      { url, content: "מחפש בונה אתרים", id: "tavily-id-2" },
      { profile: profileB, rank: 1 }
    );
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (!first.ok || !second.ok) return;

    const key1 = runCandidatePersistKey(first.normalized);
    const key2 = runCandidatePersistKey(second.normalized);
    assert.equal(key1, key2);
    assert.match(key1, /^url:/);
  });

  it("dedupes URL normalization variants in-run", () => {
    const a = mapTavilyResultToNormalized(
      { url: "https://Example.com/path/?b=2&a=1", content: "text a", id: "id-a" },
      { profile: profileA, rank: 1 }
    );
    const b = mapTavilyResultToNormalized(
      { url: "https://example.com/path?a=1&b=2", content: "text b", id: "id-b" },
      { profile: profileB, rank: 1 }
    );
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    if (!a.ok || !b.ok) return;

    const { unique, filteredDuplicateInRun } = dedupeRunCandidates([
      { normalized: a.normalized, profileId: "P1" },
      { normalized: b.normalized, profileId: "P2" },
    ]);
    assert.equal(unique.length, 1);
    assert.equal(filteredDuplicateInRun, 1);
    assert.equal(
      computeDedupeKey({
        provider: unique[0]!.normalized.provider,
        externalId: unique[0]!.normalized.externalId,
        sourceUrl: unique[0]!.normalized.sourceUrl,
      }),
      runCandidatePersistKey(a.normalized)
    );
  });
});
